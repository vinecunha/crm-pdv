import React, { useState, useEffect } from 'react'
import { Package, DollarSign, AlertCircle, XCircle, TrendingUp, Archive } from '../../lib/icons'
import { supabase } from '../../lib/supabase'
import { formatCurrency, formatNumber, formatDateTime } from '../../utils/formatters'
import SummaryCard from './SummaryCard'
import DataLoadingSkeleton from '../ui/DataLoadingSkeleton'
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
      // Buscar todos os produtos ativos
      let query = supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
      
      if (categoryFilter) {
        query = query.eq('category', categoryFilter)
      }
      
      const { data: products, error } = await query
      if (error) throw error
      
      // Estatísticas de estoque
      const totalProducts = products?.length || 0
      const totalStockValue = products?.reduce((sum, p) => sum + ((p.stock_quantity || 0) * (p.cost_price || 0)), 0) || 0
      const totalSellValue = products?.reduce((sum, p) => sum + ((p.stock_quantity || 0) * (p.price || 0)), 0) || 0
      
      // Produtos com estoque baixo
      const lowStockProducts = products?.filter(p => p.stock_quantity <= p.min_stock && p.stock_quantity > 0) || []
      const outOfStockProducts = products?.filter(p => p.stock_quantity <= 0) || []
      
      // Estoque por categoria
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
      
      // Movimentações recentes
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
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Archive className="text-blue-600" size={20} />
            Estoque por Categoria
          </h3>
        </div>
        
        {stockData?.stockByCategory.length === 0 ? (
          <div className="p-12 text-center">
            <Package size={48} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nenhum produto cadastrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Categoria</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500">Qtd. Produtos</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">Quantidade Total</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">Valor em Estoque</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">% do Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {stockData.stockByCategory.map((cat) => (
                  <tr key={cat.category} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{cat.category}</td>
                    <td className="px-6 py-4 text-center text-sm">{cat.count}</td>
                    <td className="px-6 py-4 text-right text-sm">{formatNumber(cat.quantity)}</td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-blue-600">
                      {formatCurrency(cat.value)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-500">
                      {((cat.value / stockData.totalStockValue) * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td className="px-6 py-3 font-medium text-gray-900">Total</td>
                  <td className="px-6 py-3 text-center text-sm">
                    {stockData.stockByCategory.reduce((sum, c) => sum + c.count, 0)}
                  </td>
                  <td className="px-6 py-3 text-right text-sm">
                    {formatNumber(stockData.stockByCategory.reduce((sum, c) => sum + c.quantity, 0))}
                  </td>
                  <td className="px-6 py-3 text-right text-sm font-bold text-blue-600">
                    {formatCurrency(stockData.totalStockValue)}
                  </td>
                  <td className="px-6 py-3 text-right text-sm">100%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Alertas de Estoque */}
      {(stockData?.lowStockCount > 0 || stockData?.outOfStockCount > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Estoque Baixo */}
          {stockData.lowStockCount > 0 && (
            <div className="bg-orange-50 rounded-lg border border-orange-200 p-6">
              <h3 className="text-lg font-semibold text-orange-800 mb-4 flex items-center gap-2">
                <AlertCircle size={20} />
                Produtos com Estoque Baixo
              </h3>
              <div className="space-y-2">
                {stockData.lowStockProducts.map(product => (
                  <div key={product.id} className="bg-white rounded-lg p-3 border border-orange-100">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <span className="text-sm text-orange-600 font-medium">
                        {product.stock_quantity} / {product.min_stock} {product.unit}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                      <div 
                        className="bg-orange-500 h-1.5 rounded-full"
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
            <div className="bg-red-50 rounded-lg border border-red-200 p-6">
              <h3 className="text-lg font-semibold text-red-800 mb-4 flex items-center gap-2">
                <XCircle size={20} />
                Produtos sem Estoque
              </h3>
              <div className="space-y-2">
                {stockData.outOfStockProducts.map(product => (
                  <div key={product.id} className="bg-white rounded-lg p-3 border border-red-100">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <span className="text-sm text-red-600 font-medium">
                        0 {product.unit}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
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
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Últimas Movimentações de Estoque</h3>
        </div>
        
        {stockData?.recentMovements.length === 0 ? (
          <div className="p-12 text-center">
            <Package size={48} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nenhuma movimentação registrada</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Produto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Tipo</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">Quantidade</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Data</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Motivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {stockData.recentMovements.map(movement => (
                  <tr key={movement.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm">{movement.product?.name}</td>
                    <td className="px-6 py-4 text-sm">
                      <Badge variant={
                        movement.movement_type === 'ENTRY' ? 'success' :
                        movement.movement_type === 'SALE' ? 'info' :
                        'warning'
                      }>
                        {movement.movement_type === 'ENTRY' ? 'Entrada' :
                         movement.movement_type === 'SALE' ? 'Venda' :
                         movement.movement_type === 'ADJUSTMENT' ? 'Ajuste' : movement.movement_type}
                      </Badge>
                    </td>
                    <td className={`px-6 py-4 text-right text-sm font-medium ${
                      movement.quantity > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                    </td>
                    <td className="px-6 py-4 text-sm">{formatDateTime(movement.created_at)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{movement.reason || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default StockReport