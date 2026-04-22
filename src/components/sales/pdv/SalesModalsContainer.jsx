// src/components/sales/pdv/SalesModalsContainer.jsx
import React from 'react'
import Modal from '@components/ui/Modal'
import Button from '@components/ui/Button'
import ConfirmModal from '@components/ui/ConfirmModal'
import QuickCustomerForm from '@components/sales/pdv/QuickCustomerForm'
import CouponSelector from '@components/sales/pdv/CouponSelector'
import CheckoutModal from '@components/sales/pdv/CheckoutModal'
import ShortcutsHelpModal from '@components/ui/ShortcutsHelpModal'
import ReceiptModal from '@components/sales/common/ReceiptModal'
import { Phone } from '@lib/icons'

const SalesModalsContainer = ({
  // Customer Modal
  showCustomerModal,
  closeCustomerModal,
  customerPhone,
  setCustomerPhone,
  handleSearchCustomer,
  isSearching,
  
  // Quick Customer Modal
  showQuickCustomerModal,
  setShowQuickCustomerModal,
  quickCustomerForm,
  setQuickCustomerForm,
  quickCustomerErrors,
  quickRegisterCustomer,
  isCreating,
  
  // Coupon Modal
  showCouponModal,
  closeCouponModal,
  customer,
  coupon,
  availableCoupons,
  couponCode,
  setCouponCode,
  couponError,
  handleApplyCoupon,
  removeCoupon,
  isValidating,
  
  // Payment Modal
  showPaymentModal,
  closePaymentModal,
  cart,
  discount,
  subtotal,
  total,
  paymentMethod,
  setPaymentMethod,
  confirmPayment,
  isSubmitting,
  isOnline,
  createPendingSale,
  
  // Clear Cart Modal
  showClearCartConfirm,
  closeClearCartConfirm,
  confirmClearCart,
  
  // Shortcuts Modal
  showShortcutsHelp,
  closeShortcutsHelp,
  shortcuts,
  
  // Receipt Modal
  showReceiptModal,
  closeReceiptModal,
  completedSaleData,
  profile
}) => {
  return (
    <>
      {/* Modal de Identificação do Cliente */}
      <Modal 
        isOpen={showCustomerModal} 
        onClose={closeCustomerModal} 
        title="Identificar Cliente" 
        size="sm"
      >
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <Phone size={24} className="text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
              Digite o telefone do cliente
            </p>
          </div>
          <input 
            type="tel" 
            placeholder="(11) 99999-9999" 
            value={customerPhone} 
            onChange={(e) => setCustomerPhone(e.target.value)}
            className="w-full px-4 py-2.5 border rounded-lg text-center dark:bg-gray-800 dark:text-white"
            onKeyDown={(e) => e.key === 'Enter' && handleSearchCustomer()} 
            autoFocus 
            disabled={isSearching} 
          />
          <div className="flex gap-3">
            <Button variant="outline" onClick={closeCustomerModal} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleSearchCustomer} loading={isSearching} className="flex-1">
              Buscar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de Cadastro Rápido de Cliente */}
      <QuickCustomerForm 
        isOpen={showQuickCustomerModal} 
        onClose={() => setShowQuickCustomerModal(false)}
        formData={quickCustomerForm} 
        setFormData={setQuickCustomerForm} 
        errors={quickCustomerErrors}
        onSubmit={quickRegisterCustomer} 
        isSubmitting={isCreating} 
      />

      {/* Modal de Seleção de Cupom */}
      <CouponSelector 
        isOpen={showCouponModal} 
        onClose={closeCouponModal} 
        customer={customer} 
        coupon={coupon}
        availableCoupons={availableCoupons} 
        couponCode={couponCode} 
        setCouponCode={setCouponCode} 
        couponError={couponError}
        onApplyCoupon={handleApplyCoupon} 
        onRemoveCoupon={removeCoupon} 
        isLoading={isValidating} 
      />

      {/* Modal de Checkout/Pagamento */}
      <CheckoutModal 
        isOpen={showPaymentModal} 
        onClose={closePaymentModal} 
        cart={cart} 
        discount={discount}
        subtotal={subtotal} 
        total={total} 
        customer={customer} 
        paymentMethod={paymentMethod} 
        setPaymentMethod={setPaymentMethod}
        onConfirm={confirmPayment} 
        isSubmitting={isSubmitting} 
        isOnline={isOnline} 
        onCreatePendingSale={createPendingSale} 
      />

      {/* Modal de Confirmação para Limpar Carrinho */}
      <ConfirmModal 
        isOpen={showClearCartConfirm} 
        onClose={closeClearCartConfirm} 
        onConfirm={confirmClearCart}
        title="Limpar Carrinho" 
        message="Tem certeza que deseja remover todos os itens?"
        confirmText="Limpar" 
        cancelText="Cancelar" 
        variant="danger" 
      />

      {/* Modal de Atalhos do Teclado */}
      <ShortcutsHelpModal 
        isOpen={showShortcutsHelp} 
        onClose={closeShortcutsHelp} 
        shortcuts={shortcuts} 
      />

      {/* Modal de Recibo */}
      <ReceiptModal
        isOpen={showReceiptModal}
        onClose={() => {
          closeReceiptModal()
        }}
        sale={completedSaleData?.sale}
        customer={completedSaleData?.customer}
        cart={completedSaleData?.cart || []}
        paymentMethod={completedSaleData?.paymentMethod}
        discount={completedSaleData?.discount || 0}
        profile={profile}
      />
    </>
  )
}

export default SalesModalsContainer