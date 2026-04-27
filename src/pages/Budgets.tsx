import React from 'react'
import { FileText, RefreshCw, Plus } from '@lib/icons'
import DataLoadingSkeleton from '@components/ui/DataLoadingSkeleton'
import PageHeader from '@components/ui/PageHeader'

import BudgetListView from '@components/budget/BudgetListView'
import BudgetCreator from '@components/budget/BudgetCreator'
import BudgetModalsContainer from '@components/budget/BudgetModalsContainer'

import { useBudget } from '@hooks/budget/useBudget'
import { BUDGET_COLUMNS, BUDGET_ACTIONS } from '@utils/budgetConstants'

const Budgets = () => {
  const {
    mode,
    setMode,
    viewMode,
    setViewMode,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    selectedCategory,
    setSelectedCategory,
    categories,
    notes,
    setNotes,
    validUntil,
    setValidUntil,
    setCouponCode,
    feedback,
    modals,
    cart,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    subtotal,
    customer,
    customerPhone,
    setCustomerPhone,
    quickCustomerForm,
    quickCustomerErrors,
    searchCustomer,
    createCustomer,
    clearCustomer,
    isSearching,
    isCreating,
    coupon,
    couponCode,
    couponError,
    discount,
    applyCoupon,
    removeCoupon,
    isValidating,
    budgets,
    loadingBudgets,
    refetchBudgets,
    products,
    loadingProducts,
    availableCoupons,
    isMutating,
    total,
    handlers
  } = useBudget({
    onBudgetCreated: () => {},
    onBudgetUpdated: () => {},
    onBudgetConverted: () => {},
    onError: (error) => {}
  })

  const effectiveViewMode = viewMode === 'auto' ? (false ? 'cards' : 'table') : viewMode

  const headerActions = mode === 'list' ? [
    { label: 'Atualizar', icon: RefreshCw, onClick: refetchBudgets, loading: loadingBudgets, variant: 'outline' },
    { label: 'Novo Orçamento', icon: Plus, onClick: () => setMode('create'), variant: 'primary' }
  ] : [
    { label: 'Cancelar', onClick: () => setMode('list'), disabled: isMutating, variant: 'outline' }
  ]

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
              searchInputRef={{ current: null }}
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
          isSearching={isSearching}
          onCloseQuickCustomer={modals.closeQuickCustomer}
          onQuickCustomerFormChange={modals.updateQuickCustomerForm}
          onQuickCustomerSubmit={handlers.handleQuickRegisterCustomer}
          isCreating={isCreating}
          onCloseCoupon={modals.closeCoupon}
          onApplyCoupon={handlers.handleApplyCoupon}
          onRemoveCoupon={removeCoupon}
          isValidating={isValidating}
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
          isUpdating={isValidating}
          isConverting={isValidating}
        />
      </div>
    </div>
  )
}

export default Budgets