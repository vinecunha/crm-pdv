// src/components/sales/pdv/CartItem.jsx
import React, { useState } from 'react'  // ✅ Adicionar useState
import { Minus, Plus, Trash2, Package } from '@lib/icons'
import ConfirmModal from '../../ui/ConfirmModal'
import { formatCurrency } from '@utils/formatters'

const CartItem = ({ 
  item, 
  onUpdateQuantity, 
  onRemove,
  maxStock 
}) => {
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)

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

  const handleRemoveClick = () => {
    setShowRemoveConfirm(true)
  }

  const handleRemoveConfirm = () => {
    setShowRemoveConfirm(false)
    onRemove(item.id)
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all overflow-hidden dark:bg-gray-900 dark:border-gray-700 dark:hover:border-blue-700 dark:hover:shadow-lg dark:hover:shadow-gray-900/50">
        {/* Parte superior - Informações do produto */}
        <div className="flex gap-3 p-3">
          {/* Ícone do produto */}
          <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 dark:from-blue-900/30 dark:to-blue-800/30">
            <Package size={18} className="text-blue-600 dark:text-blue-400" />
          </div>
          
          {/* Informações */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-gray-900 truncate dark:text-white">
                {item.name}
              </p>
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                {formatCurrency(item.total)}
              </span>
            </div>
            
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatCurrency(item.price)} / {item.unit}
              </span>
              {item.quantity >= maxStock && (
                <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full dark:bg-yellow-900/30 dark:text-yellow-300">
                  Estoque máximo
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Parte inferior - Controles sempre visíveis */}
        <div className="flex items-center justify-between px-3 pb-3 pt-1 border-t border-gray-100 dark:border-gray-700">
          {/* Controles de quantidade */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 dark:bg-gray-800">
            <button
              onClick={handleDecrement}
              disabled={item.quantity <= 1}
              className="p-1.5 rounded-md text-gray-600 hover:bg-white hover:text-blue-600 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-600 transition-all dark:text-gray-400 dark:hover:bg-gray-600 dark:hover:text-blue-400 dark:disabled:hover:bg-transparent dark:disabled:hover:text-gray-500"
              title="Diminuir quantidade"
            >
              <Minus size={14} />
            </button>
            
            <span className="w-7 text-center text-sm font-medium text-gray-900 dark:text-white">
              {item.quantity}
            </span>
            
            <button
              onClick={handleIncrement}
              disabled={item.quantity >= maxStock}
              className="p-1.5 rounded-md text-gray-600 hover:bg-white hover:text-blue-600 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-600 transition-all dark:text-gray-400 dark:hover:bg-gray-600 dark:hover:text-blue-400 dark:disabled:hover:bg-transparent dark:disabled:hover:text-gray-500"
              title="Aumentar quantidade"
            >
              <Plus size={14} />
            </button>
          </div>

          {/* Botão Remover */}
          <button
            onClick={handleRemoveClick}  
            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-600 transition-all dark:text-red-400 dark:hover:bg-red-900/30 dark:hover:text-red-300"
            title="Remover item"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* ✅ Modal de Confirmação de Remoção */}
      <ConfirmModal
        isOpen={showRemoveConfirm}
        onClose={() => setShowRemoveConfirm(false)}
        onConfirm={handleRemoveConfirm}
        title="Remover Item"
        message={
          <div className="space-y-2">
            <p className="text-gray-700 dark:text-gray-300">
              Tem certeza que deseja remover do carrinho:
            </p>
            <p className="font-medium text-gray-900 dark:text-white">
              "{item.name}"
            </p>
          </div>
        }
        confirmText="Remover"
        cancelText="Cancelar"
        variant="danger"
        size="sm"
      />
    </>
  )
}

export default CartItem