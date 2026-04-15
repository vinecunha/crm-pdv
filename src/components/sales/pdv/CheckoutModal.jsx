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

  // ✅ CORRIGIDO: Função chamada quando clica no PIX
  const handlePixPayment = () => {
    if (!onCreatePendingSale) {
      console.error('onCreatePendingSale não foi passado!')
      return
    }
    
    // Criar venda pendente e depois abrir modal PIX
    onCreatePendingSale((saleId) => {
      console.log('✅ Venda pendente criada:', saleId)
      setPendingSaleId(saleId)
      setShowPixModal(true)
    })
  }

  const handleMethodSelect = (method) => {
    setPaymentMethod(method)
    
    // ✅ Se for PIX, chamar handlePixPayment diretamente
    if (method === 'pix') {
      handlePixPayment()
    }
  }

  const handlePixConfirmed = () => {
    setShowPixModal(false)
    setPendingSaleId(null)
    onClose()
    // Notificar sucesso
    onConfirm('pix') // Finaliza a venda no sistema
  }

  // ✅ CORRIGIDO: Botão de confirmar para PIX também
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
          {/* Resumo */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Itens:</span>
                <span>{cart.length} produto{cart.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Desconto:</span>
                  <span>- {formatCurrency(discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total:</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          {/* Cliente */}
          {customer && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">Cliente:</span> {customer.name}
            </div>
          )}

          {/* Aviso Offline */}
          {!isOnline && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                ⚠️ Você está offline. O pagamento será registrado localmente.
              </p>
            </div>
          )}

          {/* Métodos de Pagamento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : 'border-gray-200 hover:border-gray-300'
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

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={onClose}
            shortcut={{ key: 'Escape', description: 'Cancelar' }}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          
          {/* ✅ CORRIGIDO: Botão sempre aparece, com texto diferente para PIX */}
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

      {/* Modal PIX */}
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