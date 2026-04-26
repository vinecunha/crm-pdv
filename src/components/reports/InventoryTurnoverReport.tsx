import React, { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { RefreshCw, Package } from '@lib/icons'
import { formatCurrency, formatNumber } from '@utils/formatters'
import DataLoadingSkeleton from '@components/ui/DataLoadingSkeleton'
import DataTable from '@components/ui/DataTable'
import StatCard from '@components/ui/StatCard'

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

  // Colunas para o DataTable
  const columns = useMemo(() => [
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
      key: 'stock',
      header: 'Estoque Atual',
      sortable: true,
      width: '120px',
      render: (row) => <span className="text-gray-900 dark:text-white">{formatNumber(row.stock)}</span>
    },
    {
      key: 'sold',
      header: 'Vendido no Período',
      sortable: true,
      width: '140px',
      render: (row) => <span className="text-gray-900 dark:text-white">{formatNumber(row.sold)}</span>
    },
    {
      key: 'costValue',
      header: 'Valor em Estoque',
      sortable: true,
      width: '140px',
      render: (row) => <span className="text-gray-900 dark:text-white">{formatCurrency(row.costValue)}</span>
    },
    {
      key: 'turnover',
      header: 'Giro Mensal',
      sortable: true,
      width: '120px',
      render: (row) => <span className="font-medium text-gray-900 dark:text-white">{row.turnover.toFixed(2)}x</span>
    },
    {
      key: 'daysToSell',
      header: 'Dias p/ Vender',
      sortable: true,
      width: '120px',
      render: (row) => <span className="text-gray-900 dark:text-white">{Math.round(row.daysToSell)} dias</span>
    },
    {
      key: 'status',
      header: 'Status',
      width: '100px',
      render: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          row.status === 'high' 
            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
            : row.status === 'normal' 
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' 
              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
        }`}>
          {row.status === 'high' ? 'Alto' : row.status === 'normal' ? 'Normal' : 'Baixo'}
        </span>
      )
    }
  ], [])

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

      {/* Tabela com DataTable */}
      <DataTable
        columns={columns}
        data={turnoverData.items.slice(0, 30)}
        emptyMessage="Nenhum produto encontrado"
        striped
        hover
        pagination={turnoverData.items.length > 20}
        itemsPerPageOptions={[20, 50, 100]}
        defaultItemsPerPage={20}
        showTotalItems
        showActionsLegend={false}
      />

      {/* Explicação */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          <strong className="dark:text-blue-200">📊 Como interpretar:</strong>
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
