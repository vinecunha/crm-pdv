// components/sales/pdv/CouponSelector.jsx
import React from 'react'
import { Ticket, X, Percent, DollarSign } from '../../../lib/icons'
import { formatCurrency } from '../../../utils/formatters'
import Modal from '../../ui/Modal'
import Button from '../../ui/Button'

const CouponSelector = ({
  isOpen,
  onClose,
  availableCoupons,
  couponCode,
  setCouponCode,
  couponError,
  onApplyCoupon,
  onRemoveCoupon
}) => {
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Aplicar Cupom de Desconto"
      size="md"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
            Código do Cupom
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ex: PRIMEIRACOMPRA"
              value={couponCode}
              onChange={(e) => {
                setCouponCode(e.target.value.toUpperCase())
              }}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 dark:focus:ring-blue-400"
              onKeyPress={(e) => e.key === 'Enter' && onApplyCoupon()}
              autoFocus
            />
            <Button onClick={() => onApplyCoupon()}>
              Aplicar
            </Button>
          </div>
          {couponError && (
            <p className="text-xs text-red-500 mt-1 dark:text-red-400">{couponError}</p>
          )}
        </div>

        {availableCoupons.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
              Cupons Disponíveis
            </p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {availableCoupons.map(coupon => (
                <div
                  key={coupon.id}
                  className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors dark:border-gray-700 dark:hover:bg-gray-700"
                  onClick={() => onApplyCoupon(coupon)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center dark:bg-green-900/30">
                        <Ticket size={16} className="text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{coupon.code}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{coupon.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600 dark:text-green-400">
                        {coupon.discount_type === 'percent' ? (
                          <span className="flex items-center gap-0.5">
                            <Percent size={12} />
                            {coupon.discount_value}%
                          </span>
                        ) : (
                          <span className="flex items-center gap-0.5">
                            <DollarSign size={12} />
                            {coupon.discount_value}
                          </span>
                        )}
                      </p>
                      {coupon.min_purchase > 0 && (
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          Mín: {formatCurrency(coupon.min_purchase)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500 text-center pt-2 border-t dark:text-gray-400 dark:border-gray-700">
          Dica: Use <kbd className="px-1.5 py-0.5 bg-gray-100 border rounded dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300">Alt + U</kbd> para abrir este menu
        </div>
      </div>
    </Modal>
  )
}

export default CouponSelector