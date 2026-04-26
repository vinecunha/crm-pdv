import React, { useState } from 'react'
import { ShoppingCart, ChevronUp, ChevronDown } from '@lib/icons'
import { formatCurrency } from '@utils/formatters'
import Button from '@components/ui/Button'
import CartSummary from './CartSummary'

const CompactCartView = ({ 
  cart, 
  total, 
  subtotal,
  discount,
  products,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCheckout,
  disabled 
}) => {
  const [expanded, setExpanded] = useState(false)
  
  if (!expanded) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 shadow-lg border-t border-gray-200 dark:border-gray-700 z-40 lg:hidden">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setExpanded(true)}
              className="flex items-center gap-2 text-gray-700 dark:text-gray-300"
            >
              <ShoppingCart size={20} />
              <span className="font-medium">
                {cart.length} {cart.length === 1 ? 'item' : 'itens'}
              </span>
              <ChevronUp size={16} />
            </button>
            
            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                {formatCurrency(total)}
              </p>
            </div>
            
            <Button
              variant="success"
              size="sm"
              onClick={onCheckout}
              disabled={cart.length === 0 || disabled}
            >
              <span className="hidden sm:inline">Finalizar </span>
              <span className="text-xs opacity-70 ml-1">[Ctrl+Enter]</span>
            </Button>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 lg:hidden flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Carrinho ({cart.length} itens)
        </h2>
        <button
          onClick={() => setExpanded(false)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
        >
          <ChevronDown size={20} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <CartSummary
          cart={cart}
          discount={discount}
          products={products}
          onUpdateQuantity={onUpdateQuantity}
          onRemoveItem={onRemoveItem}
          onClearCart={onClearCart}
          onCheckout={onCheckout}
          disabled={disabled}
        />
      </div>
      
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
            <span className="font-medium dark:text-white">{formatCurrency(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
              <span>Desconto</span>
              <span>- {formatCurrency(discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold">
            <span className="dark:text-white">Total</span>
            <span className="text-blue-600 dark:text-blue-400">{formatCurrency(total)}</span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setExpanded(false)}
            className="flex-1"
          >
            Continuar
          </Button>
          <Button
            variant="success"
            onClick={onCheckout}
            disabled={cart.length === 0 || disabled}
            className="flex-1"
          >
            Finalizar
          </Button>
        </div>
      </div>
    </div>
  )
}

export default CompactCartView 
