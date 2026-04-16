import React, { useState } from 'react'
import { CreditCard, Banknote, QrCode, Smartphone } from '../../../lib/icons'
import { formatCurrency } from '../../../utils/formatters'
import Modal from '../../ui/Modal'
import Button from '../../ui/Button'
import PixPaymentModal from './PixPaymentModal'

const paymentMethods = [
  { id: 'cash', name: 'Dinheiro', icon: Banknote, shortcut: { key: 'F6', description: 'Dinheiro' } },
  { id: 'pix', name: 'PIX', icon: QrCode, shortcut: { key: 'F7', description: 'PIX' } },
  { id: 'credit_card', name: 'Crédito', icon: CreditCard, shortcut: { key: 'F8', description: 'Crédito' } },
  { id: 'debit_card', name: 'Débito', icon: CreditCard, shortcut: { key: 'F9', description: 'Débito' } },
  { id: 'other', name: 'Outro', icon: Smartphone }
]

const CheckoutModal = ({
  isOpen,
  onClose,
  cart,
  discount,
  subtotal,
  total,
  customer,
  paymentMethod,
  setPaymentMethod,
  onConfirm,
  isSubmitting,
  isOnline = true,
  onCreatePendingSale
}) => {
  const [showPixModal, setShowPixModal] = useState(false)
  const [pendingSaleId, setPendingSaleId] = useState(null)

  const handlePixPayment = () => {
    if (!onCreatePendingSale) {
      console.error('onCreatePendingSale não foi passado!')
      return
    }
    
    onCreatePendingSale((saleId) => {
      console.log('✅ Venda pendente criada:', saleId)
      setPendingSaleId(saleId)
      setShowPixModal(true)
    })
  }

  const handleMethodSelect = (method) => {
    setPaymentMethod(method)
    
    if (method === 'pix') {
      handlePixPayment()
    }
  }

  const handlePixConfirmed = () => {
    setShowPixModal(false)
    setPendingSaleId(null)
    onClose()
    onConfirm('pix')
  }

  const handleConfirmClick = () => {
    if (paymentMethod === 'pix') {
      handlePixPayment()
    } else {
      onConfirm(paymentMethod)
    }
  }

  return (
    <>
      <Modal
        isOpen={isOpen && !showPixModal}
        onClose={onClose}
        title="Finalizar Venda"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4 dark:bg-gray-800">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Itens:</span>
                <span className="dark:text-white">{cart.length} produto{cart.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                <span className="dark:text-white">{formatCurrency(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600 dark:text-green-400">
                  <span>Desconto:</span>
                  <span>- {formatCurrency(discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg pt-2 border-t dark:border-gray-700">
                <span className="dark:text-white">Total:</span>
                <span className="dark:text-white">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          {customer && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium dark:text-white">Cliente:</span> {customer.name}
            </div>
          )}

          {!isOnline && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 dark:bg-yellow-900/20 dark:border-yellow-800">
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                ⚠️ Você está offline. O pagamento será registrado localmente.
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
              Método de Pagamento
            </label>
            <div className="grid grid-cols-2 gap-2">
              {paymentMethods.map(method => (
                <button
                  key={method.id}
                  onClick={() => handleMethodSelect(method.id)}
                  className={`
                    p-3 rounded-lg border-2 flex flex-col items-center gap-1 transition-all
                    ${paymentMethod === method.id 
                      ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-900/30 dark:text-blue-300' 
                      : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600 dark:text-gray-300'
                    }
                  `}
                  disabled={isSubmitting || !isOnline}
                >
                  <method.icon size={24} />
                  <span className="text-sm font-medium">{method.name}</span>
                  {method.shortcut && (
                    <span className="text-xs opacity-60 font-mono">
                      {method.shortcut.key}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t dark:border-gray-700">
          <Button 
            variant="outline" 
            onClick={onClose}
            shortcut={{ key: 'Escape', description: 'Cancelar' }}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          
          <Button 
            variant="success" 
            onClick={handleConfirmClick}
            loading={isSubmitting}
            shortcut={{ key: 'F2', description: paymentMethod === 'pix' ? 'Gerar PIX' : 'Confirmar' }}
            disabled={!isOnline || cart.length === 0}
          >
            {paymentMethod === 'pix' ? 'Gerar QR Code PIX' : 'Confirmar Pagamento'}
          </Button>
        </div>
      </Modal>

      {showPixModal && pendingSaleId && (
        <PixPaymentModal
          isOpen={showPixModal}
          onClose={() => {
            setShowPixModal(false)
            setPendingSaleId(null)
          }}
          saleId={pendingSaleId}
          amount={total}
          description={customer ? `Compra - ${customer.name}` : 'Compra PDV'}
          onPaymentConfirmed={handlePixConfirmed}
        />
      )}
    </>
  )
}

export default CheckoutModal