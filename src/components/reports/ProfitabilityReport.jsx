import React, { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { TrendingUp, TrendingDown, DollarSign, Percent } from '../../lib/icons'
import { formatCurrency, formatNumber } from '../../utils/formatters'
import DataLoadingSkeleton from '../ui/DataLoadingSkeleton'
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
  
  // Filtrar por categoria se necessário
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

    // Por produto
    const productMap = {}
    // Por categoria
    const categoryMap = {}

    data.forEach(item => {
      const product = item.product
      if (!product) return

      const revenue = item.total_price || 0
      const cost = (product.cost_price || 0) * (item.quantity || 0)
      const profit = revenue - cost

      // Agrupar por produto
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

      // Agrupar por categoria
      const cat = product.category || 'Sem categoria'
      if (!categoryMap[cat]) {
        categoryMap[cat] = { revenue: 0, cost: 0, profit: 0, quantity: 0 }
      }
      categoryMap[cat].revenue += revenue
      categoryMap[cat].cost += cost
      categoryMap[cat].profit += profit
      categoryMap[cat].quantity += item.quantity || 0
    })

    // Calcular margens
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
          sublabel={`${((totals.cost / totals.revenue) * 100).toFixed(1)}% da receita`}
          icon={TrendingDown}
          variant="warning"
        />
      </div>

      {/* Lucratividade por Categoria */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Lucratividade por Categoria</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-xs text-gray-500 uppercase">
                <th className="px-6 py-3 text-left">Categoria</th>
                <th className="px-6 py-3 text-right">Receita</th>
                <th className="px-6 py-3 text-right">Custo</th>
                <th className="px-6 py-3 text-right">Lucro</th>
                <th className="px-6 py-3 text-right">Margem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {byCategory.map((cat, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium text-gray-900">{cat.name}</td>
                  <td className="px-6 py-3 text-right">{formatCurrency(cat.revenue)}</td>
                  <td className="px-6 py-3 text-right">{formatCurrency(cat.cost)}</td>
                  <td className="px-6 py-3 text-right font-medium text-green-600">{formatCurrency(cat.profit)}</td>
                  <td className="px-6 py-3 text-right">
                    <span className={`${cat.margin > 30 ? 'text-green-600' : cat.margin > 15 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {cat.margin.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lucratividade por Produto */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Lucratividade por Produto (Top 20)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-xs text-gray-500 uppercase">
                <th className="px-6 py-3 text-left">Produto</th>
                <th className="px-6 py-3 text-left">Categoria</th>
                <th className="px-6 py-3 text-right">Qtd</th>
                <th className="px-6 py-3 text-right">Receita</th>
                <th className="px-6 py-3 text-right">Lucro</th>
                <th className="px-6 py-3 text-right">Margem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {byProduct.slice(0, 20).map((product, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-3">
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-xs text-gray-500">{product.code}</p>
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-600">{product.category || '-'}</td>
                  <td className="px-6 py-3 text-right">{formatNumber(product.quantity)}</td>
                  <td className="px-6 py-3 text-right">{formatCurrency(product.revenue)}</td>
                  <td className="px-6 py-3 text-right font-medium text-green-600">{formatCurrency(product.profit)}</td>
                  <td className="px-6 py-3 text-right">
                    <span className={`${product.margin > 30 ? 'text-green-600' : product.margin > 15 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {product.margin.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default ProfitabilityReport