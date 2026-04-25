import React, { useMemo, useCallback, useState } from 'react'
import { 
  Package, 
  ArchiveX, 
  AlertTriangle, 
  TrendingUp, 
  CheckCircle,
  Barcode,
  DollarSign,
  ShoppingCart,
  Tag,
  RefreshCw,
  Download
} from '@lib/icons'
import { useTableStrategy } from '@hooks/utils/useTableStrategy'
import Badge from '../Badge'
import { formatCurrency, formatNumber } from '@utils/formatters'
import { createAction } from '@utils/actions'

const ProductTable = ({ 
  products, 
  onViewDetails,
  onEdit,
  onDelete,
  onRegisterEntry,
  canEdit,
  canManageStock,
  canViewAll,
  canViewOnlyActive,
  units,
  
  // Novas props opcionais
  onRefresh,
  onExport,
  onBulkUpdate,
  loading = false,
  enableSearch = true,
  enableExport = true,
  enableRefresh = true,
  enableSelection = false,
  onSelectionChange,
  compact = false,
  showSummary = true,
  showStockAlerts = true
}) => {
  const TableComponent = useTableStrategy(products, 100)
  const [selectedProducts, setSelectedProducts] = useState([])
  const safeProducts = Array.isArray(products) ? products : []

  // Mapeamento de unidades
  const getUnitLabel = useCallback((unit) => {
    const found = units?.find(u => u.value === unit)
    return found ? found.label : unit
  }, [units])

  // Status do estoque com ícones e cores
  const stockStatuses = useMemo(() => ({
    out: { 
      label: 'Sem Estoque', 
      color: 'danger', 
      icon: ArchiveX,
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      textColor: 'text-red-700 dark:text-red-300'
    },
    low: { 
      label: 'Estoque Baixo', 
      color: 'warning', 
      icon: AlertTriangle,
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      textColor: 'text-yellow-700 dark:text-yellow-300'
    },
    high: { 
      label: 'Estoque Alto', 
      color: 'info', 
      icon: TrendingUp,
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      textColor: 'text-blue-700 dark:text-blue-300'
    },
    normal: { 
      label: 'Normal', 
      color: 'success', 
      icon: CheckCircle,
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      textColor: 'text-green-700 dark:text-green-300'
    }
  }), [])

  const getStockStatus = useCallback((product) => {
    if (!product) return stockStatuses.normal
    if (product.stock_quantity <= 0) return stockStatuses.out
    if (product.stock_quantity <= product.min_stock) return stockStatuses.low
    if (product.max_stock && product.stock_quantity >= product.max_stock) return stockStatuses.high
    return stockStatuses.normal
  }, [stockStatuses])

  // Badge de status
  const getStatusBadge = useCallback((is_active) => {
    return is_active ? (
      <Badge variant="success">
        <CheckCircle size={10} className="mr-1" />
        Ativo
      </Badge>
    ) : (
      <Badge variant="danger">
        <ArchiveX size={10} className="mr-1" />
        Inativo
      </Badge>
    )
  }, [])

  // Cálculo de margem
  const calculateMargin = useCallback((price, cost) => {
    if (!price || !cost || cost === 0) return null
    return ((price - cost) / price) * 100
  }, [])

  // Colunas da tabela
  const columns = useMemo(() => [
    {
      key: 'code',
      header: 'Código',
      sortable: true,
      searchable: true,
      width: '120px',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Barcode size={14} className="text-gray-400 flex-shrink-0" />
          <span className="text-sm font-mono text-gray-600 dark:text-gray-400 truncate">
            {row.code || '-'}
          </span>
        </div>
      )
    },
    {
      key: 'name',
      header: 'Produto',
      sortable: true,
      searchable: true,
      minWidth: '220px',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-full flex items-center justify-center flex-shrink-0">
            <Package size={16} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div className="min-w-0">
            <div className="font-medium text-gray-900 dark:text-white truncate">
              {row.name}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-1">
              <Tag size={10} />
              {row.category || 'Sem categoria'}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'stock_quantity',
      header: 'Estoque',
      sortable: true,
      width: '140px',
      render: (row) => {
        const status = getStockStatus(row)
        const StatusIcon = status.icon
        const stockPercent = row.max_stock 
          ? Math.min((row.stock_quantity / row.max_stock) * 100, 100)
          : null
        
        return (
          <div>
            <div className="font-medium text-gray-900 dark:text-white">
              {formatNumber(row.stock_quantity)} {getUnitLabel(row.unit)}
            </div>
            
            {/* Barra de progresso do estoque */}
            {stockPercent !== null && (
              <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mt-1.5 mb-1">
                <div 
                  className={`h-full rounded-full transition-all ${
                    stockPercent >= 90 ? 'bg-red-500' :
                    stockPercent <= 20 ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${stockPercent}%` }}
                />
              </div>
            )}
            
            <div className="flex items-center gap-1 mt-1">
              <StatusIcon size={12} className={`text-${status.color}-500 dark:text-${status.color}-400`} />
              <span className={`text-xs text-${status.color}-600 dark:text-${status.color}-400`}>
                {status.label}
              </span>
              {row.min_stock > 0 && (
                <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">
                  (mín: {row.min_stock})
                </span>
              )}
            </div>
          </div>
        )
      }
    },
    {
      key: 'price',
      header: 'Preço Venda',
      sortable: true,
      width: '130px',
      render: (row) => (
        <div>
          <div className="font-semibold text-green-600 dark:text-green-400">
            {formatCurrency(row.price)}
          </div>
          {row.cost_price > 0 && (
            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
              <DollarSign size={10} />
              Margem: {calculateMargin(row.price, row.cost_price)?.toFixed(1)}%
            </div>
          )}
        </div>
      )
    },
    {
      key: 'cost_price',
      header: 'Custo',
      sortable: true,
      width: '120px',
      render: (row) => (
        <div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {formatCurrency(row.cost_price)}
          </div>
          {row.last_purchase_date && (
            <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              Última compra: {new Date(row.last_purchase_date).toLocaleDateString('pt-BR')}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'is_active',
      header: 'Status',
      sortable: true,
      width: '100px',
      render: (row) => getStatusBadge(row.is_active)
    }
  ], [getStockStatus, getUnitLabel, getStatusBadge, calculateMargin])

  // Ações da tabela
  const actions = useMemo(() => [
    createAction('view', onViewDetails, {
      disabled: () => !canViewAll && !canViewOnlyActive,
      className: 'text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30'
    }),
    createAction('entry', onRegisterEntry, {
      disabled: () => !canManageStock,
      className: 'text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/30',
      label: 'Entrada'
    }),
    createAction('edit', onEdit, {
      disabled: () => !canEdit,
      className: 'text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/30'
    }),
    createAction('delete', onDelete, {
      disabled: () => !canEdit,
      className: 'text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30'
    })
  ], [onViewDetails, onRegisterEntry, onEdit, onDelete, canEdit, canManageStock, canViewAll, canViewOnlyActive])

  // Estatísticas dos produtos
  const stats = useMemo(() => {
    if (!safeProducts.length) return null
    
    const total = safeProducts.length
    const active = safeProducts.filter(p => p.is_active).length
    const lowStock = safeProducts.filter(p => p.stock_quantity <= p.min_stock).length
    const outOfStock = safeProducts.filter(p => p.stock_quantity <= 0).length
    const totalValue = safeProducts.reduce((sum, p) => sum + (p.stock_quantity * p.cost_price || 0), 0)
    const potentialRevenue = safeProducts.reduce((sum, p) => sum + (p.stock_quantity * p.price || 0), 0)
    
    return { 
      total, 
      active, 
      lowStock, 
      outOfStock, 
      totalValue,
      potentialRevenue,
      margin: totalValue > 0 ? ((potentialRevenue - totalValue) / potentialRevenue) * 100 : 0
    }
  }, [safeProducts])

  // Campos para busca
  const searchFields = useMemo(() => 
    columns
      .filter(col => col.searchable)
      .map(col => col.key)
  , [columns])

  // Handlers
  const handleSelectionChange = useCallback((selectedIds) => {
    setSelectedProducts(selectedIds)
    onSelectionChange?.(selectedIds)
  }, [onSelectionChange])

  const handleRefresh = useCallback(async () => {
    if (onRefresh) {
      await onRefresh()
    }
  }, [onRefresh])

  const exportFilename = useMemo(() => {
    const date = new Date().toISOString().split('T')[0]
    return `produtos-${date}.csv`
  }, [])

  // Alertas de estoque
  const stockAlerts = useMemo(() => {
    if (!showStockAlerts) return []
    
    const alerts = []
    const lowStockProducts = safeProducts.filter(p => p.stock_quantity <= p.min_stock && p.stock_quantity > 0)
    const outOfStockProducts = safeProducts.filter(p => p.stock_quantity <= 0)
    
    if (outOfStockProducts.length > 0) {
      alerts.push({
        type: 'danger',
        message: `${outOfStockProducts.length} produto(s) sem estoque`,
        products: outOfStockProducts
      })
    }
    if (lowStockProducts.length > 0) {
      alerts.push({
        type: 'warning',
        message: `${lowStockProducts.length} produto(s) com estoque baixo`,
        products: lowStockProducts
      })
    }
    
    return alerts
  }, [safeProducts, showStockAlerts])

  return (
    <div className="space-y-3">
      {/* Alertas de estoque */}
      {stockAlerts.length > 0 && (
        <div className="space-y-2">
          {stockAlerts.map((alert, idx) => (
            <div 
              key={idx}
              className={`
                border rounded-lg p-3 flex items-center gap-3
                ${alert.type === 'danger' 
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' 
                  : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                }
              `}
            >
              <AlertTriangle size={18} className={
                alert.type === 'danger' 
                  ? 'text-red-500 dark:text-red-400' 
                  : 'text-yellow-500 dark:text-yellow-400'
              } />
              <span className={
                alert.type === 'danger' 
                  ? 'text-red-700 dark:text-red-300' 
                  : 'text-yellow-700 dark:text-yellow-300'
              }>
                {alert.message}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Cards de estatísticas */}
      {showSummary && stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
            <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
            <div className="text-xs text-gray-400 mt-1">{stats.active} ativos</div>
          </div>
          
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 p-3">
            <div className="text-xs text-red-600 dark:text-red-400">Sem Estoque</div>
            <div className="text-xl font-bold text-red-700 dark:text-red-300">{stats.outOfStock}</div>
          </div>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 p-3">
            <div className="text-xs text-yellow-600 dark:text-yellow-400">Estoque Baixo</div>
            <div className="text-xl font-bold text-yellow-700 dark:text-yellow-300">{stats.lowStock}</div>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-3">
            <div className="text-xs text-blue-600 dark:text-blue-400">Valor em Estoque</div>
            <div className="text-lg font-bold text-blue-700 dark:text-blue-300 truncate">
              {formatCurrency(stats.totalValue)}
            </div>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 p-3">
            <div className="text-xs text-green-600 dark:text-green-400">Receita Potencial</div>
            <div className="text-lg font-bold text-green-700 dark:text-green-300 truncate">
              {formatCurrency(stats.potentialRevenue)}
            </div>
          </div>
          
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800 p-3">
            <div className="text-xs text-purple-600 dark:text-purple-400">Margem Média</div>
            <div className="text-xl font-bold text-purple-700 dark:text-purple-300">
              {stats.margin.toFixed(1)}%
            </div>
          </div>
        </div>
      )}

      {/* Tabela principal */}
      <TableComponent
        // Props básicas (mantidas)
        columns={columns}
        data={safeProducts}
        actions={actions}
        onRowClick={onViewDetails}
        emptyMessage="Nenhum produto encontrado"
        striped
        hover
        showTotalItems
        
        // Novas funcionalidades (opcionais)
        id="tabela-produtos"
        // searchable={enableSearch}
        // searchPlaceholder="Buscar por código, nome, categoria..."
        // searchFields={searchFields}
        exportable={enableExport}
        exportFilename={exportFilename}
        refreshable={enableRefresh && !!onRefresh}
        onRefresh={handleRefresh}
        loading={loading}
        loadingRows={5}
        selectable={enableSelection}
        onSelectionChange={handleSelectionChange}
        compact={compact}
        stickyHeader={true}
        itemsPerPageOptions={[10, 20, 50, 100]}
        defaultItemsPerPage={20}
      />

      {/* Ações em massa */}
      {enableSelection && selectedProducts.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {selectedProducts.length} produto{selectedProducts.length > 1 ? 's' : ''} selecionado{selectedProducts.length > 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-2">
            {canManageStock && onRegisterEntry && (
              <button
                onClick={() => onRegisterEntry(selectedProducts)}
                className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-1"
              >
                <Package size={14} />
                Registrar entrada
              </button>
            )}
            {canEdit && onBulkUpdate && (
              <button
                onClick={() => onBulkUpdate(selectedProducts)}
                className="px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                Atualizar em massa
              </button>
            )}
            {onExport && (
              <button
                onClick={() => onExport(selectedProducts)}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-1"
              >
                <Download size={14} />
                Exportar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductTable
