import React from 'react'
import { Package, ArchiveX, AlertTriangle, TrendingUp, CheckCircle } from 'lucide-react'
import DataTable from '../ui/DataTable'
import Badge from '../Badge'
import { formatCurrency, formatNumber } from '../../utils/formatters'

const ProductTable = ({ 
  products, 
  loading, 
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
      render: (row) => (
        <div className="text-sm font-mono text-gray-600">{row.code || '-'}</div>
      )
    },
    {
      key: 'name',
      header: 'Produto',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <Package size={16} className="text-blue-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{row.name}</div>
            <div className="text-xs text-gray-500">{row.category || 'Sem categoria'}</div>
          </div>
        </div>
      )
    },
    {
      key: 'stock_quantity',
      header: 'Estoque',
      sortable: true,
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
      render: (row) => (
        <div className="font-semibold text-green-600">
          {formatCurrency(row.price)}
        </div>
      )
    },
    {
      key: 'cost_price',
      header: 'Último Custo',
      render: (row) => (
        <div className="text-sm text-gray-600">
          {formatCurrency(row.cost_price)}
        </div>
      )
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (row) => getStatusBadge(row.is_active)
    }
  ]

  const getActions = () => {
    const actionsList = []
    
    if (canViewAll || canViewOnlyActive) {
      actionsList.push({
        label: 'Ver detalhes',
        icon: <Package size={16} />,
        onClick: onViewDetails,
        className: 'text-gray-600 hover:text-gray-700 hover:bg-gray-50'
      })
    }
    
    if (canManageStock) {
      actionsList.push({
        label: 'Registrar entrada',
        icon: <TrendingUp size={16} />,
        onClick: onRegisterEntry,
        className: 'text-green-600 hover:text-green-700 hover:bg-green-50'
      })
    }
    
    if (canEdit) {
      actionsList.push({
        label: 'Editar',
        icon: <Package size={16} />,
        onClick: onEdit,
        className: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
      })
      
      actionsList.push({
        label: 'Excluir',
        icon: <ArchiveX size={16} />,
        onClick: onDelete,
        className: 'text-red-600 hover:text-red-700 hover:bg-red-50'
      })
    }
    
    return actionsList
  }

  return (
    <DataTable
      columns={columns}
      data={products}
      actions={getActions()}
      onRowClick={onViewDetails}
      striped
      hover
      pagination={true}
      itemsPerPageOptions={[20, 50, 100]}
      defaultItemsPerPage={20}
    />
  )
}

export default ProductTable