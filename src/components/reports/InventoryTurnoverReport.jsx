import React, { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { RefreshCw, Package, TrendingUp, TrendingDown } from '../../lib/icons'
import { formatCurrency, formatNumber } from '../../utils/formatters'
import DataLoadingSkeleton from '../ui/DataLoadingSkeleton'
import StatCard from '../ui/StatCard'

const fetchInventoryData = async (startDate, endDate) => {
  // Buscar produtos e vendas do período
  const [productsRes, salesRes] = await Promise.all([
    supabase.from('products').select('*').eq('is_active', true),
    supabase.from('sale_items')
      .select(`quantity, product_id, product:products(cost_price)`)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
  ])

  if (productsRes.error) throw productsRes.error
  if (salesRes.error) throw salesRes.error

  return { products: productsRes.data || [], sales: salesRes.data || [] }
}

const InventoryTurnoverReport = ({ dateRange, customDateRange }) => {
  const startDate = customDateRange?.start || new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0]
  const endDate = customDateRange?.end || new Date().toISOString().split('T')[0]
  
  // Calcular número de dias do período
  const daysDiff = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24))

  const { data, isLoading } = useQuery({
    queryKey: ['inventory-turnover', startDate, endDate],
    queryFn: () => fetchInventoryData(startDate, endDate)
  })

  const turnoverData = useMemo(() => {
    if (!data) return { items: [], avgTurnover: 0, totalCost: 0 }

    const { products, sales } = data

    // Calcular vendas por produto
    const salesMap = {}
    sales.forEach(sale => {
      if (!salesMap[sale.product_id]) {
        salesMap[sale.product_id] = { quantity: 0, cost: 0 }
      }
      salesMap[sale.product_id].quantity += sale.quantity || 0
      salesMap[sale.product_id].cost += (sale.quantity || 0) * (sale.product?.cost_price || 0)
    })

    // Calcular giro para cada produto
    const items = products.map(product => {
      const sold = salesMap[product.id] || { quantity: 0, cost: 0 }
      const avgStock = product.stock_quantity || 0
      const turnover = avgStock > 0 ? (sold.quantity / daysDiff) * 30 : 0 // Giro mensal
      const daysToSell = turnover > 0 ? 30 / turnover : 0
      
      return {
        id: product.id,
        name: product.name,
        code: product.code,
        stock: avgStock,
        sold: sold.quantity,
        costValue: avgStock * (product.cost_price || 0),
        soldValue: sold.cost,
        turnover,
        daysToSell,
        status: turnover > 2 ? 'high' : turnover > 0.5 ? 'normal' : 'low'
      }
    })

    // Ordenar por giro (menor primeiro = problema)
    const sorted = items.sort((a, b) => a.turnover - b.turnover)
    const totalCost = items.reduce((sum, p) => sum + p.costValue, 0)
    const avgTurnover = items.length > 0 ? items.reduce((sum, p) => sum + p.turnover, 0) / items.length : 0

    return { items: sorted, avgTurnover, totalCost }
  }, [data, daysDiff])

  if (isLoading) return <DataLoadingSkeleton type="cards" rows={5} />

  const lowTurnover = turnoverData.items.filter(p => p.status === 'low').length
  const normalTurnover = turnoverData.items.filter(p => p.status === 'normal').length
  const highTurnover = turnoverData.items.filter(p => p.status === 'high').length

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Giro Médio Mensal"
          value={turnoverData.avgTurnover.toFixed(2)}
          sublabel={`${lowTurnover} produtos com giro baixo`}
          icon={RefreshCw}
          variant={turnoverData.avgTurnover < 1 ? 'warning' : 'success'}
        />
        <StatCard
          label="Valor em Estoque"
          value={formatCurrency(turnoverData.totalCost)}
          sublabel="Baseado no custo"
          icon={Package}
          variant="info"
        />
        <StatCard
          label="Período Analisado"
          value={`${daysDiff} dias`}
          sublabel={`${formatDate(startDate)} - ${formatDate(endDate)}`}
          icon={RefreshCw}
          variant="default"
        />
      </div>

      {/* Tabela de Giro */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Giro de Estoque por Produto</h3>
          <p className="text-sm text-gray-500">
            Produtos com baixo giro representam capital parado
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-xs text-gray-500 uppercase">
                <th className="px-6 py-3 text-left">Produto</th>
                <th className="px-6 py-3 text-right">Estoque Atual</th>
                <th className="px-6 py-3 text-right">Vendido no Período</th>
                <th className="px-6 py-3 text-right">Valor em Estoque</th>
                <th className="px-6 py-3 text-right">Giro Mensal</th>
                <th className="px-6 py-3 text-right">Dias p/ Vender</th>
                <th className="px-6 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {turnoverData.items.slice(0, 30).map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3">
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-xs text-gray-500">{product.code}</p>
                  </td>
                  <td className="px-6 py-3 text-right">{formatNumber(product.stock)}</td>
                  <td className="px-6 py-3 text-right">{formatNumber(product.sold)}</td>
                  <td className="px-6 py-3 text-right">{formatCurrency(product.costValue)}</td>
                  <td className="px-6 py-3 text-right font-medium">{product.turnover.toFixed(2)}x</td>
                  <td className="px-6 py-3 text-right">{Math.round(product.daysToSell)} dias</td>
                  <td className="px-6 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      product.status === 'high' ? 'bg-green-100 text-green-800' :
                      product.status === 'normal' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {product.status === 'high' ? 'Alto' : product.status === 'normal' ? 'Normal' : 'Baixo'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Explicação */}
      <div className="bg-blue-50 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>📊 Como interpretar:</strong>
          <br />• <strong>Giro &gt; 2:</strong> Produto vende bem, estoque adequado
          <br />• <strong>Giro entre 0.5 e 2:</strong> Situação normal
          <br />• <strong>Giro &lt; 0.5:</strong> Produto parado, avaliar descontinuação ou promoção
          <br />• <strong>Dias para vender:</strong> Tempo estimado para zerar o estoque atual
        </p>
      </div>
    </div>
  )
}

// Helper para formatar data
const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const [year, month, day] = dateStr.split('T')[0].split('-')
  return `${day}/${month}/${year}`
}

export default InventoryTurnoverReport