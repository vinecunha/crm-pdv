import React from 'react'
import { Minus, Plus, Trash2, Package } from 'lucide-react'
import { formatCurrency } from '../../../utils/formatters'

const CartItem = ({ 
  item, 
  onUpdateQuantity, 
  onRemove,
  maxStock 
}) => {
  const handleIncrement = () => {
    if (item.quantity < maxStock) {
      onUpdateQuantity(item.id, item.quantity + 1)
    }
  }

  const handleDecrement = () => {
    if (item.quantity > 1) {
      onUpdateQuantity(item.id, item.quantity - 1)
    }
  }

  const handleRemove = () => {
    if (window.confirm(`Remover ${item.name} do carrinho?`)) {
      onRemove(item.id)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all overflow-hidden">
      {/* Parte superior - Informações do produto */}
      <div className="flex gap-3 p-3">
        {/* Ícone do produto */}
        <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <Package size={18} className="text-blue-600" />
        </div>
        
        {/* Informações */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
            <span className="text-sm font-bold text-gray-900">{formatCurrency(item.total)}</span>
          </div>
          
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-gray-500">
              {formatCurrency(item.price)} / {item.unit}
            </span>
            {item.quantity >= maxStock && (
              <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full">
                Estoque máximo
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Parte inferior - Controles sempre visíveis */}
      <div className="flex items-center justify-between px-3 pb-3 pt-1 border-t border-gray-100">
        {/* Controles de quantidade */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={handleDecrement}
            disabled={item.quantity <= 1}
            className="p-1.5 rounded-md text-gray-600 hover:bg-white hover:text-blue-600 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-600 transition-all"
            title="Diminuir quantidade"
          >
            <Minus size={14} />
          </button>
          
          <span className="w-7 text-center text-sm font-medium text-gray-900">
            {item.quantity}
          </span>
          
          <button
            onClick={handleIncrement}
            disabled={item.quantity >= maxStock}
            className="p-1.5 rounded-md text-gray-600 hover:bg-white hover:text-blue-600 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-600 transition-all"
            title="Aumentar quantidade"
          >
            <Plus size={14} />
          </button>
        </div>

        {/* Botão Remover */}
        <button
          onClick={handleRemove}
          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-600 transition-all"
          title="Remover item"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  )
}

export default CartItem