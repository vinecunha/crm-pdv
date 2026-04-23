import React, { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { Award, TrendingUp, Package } from '@lib/icons'
import { formatCurrency, formatNumber } from '@utils/formatters'
import DataLoadingSkeleton from '@components/ui/DataLoadingSkeleton'
import StatCard from '@components/ui/StatCard'
import DataTable from '@components/ui/DataTable'

const fetchABCData = async (startDate, endDate) => {
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
    })

    const sorted = Object.values(productMap).sort((a, b) => b.revenue - a.revenue)
    const totalValue = sorted.reduce((sum, p) => sum + p.revenue, 0)

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

  // Colunas para o DataTable
  const columns = [
    {
      key: 'classification',
      header: 'Classificação',
      width: '100px',
      render: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          row.classification === 'A' 
            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
            : row.classification === 'B' 
              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' 
              : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300'
        }`}>
          {row.classification}
        </span>
      )
    },
    {
      key: 'name',
      header: 'Produto',
      sortable: true,
      width: '30%',
      minWidth: '200px',
      render: (row) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{row.name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{row.code}</p>
        </div>
      )
    },
    {
      key: 'revenue',
      header: 'Receita',
      sortable: true,
      width: '120px',
      render: (row) => <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(row.revenue)}</span>
    },
    {
      key: 'percent',
      header: '% Individual',
      sortable: true,
      width: '110px',
      render: (row) => <span className="text-gray-700 dark:text-gray-300">{row.percent.toFixed(2)}%</span>
    },
    {
      key: 'cumulativePercent',
      header: '% Acumulado',
      sortable: true,
      width: '110px',
      render: (row) => <span className="font-medium text-gray-900 dark:text-white">{row.cumulativePercent.toFixed(2)}%</span>
    },
    {
      key: 'quantity',
      header: 'Quantidade',
      sortable: true,
      width: '100px',
      render: (row) => <span className="text-gray-700 dark:text-gray-300">{formatNumber(row.quantity)}</span>
    }
  ]

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

      {/* Tabela com DataTable */}
      <DataTable
        columns={columns}
        data={abcData.items.slice(0, 20)}
        emptyMessage="Nenhum produto encontrado no período"
        striped
        hover
        pagination={abcData.items.length > 20}
        itemsPerPageOptions={[20, 50, 100]}
        defaultItemsPerPage={20}
        showTotalItems
        showActionsLegend={false}
      />

      {/* Resumo */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-300">
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
