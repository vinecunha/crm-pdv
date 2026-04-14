import React from 'react'
import { User, Ticket, Printer, Ban } from '../../lib/icons'
import Modal from '../../ui/Modal'
import Button from '../../ui/Button'
import { formatCurrency, formatDateTime } from '../../../utils/formatters'

const SaleDetailsModal = ({ 
  isOpen, 
  onClose, 
  sale, 
  items, 
  onCancel, 
  onPrint,
  getPaymentMethodIcon,
  getPaymentMethodText,
  getStatusBadge 
}) => {
  if (!sale) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Detalhes da Venda #${sale.sale_number || ''}`} size="lg">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-xs text-gray-500">Data da venda</p>
            <p className="text-sm font-medium">{formatDateTime(sale.created_at)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Forma de pagamento</p>
            <p className="text-sm font-medium flex items-center gap-1">
              {getPaymentMethodIcon(sale.payment_method)}
              {getPaymentMethodText(sale.payment_method)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Status</p>
            <div>{getStatusBadge(sale.status)}</div>
          </div>
          {sale.coupon_code && (
            <div>
              <p className="text-xs text-gray-500">Cupom aplicado</p>
              <p className="text-sm font-medium text-green-600 flex items-center gap-1">
                <Ticket size={14} />
                {sale.coupon_code}
              </p>
            </div>
          )}
          {sale.cancelled_at && (
            <>
              <div>
                <p className="text-xs text-gray-500">Cancelado em</p>
                <p className="text-sm font-medium">{formatDateTime(sale.cancelled_at)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Motivo</p>
                <p className="text-sm font-medium">{sale.cancellation_reason}</p>
              </div>
            </>
          )}
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Cliente</h3>
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <User size={16} className="text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-900">{sale.customer_name || 'Cliente não identificado'}</p>
                {sale.customer_phone && <p className="text-xs text-blue-600">{sale.customer_phone}</p>}
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Itens da Venda</h3>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{item.product_name}</p>
                  <p className="text-xs text-gray-500">{formatCurrency(item.unit_price)} x {item.quantity}</p>
                </div>
                <p className="text-sm font-semibold text-gray-900">{formatCurrency(item.total_price)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span>{formatCurrency(sale.total_amount)}</span>
          </div>
          {sale.discount_amount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Desconto</span>
              <span>- {formatCurrency(sale.discount_amount)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold pt-2 border-t">
            <span>Total</span>
            <span className="text-green-600">{formatCurrency(sale.final_amount)}</span>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onClose} className="flex-1">Fechar</Button>
          {sale.status === 'completed' && (
            <Button variant="danger" onClick={onCancel} className="flex-1">
              <Ban size={16} className="mr-1" />
              Cancelar Venda
            </Button>
          )}
          <Button onClick={onPrint} className="flex-1">
            <Printer size={16} className="mr-1" />
            Imprimir
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default SaleDetailsModal