import React, { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { TrendingUp, TrendingDown, DollarSign, Percent } from '@lib/icons'
import { formatCurrency, formatNumber } from '@utils/formatters'
import DataLoadingSkeleton from '../ui/DataLoadingSkeleton'
import DataTable from '../ui/DataTable'
import StatCard from '../ui/StatCard'

const fetchProfitabilityData = async (startDate, endDate, categoryFilter) => {
  let query = supabase.from('sale_items').select(`
    quantity,
    total_price,
    product:products(name, code, category, price, cost_price)
  `)

  if (startDate) query = query.gte('created_at', startDate)
  if (endDate) query = query.lte('created_at', endDate)

  const { data, error } = await query

  if (error) throw error
  
  let filtered = data || []
  if (categoryFilter) {
    filtered = filtered.filter(item => item.product?.category === categoryFilter)
  }

  return filtered
}

const fetchCategories = async () => {
  const { data, error } = await supabase
    .from('products')
    .select('category')
    .not('category', 'is', null)

  if (error) throw error
  
  const categories = [...new Set(data.map(p => p.category))]
  return categories.sort()
}

const ProfitabilityReport = ({ dateRange, customDateRange, categoryFilter }) => {
  const startDate = customDateRange?.start || new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0]
  const endDate = customDateRange?.end || new Date().toISOString().split('T')[0]

  const { data, isLoading } = useQuery({
    queryKey: ['profitability', startDate, endDate, categoryFilter],
    queryFn: () => fetchProfitabilityData(startDate, endDate, categoryFilter)
  })

  const { data: categories } = useQuery({
    queryKey: ['categories-profitability'],
    queryFn: fetchCategories
  })

  const profitabilityData = useMemo(() => {
    if (!data) return { byProduct: [], byCategory: [], totals: { revenue: 0, cost: 0, profit: 0 } }

    const productMap = {}
    const categoryMap = {}

    data.forEach(item => {
      const product = item.product
      if (!product) return

      const revenue = item.total_price || 0
      const cost = (product.cost_price || 0) * (item.quantity || 0)
      const profit = revenue - cost

      const key = product.code || product.name
      if (!productMap[key]) {
        productMap[key] = {
          name: product.name,
          code: product.code,
          category: product.category,
          revenue: 0,
          cost: 0,
          profit: 0,
          quantity: 0,
          margin: 0
        }
      }
      productMap[key].revenue += revenue
      productMap[key].cost += cost
      productMap[key].profit += profit
      productMap[key].quantity += item.quantity || 0

      const cat = product.category || 'Sem categoria'
      if (!categoryMap[cat]) {
        categoryMap[cat] = { revenue: 0, cost: 0, profit: 0, quantity: 0 }
      }
      categoryMap[cat].revenue += revenue
      categoryMap[cat].cost += cost
      categoryMap[cat].profit += profit
      categoryMap[cat].quantity += item.quantity || 0
    })

    Object.values(productMap).forEach(p => {
      p.margin = p.revenue > 0 ? (p.profit / p.revenue) * 100 : 0
    })

    const byProduct = Object.values(productMap).sort((a, b) => b.profit - a.profit)
    const byCategory = Object.entries(categoryMap).map(([name, data]) => ({
      name,
      ...data,
      margin: data.revenue > 0 ? (data.profit / data.revenue) * 100 : 0
    })).sort((a, b) => b.profit - a.profit)

    const totals = {
      revenue: byProduct.reduce((sum, p) => sum + p.revenue, 0),
      cost: byProduct.reduce((sum, p) => sum + p.cost, 0),
      profit: byProduct.reduce((sum, p) => sum + p.profit, 0)
    }

    return { byProduct, byCategory, totals }
  }, [data])

  // Colunas para Categorias
  const categoryColumns = [
    {
      key: 'name',
      header: 'Categoria',
      sortable: true,
      width: '25%',
      render: (row) => <span className="font-medium text-gray-900 dark:text-white">{row.name}</span>
    },
    {
      key: 'revenue',
      header: 'Receita',
      sortable: true,
      width: '150px',
      render: (row) => <span className="text-gray-900 dark:text-white">{formatCurrency(row.revenue)}</span>
    },
    {
      key: 'cost',
      header: 'Custo',
      sortable: true,
      width: '150px',
      render: (row) => <span className="text-gray-900 dark:text-white">{formatCurrency(row.cost)}</span>
    },
    {
      key: 'profit',
      header: 'Lucro',
      sortable: true,
      width: '150px',
      render: (row) => <span className="font-medium text-green-600 dark:text-green-400">{formatCurrency(row.profit)}</span>
    },
    {
      key: 'margin',
      header: 'Margem',
      sortable: true,
      width: '120px',
      render: (row) => (
        <span className={`${
          row.margin > 30 ? 'text-green-600 dark:text-green-400' : 
          row.margin > 15 ? 'text-yellow-600 dark:text-yellow-400' : 
          'text-red-600 dark:text-red-400'
        }`}>
          {row.margin.toFixed(1)}%
        </span>
      )
    }
  ]

  // Colunas para Produtos
  const productColumns = [
    {
      key: 'name',
      header: 'Produto',
      sortable: true,
      width: '25%',
      minWidth: '200px',
      render: (row) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{row.name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{row.code}</p>
        </div>
      )
    },
    {
      key: 'category',
      header: 'Categoria',
      sortable: true,
      width: '150px',
      render: (row) => <span className="text-sm text-gray-600 dark:text-gray-400">{row.category || '-'}</span>
    },
    {
      key: 'quantity',
      header: 'Qtd',
      sortable: true,
      width: '100px',
      render: (row) => <span className="text-gray-900 dark:text-white">{formatNumber(row.quantity)}</span>
    },
    {
      key: 'revenue',
      header: 'Receita',
      sortable: true,
      width: '150px',
      render: (row) => <span className="text-gray-900 dark:text-white">{formatCurrency(row.revenue)}</span>
    },
    {
      key: 'profit',
      header: 'Lucro',
      sortable: true,
      width: '150px',
      render: (row) => <span className="font-medium text-green-600 dark:text-green-400">{formatCurrency(row.profit)}</span>
    },
    {
      key: 'margin',
      header: 'Margem',
      sortable: true,
      width: '120px',
      render: (row) => (
        <span className={`${
          row.margin > 30 ? 'text-green-600 dark:text-green-400' : 
          row.margin > 15 ? 'text-yellow-600 dark:text-yellow-400' : 
          'text-red-600 dark:text-red-400'
        }`}>
          {row.margin.toFixed(1)}%
        </span>
      )
    }
  ]

  if (isLoading) return <DataLoadingSkeleton type="cards" rows={5} />

  const { totals, byProduct, byCategory } = profitabilityData
  const overallMargin = totals.revenue > 0 ? (totals.profit / totals.revenue) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Receita Total"
          value={formatCurrency(totals.revenue)}
          icon={DollarSign}
          variant="info"
        />
        <StatCard
          label="Lucro Bruto"
          value={formatCurrency(totals.profit)}
          sublabel={`Margem: ${overallMargin.toFixed(1)}%`}
          icon={TrendingUp}
          variant="success"
        />
        <StatCard
          label="Custo Total"
          value={formatCurrency(totals.cost)}
          sublabel={`${totals.revenue > 0 ? ((totals.cost / totals.revenue) * 100).toFixed(1) : 0}% da receita`}
          icon={TrendingDown}
          variant="warning"
        />
      </div>

      {/* Lucratividade por Categoria */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">Lucratividade por Categoria</h3>
        </div>
        <DataTable
          columns={categoryColumns}
          data={byCategory}
          emptyMessage="Nenhuma categoria encontrada"
          striped
          hover
          pagination={byCategory.length > 10}
          itemsPerPageOptions={[10, 20, 50]}
          defaultItemsPerPage={10}
          showTotalItems
          showActionsLegend={false}
        />
      </div>

      {/* Lucratividade por Produto */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">Lucratividade por Produto (Top 20)</h3>
        </div>
        <DataTable
          columns={productColumns}
          data={byProduct.slice(0, 20)}
          emptyMessage="Nenhum produto encontrado"
          striped
          hover
          pagination={byProduct.length > 20}
          itemsPerPageOptions={[20, 50, 100]}
          defaultItemsPerPage={20}
          showTotalItems
          showActionsLegend={false}
        />
      </div>
    </div>
  )
}

export default ProfitabilityReport