import React, { useState, useEffect, useRef } from 'react'
import { 
  UserCheck, TrendingUp, Award, ShoppingBag, 
  DollarSign, Target, Medal, Star, User
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatCurrency, formatNumber } from '../../utils/formatters'
import SummaryCard from './SummaryCard'
import DataLoadingSkeleton from '../ui/DataLoadingSkeleton'
import '../../lib/chartConfig' 

const OperatorPerformance = ({ dateRange, customDateRange, paymentMethodFilter }) => {
  const [loading, setLoading] = useState(true)
  const [operators, setOperators] = useState([])
  const [stats, setStats] = useState({
    totalOperators: 0,
    activeOperators: 0,
    totalSales: 0,
    totalRevenue: 0
  })

  const lineChartId = useRef(`line-chart-${Date.now()}-${Math.random().toString(36)}`)
  const doughnutChartId = useRef(`doughnut-chart-${Date.now()}-${Math.random().toString(36)}`)

  useEffect(() => {
    loadOperatorPerformance()
  }, [dateRange, customDateRange, paymentMethodFilter])

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

  const loadOperatorPerformance = async () => {
    setLoading(true)
    try {
      const { startDate, endDate } = getDateRange()

      // Buscar todos os perfis que podem vender
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['operador', 'gerente', 'admin'])

      if (profilesError) throw profilesError

      // Buscar vendas no período
      let query = supabase
        .from('sales')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .not('created_by', 'is', null)

      if (paymentMethodFilter) {
        query = query.eq('payment_method', paymentMethodFilter)
      }

      const { data: sales, error: salesError } = await query
      if (salesError) throw salesError

      // Processar dados por operador
      const operatorStats = {}
      
      profiles?.forEach(profile => {
        operatorStats[profile.id] = {
          id: profile.id,
          name: profile.full_name || profile.email?.split('@')[0] || 'Usuário',
          email: profile.email,
          role: profile.role,
          avatar_url: profile.avatar_url,
          salesCount: 0,
          totalRevenue: 0,
          totalDiscount: 0,
          averageTicket: 0,
          itemsSold: 0,
          // Para ranking
          rank: 0
        }
      })

      // Buscar itens vendidos para contar produtos
      const { data: saleItems, error: itemsError } = await supabase
        .from('sale_items')
        .select(`
          quantity,
          sale_id
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())

      if (itemsError) throw itemsError

      // Criar mapa de sale_id -> created_by
      const saleOperatorMap = {}
      sales?.forEach(sale => {
        if (sale.created_by) {
          saleOperatorMap[sale.id] = sale.created_by
        }
      })

      // Contar itens por operador
      const operatorItems = {}
      saleItems?.forEach(item => {
        const operatorId = saleOperatorMap[item.sale_id]
        if (operatorId) {
          operatorItems[operatorId] = (operatorItems[operatorId] || 0) + (item.quantity || 0)
        }
      })

      // Processar vendas
      sales?.forEach(sale => {
        const operatorId = sale.created_by
        if (operatorId && operatorStats[operatorId]) {
          operatorStats[operatorId].salesCount++
          operatorStats[operatorId].totalRevenue += sale.final_amount || 0
          operatorStats[operatorId].totalDiscount += sale.discount_amount || 0
        }
      })

      // Adicionar contagem de itens
      Object.keys(operatorItems).forEach(operatorId => {
        if (operatorStats[operatorId]) {
          operatorStats[operatorId].itemsSold = operatorItems[operatorId]
        }
      })

      // Calcular ticket médio
      Object.keys(operatorStats).forEach(id => {
        const op = operatorStats[id]
        op.averageTicket = op.salesCount > 0 ? op.totalRevenue / op.salesCount : 0
      })

      // Converter para array, filtrar quem tem vendas, ordenar por receita
      const operatorsArray = Object.values(operatorStats)
        .filter(op => op.salesCount > 0)
        .sort((a, b) => b.totalRevenue - a.totalRevenue)

      // Atribuir ranking
      operatorsArray.forEach((op, index) => {
        op.rank = index + 1
      })

      setOperators(operatorsArray)

      // Calcular estatísticas gerais
      const activeOperators = operatorsArray.length
      const totalSales = operatorsArray.reduce((sum, op) => sum + op.salesCount, 0)
      const totalRevenue = operatorsArray.reduce((sum, op) => sum + op.totalRevenue, 0)

      setStats({
        totalOperators: profiles?.length || 0,
        activeOperators,
        totalSales,
        totalRevenue
      })

    } catch (error) {
      console.error('Erro ao carregar desempenho:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRoleBadge = (role) => {
    const configs = {
      admin: { label: 'Admin', color: 'bg-purple-100 text-purple-800' },
      gerente: { label: 'Gerente', color: 'bg-blue-100 text-blue-800' },
      operador: { label: 'Operador', color: 'bg-gray-100 text-gray-800' }
    }
    const config = configs[role] || configs.operador
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    )
  }

  const getRankIcon = (rank) => {
    if (rank === 1) return <Medal size={20} className="text-yellow-500" />
    if (rank === 2) return <Medal size={20} className="text-gray-400" />
    if (rank === 3) return <Medal size={20} className="text-amber-600" />
    return <span className="text-sm font-medium text-gray-500">#{rank}</span>
  }

  if (loading) {
    return <DataLoadingSkeleton type="cards" rows={4} />
  }

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Total de Operadores"
          value={formatNumber(stats.totalOperators)}
          icon={UserCheck}
          color="blue"
        />
        <SummaryCard
          title="Operadores Ativos"
          value={formatNumber(stats.activeOperators)}
          icon={Target}
          color="green"
          subtitle="Com vendas no período"
        />
        <SummaryCard
          title="Total de Vendas"
          value={formatNumber(stats.totalSales)}
          icon={ShoppingBag}
          color="purple"
        />
        <SummaryCard
          title="Faturamento Total"
          value={formatCurrency(stats.totalRevenue)}
          icon={DollarSign}
          color="indigo"
        />
      </div>

      {/* Ranking de Operadores */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Award className="text-yellow-500" size={20} />
            Ranking de Desempenho
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Baseado no faturamento total no período
          </p>
        </div>

        {operators.length === 0 ? (
          <div className="p-12 text-center">
            <User size={48} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nenhuma venda registrada no período</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {/* Top 3 - Destaque */}
            <div className="p-6 bg-gradient-to-r from-gray-50 to-white">
              <div className="grid grid-cols-3 gap-4">
                {operators.slice(0, 3).map((operator, index) => (
                  <div 
                    key={operator.id}
                    className={`text-center p-4 rounded-lg ${
                      index === 0 ? 'bg-yellow-50 border border-yellow-200' :
                      index === 1 ? 'bg-gray-50 border border-gray-200' :
                      'bg-amber-50 border border-amber-200'
                    }`}
                  >
                    <div className="flex justify-center mb-2">
                      {getRankIcon(operator.rank)}
                    </div>
                    <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                      {operator.name.charAt(0).toUpperCase()}
                    </div>
                    <p className="font-medium text-gray-900 truncate">{operator.name}</p>
                    <p className="text-xs text-gray-500 mb-1">{getRoleBadge(operator.role)}</p>
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(operator.totalRevenue)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {operator.salesCount} vendas
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Lista completa */}
            <div className="p-6">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 text-xs font-medium text-gray-500">#</th>
                    <th className="text-left py-3 text-xs font-medium text-gray-500">Operador</th>
                    <th className="text-center py-3 text-xs font-medium text-gray-500">Função</th>
                    <th className="text-right py-3 text-xs font-medium text-gray-500">Vendas</th>
                    <th className="text-right py-3 text-xs font-medium text-gray-500">Itens</th>
                    <th className="text-right py-3 text-xs font-medium text-gray-500">Ticket Médio</th>
                    <th className="text-right py-3 text-xs font-medium text-gray-500">Descontos</th>
                    <th className="text-right py-3 text-xs font-medium text-gray-500">Faturamento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {operators.map((operator) => (
                    <tr key={operator.id} className="hover:bg-gray-50">
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          {getRankIcon(operator.rank)}
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                            {operator.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{operator.name}</p>
                            <p className="text-xs text-gray-500">{operator.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-center">
                        {getRoleBadge(operator.role)}
                      </td>
                      <td className="py-3 text-right text-sm">
                        {operator.salesCount}
                      </td>
                      <td className="py-3 text-right text-sm">
                        {formatNumber(operator.itemsSold)}
                      </td>
                      <td className="py-3 text-right text-sm">
                        {formatCurrency(operator.averageTicket)}
                      </td>
                      <td className="py-3 text-right text-sm text-orange-600">
                        {formatCurrency(operator.totalDiscount)}
                      </td>
                      <td className="py-3 text-right font-semibold text-green-600">
                        {formatCurrency(operator.totalRevenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Métricas Adicionais */}
      {operators.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Melhor Ticket Médio</h4>
            {[...operators].sort((a, b) => b.averageTicket - a.averageTicket).slice(0, 1).map(op => (
              <div key={op.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star size={16} className="text-yellow-500" />
                  <span className="font-medium">{op.name}</span>
                </div>
                <span className="font-bold text-blue-600">{formatCurrency(op.averageTicket)}</span>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Mais Itens Vendidos</h4>
            {[...operators].sort((a, b) => b.itemsSold - a.itemsSold).slice(0, 1).map(op => (
              <div key={op.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag size={16} className="text-green-500" />
                  <span className="font-medium">{op.name}</span>
                </div>
                <span className="font-bold text-green-600">{formatNumber(op.itemsSold)} itens</span>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Maior Número de Vendas</h4>
            {[...operators].sort((a, b) => b.salesCount - a.salesCount).slice(0, 1).map(op => (
              <div key={op.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target size={16} className="text-purple-500" />
                  <span className="font-medium">{op.name}</span>
                </div>
                <span className="font-bold text-purple-600">{op.salesCount} vendas</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default OperatorPerformance