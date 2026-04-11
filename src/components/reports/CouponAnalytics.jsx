import React, { useState, useEffect } from 'react'
import { 
  Ticket, Percent, Target, Gift, Star, Zap, TrendingUp,
  Users, Award, AlertCircle, ChevronRight, ShoppingBag, Eye
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatCurrency, formatNumber } from '../../utils/formatters'
import DataLoadingSkeleton from '../ui/DataLoadingSkeleton'
import Badge from '../Badge'
import Button from '../ui/Button'
import { useNavigate } from 'react-router-dom'

const CouponAnalytics = ({ dateRange, customDateRange }) => {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [topCouponUsers, setTopCouponUsers] = useState([])
  const [engagementOpportunities, setEngagementOpportunities] = useState([])
  const [couponPerformance, setCouponPerformance] = useState([])
  const [activeTab, setActiveTab] = useState('opportunities')
  const navigate = useNavigate()

  useEffect(() => {
    loadCouponAnalytics()
  }, [dateRange, customDateRange])

  const getDateRange = () => {
    const now = new Date()
    let startDate, endDate
    
    switch (dateRange) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0))
        endDate = new Date(now.setHours(23, 59, 59, 999))
        break
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7))
        endDate = new Date()
        break
      case 'month':
        startDate = new Date(now.setDate(now.getDate() - 30))
        endDate = new Date()
        break
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1))
        endDate = new Date()
        break
      case 'custom':
        startDate = new Date(customDateRange.start)
        endDate = new Date(customDateRange.end)
        endDate.setHours(23, 59, 59, 999)
        break
      default:
        startDate = new Date(now.setDate(now.getDate() - 30))
        endDate = new Date()
    }
    
    return { startDate, endDate }
  }

  const loadCouponAnalytics = async () => {
    setLoading(true)
    try {
      const { startDate, endDate } = getDateRange()

      // Buscar todas as vendas com cupons
      const { data: salesWithCoupons, error: salesError } = await supabase
        .from('sales')
        .select(`
          id,
          customer_id,
          final_amount,
          discount_amount,
          coupon_code,
          created_at,
          customer:customers(id, name, email, phone, total_purchases)
        `)
        .not('coupon_code', 'is', null)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false })

      if (salesError) throw salesError

      // Buscar todas as vendas (para calcular última compra)
      const { data: allSales, error: allSalesError } = await supabase
        .from('sales')
        .select('customer_id, created_at, status')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })

      if (allSalesError) throw allSalesError

      // Calcular última compra por cliente
      const lastPurchaseMap = {}
      allSales?.forEach(sale => {
        if (sale.customer_id && !lastPurchaseMap[sale.customer_id]) {
          lastPurchaseMap[sale.customer_id] = sale.created_at
        }
      })

      // Buscar todos os cupons disponíveis
      const { data: coupons, error: couponsError } = await supabase
        .from('coupons')
        .select('*')
        .eq('is_active', true)

      if (couponsError) throw couponsError

      // Buscar todos os clientes ativos
      const { data: allCustomers, error: customersError } = await supabase
        .from('customers')
        .select('id, name, email, phone, total_purchases, status, created_at')
        .eq('status', 'active')

      if (customersError) throw customersError

      // Análise de uso de cupons por cliente
      const customerCouponUsage = {}
      const couponUsageCount = {}
      
      salesWithCoupons?.forEach(sale => {
        const customerId = sale.customer_id
        const couponCode = sale.coupon_code
        
        if (customerId) {
          if (!customerCouponUsage[customerId]) {
            customerCouponUsage[customerId] = {
              customer: sale.customer,
              count: 0,
              totalDiscount: 0,
              totalSpent: 0,
              couponsUsed: new Set()
            }
          }
          customerCouponUsage[customerId].count++
          customerCouponUsage[customerId].totalDiscount += sale.discount_amount || 0
          customerCouponUsage[customerId].totalSpent += sale.final_amount || 0
          customerCouponUsage[customerId].couponsUsed.add(couponCode)
        }
        
        if (couponCode) {
          couponUsageCount[couponCode] = (couponUsageCount[couponCode] || 0) + 1
        }
      })

      // Top usuários de cupons
      const topUsers = Object.values(customerCouponUsage)
        .map(u => ({
          ...u,
          couponsUsed: Array.from(u.couponsUsed)
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      setTopCouponUsers(topUsers)

      // Performance dos cupons
      const performance = coupons?.map(coupon => ({
        ...coupon,
        usageCount: couponUsageCount[coupon.code] || 0,
        usageRate: coupon.usage_limit 
          ? ((couponUsageCount[coupon.code] || 0) / coupon.usage_limit) * 100 
          : 0
      })).sort((a, b) => b.usageCount - a.usageCount)

      setCouponPerformance(performance)

      // Identificar oportunidades de engajamento
      const opportunities = []
      
      // 1. Clientes que gastam muito mas NUNCA usaram cupom
      const highSpendersNoCoupon = allCustomers?.filter(c => {
        const hasUsedCoupon = customerCouponUsage[c.id]
        return !hasUsedCoupon && (c.total_purchases || 0) > 100 // Reduzi para 100 reais
      }).sort((a, b) => (b.total_purchases || 0) - (a.total_purchases || 0)).slice(0, 5)

      highSpendersNoCoupon?.forEach(customer => {
        opportunities.push({
          type: 'high_spender',
          priority: 'high',
          customer,
          reason: 'Cliente fiel que nunca usou cupom',
          suggestion: 'Ofereça cupom de fidelidade exclusivo',
          icon: Star
        })
      })

      // 2. Clientes que NÃO compram há mais de 30 dias
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      // CORREÇÃO: Usar o mapa de última compra calculado
      const inactiveCustomers = allCustomers?.filter(c => {
        const lastPurchase = lastPurchaseMap[c.id]
        
        // Se nunca comprou, considera como inativo também
        if (!lastPurchase) {
          // Verifica se é cliente há mais de 30 dias
          const createdAt = new Date(c.created_at)
          return createdAt < thirtyDaysAgo
        }
        
        // Se tem última compra, verifica se foi há mais de 30 dias
        return new Date(lastPurchase) < thirtyDaysAgo
      }).slice(0, 5)

      console.log('📊 Clientes inativos encontrados:', inactiveCustomers.length)
      console.log('📊 Mapa de última compra:', lastPurchaseMap)

      inactiveCustomers?.forEach(customer => {
        const lastPurchase = lastPurchaseMap[customer.id]
        const reason = lastPurchase 
          ? `Cliente inativo há mais de 30 dias (última compra: ${new Date(lastPurchase).toLocaleDateString('pt-BR')})`
          : 'Cliente nunca realizou uma compra'
        
        opportunities.push({
          type: 'inactive',
          priority: 'medium',
          customer,
          reason: reason,
          suggestion: 'Envie cupom de reengajamento',
          icon: AlertCircle
        })
      })

      // 3. Clientes que usam cupons frequentemente (3+ vezes)
      const frequentCouponUsers = Object.values(customerCouponUsage)
        .filter(u => u.count >= 3)
        .map(u => u.customer)
        .slice(0, 5)

      frequentCouponUsers?.forEach(customer => {
        opportunities.push({
          type: 'coupon_lover',
          priority: 'medium',
          customer,
          reason: 'Cliente que adora cupons',
          suggestion: 'Ofereça cupons exclusivos com frequência',
          icon: Gift
        })
      })

      // Remover duplicatas (um cliente pode aparecer em múltiplas categorias)
      const uniqueOpportunities = []
      const seenCustomers = new Set()
      
      opportunities.forEach(opp => {
        if (!seenCustomers.has(opp.customer.id)) {
          seenCustomers.add(opp.customer.id)
          uniqueOpportunities.push(opp)
        }
      })

      setEngagementOpportunities(uniqueOpportunities)

      // Estatísticas gerais
      const customersWithCoupon = Object.keys(customerCouponUsage).length
      const totalCustomers = allCustomers?.length || 0
      const couponAdoptionRate = totalCustomers > 0 ? (customersWithCoupon / totalCustomers) * 100 : 0
      
      const totalDiscountGiven = salesWithCoupons?.reduce((sum, s) => sum + (s.discount_amount || 0), 0) || 0
      const totalSalesWithCoupon = salesWithCoupons?.reduce((sum, s) => sum + (s.final_amount || 0), 0) || 0
      const averageDiscount = salesWithCoupons?.length > 0 ? totalDiscountGiven / salesWithCoupons.length : 0

      setStats({
        totalCouponsAvailable: coupons?.length || 0,
        activeCoupons: coupons?.filter(c => c.is_active).length || 0,
        customersWithCoupon,
        couponAdoptionRate,
        totalDiscountGiven,
        totalSalesWithCoupon,
        averageDiscount,
        totalCouponSales: salesWithCoupons?.length || 0
      })

    } catch (error) {
      console.error('Erro ao carregar análise de cupons:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'border-red-300 bg-red-50'
      case 'medium': return 'border-yellow-300 bg-yellow-50'
      default: return 'border-blue-300 bg-blue-50'
    }
  }

  if (loading) {
    return <DataLoadingSkeleton type="cards" rows={3} />
  }

  return (
    <div className="space-y-6">
      {/* Cards de Estatísticas de Cupons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-700">Taxa de Adoção</p>
              <p className="text-2xl font-bold text-purple-900">
                {stats?.couponAdoptionRate.toFixed(1)}%
              </p>
              <p className="text-xs text-purple-600 mt-1">
                {stats?.customersWithCoupon} de {stats?.totalCouponsAvailable} clientes
              </p>
            </div>
            <div className="p-3 bg-purple-200 rounded-full">
              <Target size={24} className="text-purple-700" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700">Vendas com Cupom</p>
              <p className="text-2xl font-bold text-green-900">
                {formatNumber(stats?.totalCouponSales || 0)}
              </p>
              <p className="text-xs text-green-600 mt-1">
                {formatCurrency(stats?.totalSalesWithCoupon || 0)} em vendas
              </p>
            </div>
            <div className="p-3 bg-green-200 rounded-full">
              <ShoppingBag size={24} className="text-green-700" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-700">Descontos Concedidos</p>
              <p className="text-2xl font-bold text-orange-900">
                {formatCurrency(stats?.totalDiscountGiven || 0)}
              </p>
              <p className="text-xs text-orange-600 mt-1">
                Média de {formatCurrency(stats?.averageDiscount || 0)} por venda
              </p>
            </div>
            <div className="p-3 bg-orange-200 rounded-full">
              <Percent size={24} className="text-orange-700" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700">Cupons Ativos</p>
              <p className="text-2xl font-bold text-blue-900">
                {stats?.activeCoupons || 0}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                de {stats?.totalCouponsAvailable || 0} cadastrados
              </p>
            </div>
            <div className="p-3 bg-blue-200 rounded-full">
              <Ticket size={24} className="text-blue-700" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('opportunities')}
            className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'opportunities'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Zap size={16} className="inline mr-1" />
            Oportunidades de Engajamento
          </button>
          <button
            onClick={() => setActiveTab('topUsers')}
            className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'topUsers'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users size={16} className="inline mr-1" />
            Top Usuários de Cupom
          </button>
          <button
            onClick={() => setActiveTab('performance')}
            className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'performance'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <TrendingUp size={16} className="inline mr-1" />
            Performance dos Cupons
          </button>
        </nav>
      </div>

      {/* Conteúdo das Tabs */}
      {activeTab === 'opportunities' && (
        <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold flex items-center gap-2">
                <Zap className="text-yellow-500" size={20} />
                Oportunidades de Engajamento
            </h3>
            <p className="text-sm text-gray-500 mt-1">
                Clientes com potencial para receber cupons e aumentar o engajamento
            </p>
            </div>

            {engagementOpportunities.length === 0 ? (
            <div className="p-12 text-center">
                <Gift size={48} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Nenhuma oportunidade identificada no momento</p>
            </div>
            ) : (
            <div className="divide-y divide-gray-100">
                {engagementOpportunities.map((opp, index) => {
                const Icon = opp.icon
                return (
                    <div key={index} className={`p-4 border-l-4 ${getPriorityColor(opp.priority)}`}>
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                            opp.priority === 'high' ? 'bg-red-100' :
                            opp.priority === 'medium' ? 'bg-yellow-100' : 'bg-blue-100'
                        }`}>
                            <Icon size={18} className={
                            opp.priority === 'high' ? 'text-red-600' :
                            opp.priority === 'medium' ? 'text-yellow-600' : 'text-blue-600'
                            } />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-gray-900">{opp.customer?.name}</p>
                            <Badge variant={
                                opp.priority === 'high' ? 'danger' :
                                opp.priority === 'medium' ? 'warning' : 'info'
                            }>
                                {opp.priority === 'high' ? 'Alta Prioridade' : 'Média Prioridade'}
                            </Badge>
                            </div>
                            <p className="text-sm text-gray-600">{opp.reason}</p>
                            <p className="text-sm text-blue-600 mt-1 flex items-center gap-1">
                            <ChevronRight size={14} />
                            {opp.suggestion}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>📧 {opp.customer?.email || 'Email não cadastrado'}</span>
                            <span>📞 {opp.customer?.phone || 'Telefone não cadastrado'}</span>
                            <span>💰 Total gasto: {formatCurrency(opp.customer?.total_purchases || 0)}</span>
                            </div>
                        </div>
                        </div>
                        <div className="flex gap-2">
                        <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => opp.customer?.id && navigate(`/customers/${opp.customer.id}/communication`)}
                        >
                            <Gift size={14} className="mr-1" />
                            Enviar Cupom
                        </Button>
                        
                        <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => opp.customer?.id && navigate(`/customers/${opp.customer.id}`)}
                        >
                            <Eye size={14} />
                        </Button>
                        </div>
                    </div>
                    </div>
                )
                })}
            </div>
            )}
        </div>
        )}

      {activeTab === 'topUsers' && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Award className="text-purple-500" size={20} />
              Top Usuários de Cupons
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Clientes que mais utilizaram cupons no período
            </p>
          </div>

          {topCouponUsers.length === 0 ? (
            <div className="p-12 text-center">
              <Ticket size={48} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Nenhum cupom utilizado no período</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">#</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Cliente</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500">Cupons Usados</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500">Cupons Diferentes</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">Total em Descontos</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">Total Gasto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {topCouponUsers.map((user, index) => (
                    <tr key={user.customer?.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`
                            w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                            ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                              index === 1 ? 'bg-gray-200 text-gray-600' :
                              index === 2 ? 'bg-amber-100 text-amber-700' :
                              'bg-blue-100 text-blue-600'}
                          `}>
                            {index + 1}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{user.customer?.name}</p>
                        <p className="text-xs text-gray-500">{user.customer?.email}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-semibold text-purple-600">{user.count}</span>
                      </td>
                      <td className="px-6 py-4 text-center text-sm">
                        {user.couponsUsed?.length || 0}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium text-green-600">
                        {formatCurrency(user.totalDiscount)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm">
                        {formatCurrency(user.totalSpent)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'performance' && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="text-green-500" size={20} />
              Performance dos Cupons
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Cupons mais utilizados no período
            </p>
          </div>

          {couponPerformance.length === 0 ? (
            <div className="p-12 text-center">
              <Ticket size={48} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Nenhum cupom cadastrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Código</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Nome</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Tipo</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500">Usos</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {couponPerformance.map((coupon) => (
                    <tr key={coupon.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-blue-600">{coupon.code}</span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{coupon.name}</p>
                        <p className="text-xs text-gray-500">
                          {coupon.discount_type === 'percent' 
                            ? `${coupon.discount_value}%` 
                            : formatCurrency(coupon.discount_value)}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={coupon.is_global ? 'success' : 'info'}>
                          {coupon.is_global ? 'Global' : 'Restrito'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-semibold">{coupon.usageCount}</span>
                        {coupon.usage_limit && (
                          <span className="text-xs text-gray-500 ml-1">
                            /{coupon.usage_limit}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge variant={coupon.is_active ? 'success' : 'danger'}>
                          {coupon.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default CouponAnalytics