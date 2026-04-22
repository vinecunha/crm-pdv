import React from 'react'
import { TrendingUp, TrendingDown, RefreshCw } from '@lib/icons'
import Modal from '../ui/Modal'
import Badge from '../Badge'
import { formatCurrency, formatNumber } from '@utils/formatters'

const ProductDetailsModal = ({ 
  isOpen, 
  onClose, 
  product, 
  entries, 
  movements,
  units 
}) => {
  const getUnitLabel = (unit) => {
    const found = units.find(u => u.value === unit)
    return found ? found.label : unit
  }

  const getStatusBadge = (is_active) => {
    return is_active ? (
      <Badge variant="success">Ativo</Badge>
    ) : (
      <Badge variant="danger">Inativo</Badge>
    )
  }

  if (!product) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Detalhes do Produto - ${product.name}`}
      size="xl"
    >
      <div className="space-y-6">
        {/* Informações do Produto */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">Informações do Produto</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Código</p>
              <p className="text-sm font-mono text-gray-900 dark:text-white">{product.code || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Categoria</p>
              <p className="text-sm text-gray-900 dark:text-white">{product.category || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Unidade</p>
              <p className="text-sm text-gray-900 dark:text-white">{getUnitLabel(product.unit)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
              <p className="text-sm">{getStatusBadge(product.is_active)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Estoque Atual</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {formatNumber(product.stock_quantity)} {getUnitLabel(product.unit)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Estoque Mínimo</p>
              <p className="text-sm text-gray-900 dark:text-white">{formatNumber(product.min_stock)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Preço de Venda</p>
              <p className="text-sm font-semibold text-green-600 dark:text-green-400">{formatCurrency(product.price)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Último Custo</p>
              <p className="text-sm text-gray-900 dark:text-white">{formatCurrency(product.cost_price)}</p>
            </div>
          </div>
        </div>

        {/* Últimas Entradas */}
        {entries.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">Últimas Entradas</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {entries.slice(0, 5).map(entry => (
                <div key={entry.id} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">NF {entry.invoice_number}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{entry.supplier_name || 'Fornecedor não informado'}</p>
                      {entry.batch_number && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">Lote: {entry.batch_number}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-green-600 dark:text-green-400">{formatCurrency(entry.unit_cost)}/un</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{formatNumber(entry.quantity)} unidades</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{new Date(entry.entry_date).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Últimas Movimentações */}
        {movements.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">Últimas Movimentações</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {movements.map(movement => (
                <div key={movement.id} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {movement.movement_type === 'ENTRY' ? (
                        <TrendingUp size={16} className="text-green-500 dark:text-green-400" />
                      ) : movement.movement_type === 'SALE' ? (
                        <TrendingDown size={16} className="text-red-500 dark:text-red-400" />
                      ) : (
                        <RefreshCw size={16} className="text-blue-500 dark:text-blue-400" />
                      )}
                      <span className="text-sm text-gray-900 dark:text-white">
                        {movement.movement_type === 'ENTRY' ? 'Entrada' : 
                         movement.movement_type === 'SALE' ? 'Venda' : 
                         movement.movement_type === 'ADJUSTMENT' ? 'Ajuste' : movement.movement_type}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {movement.quantity > 0 ? `+${formatNumber(movement.quantity)}` : formatNumber(movement.quantity)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(movement.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default ProductDetailsModal