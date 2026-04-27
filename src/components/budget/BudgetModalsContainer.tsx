// src/components/budget/BudgetModalsContainer.jsx
import React from 'react'
import Modal from '@components/ui/Modal'
import ConfirmModal from '@components/ui/ConfirmModal'
import QuickCustomerForm from '@components/sales/pdv/QuickCustomerForm'
import CouponSelector from '@components/sales/pdv/CouponSelector'
import IdentifyCustomerModal from '@components/budget/IdentifyCustomerModal'
import BudgetDetailsModal from '@components/budget/BudgetDetailsModal'

const BudgetModalsContainer = ({
  modals,
  cart,
  customer,
  coupon,
  availableCoupons,
  couponCode,
  setCouponCode,
  onCloseCustomer,
  onPhoneChange,
  onSearchCustomer,
  isSearching,
  onCloseQuickCustomer,
  onQuickCustomerFormChange,
  onQuickCustomerSubmit,
  isCreating,
  onCloseCoupon,
  onApplyCoupon,
  onRemoveCoupon,
  isValidating,
  onCloseClearCart,
  onConfirmClearCart,
  onCloseDetails,
  onApprove,
  onReject,
  onConvert,
  onCloseApprove,
  onConfirmApprove,
  onCloseReject,
  onConfirmReject,
  onCloseConvert,
  onConfirmConvert,
  isUpdating,
  isConverting
}) => {
  return (
    <>
      {/* Identificar Cliente */}
      <IdentifyCustomerModal
        isOpen={modals.showCustomer}
        onClose={onCloseCustomer}
        phone={modals.customerPhone}
        onPhoneChange={onPhoneChange}
        onSearch={onSearchCustomer}
        isLoading={isSearching}
      />

      {/* Cadastro Rápido */}
      <QuickCustomerForm
        isOpen={modals.showQuickCustomer}
        onClose={onCloseQuickCustomer}
        formData={modals.quickCustomer.form}
        setFormData={onQuickCustomerFormChange}
        errors={modals.quickCustomer.errors}
        onSubmit={onQuickCustomerSubmit}
        isSubmitting={isCreating}
      />

      {/* Cupom */}
      <CouponSelector
        isOpen={modals.showCoupon}
        onClose={onCloseCoupon}
        customer={customer}
        coupon={coupon}
        availableCoupons={availableCoupons}
        couponCode={couponCode}
        setCouponCode={setCouponCode}
        couponError={modals.couponError}
        onApplyCoupon={onApplyCoupon}
        onRemoveCoupon={onRemoveCoupon}
        isLoading={isValidating}
      />

      {/* Limpar Carrinho */}
      <ConfirmModal
        isOpen={modals.showClearCartConfirm}
        onClose={onCloseClearCart}
        onConfirm={onConfirmClearCart}
        title="Limpar Orçamento"
        message={
          <div>
            <p className="mb-2 dark:text-gray-300 text-sm sm:text-base">
              Tem certeza que deseja remover todos os itens do orçamento?
            </p>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              {cart.length} {cart.length === 1 ? 'item será' : 'itens serão'} removidos.
            </p>
          </div>
        }
        confirmText="Limpar"
        cancelText="Cancelar"
        variant="danger"
      />

      {/* Detalhes do Orçamento */}
      <BudgetDetailsModal
        isOpen={modals.showDetails}
        onClose={onCloseDetails}
        budget={modals.selectedBudget}
        items={modals.budgetItems}
        onApprove={onApprove}
        onReject={onReject}
        onConvert={onConvert}
      />

      {/* Confirmar Aprovação */}
      <ConfirmModal
        isOpen={modals.showApproveConfirm}
        onClose={onCloseApprove}
        onConfirm={onConfirmApprove}
        title="Aprovar Orçamento"
        message={
          <p className="dark:text-gray-300 text-sm sm:text-base">
            Tem certeza que deseja <strong>aprovar</strong> o orçamento #
            {modals.selectedBudget?.budget_number}?
          </p>
        }
        confirmText="Aprovar"
        cancelText="Cancelar"
        variant="success"
        loading={isUpdating}
      />

      {/* Confirmar Rejeição */}
      <ConfirmModal
        isOpen={modals.showRejectConfirm}
        onClose={onCloseReject}
        onConfirm={onConfirmReject}
        title="Rejeitar Orçamento"
        message={
          <p className="dark:text-gray-300 text-sm sm:text-base">
            Tem certeza que deseja <strong>rejeitar</strong> o orçamento #
            {modals.selectedBudget?.budget_number}?
          </p>
        }
        confirmText="Rejeitar"
        cancelText="Cancelar"
        variant="danger"
        loading={isUpdating}
      />

      {/* Confirmar Conversão */}
      <ConfirmModal
        isOpen={modals.showConvertConfirm}
        onClose={onCloseConvert}
        onConfirm={onConfirmConvert}
        title="Converter em Venda"
        message={
          <div>
            <p className="mb-2 dark:text-gray-300 text-sm sm:text-base">
              Deseja converter o orçamento #{modals.selectedBudget?.budget_number} em uma venda?
            </p>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              O estoque será atualizado e o orçamento será marcado como convertido.
            </p>
          </div>
        }
        confirmText="Converter"
        cancelText="Cancelar"
        variant="success"
        loading={isConverting}
      />
    </>
  )
}

export default BudgetModalsContainer
