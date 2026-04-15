import React, { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Award, TrendingUp, Package } from '../../lib/icons'
import { formatCurrency, formatNumber } from '../../utils/formatters'
import DataLoadingSkeleton from '../ui/DataLoadingSkeleton'
import StatCard from '../ui/StatCard'

const fetchABCData = async (startDate, endDate) => {
  // Buscar vendas do período
  const { data, error } = await supabase
    .from('sale_items')
    .select(`
      quantity,
      total_price,
      product:products(name, code, price, cost_price)
    `)
    .gte('created_at', startDate)
    .lte('created_at', endDate)

  if (error) throw error
  return data
}

const ABCCurveReport = ({ dateRange, customDateRange }) => {
  const startDate = customDateRange?.start || new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0]
  const endDate = customDateRange?.end || new Date().toISOString().split('T')[0]

  const { data, isLoading } = useQuery({
    queryKey: ['abc-curve', startDate, endDate],
    queryFn: () => fetchABCData(startDate, endDate)
  })

  const abcData = useMemo(() => {
    if (!data) return { items: [], totalValue: 0 }

    // Agrupar por produto
    const productMap = {}
    data.forEach(item => {
      const productId = item.product?.code || 'unknown'
      if (!productMap[productId]) {
        productMap[productId] = {
          name: item.product?.name || 'Desconhecido',
          code: item.product?.code || '-',
          revenue: 0,
          quantity: 0,
          profit: 0,
          cost: item.product?.cost_price || 0,
          price: item.product?.price || 0
        }
      }
      productMap[productId].revenue += item.total_price || 0
      productMap[productId].quantity += item.quantity || 0
      productMap[productId].profit += (item.product?.price - item.product?.cost_price) * (item.quantity || 0)
    })

    // Ordenar por receita (decrescente)
    const sorted = Object.values(productMap).sort((a, b) => b.revenue - a.revenue)
    const totalValue = sorted.reduce((sum, p) => sum + p.revenue, 0)

    // Classificar ABC
    let cumulativePercent = 0
    const classified = sorted.map(product => {
      const percent = (product.revenue / totalValue) * 100
      cumulativePercent += percent
      
      let classification = 'C'
      if (cumulativePercent <= 80) classification = 'A'
      else if (cumulativePercent <= 95) classification = 'B'
      
      return { ...product, percent, cumulativePercent, classification }
    })

    return { items: classified, totalValue }
  }, [data])

  if (isLoading) return <DataLoadingSkeleton type="cards" rows={5} />

  const aCount = abcData.items.filter(p => p.classification === 'A').length
  const bCount = abcData.items.filter(p => p.classification === 'B').length
  const cCount = abcData.items.filter(p => p.classification === 'C').length

  const aRevenue = abcData.items.filter(p => p.classification === 'A').reduce((sum, p) => sum + p.revenue, 0)
  const bRevenue = abcData.items.filter(p => p.classification === 'B').reduce((sum, p) => sum + p.revenue, 0)
  const cRevenue = abcData.items.filter(p => p.classification === 'C').reduce((sum, p) => sum + p.revenue, 0)

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Curva A"
          value={`${aCount} produtos`}
          sublabel={`${formatCurrency(aRevenue)} (${((aRevenue / abcData.totalValue) * 100).toFixed(1)}%)`}
          icon={Award}
          variant="success"
        />
        <StatCard
          label="Curva B"
          value={`${bCount} produtos`}
          sublabel={`${formatCurrency(bRevenue)} (${((bRevenue / abcData.totalValue) * 100).toFixed(1)}%)`}
          icon={TrendingUp}
          variant="warning"
        />
        <StatCard
          label="Curva C"
          value={`${cCount} produtos`}
          sublabel={`${formatCurrency(cRevenue)} (${((cRevenue / abcData.totalValue) * 100).toFixed(1)}%)`}
          icon={Package}
          variant="info"
        />
      </div>

      {/* Tabela ABC */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Classificação ABC dos Produtos</h3>
          <p className="text-sm text-gray-500">Baseado na receita do período selecionado</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-xs text-gray-500 uppercase">
                <th className="px-6 py-3 text-left">Classificação</th>
                <th className="px-6 py-3 text-left">Produto</th>
                <th className="px-6 py-3 text-right">Receita</th>
                <th className="px-6 py-3 text-right">% Individual</th>
                <th className="px-6 py-3 text-right">% Acumulado</th>
                <th className="px-6 py-3 text-right">Quantidade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {abcData.items.slice(0, 20).map((product, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      product.classification === 'A' ? 'bg-green-100 text-green-800' :
                      product.classification === 'B' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {product.classification}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-xs text-gray-500">{product.code}</p>
                  </td>
                  <td className="px-6 py-3 text-right font-medium">{formatCurrency(product.revenue)}</td>
                  <td className="px-6 py-3 text-right">{product.percent.toFixed(2)}%</td>
                  <td className="px-6 py-3 text-right">{product.cumulativePercent.toFixed(2)}%</td>
                  <td className="px-6 py-3 text-right">{formatNumber(product.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resumo */}
      <div className="bg-blue-50 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>📊 Interpretação:</strong> 
          <br />• <strong>Curva A:</strong> {aCount} produtos ({((aCount / abcData.items.length) * 100).toFixed(1)}%) 
          representam {((aRevenue / abcData.totalValue) * 100).toFixed(1)}% da receita - Foco principal!
          <br />• <strong>Curva B:</strong> {bCount} produtos ({((bCount / abcData.items.length) * 100).toFixed(1)}%) 
          representam {((bRevenue / abcData.totalValue) * 100).toFixed(1)}% da receita - Importância intermediária.
          <br />• <strong>Curva C:</strong> {cCount} produtos ({((cCount / abcData.items.length) * 100).toFixed(1)}%) 
          representam apenas {((cRevenue / abcData.totalValue) * 100).toFixed(1)}% da receita - Avaliar manutenção.
        </p>
      </div>
    </div>
  )
}

export default ABCCurveReport