import React from 'react'
import { User } from 'lucide-react'
import Modal from '../../ui/Modal'
import Button from '../../ui/Button'
import { formatCurrency } from '../../../utils/formatters'
import PaymentMethodSelector from './PaymentMethodSelector'

const CheckoutModal = ({ 
  isOpen, 
  onClose, 
  cart, 
  discount, 
  customer, 
  paymentMethod, 
  setPaymentMethod, 
  onConfirm, 
  isSubmitting 
}) => {
  const getSubtotal = () => cart.reduce((sum, item) => sum + item.total, 0)
  const getTotal = () => getSubtotal() - discount
  const getItemCount = () => cart.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !isSubmitting && onClose()}
      title="Finalizar Compra"
      size="md"
      isLoading={isSubmitting}
    >
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Itens:</span>
            <span>{getItemCount()} produtos</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal:</span>
            <span>{formatCurrency(getSubtotal())}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Desconto:</span>
              <span>- {formatCurrency(discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold pt-2 border-t">
            <span>Total a pagar:</span>
            <span className="text-green-600">{formatCurrency(getTotal())}</span>
          </div>
        </div>

        <PaymentMethodSelector selected={paymentMethod} onSelect={setPaymentMethod} />

        {customer && (
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <User size={16} className="text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-900">{customer.name}</p>
                <p className="text-xs text-blue-600">{customer.phone}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting} className="flex-1">
            Cancelar
          </Button>
          <Button onClick={onConfirm} loading={isSubmitting} className="flex-1">
            Confirmar Pagamento
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default CheckoutModal