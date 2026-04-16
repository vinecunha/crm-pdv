import React from 'react'
import { FileText, User, Ticket } from '../../lib/icons'
import { formatCurrency } from '../../utils/formatters'
import Button from '../ui/Button'
import ProductGrid from '../sales/pdv/ProductGrid'
import CartSummary from '../sales/pdv/CartSummary'

const BudgetCreator = ({
  products, loading, cart, searchTerm, setSearchTerm,
  selectedCategory, setSelectedCategory, categories,
  onAddToCart, onUpdateQuantity, onRemoveItem, onClearCart,
  customer, onClearCustomer, onShowCustomerModal,
  coupon, onRemoveCoupon, onShowCouponModal,
  discount, notes, setNotes, validUntil, setValidUntil,
  subtotal, total, onCreateBudget, isMutating, searchInputRef
}) => {
  const filteredProducts = React.useMemo(() => {
    let filtered = [...products]
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(p => 
        p.name?.toLowerCase().includes(search) || p.code?.toLowerCase().includes(search)
      )
    }
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory)
    }
    return filtered
  }, [products, searchTerm, selectedCategory])

  if (loading) return null // Loading é tratado no pai

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <ProductGrid
          products={filteredProducts}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          categories={categories}
          onAddToCart={onAddToCart}
          searchInputRef={searchInputRef}
        />
      </div>

      <div className="lg:col-span-1">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 sticky top-4">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <FileText size={18} />
              Orçamento
              {cart.length > 0 && (
                <span className="ml-auto text-sm text-gray-500 dark:text-gray-400">
                  {cart.length} {cart.length === 1 ? 'item' : 'itens'}
                </span>
              )}
            </h2>
          </div>

          {/* Cliente e Cupom */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User size={16} className="text-gray-400 dark:text-gray-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Cliente</span>
              </div>
              {customer ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-300 truncate max-w-[150px]">{customer.name}</span>
                  <button onClick={onClearCustomer} className="text-xs text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300" disabled={isMutating}>
                    Remover
                  </button>
                </div>
              ) : (
                <Button size="sm" variant="outline" onClick={onShowCustomerModal} disabled={isMutating}>
                  Identificar
                </Button>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ticket size={16} className="text-gray-400 dark:text-gray-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Cupom</span>
              </div>
              {coupon ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-green-600 dark:text-green-400 font-medium">{coupon.code}</span>
                  <button onClick={onRemoveCoupon} className="text-xs text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300" disabled={isMutating}>
                    Remover
                  </button>
                </div>
              ) : (
                <Button size="sm" variant="outline" onClick={onShowCouponModal} disabled={!customer || isMutating}>
                  Aplicar
                </Button>
              )}
            </div>

            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Válido até</label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg text-sm"
                disabled={isMutating}
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Observações</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Observações do orçamento..."
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg text-sm resize-none placeholder-gray-400 dark:placeholder-gray-500"
                disabled={isMutating}
              />
            </div>
          </div>

          {/* Carrinho */}
          <CartSummary 
            cart={cart} 
            discount={discount}
            products={products}
            onUpdateQuantity={onUpdateQuantity}
            onRemoveItem={onRemoveItem}
            onClearCart={onClearCart}
            onCheckout={onCreateBudget}
            selectedItemIndex={0}
            onSelectItem={() => {}}
            disabled={isMutating}
            checkoutLabel="Gerar Orçamento"
          />

          {/* Totais e Botão */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 rounded-b-lg">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                  <span>Desconto</span>
                  <span>- {formatCurrency(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200 dark:border-gray-700">
                <span className="text-gray-900 dark:text-white">Total</span>
                <span className="text-blue-600 dark:text-blue-400">{formatCurrency(total)}</span>
              </div>
            </div>

            <Button
              variant="success"
              size="lg"
              fullWidth
              onClick={onCreateBudget}
              disabled={cart.length === 0 || isMutating}
              icon={FileText}
            >
              Gerar Orçamento
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
export default BudgetCreator