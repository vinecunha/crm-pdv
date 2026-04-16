import React from 'react'
import { Trash2, Plus, Minus, ShoppingBag } from '../../../lib/icons'
import { formatCurrency } from '../../../utils/formatters'
import Button from '../../ui/Button'

const CartSummary = ({ 
  cart, 
  products,
  onUpdateQuantity, 
  onRemoveItem, 
  onClearCart, 
  selectedItemIndex = 0,
  onSelectItem
}) => {

  if (cart.length === 0) {
    return (
      <div className="p-8 text-center">
        <ShoppingBag size={48} className="mx-auto text-gray-300 mb-3 dark:text-gray-600" />
        <p className="text-gray-500 dark:text-gray-400">Carrinho vazio</p>
        <p className="text-sm text-gray-400 mt-1 dark:text-gray-500">Adicione produtos para continuar</p>
      </div>
    )
  }

  return (
    <>
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between dark:bg-gray-900 dark:border-gray-700">
        <span className="text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Itens</span>
        <button
          onClick={onClearCart}
          className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 dark:text-red-400 dark:hover:text-red-300"
          title="Limpar carrinho (Delete)"
        >
          <Trash2 size={12} />
          Limpar
        </button>
      </div>

      <div className="max-h-80 overflow-y-auto">
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {cart.map((item, index) => {
            const isSelected = index === selectedItemIndex
            
            return (
              <div 
                key={item.id} 
                className={`p-3 transition-colors cursor-pointer ${
                  isSelected 
                    ? 'bg-blue-50 border-l-4 border-l-blue-500 dark:bg-blue-900/30 dark:border-l-blue-400' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                onClick={() => onSelectItem?.(index)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate dark:text-white">{item.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatCurrency(item.price)} / {item.unit}
                    </p>
                  </div>
                  
                  <div className="text-right ml-2">
                    <p className="font-semibold text-sm dark:text-white">{formatCurrency(item.total)}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { 
                        e.stopPropagation()
                        onUpdateQuantity(item.id, item.quantity - 1) 
                      }}
                      className="p-1 hover:bg-gray-200 rounded dark:hover:bg-gray-600 dark:text-gray-300"
                      title="Diminuir (-)"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="text-sm font-medium w-8 text-center dark:text-white">{item.quantity}</span>
                    <button
                      onClick={(e) => { 
                        e.stopPropagation()
                        onUpdateQuantity(item.id, item.quantity + 1) 
                      }}
                      className="p-1 hover:bg-gray-200 rounded dark:hover:bg-gray-600 dark:text-gray-300"
                      title="Aumentar (+)"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  
                  <button
                    onClick={(e) => { 
                      e.stopPropagation()
                      onRemoveItem(item.id) 
                    }}
                    className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/30"
                    title="Remover item"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}

export default CartSummary