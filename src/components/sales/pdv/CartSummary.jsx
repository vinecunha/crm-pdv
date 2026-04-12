import React from 'react'
import { ShoppingCart, Receipt, Sparkles, ArrowRight, Trash2 } from 'lucide-react'
import { formatCurrency } from '../../../utils/formatters'
import CartItem from './CartItem'

const CartSummary = ({ 
  cart, 
  discount,
  products,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCheckout 
}) => {
  const getSubtotal = () => cart.reduce((sum, item) => sum + item.total, 0)
  const getTotal = () => getSubtotal() - discount
  const getItemCount = () => cart.reduce((sum, item) => sum + item.quantity, 0)
  
  const subtotal = getSubtotal()
  const total = getTotal()
  const itemCount = getItemCount()
  const savings = discount > 0 ? discount : 0

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                <ShoppingCart size={20} className="text-white" />
              </div>
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                  {itemCount}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Carrinho</h2>
              <p className="text-xs text-gray-500">
                {itemCount === 0 ? 'Nenhum item' : `${itemCount} ${itemCount === 1 ? 'item' : 'itens'}`}
              </p>
            </div>
          </div>
          
          {cart.length > 0 && onClearCart && (
            <button
              onClick={onClearCart}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
              title="Limpar carrinho"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Lista de Itens */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[400px] scrollbar-thin scrollbar-thumb-gray-300">
        {cart.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ShoppingCart size={32} className="text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium">Carrinho vazio</p>
            <p className="text-xs text-gray-400 mt-1">Adicione produtos para continuar</p>
          </div>
        ) : (
          <div className="space-y-2">
            {cart.map((item, index) => (
              <div 
                key={item.id} 
                className="animate-fadeIn"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CartItem 
                  item={item} 
                  onUpdateQuantity={onUpdateQuantity}
                  onRemove={onRemoveItem}
                  maxStock={products?.find(p => p.id === item.id)?.stock_quantity || 0}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resumo e Totais */}
      <div className="border-t border-gray-100 bg-gray-50/50 p-5 space-y-3">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
            Subtotal
          </span>
          <span className="font-semibold text-gray-900">{formatCurrency(subtotal)}</span>
        </div>

        {discount > 0 && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-green-600 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              Desconto
              {savings > 0 && (
                <span className="text-xs text-green-500 ml-1">
                  (-{Math.round((savings / subtotal) * 100)}%)
                </span>
              )}
            </span>
            <span className="font-semibold text-green-600">- {formatCurrency(discount)}</span>
          </div>
        )}

        {discount > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-2 flex items-center gap-2">
            <Sparkles size={14} className="text-green-600" />
            <span className="text-xs text-green-700">
              Você economizou <strong>{formatCurrency(discount)}</strong>!
            </span>
          </div>
        )}

        <div className="flex justify-between items-center pt-3 border-t border-gray-200">
          <span className="text-base font-semibold text-gray-900">Total</span>
          <div className="text-right">
            <span className="text-2xl font-bold text-green-600">{formatCurrency(total)}</span>
          </div>
        </div>

        <button
          onClick={onCheckout}
          disabled={cart.length === 0}
          className="w-full py-3.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-green-500/25 flex items-center justify-center gap-2 group"
        >
          <Receipt size={18} />
          <span>Finalizar Venda</span>
          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </button>

        <div className="flex items-center justify-center gap-2 pt-2">
          <span className="text-xs text-gray-400">Aceitamos:</span>
          <div className="flex gap-1">
            <span className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] text-gray-600">💵 Dinheiro</span>
            <span className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] text-gray-600">💳 Crédito</span>
            <span className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] text-gray-600">📱 PIX</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
          opacity: 0;
        }
        .scrollbar-thin::-webkit-scrollbar { width: 4px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  )
}

export default CartSummary