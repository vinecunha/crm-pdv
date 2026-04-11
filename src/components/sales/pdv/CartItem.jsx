import React from 'react'
import { Edit2, Package } from 'lucide-react'
import { formatCurrency } from '../../../utils/formatters'

const CartItem = ({ item, onEdit }) => {
  return (
    <div className="group flex gap-3 p-3 bg-white rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all">
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
          <span className="text-xs text-gray-400">•</span>
          <span className="text-xs font-medium text-gray-700">
            Qtd: {item.quantity}
          </span>
        </div>
      </div>
      
      {/* Botão Editar */}
      <button
        onClick={onEdit}
        className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all self-center"
        title="Alterar quantidade"
      >
        <Edit2 size={14} />
      </button>
    </div>
  )
}

export default CartItem