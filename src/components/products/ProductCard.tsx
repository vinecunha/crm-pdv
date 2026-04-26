import React from 'react'
import { 
  Eye, 
  Edit, 
  Trash2, 
  Package, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Archive,
  Barcode,
  DollarSign,
  MapPin,
  Layers
} from '@lib/icons'
import Badge from '@components/ui/Badge'
import { formatCurrency } from '@utils/formatters'

const ProductCard = ({ 
  product, 
  onViewDetails, 
  onEdit, 
  onDelete, 
  onRegisterEntry,
  canEdit,
  canManageStock,
  units 
}) => {
  const isLowStock = product.stock_quantity <= product.min_stock
  const isOutOfStock = product.stock_quantity === 0
  
  const getStockStatusBadge = () => {
    if (!product.is_active) {
      return <Badge variant="secondary" className="text-xs">Inativo</Badge>
    }
    if (isOutOfStock) {
      return <Badge variant="danger" className="text-xs">Sem Estoque</Badge>
    }
    if (isLowStock) {
      return <Badge variant="warning" className="text-xs">Estoque Baixo</Badge>
    }
    return <Badge variant="success" className="text-xs">Em Estoque</Badge>
  }

  const getStockColor = () => {
    if (!product.is_active) return 'text-gray-400 dark:text-gray-500'
    if (isOutOfStock) return 'text-red-600 dark:text-red-400'
    if (isLowStock) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-green-600 dark:text-green-400'
  }

  const getUnitLabel = (unitValue) => {
    const unit = units?.find(u => u.value === unitValue)
    return unit?.label || unitValue
  }

  return (
    <div 
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow duration-200 ${
        !product.is_active ? 'opacity-75' : ''
      }`}
    >
      {/* Cabeçalho do Card */}
      <div 
        className="p-4 cursor-pointer"
        onClick={() => onViewDetails?.(product)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 dark:bg-gray-900 rounded-lg">
                <Barcode size={12} className="text-gray-500 dark:text-gray-400" />
                <span className="text-xs font-mono text-gray-700 dark:text-gray-300">
                  {product.code || '---'}
                </span>
              </div>
              {getStockStatusBadge()}
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
              {product.name}
            </h3>
            {product.brand && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                {product.brand}
              </p>
            )}
            {product.category && (
              <Badge variant="info" size="sm" className="text-xs">
                {product.category}
              </Badge>
            )}
          </div>
        </div>

        {/* Informações de Estoque e Preço */}
        <div className="grid grid-cols-2 gap-3 mb-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
              <Package size={12} />
              Estoque
            </p>
            <div className="flex items-baseline gap-1">
              <p className={`text-xl font-bold ${getStockColor()}`}>
                {product.stock_quantity || 0}
              </p>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {getUnitLabel(product.unit)}
              </span>
            </div>
            {product.min_stock > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Mín: {product.min_stock} {getUnitLabel(product.unit)}
              </p>
            )}
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
              <DollarSign size={12} />
              Preço
            </p>
            <p className="text-xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(product.price || 0)}
            </p>
            {product.cost_price > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Custo: {formatCurrency(product.cost_price)}
              </p>
            )}
          </div>
        </div>

        {/* Informações Adicionais */}
        <div className="space-y-1.5 text-xs">
          {product.location && (
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <MapPin size={12} />
              <span className="truncate">{product.location}</span>
            </div>
          )}
          {product.weight && (
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Layers size={12} />
              <span>{product.weight} kg</span>
            </div>
          )}
        </div>
      </div>

      {/* Ações do Card */}
      <div className="grid grid-cols-4 gap-1 p-2 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => onViewDetails?.(product)}
          className="flex items-center justify-center p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
          title="Ver detalhes"
        >
          <Eye size={16} />
        </button>

        {canEdit && (
          <button
            onClick={() => onEdit?.(product)}
            className="flex items-center justify-center p-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
            title="Editar"
          >
            <Edit size={16} />
          </button>
        )}

        {canManageStock && product.is_active && (
          <button
            onClick={() => onRegisterEntry?.(product)}
            className="flex items-center justify-center p-2 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
            title="Registrar entrada"
          >
            <Archive size={16} />
          </button>
        )}

        {canEdit && (
          <button
            onClick={() => onDelete?.(product)}
            className="flex items-center justify-center p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
            title="Excluir"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </div>
  )
}

export default ProductCard

