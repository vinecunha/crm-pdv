// src/pages/Budgets.jsx
import React, { useState, useEffect, useRef } from 'react'
import { FileText, RefreshCw, Plus } from '@lib/icons'
import { useAuth } from '@contexts/AuthContext'
import DataLoadingSkeleton from '@components/ui/DataLoadingSkeleton'
import PageHeader from '@components/ui/PageHeader'

// Componentes
import BudgetListView from '@components/budget/BudgetListView'
import BudgetCreator from '@components/budget/BudgetCreator'
import BudgetModalsContainer from '@components/budget/BudgetModalsContainer'

// ✅ Hooks centralizados
import { useBudgetMutations } from '@hooks/mutations/useBudgetMutations'
import { useBudgetCart } from '@hooks/budget/useBudgetCart'
import { useBudgetCustomer } from '@hooks/budget/useBudgetCustomer'
import { useBudgetCoupon } from '@hooks/budget/useBudgetCoupon'
import { useBudgetModals } from '@hooks/budget/useBudgetModals'
import { useBudgetHandlers } from '@hooks/handlers'
import { useBudgetsQueries } from '@hooks/queries/useBudgetsQueries'
import useFeedback from '@hooks/ui/useFeedback'
import useMediaQuery from '@/hooks/utils/useMediaQuery'

// Utils
import { calculateTotal } from '@utils/budgetConstants.jsx'
import { BUDGET_COLUMNS, BUDGET_ACTIONS } from '@utils/budgetConstants'

const Budgets = () => {
  const { profile } = useAuth()
  const isMobile = useMediaQuery('(max-width: 768px)')
  const searchInputRef = useRef(null)
  
  // Estado local
  const [mode, setMode] = useState('list')
  const [viewMode, setViewMode] = useState('auto')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [categories, setCategories] = useState([])
  const [notes, setNotes] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [couponCode, setCouponCode] = useState('')
  
  // Hooks de estado
  const feedback = useFeedback()
  const modals = useBudgetModals()
  
  const { cart, addToCart, updateQuantity, removeItem, clearCart, subtotal } = useBudgetCart()
  const { customer, setCustomerPhone, searchCustomer, createCustomer, clearCustomer } = useBudgetCustomer()
  const { coupon, discount, validateCoupon, removeCoupon } = useBudgetCoupon(customer, subtotal)
  
  // ✅ Queries centralizadas
  const {
    budgets,
    loadingBudgets,
    refetchBudgets,
    products,
    loadingProducts,
    availableCoupons
  } = useBudgetsQueries({ searchTerm, statusFilter, mode, customer })

  // ✅ Mutations com callbacks
  const { createBudget, updateStatus, convertToSale, isMutating } = useBudgetMutations({
    onBudgetCreated: () => {
      feedback.showSuccess('Orçamento criado com sucesso!')
      clearCart()
      clearCustomer()
      removeCoupon()
      setNotes('')
      setValidUntil('')
      setMode('list')
    },
    onBudgetUpdated: () => {
      feedback.showSuccess('Status atualizado!')
      modals.closeAll()
    },
    onBudgetConverted: () => {
      feedback.showSuccess('Orçamento convertido em venda!')
      modals.closeAll()
    },
    onError: (error) => {
      feedback.showError(error.message)
    }
  })
  
  // Handlers
  const handlers = useBudgetHandlers({
    cart, customer, coupon, discount, notes, validUntil, subtotal, couponCode,
    createBudget, updateStatus, convertToSale, validateCoupon,
    searchCustomer, createCustomer, clearCart, clearCustomer, removeCoupon,
    setMode, modals, feedback
  })
  
  // Efeitos
  useEffect(() => { 
    if (mode === 'create' && products.length > 0) {
      setCategories([...new Set(products.map(p => p.category).filter(Boolean))])
    }
  }, [products, mode])

  // Configurações
  const total = calculateTotal(subtotal, discount)
  const effectiveViewMode = viewMode === 'auto' ? (isMobile ? 'cards' : 'table') : viewMode

  const headerActions = mode === 'list' ? [
    { label: 'Atualizar', icon: RefreshCw, onClick: refetchBudgets, loading: loadingBudgets, variant: 'outline' },
    { label: 'Novo Orçamento', icon: Plus, onClick: () => setMode('create'), variant: 'primary' }
  ] : [
    { label: 'Cancelar', onClick: () => setMode('list'), disabled: isMutating, variant: 'outline' }
  ]

  // Render
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        <PageHeader
          title="Orçamentos"
          description={mode === 'list' ? 'Gerencie os orçamentos solicitados pelos clientes' : 'Crie um novo orçamento'}
          icon={FileText}
          actions={headerActions}
        />

        {mode === 'list' && (
          <BudgetListView
            budgets={budgets}
            loading={loadingBudgets}
            viewMode={effectiveViewMode}
            onViewModeChange={setViewMode}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            onRefresh={refetchBudgets}
            onCreateNew={() => setMode('create')}
            onViewDetails={handlers.handleViewDetails}
            columns={BUDGET_COLUMNS}
            actions={BUDGET_ACTIONS.map(a => ({ ...a, onClick: handlers[`handle${a.id.charAt(0).toUpperCase() + a.id.slice(1)}`] || handlers.handleViewDetails }))}
          />
        )}

        {mode === 'create' && (
          loadingProducts ? <DataLoadingSkeleton /> : (
            <BudgetCreator
              products={products}
              cart={cart}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              categories={categories}
              onAddToCart={addToCart}
              onUpdateQuantity={updateQuantity}
              onRemoveItem={removeItem}
              onClearCart={handlers.handleClearCart}
              customer={customer}
              onClearCustomer={clearCustomer}
              onShowCustomerModal={modals.openCustomer}
              coupon={coupon}
              onRemoveCoupon={removeCoupon}
              onShowCouponModal={modals.openCoupon}
              discount={discount}
              notes={notes}
              setNotes={setNotes}
              validUntil={validUntil}
              setValidUntil={setValidUntil}
              subtotal={subtotal}
              total={total}
              onCreateBudget={handlers.handleCreateBudget}
              isMutating={isMutating}
              searchInputRef={searchInputRef}
            />
          )
        )}

        <BudgetModalsContainer
          modals={modals}
          cart={cart}
          customer={customer}
          coupon={coupon}
          availableCoupons={availableCoupons}
          couponCode={couponCode}
          setCouponCode={setCouponCode}
          onCloseCustomer={modals.closeCustomer}
          onPhoneChange={setCustomerPhone}
          onSearchCustomer={handlers.handleSearchCustomer}
          isSearching={searchCustomer.isPending}
          onCloseQuickCustomer={modals.closeQuickCustomer}
          onQuickCustomerFormChange={modals.updateQuickCustomerForm}
          onQuickCustomerSubmit={handlers.handleQuickRegisterCustomer}
          isCreating={createCustomer.isPending}
          onCloseCoupon={modals.closeCoupon}
          onApplyCoupon={handlers.handleApplyCoupon}
          onRemoveCoupon={removeCoupon}
          isValidating={validateCoupon.isPending}
          onCloseClearCart={modals.closeClearCartConfirm}
          onConfirmClearCart={handlers.confirmClearCart}
          onCloseDetails={modals.closeDetails}
          onApprove={handlers.handleApprove}
          onReject={handlers.handleReject}
          onConvert={handlers.handleConvertToSale}
          onCloseApprove={modals.closeApproveConfirm}
          onConfirmApprove={() => handlers.handleApprove(modals.selectedBudget)}
          onCloseReject={modals.closeRejectConfirm}
          onConfirmReject={() => handlers.handleReject(modals.selectedBudget)}
          onCloseConvert={modals.closeConvertConfirm}
          onConfirmConvert={handlers.handleConvertToSale}
          isUpdating={updateStatus.isPending}
          isConverting={convertToSale.isPending}
        />
      </div>
    </div>
  )
}

export default Budgets
