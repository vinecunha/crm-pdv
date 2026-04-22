import React, { useState, useEffect } from 'react'
import { 
  Ticket, Percent, Target, Gift, Zap, TrendingUp,
  Users, Award, AlertCircle, ChevronRight, ShoppingBag, Eye
} from '@lib/icons'
import { supabase } from '@lib/supabase'
import { formatCurrency, formatNumber } from '@utils/formatters'
import DataLoadingSkeleton from '../ui/DataLoadingSkeleton'
import DataTable from '../ui/DataTable'
import Badge from '../Badge'
import Button from '../ui/Button'
import { useNavigate } from 'react-router-dom'
import { logger } from '@utils/logger' 

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

      const { data: allSales, error: allSalesError } = await supabase
        .from('sales')
        .select('customer_id, created_at, status')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })

      if (allSalesError) throw allSalesError

      const lastPurchaseMap = {}
      allSales?.forEach(sale => {
        if (sale.customer_id && !lastPurchaseMap[sale.customer_id]) {
          lastPurchaseMap[sale.customer_id] = sale.created_at
        }
      })

      const { data: coupons, error: couponsError } = await supabase
        .from('coupons')
        .select('*')
        .eq('is_active', true)

      if (couponsError) throw couponsError

      const { data: allCustomers, error: customersError } = await supabase
        .from('customers')
        .select('id, name, email, phone, total_purchases, status, created_at')
        .eq('status', 'active')

      if (customersError) throw customersError

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

      const topUsers = Object.values(customerCouponUsage)
        .map(u => ({
          ...u,
          couponsUsed: Array.from(u.couponsUsed)
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      setTopCouponUsers(topUsers)

      const performance = coupons?.map(coupon => ({
        ...coupon,
        usageCount: couponUsageCount[coupon.code] || 0,
        usageRate: coupon.usage_limit 
          ? ((couponUsageCount[coupon.code] || 0) / coupon.usage_limit) * 100 
          : 0
      })).sort((a, b) => b.usageCount - a.usageCount)

      setCouponPerformance(performance)

      const opportunities = []
      
      const highSpendersNoCoupon = allCustomers?.filter(c => {
        const hasUsedCoupon = customerCouponUsage[c.id]
        return !hasUsedCoupon && (c.total_purchases || 0) > 100
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

      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const inactiveCustomers = allCustomers?.filter(c => {
        const lastPurchase = lastPurchaseMap[c.id]
        if (!lastPurchase) {
          const createdAt = new Date(c.created_at)
          return createdAt < thirtyDaysAgo
        }
        return new Date(lastPurchase) < thirtyDaysAgo
      }).slice(0, 5)

      logger.log('📊 Clientes inativos encontrados:', inactiveCustomers.length)

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

      const uniqueOpportunities = []
      const seenCustomers = new Set()
      
      opportunities.forEach(opp => {
        if (!seenCustomers.has(opp.customer.id)) {
          seenCustomers.add(opp.customer.id)
          uniqueOpportunities.push(opp)
        }
      })

      setEngagementOpportunities(uniqueOpportunities)

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
      case 'high': return 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20'
      case 'medium': return 'border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20'
      default: return 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20'
    }
  }

  // Colunas para Top Usuários
  const topUsersColumns = [
    {
      key: 'rank',
      header: '#',
      width: '60px',
      render: (_, index) => (
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
          index === 0 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
          index === 1 ? 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300' :
          index === 2 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' :
          'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300'
        }`}>
          {index + 1}
        </div>
      )
    },
    {
      key: 'customer',
      header: 'Cliente',
      sortable: true,
      width: '25%',
      render: (row) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{row.customer?.name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{row.customer?.email}</p>
        </div>
      )
    },
    {
      key: 'count',
      header: 'Cupons Usados',
      sortable: true,
      width: '120px',
      render: (row) => <span className="font-semibold text-purple-600 dark:text-purple-400">{row.count}</span>
    },
    {
      key: 'couponsUsed',
      header: 'Cupons Diferentes',
      width: '140px',
      render: (row) => <span className="text-gray-700 dark:text-gray-300">{row.couponsUsed?.length || 0}</span>
    },
    {
      key: 'totalDiscount',
      header: 'Total em Descontos',
      sortable: true,
      width: '150px',
      render: (row) => <span className="font-medium text-green-600 dark:text-green-400">{formatCurrency(row.totalDiscount)}</span>
    },
    {
      key: 'totalSpent',
      header: 'Total Gasto',
      sortable: true,
      width: '120px',
      render: (row) => <span className="text-gray-700 dark:text-gray-300">{formatCurrency(row.totalSpent)}</span>
    }
  ]

  // Colunas para Performance dos Cupons
  const performanceColumns = [
    {
      key: 'code',
      header: 'Código',
      sortable: true,
      width: '140px',
      render: (row) => <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{row.code}</span>
    },
    {
      key: 'name',
      header: 'Nome',
      sortable: true,
      width: '25%',
      render: (row) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{row.name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {row.discount_type === 'percent' ? `${row.discount_value}%` : formatCurrency(row.discount_value)}
          </p>
        </div>
      )
    },
    {
      key: 'type',
      header: 'Tipo',
      width: '100px',
      render: (row) => (
        <Badge variant={row.is_global ? 'success' : 'info'}>
          {row.is_global ? 'Global' : 'Restrito'}
        </Badge>
      )
    },
    {
      key: 'usageCount',
      header: 'Usos',
      sortable: true,
      width: '120px',
      render: (row) => (
        <div>
          <span className="font-semibold text-gray-900 dark:text-white">{row.usageCount}</span>
          {row.usage_limit && (
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">/{row.usage_limit}</span>
          )}
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      width: '100px',
      render: (row) => (
        <Badge variant={row.is_active ? 'success' : 'danger'}>
          {row.is_active ? 'Ativo' : 'Inativo'}
        </Badge>
      )
    }
  ]

  if (loading) {
    return <DataLoadingSkeleton type="cards" rows={3} />
  }

  return (
    <div className="space-y-6">
      {/* Cards de Estatísticas de Cupons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 rounded-lg border border-purple-200 dark:border-purple-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-700 dark:text-purple-300">Taxa de Adoção</p>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-200">
                {stats?.couponAdoptionRate.toFixed(1)}%
              </p>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                {stats?.customersWithCoupon} de {stats?.totalCouponsAvailable} clientes
              </p>
            </div>
            <div className="p-3 bg-purple-200 dark:bg-purple-800 rounded-full">
              <Target size={24} className="text-purple-700 dark:text-purple-300" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-lg border border-green-200 dark:border-green-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 dark:text-green-300">Vendas com Cupom</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-200">
                {formatNumber(stats?.totalCouponSales || 0)}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                {formatCurrency(stats?.totalSalesWithCoupon || 0)} em vendas
              </p>
            </div>
            <div className="p-3 bg-green-200 dark:bg-green-800 rounded-full">
              <ShoppingBag size={24} className="text-green-700 dark:text-green-300" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 rounded-lg border border-orange-200 dark:border-orange-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-700 dark:text-orange-300">Descontos Concedidos</p>
              <p className="text-2xl font-bold text-orange-900 dark:text-orange-200">
                {formatCurrency(stats?.totalDiscountGiven || 0)}
              </p>
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                Média de {formatCurrency(stats?.averageDiscount || 0)} por venda
              </p>
            </div>
            <div className="p-3 bg-orange-200 dark:bg-orange-800 rounded-full">
              <Percent size={24} className="text-orange-700 dark:text-orange-300" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg border border-blue-200 dark:border-blue-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 dark:text-blue-300">Cupons Ativos</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-200">
                {stats?.activeCoupons || 0}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                de {stats?.totalCouponsAvailable || 0} cadastrados
              </p>
            </div>
            <div className="p-3 bg-blue-200 dark:bg-blue-800 rounded-full">
              <Ticket size={24} className="text-blue-700 dark:text-blue-300" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('opportunities')}
            className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'opportunities'
                ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Zap size={16} className="inline mr-1" />
            Oportunidades
          </button>
          <button
            onClick={() => setActiveTab('topUsers')}
            className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'topUsers'
                ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Users size={16} className="inline mr-1" />
            Top Usuários
          </button>
          <button
            onClick={() => setActiveTab('performance')}
            className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'performance'
                ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <TrendingUp size={16} className="inline mr-1" />
            Performance
          </button>
        </nav>
      </div>

      {/* Conteúdo das Tabs */}
      {activeTab === 'opportunities' && (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
              <Zap className="text-yellow-500 dark:text-yellow-400" size={20} />
              Oportunidades de Engajamento
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Clientes com potencial para receber cupons e aumentar o engajamento
            </p>
          </div>

          {engagementOpportunities.length === 0 ? (
            <div className="p-12 text-center">
              <Gift size={48} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">Nenhuma oportunidade identificada no momento</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {engagementOpportunities.map((opp, index) => {
                const Icon = opp.icon
                return (
                  <div key={index} className={`p-4 border-l-4 ${getPriorityColor(opp.priority)}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          opp.priority === 'high' ? 'bg-red-100 dark:bg-red-900/30' :
                          opp.priority === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-blue-100 dark:bg-blue-900/30'
                        }`}>
                          <Icon size={18} className={
                            opp.priority === 'high' ? 'text-red-600 dark:text-red-400' :
                            opp.priority === 'medium' ? 'text-yellow-600 dark:text-yellow-400' : 'text-blue-600 dark:text-blue-400'
                          } />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-gray-900 dark:text-white">{opp.customer?.name}</p>
                            <Badge variant={
                              opp.priority === 'high' ? 'danger' :
                              opp.priority === 'medium' ? 'warning' : 'info'
                            }>
                              {opp.priority === 'high' ? 'Alta Prioridade' : 'Média Prioridade'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{opp.reason}</p>
                          <p className="text-sm text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1">
                            <ChevronRight size={14} />
                            {opp.suggestion}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
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
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
              <Award className="text-purple-500 dark:text-purple-400" size={20} />
              Top Usuários de Cupons
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Clientes que mais utilizaram cupons no período
            </p>
          </div>

          {topCouponUsers.length === 0 ? (
            <div className="p-12 text-center">
              <Ticket size={48} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">Nenhum cupom utilizado no período</p>
            </div>
          ) : (
            <DataTable
              columns={topUsersColumns}
              data={topCouponUsers}
              emptyMessage="Nenhum usuário encontrado"
              striped
              hover
              pagination={false}
              showActionsLegend={false}
            />
          )}
        </div>
      )}

      {activeTab === 'performance' && (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
              <TrendingUp className="text-green-500 dark:text-green-400" size={20} />
              Performance dos Cupons
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Cupons mais utilizados no período
            </p>
          </div>

          {couponPerformance.length === 0 ? (
            <div className="p-12 text-center">
              <Ticket size={48} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">Nenhum cupom cadastrado</p>
            </div>
          ) : (
            <DataTable
              columns={performanceColumns}
              data={couponPerformance}
              emptyMessage="Nenhum cupom encontrado"
              striped
              hover
              pagination={couponPerformance.length > 10}
              itemsPerPageOptions={[10, 20, 50]}
              defaultItemsPerPage={10}
              showActionsLegend={false}
            />
          )}
        </div>
      )}
    </div>
  )
}

export default CouponAnalytics