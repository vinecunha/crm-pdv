import React, { useState, useEffect } from 'react'
import { Package, DollarSign, AlertCircle, XCircle, TrendingUp, Archive } from '../../lib/icons'
import { supabase } from '../../lib/supabase'
import { formatCurrency, formatNumber, formatDateTime } from '../../utils/formatters'
import SummaryCard from './SummaryCard'
import DataLoadingSkeleton from '../ui/DataLoadingSkeleton'
import DataTable from '../ui/DataTable'
import Badge from '../Badge'

const StockReport = ({ categoryFilter }) => {
  const [loading, setLoading] = useState(true)
  const [stockData, setStockData] = useState(null)

  useEffect(() => {
    loadStockReport()
  }, [categoryFilter])

  const loadStockReport = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
      
      if (categoryFilter) {
        query = query.eq('category', categoryFilter)
      }
      
      const { data: products, error } = await query
      if (error) throw error
      
      const totalProducts = products?.length || 0
      const totalStockValue = products?.reduce((sum, p) => sum + ((p.stock_quantity || 0) * (p.cost_price || 0)), 0) || 0
      const totalSellValue = products?.reduce((sum, p) => sum + ((p.stock_quantity || 0) * (p.price || 0)), 0) || 0
      
      const lowStockProducts = products?.filter(p => p.stock_quantity <= p.min_stock && p.stock_quantity > 0) || []
      const outOfStockProducts = products?.filter(p => p.stock_quantity <= 0) || []
      
      const stockByCategory = {}
      products?.forEach(p => {
        const category = p.category || 'Sem categoria'
        if (!stockByCategory[category]) {
          stockByCategory[category] = {
            quantity: 0,
            value: 0,
            count: 0
          }
        }
        stockByCategory[category].quantity += p.stock_quantity || 0
        stockByCategory[category].value += (p.stock_quantity || 0) * (p.cost_price || 0)
        stockByCategory[category].count += 1
      })
      
      const { data: recentMovements } = await supabase
        .from('stock_movements')
        .select(`
          *,
          product:products(name, unit)
        `)
        .order('created_at', { ascending: false })
        .limit(20)
      
      setStockData({
        totalProducts,
        totalStockValue,
        totalSellValue,
        lowStockCount: lowStockProducts.length,
        outOfStockCount: outOfStockProducts.length,
        lowStockProducts: lowStockProducts.slice(0, 10),
        outOfStockProducts: outOfStockProducts.slice(0, 10),
        potentialProfit: totalSellValue - totalStockValue,
        stockByCategory: Object.entries(stockByCategory)
          .map(([category, data]) => ({
            category,
            quantity: data.quantity,
            value: data.value,
            count: data.count
          }))
          .sort((a, b) => b.value - a.value),
        recentMovements: recentMovements || []
      })

    } catch (error) {
      console.error('Erro ao carregar relatório de estoque:', error)
    } finally {
      setLoading(false)
    }
  }

  // Colunas para Estoque por Categoria
  const categoryColumns = [
    {
      key: 'category',
      header: 'Categoria',
      sortable: true,
      width: '25%',
      render: (row) => <span className="font-medium text-gray-900 dark:text-white">{row.category}</span>
    },
    {
      key: 'count',
      header: 'Qtd. Produtos',
      sortable: true,
      width: '120px',
      render: (row) => <span className="text-gray-700 dark:text-gray-300">{row.count}</span>
    },
    {
      key: 'quantity',
      header: 'Quantidade Total',
      sortable: true,
      width: '150px',
      render: (row) => <span className="text-gray-700 dark:text-gray-300">{formatNumber(row.quantity)}</span>
    },
    {
      key: 'value',
      header: 'Valor em Estoque',
      sortable: true,
      width: '180px',
      render: (row) => <span className="font-medium text-blue-600 dark:text-blue-400">{formatCurrency(row.value)}</span>
    },
    {
      key: 'percent',
      header: '% do Total',
      sortable: true,
      width: '120px',
      render: (row) => (
        <span className="text-gray-500 dark:text-gray-400">
          {stockData?.totalStockValue > 0 ? ((row.value / stockData.totalStockValue) * 100).toFixed(1) : 0}%
        </span>
      )
    }
  ]

  // Colunas para Movimentações Recentes
  const movementColumns = [
    {
      key: 'product',
      header: 'Produto',
      width: '25%',
      render: (row) => <span className="text-sm text-gray-900 dark:text-white">{row.product?.name}</span>
    },
    {
      key: 'movement_type',
      header: 'Tipo',
      width: '120px',
      render: (row) => (
        <Badge variant={
          row.movement_type === 'ENTRY' ? 'success' :
          row.movement_type === 'SALE' ? 'info' :
          'warning'
        }>
          {row.movement_type === 'ENTRY' ? 'Entrada' :
           row.movement_type === 'SALE' ? 'Venda' :
           row.movement_type === 'ADJUSTMENT' ? 'Ajuste' : row.movement_type}
        </Badge>
      )
    },
    {
      key: 'quantity',
      header: 'Quantidade',
      width: '100px',
      render: (row) => (
        <span className={`text-sm font-medium ${row.quantity > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {row.quantity > 0 ? '+' : ''}{row.quantity}
        </span>
      )
    },
    {
      key: 'created_at',
      header: 'Data',
      width: '180px',
      render: (row) => <span className="text-sm text-gray-600 dark:text-gray-400">{formatDateTime(row.created_at)}</span>
    },
    {
      key: 'reason',
      header: 'Motivo',
      width: '25%',
      render: (row) => <span className="text-sm text-gray-500 dark:text-gray-400">{row.reason || '-'}</span>
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
          title="Produtos em Estoque"
          value={formatNumber(stockData?.totalProducts || 0)}
          icon={Package}
          color="blue"
        />
        <SummaryCard
          title="Valor do Estoque (Custo)"
          value={formatCurrency(stockData?.totalStockValue || 0)}
          icon={DollarSign}
          color="green"
          subtitle="Valor de custo total"
        />
        <SummaryCard
          title="Estoque Baixo"
          value={formatNumber(stockData?.lowStockCount || 0)}
          icon={AlertCircle}
          color="orange"
          alert={stockData?.lowStockCount > 0}
        />
        <SummaryCard
          title="Sem Estoque"
          value={formatNumber(stockData?.outOfStockCount || 0)}
          icon={XCircle}
          color="red"
          alert={stockData?.outOfStockCount > 0}
        />
      </div>

      {/* Segunda linha de cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <SummaryCard
          title="Valor de Venda"
          value={formatCurrency(stockData?.totalSellValue || 0)}
          icon={TrendingUp}
          color="purple"
          subtitle="Preço de venda total"
        />
        <SummaryCard
          title="Lucro Potencial"
          value={formatCurrency(stockData?.potentialProfit || 0)}
          icon={TrendingUp}
          color="indigo"
          subtitle="Venda - Custo"
        />
        <SummaryCard
          title="Margem Média"
          value={stockData?.totalStockValue > 0 
            ? `${(((stockData.totalSellValue - stockData.totalStockValue) / stockData.totalStockValue) * 100).toFixed(1)}%`
            : '0%'}
          icon={TrendingUp}
          color="cyan"
        />
      </div>

      {/* Estoque por Categoria */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
            <Archive className="text-blue-600 dark:text-blue-400" size={20} />
            Estoque por Categoria
          </h3>
        </div>
        
        {stockData?.stockByCategory.length === 0 ? (
          <div className="p-12 text-center">
            <Package size={48} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">Nenhum produto cadastrado</p>
          </div>
        ) : (
          <DataTable
            columns={categoryColumns}
            data={stockData.stockByCategory}
            emptyMessage="Nenhuma categoria encontrada"
            striped
            hover
            pagination={stockData.stockByCategory.length > 10}
            itemsPerPageOptions={[10, 20, 50]}
            defaultItemsPerPage={10}
            showTotalItems
            showActionsLegend={false}
            footer={
              <div className="bg-gray-50 dark:bg-gray-800 px-6 py-3 font-medium text-gray-900 dark:text-white">
                Total: {stockData.stockByCategory.reduce((sum, c) => sum + c.count, 0)} produtos | 
                {formatNumber(stockData.stockByCategory.reduce((sum, c) => sum + c.quantity, 0))} unidades | 
                {formatCurrency(stockData.totalStockValue)}
              </div>
            }
          />
        )}
      </div>

      {/* Alertas de Estoque */}
      {(stockData?.lowStockCount > 0 || stockData?.outOfStockCount > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Estoque Baixo */}
          {stockData.lowStockCount > 0 && (
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800 p-6">
              <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-300 mb-4 flex items-center gap-2">
                <AlertCircle size={20} />
                Produtos com Estoque Baixo
              </h3>
              <div className="space-y-2">
                {stockData.lowStockProducts.map(product => (
                  <div key={product.id} className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-orange-100 dark:border-orange-800">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                      <span className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                        {product.stock_quantity} / {product.min_stock} {product.unit}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-1.5 mt-2">
                      <div 
                        className="bg-orange-500 dark:bg-orange-600 h-1.5 rounded-full"
                        style={{ width: `${Math.min((product.stock_quantity / product.min_stock) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sem Estoque */}
          {stockData.outOfStockCount > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 p-6">
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-4 flex items-center gap-2">
                <XCircle size={20} />
                Produtos sem Estoque
              </h3>
              <div className="space-y-2">
                {stockData.outOfStockProducts.map(product => (
                  <div key={product.id} className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-red-100 dark:border-red-800">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                      <span className="text-sm text-red-600 dark:text-red-400 font-medium">
                        0 {product.unit}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Categoria: {product.category || 'Sem categoria'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Movimentações Recentes */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Últimas Movimentações de Estoque</h3>
        </div>
        
        {stockData?.recentMovements.length === 0 ? (
          <div className="p-12 text-center">
            <Package size={48} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">Nenhuma movimentação registrada</p>
          </div>
        ) : (
          <DataTable
            columns={movementColumns}
            data={stockData.recentMovements}
            emptyMessage="Nenhuma movimentação encontrada"
            striped
            hover
            pagination={stockData.recentMovements.length > 10}
            itemsPerPageOptions={[10, 20, 50]}
            defaultItemsPerPage={10}
            showTotalItems
            showActionsLegend={false}
          />
        )}
      </div>
    </div>
  )
}

export default StockReport