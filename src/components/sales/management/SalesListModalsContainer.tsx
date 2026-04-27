// src/components/sales/management/SalesListModalsContainer.jsx
import React from 'react'
import Button from '@components/ui/Button'
import CancelSaleModal from '@components/sales/management/CancelSaleModal'
import ReceiptModal from '@components/sales/common/ReceiptModal'
import { RefreshCw, XCircle } from '@lib/icons'
import { formatCurrency, formatDateTime } from '@utils/formatters'

const SalesListModalsContainer = ({
  showDetailsModal,
  closeDetailsModal,
  selectedSale,
  saleItems,
  isLoadingItems,
  canCancelDirectly,
  canRequestCancellation,
  cancelMutation,
  openCancelModal,
  showCancelModal,
  closeCancelModal,
  cancelReason,
  setCancelReason,
  cancelNotes,
  setCancelNotes,
  handleCancelWithApproval,
  profile,
  showReceiptModal,
  closeReceiptModal,
  receiptSale,
  receiptItems,
  isLoadingReceiptItems
}) => {
  return (
    <>
      {/* Modal de Detalhes */}
      {showDetailsModal && selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="absolute inset-0 bg-black/30 dark:bg-black/50" onClick={closeDetailsModal} />
          <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-hidden">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <div>
                <h3 className="text-base sm:text-lg font-semibold dark:text-white">
                  Detalhes da Venda #{selectedSale.sale_number}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  {formatDateTime(selectedSale.created_at)}
                </p>
              </div>
              <Button onClick={closeDetailsModal} variant="ghost" size="sm" ariaLabel="Fechar">
                ✕
              </Button>
            </div>
            
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[60vh] space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 sm:p-4">
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-2">CLIENTE</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-medium flex-shrink-0">
                    {selectedSale.customer_name?.charAt(0) || 'C'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base truncate">
                      {selectedSale.customer_name || 'Cliente não identificado'}
                    </p>
                    {selectedSale.customer_phone && (
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                        {selectedSale.customer_phone}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {selectedSale.status === 'cancelled' && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 sm:p-4 border border-red-200 dark:border-red-800">
                  <p className="text-xs text-red-600 dark:text-red-400 font-medium mb-2 sm:mb-3 flex items-center gap-1">
                    <XCircle size={14} />INFORMAÇÕES DE CANCELAMENTO
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                    <div><p className="text-gray-500 dark:text-gray-400 text-xs">Data/Hora</p><p className="font-medium text-gray-900 dark:text-white">{formatDateTime(selectedSale.cancelled_at)}</p></div>
                    <div><p className="text-gray-500 dark:text-gray-400 text-xs">Cancelado por</p><p className="font-medium text-gray-900 dark:text-white">{selectedSale.cancelled_by_user?.full_name || selectedSale.cancelled_by_user?.email || 'Sistema'}</p></div>
                    <div className="sm:col-span-2"><p className="text-gray-500 dark:text-gray-400 text-xs">Motivo</p><p className="font-medium text-gray-900 dark:text-white">{selectedSale.cancellation_reason || '-'}</p></div>
                    {selectedSale.cancellation_notes && <div className="sm:col-span-2"><p className="text-gray-500 dark:text-gray-400 text-xs">Observações</p><p className="text-gray-700 dark:text-gray-300 text-sm">{selectedSale.cancellation_notes}</p></div>}
                    {selectedSale.approved_by_user && (
                      <div className="sm:col-span-2 border-t border-red-200 dark:border-red-800 pt-2 sm:pt-3 mt-1">
                        <p className="text-gray-500 dark:text-gray-400 text-xs">Aprovado por</p>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                          {selectedSale.approved_by_user.full_name || selectedSale.approved_by_user.email}
                          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                            ({selectedSale.approved_by === selectedSale.cancelled_by ? 'Auto-aprovado' : 'Aprovador'})
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">ITENS</p>
                {isLoadingItems ? (
                  <div className="text-center py-4">
                    <RefreshCw size={20} className="animate-spin mx-auto text-gray-400 dark:text-gray-500" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {saleItems.map((item, i) => (
                      <div key={i} className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                        <span className="text-gray-700 dark:text-gray-300 text-sm">{item.product_name} x{item.quantity}</span>
                        <span className="font-medium dark:text-white text-sm">{formatCurrency(item.total_price)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t dark:border-gray-700 pt-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
                  <span className="dark:text-white">{formatCurrency(selectedSale.total_amount)}</span>
                </div>
                {selectedSale.discount_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600 dark:text-green-400">
                      Desconto {selectedSale.coupon_code && `(${selectedSale.coupon_code})`}
                    </span>
                    <span className="text-green-600 dark:text-green-400">-{formatCurrency(selectedSale.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold pt-2 border-t dark:border-gray-700 text-base">
                  <span className="dark:text-white">Total</span>
                  <span className="text-green-600 dark:text-green-400">{formatCurrency(selectedSale.final_amount)}</span>
                </div>
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500 border-t dark:border-gray-700 pt-3">
                <p>Venda realizada por: {selectedSale.created_by_user?.full_name || selectedSale.created_by_user?.email || 'Sistema'}</p>
              </div>
            </div>

            <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
              <Button variant="outline" onClick={closeDetailsModal} className="order-2 sm:order-1 w-full sm:w-auto">
                Fechar
              </Button>
              {selectedSale.status === 'completed' && (canCancelDirectly || canRequestCancellation) && (
                <Button 
                  variant="danger" 
                  onClick={() => { 
                    closeDetailsModal()
                    openCancelModal(selectedSale)
                  }} 
                  disabled={cancelMutation.isPending}
                  className="order-1 sm:order-2 w-full sm:w-auto"
                >
                  {canCancelDirectly ? 'Cancelar Venda' : 'Solicitar Cancelamento'}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cancelamento */}
      <CancelSaleModal 
        isOpen={showCancelModal} 
        onClose={closeCancelModal} 
        sale={selectedSale} 
        cancelReason={cancelReason} 
        setCancelReason={setCancelReason} 
        cancelNotes={cancelNotes} 
        setCancelNotes={setCancelNotes} 
        onConfirm={handleCancelWithApproval} 
        isSubmitting={cancelMutation.isPending} 
        currentUser={profile} 
      />

      {/* Modal de Recibo */}
      <ReceiptModal
        isOpen={showReceiptModal}
        onClose={closeReceiptModal}
        sale={receiptSale}
        items={receiptItems}
        isLoading={isLoadingReceiptItems}
        title={`Recibo #${receiptSale?.sale_number || ''}`}
      />
    </>
  )
}

export default SalesListModalsContainer
