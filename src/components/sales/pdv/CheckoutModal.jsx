import React, { useState, useRef } from 'react'
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
  
  // 🛡️ Proteção contra duplo clique
  const [isLocalSubmitting, setIsLocalSubmitting] = useState(false)
  const confirmInProgress = useRef(false)

  const handlePixPayment = () => {
    if (!onCreatePendingSale) {
      console.error('onCreatePendingSale não foi passado!')
      return
    }
    
    // 🛡️ Evitar múltiplas chamadas
    if (confirmInProgress.current) {
      console.warn('⚠️ PIX já em processamento')
      return
    }
    
    confirmInProgress.current = true
    setIsLocalSubmitting(true)
    
    onCreatePendingSale((saleId) => {
      console.log('✅ Venda pendente criada:', saleId)
      setPendingSaleId(saleId)
      setShowPixModal(true)
      
      // Resetar após sucesso
      setTimeout(() => {
        confirmInProgress.current = false
        setIsLocalSubmitting(false)
      }, 1000)
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
    console.log('🟡 Botão Confirmar clicado', { 
      paymentMethod, 
      isLocalSubmitting, 
      isSubmitting 
    })
    
    // 🛡️ Proteção contra duplo clique
    if (isLocalSubmitting || isSubmitting || confirmInProgress.current) {
      console.warn('⚠️ Já está processando pagamento');
      return;
    }
    
    if (paymentMethod === 'pix') {
      handlePixPayment()
    } else {
      // Marcar como em progresso
      confirmInProgress.current = true
      setIsLocalSubmitting(true)
      
      // Chamar o callback
      onConfirm(paymentMethod)
      
      // Resetar após um tempo (caso o onConfirm não feche o modal)
      setTimeout(() => {
        confirmInProgress.current = false
        setIsLocalSubmitting(false)
      }, 3000)
    }
  }

  // Resetar estado quando o modal fechar
  const handleClose = () => {
    if (!isSubmitting) {
      confirmInProgress.current = false
      setIsLocalSubmitting(false)
      onClose()
    }
  }

  return (
    <>
      <Modal
        isOpen={isOpen && !showPixModal}
        onClose={handleClose}
        title="Finalizar Venda"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4 dark:bg-gray-900">
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
                  type="button" // 🛡️ Evitar submit de formulário
                  onClick={() => handleMethodSelect(method.id)}
                  className={`
                    p-3 rounded-lg border-2 flex flex-col items-center gap-1 transition-all
                    ${paymentMethod === method.id 
                      ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-900/30 dark:text-blue-300' 
                      : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600 dark:text-gray-300'
                    }
                  `}
                  disabled={isSubmitting || isLocalSubmitting || !isOnline}
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
            onClick={handleClose}
            shortcut={{ key: 'Escape', description: 'Cancelar' }}
            disabled={isSubmitting || isLocalSubmitting}
          >
            Cancelar
          </Button>
          
          <Button 
            variant="success" 
            onClick={handleConfirmClick}
            loading={isSubmitting || isLocalSubmitting}
            shortcut={{ key: 'F2', description: paymentMethod === 'pix' ? 'Gerar PIX' : 'Confirmar' }}
            disabled={!isOnline || cart.length === 0 || isSubmitting || isLocalSubmitting}
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
            confirmInProgress.current = false
            setIsLocalSubmitting(false)
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