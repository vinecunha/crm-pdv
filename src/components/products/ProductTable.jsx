import React from 'react'
import { Package, ArchiveX, AlertTriangle, TrendingUp, CheckCircle } from '../../lib/icons'
import { useTableStrategy } from '../../hooks/useTableStrategy'
import Badge from '../Badge'
import { formatCurrency, formatNumber } from '../../utils/formatters'
import { createAction } from '../../utils/actions'

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
  units 
}) => {
  const TableComponent = useTableStrategy(products, 100)

  const getUnitLabel = (unit) => {
    const found = units.find(u => u.value === unit)
    return found ? found.label : unit
  }

  const getStockStatus = (product) => {
    if (product.stock_quantity <= 0) return { label: 'Sem Estoque', color: 'danger', icon: ArchiveX }
    if (product.stock_quantity <= product.min_stock) return { label: 'Estoque Baixo', color: 'warning', icon: AlertTriangle }
    if (product.max_stock && product.stock_quantity >= product.max_stock) return { label: 'Estoque Alto', color: 'info', icon: TrendingUp }
    return { label: 'Normal', color: 'success', icon: CheckCircle }
  }

  const getStatusBadge = (is_active) => {
    return is_active ? (
      <Badge variant="success">Ativo</Badge>
    ) : (
      <Badge variant="danger">Inativo</Badge>
    )
  }

  const columns = [
    {
      key: 'code',
      header: 'Código',
      width: '100px',
      render: (row) => <div className="text-sm font-mono text-gray-600">{row.code || '-'}</div>
    },
    {
      key: 'name',
      header: 'Produto',
      sortable: true,
      width: '25%',
      minWidth: '200px',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Package size={16} className="text-blue-600" />
          </div>
          <div className="min-w-0">
            <div className="font-medium text-gray-900 truncate">{row.name}</div>
            <div className="text-xs text-gray-500 truncate">{row.category || 'Sem categoria'}</div>
          </div>
        </div>
      )
    },
    {
      key: 'stock_quantity',
      header: 'Estoque',
      sortable: true,
      width: '120px',
      render: (row) => {
        const status = getStockStatus(row)
        const StatusIcon = status.icon
        return (
          <div>
            <div className="font-medium text-gray-900">
              {formatNumber(row.stock_quantity)} {getUnitLabel(row.unit)}
            </div>
            <div className="flex items-center gap-1 mt-1">
              <StatusIcon size={12} className={`text-${status.color}-500`} />
              <span className={`text-xs text-${status.color}-600`}>{status.label}</span>
            </div>
          </div>
        )
      }
    },
    {
      key: 'price',
      header: 'Preço Venda',
      sortable: true,
      width: '120px',
      render: (row) => <div className="font-semibold text-green-600">{formatCurrency(row.price)}</div>
    },
    {
      key: 'cost_price',
      header: 'Último Custo',
      width: '120px',
      render: (row) => <div className="text-sm text-gray-600">{formatCurrency(row.cost_price)}</div>
    },
    {
      key: 'is_active',
      header: 'Status',
      width: '100px',
      render: (row) => getStatusBadge(row.is_active)
    }
  ]

  const actions = [
    createAction('view', onViewDetails, {
      disabled: () => !canViewAll && !canViewOnlyActive
    }),
    createAction('entry', onRegisterEntry, {
      disabled: () => !canManageStock
    }),
    createAction('edit', onEdit, {
      disabled: () => !canEdit
    }),
    createAction('delete', onDelete, {
      disabled: () => !canEdit
    })
  ]

  return (
    <TableComponent
      columns={columns}
      data={products}
      actions={actions}
      onRowClick={onViewDetails}
      emptyMessage="Nenhum produto encontrado"
      striped
      hover
      showTotalItems
    />
  )
}

export default ProductTable