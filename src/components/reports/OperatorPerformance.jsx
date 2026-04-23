// src/components/reports/OperatorPerformance.jsx
import React, { useState, useEffect } from 'react'
import { 
  UserCheck, TrendingUp, Award, ShoppingBag, 
  DollarSign, Target, Medal, Star, User
} from '@lib/icons'
import { supabase } from '@lib/supabase'
import { formatCurrency, formatNumber } from '@utils/formatters'
import StatCard from '@components/ui/StatCard'
import DataLoadingSkeleton from '@components/ui/DataLoadingSkeleton'
import DataTable from '@components/ui/DataTable'

const OperatorPerformance = ({ dateRange, customDateRange, paymentMethodFilter }) => {
  const [loading, setLoading] = useState(true)
  const [operators, setOperators] = useState([])
  const [stats, setStats] = useState({
    totalOperators: 0,
    activeOperators: 0,
    totalSales: 0,
    totalRevenue: 0
  })

  useEffect(() => {
    loadOperatorPerformance()
  }, [dateRange, customDateRange, paymentMethodFilter])

  const getDateRange = () => {
    const now = new Date()
    let startDate, endDate
    
    switch (dateRange) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0))
        endDate = new Date()
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

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['operador', 'gerente', 'admin'])

      if (profilesError) throw profilesError

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
          rank: 0
        }
      })

      const { data: saleItems, error: itemsError } = await supabase
        .from('sale_items')
        .select(`quantity, sale_id`)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())

      if (itemsError) throw itemsError

      const saleOperatorMap = {}
      sales?.forEach(sale => {
        if (sale.created_by) {
          saleOperatorMap[sale.id] = sale.created_by
        }
      })

      const operatorItems = {}
      saleItems?.forEach(item => {
        const operatorId = saleOperatorMap[item.sale_id]
        if (operatorId) {
          operatorItems[operatorId] = (operatorItems[operatorId] || 0) + (item.quantity || 0)
        }
      })

      sales?.forEach(sale => {
        const operatorId = sale.created_by
        if (operatorId && operatorStats[operatorId]) {
          operatorStats[operatorId].salesCount++
          operatorStats[operatorId].totalRevenue += sale.final_amount || 0
          operatorStats[operatorId].totalDiscount += sale.discount_amount || 0
        }
      })

      Object.keys(operatorItems).forEach(operatorId => {
        if (operatorStats[operatorId]) {
          operatorStats[operatorId].itemsSold = operatorItems[operatorId]
        }
      })

      Object.keys(operatorStats).forEach(id => {
        const op = operatorStats[id]
        op.averageTicket = op.salesCount > 0 ? op.totalRevenue / op.salesCount : 0
      })

      const operatorsArray = Object.values(operatorStats)
        .filter(op => op.salesCount > 0)
        .sort((a, b) => b.totalRevenue - a.totalRevenue)

      operatorsArray.forEach((op, index) => {
        op.rank = index + 1
      })

      setOperators(operatorsArray)

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
      admin: { label: 'Admin', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300' },
      gerente: { label: 'Gerente', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' },
      operador: { label: 'Operador', color: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300' }
    }
    const config = configs[role] || configs.operador
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    )
  }

  const getRankIcon = (rank) => {
    if (rank === 1) return <Medal size={20} className="text-yellow-500 dark:text-yellow-400" />
    if (rank === 2) return <Medal size={20} className="text-gray-400 dark:text-gray-500" />
    if (rank === 3) return <Medal size={20} className="text-amber-600 dark:text-amber-400" />
    return <span className="text-sm font-medium text-gray-500 dark:text-gray-400">#{rank}</span>
  }

  const columns = [
    {
      key: 'rank',
      header: '#',
      render: (row) => <div className="flex items-center gap-2">{getRankIcon(row.rank)}</div>
    },
    {
      key: 'name',
      header: 'Operador',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
            {row.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{row.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{row.email}</p>
          </div>
        </div>
      )
    },
    {
      key: 'role',
      header: 'Função',
      render: (row) => getRoleBadge(row.role)
    },
    {
      key: 'salesCount',
      header: 'Vendas',
      sortable: true,
      render: (row) => <span className="text-gray-900 dark:text-white">{row.salesCount}</span>
    },
    {
      key: 'itemsSold',
      header: 'Itens',
      sortable: true,
      render: (row) => <span className="text-gray-900 dark:text-white">{formatNumber(row.itemsSold)}</span>
    },
    {
      key: 'averageTicket',
      header: 'Ticket Médio',
      sortable: true,
      render: (row) => <span className="text-gray-900 dark:text-white">{formatCurrency(row.averageTicket)}</span>
    },
    {
      key: 'totalDiscount',
      header: 'Descontos',
      sortable: true,
      render: (row) => <span className="text-orange-600 dark:text-orange-400">{formatCurrency(row.totalDiscount)}</span>
    },
    {
      key: 'totalRevenue',
      header: 'Faturamento',
      sortable: true,
      render: (row) => <span className="font-semibold text-green-600 dark:text-green-400">{formatCurrency(row.totalRevenue)}</span>
    }
  ]

  if (loading) return <DataLoadingSkeleton type="cards" rows={4} />

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total de Operadores"
          value={stats.totalOperators}
          icon={UserCheck}
          variant="info"
          formatValue={formatNumber}
        />
        <StatCard
          label="Operadores Ativos"
          value={stats.activeOperators}
          icon={Target}
          variant="success"
          formatValue={formatNumber}
        />
        <StatCard
          label="Total de Vendas"
          value={stats.totalSales}
          icon={ShoppingBag}
          variant="purple"
          formatValue={formatNumber}
        />
        <StatCard
          label="Faturamento Total"
          value={stats.totalRevenue}
          icon={DollarSign}
          variant="success"
          formatValue={formatCurrency}
        />
      </div>

      {/* Ranking de Operadores */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
            <Award className="text-yellow-500 dark:text-yellow-400" size={20} />
            Ranking de Desempenho
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Baseado no faturamento total no período
          </p>
        </div>

        {operators.length === 0 ? (
          <div className="p-12 text-center">
            <User size={48} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">Nenhuma venda registrada no período</p>
          </div>
        ) : (
          <>
            {/* Top 3 - Destaque */}
            <div className="p-6 bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
              <div className="grid grid-cols-3 gap-4">
                {operators.slice(0, 3).map((operator, index) => (
                  <div 
                    key={operator.id}
                    className={`text-center p-4 rounded-lg ${
                      index === 0 ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800' :
                      index === 1 ? 'bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700' :
                      'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
                    }`}
                  >
                    <div className="flex justify-center mb-2">{getRankIcon(operator.rank)}</div>
                    <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                      {operator.name.charAt(0).toUpperCase()}
                    </div>
                    <p className="font-medium text-gray-900 dark:text-white truncate">{operator.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{getRoleBadge(operator.role)}</p>
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(operator.totalRevenue)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {operator.salesCount} vendas
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tabela */}
            <div className="p-6">
              <DataTable
                columns={columns}
                data={operators}
                emptyMessage="Nenhum operador encontrado"
                striped
                hover
                pagination={operators.length > 10}
                itemsPerPageOptions={[10, 20, 50]}
                defaultItemsPerPage={10}
                showTotalItems
                showActionsLegend={false}
              />
            </div>
          </>
        )}
      </div>

      {/* Métricas Adicionais */}
      {operators.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">Melhor Ticket Médio</h4>
            {[...operators].sort((a, b) => b.averageTicket - a.averageTicket).slice(0, 1).map(op => (
              <div key={op.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star size={16} className="text-yellow-500 dark:text-yellow-400" />
                  <span className="font-medium text-gray-900 dark:text-white">{op.name}</span>
                </div>
                <span className="font-bold text-blue-600 dark:text-blue-400">{formatCurrency(op.averageTicket)}</span>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">Mais Itens Vendidos</h4>
            {[...operators].sort((a, b) => b.itemsSold - a.itemsSold).slice(0, 1).map(op => (
              <div key={op.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag size={16} className="text-green-500 dark:text-green-400" />
                  <span className="font-medium text-gray-900 dark:text-white">{op.name}</span>
                </div>
                <span className="font-bold text-green-600 dark:text-green-400">{formatNumber(op.itemsSold)} itens</span>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">Maior Número de Vendas</h4>
            {[...operators].sort((a, b) => b.salesCount - a.salesCount).slice(0, 1).map(op => (
              <div key={op.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target size={16} className="text-purple-500 dark:text-purple-400" />
                  <span className="font-medium text-gray-900 dark:text-white">{op.name}</span>
                </div>
                <span className="font-bold text-purple-600 dark:text-purple-400">{op.salesCount} vendas</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default OperatorPerformance
