import React from 'react'
import { CreditCard, Banknote, QrCode, Smartphone } from '../../../lib/icons'
import { formatCurrency } from '../../../utils/formatters'
import Modal from '../../ui/Modal'
import Button from '../../ui/Button'

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
  isSubmitting
}) => {

  return (
    <Modal
      isOpen={isOpen}
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

        {/* Métodos de Pagamento */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Método de Pagamento
          </label>
          <div className="grid grid-cols-2 gap-2">
            {paymentMethods.map(method => (
              <button
                key={method.id}
                onClick={() => setPaymentMethod(method.id)}
                className={`
                  p-3 rounded-lg border-2 flex flex-col items-center gap-1 transition-all
                  ${paymentMethod === method.id 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
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
        >
          Cancelar
        </Button>
        <Button 
          variant="success" 
          onClick={() => onConfirm(paymentMethod)} 
          loading={isSubmitting}
          shortcut={{ key: 'F2', description: 'Confirmar' }}
        >
          Confirmar Pagamento
        </Button>
      </div>
    </Modal>
  )
}

export default CheckoutModal