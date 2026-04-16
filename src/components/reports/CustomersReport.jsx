import React, { useState, useEffect } from 'react'
import { 
  Users, UserPlus, Award, TrendingUp, Phone, Mail, ShoppingBag,
  Ticket
} from '../../lib/icons'
import { supabase } from '../../lib/supabase'
import { formatCurrency, formatNumber, formatDate } from '../../utils/formatters'
import SummaryCard from './SummaryCard'
import DataLoadingSkeleton from '../ui/DataLoadingSkeleton'
import DataTable from '../ui/DataTable'
import Badge from '../Badge'
import CouponAnalytics from './CouponAnalytics'

const CustomersReport = ({ dateRange, customDateRange }) => {
  const [loading, setLoading] = useState(true)
  const [customersData, setCustomersData] = useState(null)
  const [topCustomers, setTopCustomers] = useState([])
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    loadCustomersReport()
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

  const loadCustomersReport = async () => {
    setLoading(true)
    try {
      const { startDate, endDate } = getDateRange()

      const { data: customers, error } = await supabase
        .from('customers')
        .select('*')
        .order('total_purchases', { ascending: false })
      
      if (error) throw error
      
      const { data: sales } = await supabase
        .from('sales')
        .select('customer_id, final_amount, created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .not('customer_id', 'is', null)
      
      const customerPurchases = {}
      sales?.forEach(sale => {
        if (!customerPurchases[sale.customer_id]) {
          customerPurchases[sale.customer_id] = {
            count: 0,
            total: 0,
            lastPurchase: sale.created_at
          }
        }
        customerPurchases[sale.customer_id].count += 1
        customerPurchases[sale.customer_id].total += sale.final_amount || 0
        if (new Date(sale.created_at) > new Date(customerPurchases[sale.customer_id].lastPurchase)) {
          customerPurchases[sale.customer_id].lastPurchase = sale.created_at
        }
      })
      
      const enrichedCustomers = customers?.map(customer => ({
        ...customer,
        period_purchases: customerPurchases[customer.id]?.count || 0,
        period_total: customerPurchases[customer.id]?.total || 0,
        period_last_purchase: customerPurchases[customer.id]?.lastPurchase || null
      })).sort((a, b) => b.period_total - a.period_total)
      
      const topPeriodCustomers = enrichedCustomers
        ?.filter(c => c.period_purchases > 0)
        .slice(0, 10) || []
      
      setTopCustomers(topPeriodCustomers)
      
      const activeCustomers = customers?.filter(c => c.status === 'active').length || 0
      const newCustomers = customers?.filter(c => {
        const createdAt = new Date(c.created_at)
        return createdAt >= startDate && createdAt <= endDate
      }).length || 0
      
      const customersWithPurchases = enrichedCustomers?.filter(c => c.period_purchases > 0).length || 0
      
      setCustomersData({
        totalCustomers: customers?.length || 0,
        activeCustomers,
        newCustomers,
        customersWithPurchases,
        totalRevenue: enrichedCustomers?.reduce((sum, c) => sum + (c.total_purchases || 0), 0) || 0,
        periodRevenue: enrichedCustomers?.reduce((sum, c) => sum + (c.period_total || 0), 0) || 0,
        averagePeriodPerCustomer: customersWithPurchases > 0
          ? (enrichedCustomers?.reduce((sum, c) => sum + (c.period_total || 0), 0) || 0) / customersWithPurchases
          : 0
      })

    } catch (error) {
      console.error('Erro ao carregar relatório de clientes:', error)
    } finally {
      setLoading(false)
    }
  }

  // Colunas para o DataTable
  const topCustomersColumns = [
    {
      key: 'rank',
      header: '#',
      width: '60px',
      render: (_, index) => (
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
          index === 0 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
          index === 1 ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300' :
          index === 2 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' :
          'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300'
        }`}>
          {index + 1}
        </div>
      )
    },
    {
      key: 'name',
      header: 'Cliente',
      sortable: true,
      width: '25%',
      minWidth: '200px',
      render: (row) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{row.name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Cliente desde {formatDate(row.created_at)}
          </p>
        </div>
      )
    },
    {
      key: 'contact',
      header: 'Contato',
      width: '180px',
      render: (row) => (
        <div className="space-y-1">
          <p className="text-sm flex items-center gap-1 text-gray-700 dark:text-gray-300">
            <Phone size={12} className="text-gray-400 dark:text-gray-500" />
            {row.phone || '-'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <Mail size={12} className="text-gray-400 dark:text-gray-500" />
            {row.email || '-'}
          </p>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      width: '100px',
      render: (row) => (
        <Badge variant={row.status === 'active' ? 'success' : 'danger'}>
          {row.status === 'active' ? 'Ativo' : 'Inativo'}
        </Badge>
      )
    },
    {
      key: 'period_purchases',
      header: 'Compras',
      sortable: true,
      width: '100px',
      render: (row) => <span className="text-gray-900 dark:text-white">{row.period_purchases}</span>
    },
    {
      key: 'period_total',
      header: 'Total (Período)',
      sortable: true,
      width: '150px',
      render: (row) => <span className="font-medium text-green-600 dark:text-green-400">{formatCurrency(row.period_total)}</span>
    },
    {
      key: 'total_purchases',
      header: 'Total Histórico',
      sortable: true,
      width: '150px',
      render: (row) => <span className="text-gray-600 dark:text-gray-400">{formatCurrency(row.total_purchases)}</span>
    }
  ]

  if (loading) {
    return <DataLoadingSkeleton type="cards" rows={4} />
  }

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Total de Clientes"
          value={formatNumber(customersData?.totalCustomers || 0)}
          icon={Users}
          color="blue"
        />
        <SummaryCard
          title="Clientes Ativos"
          value={formatNumber(customersData?.activeCustomers || 0)}
          icon={Award}
          color="green"
        />
        <SummaryCard
          title="Novos Clientes"
          value={formatNumber(customersData?.newCustomers || 0)}
          icon={UserPlus}
          color="purple"
          subtitle="No período"
        />
        <SummaryCard
          title="Clientes com Compras"
          value={formatNumber(customersData?.customersWithPurchases || 0)}
          icon={ShoppingBag}
          color="orange"
          subtitle="No período"
        />
      </div>

      {/* Segunda linha de cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard
          title="Faturamento Total"
          value={formatCurrency(customersData?.totalRevenue || 0)}
          icon={TrendingUp}
          color="indigo"
          subtitle="Histórico"
        />
        <SummaryCard
          title="Faturamento no Período"
          value={formatCurrency(customersData?.periodRevenue || 0)}
          icon={TrendingUp}
          color="cyan"
          subtitle="Período selecionado"
        />
        <SummaryCard
          title="Ticket Médio"
          value={formatCurrency(customersData?.averagePeriodPerCustomer || 0)}
          icon={Award}
          color="green"
          subtitle="Por cliente no período"
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Users size={16} className="inline mr-1" />
            Visão Geral
          </button>
          <button
            onClick={() => setActiveTab('coupons')}
            className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'coupons'
                ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Ticket size={16} className="inline mr-1" />
            Análise de Cupons
          </button>
        </nav>
      </div>

      {/* Conteúdo das Tabs */}
      {activeTab === 'overview' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
              <Award className="text-yellow-500 dark:text-yellow-400" size={20} />
              Top Clientes do Período
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Clientes que mais compraram no período selecionado
            </p>
          </div>

          {topCustomers.length === 0 ? (
            <div className="p-12 text-center">
              <Users size={48} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">Nenhuma compra de clientes cadastrados no período</p>
            </div>
          ) : (
            <DataTable
              columns={topCustomersColumns}
              data={topCustomers}
              emptyMessage="Nenhum cliente encontrado"
              striped
              hover
              pagination={false}
              showActionsLegend={false}
            />
          )}
        </div>
      )}

      {activeTab === 'coupons' && (
        <CouponAnalytics dateRange={dateRange} customDateRange={customDateRange} />
      )}
    </div>
  )
}

export default CustomersReport