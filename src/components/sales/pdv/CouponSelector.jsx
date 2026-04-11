import React from 'react'
import { Ticket, Percent, X } from 'lucide-react'
import Modal from '../../ui/Modal'
import Button from '../../ui/Button'

const CouponSelector = ({ 
  customer, 
  coupon, 
  availableCoupons, 
  couponCode, 
  setCouponCode, 
  couponError, 
  onApplyCoupon, 
  onRemoveCoupon, 
  onOpenModal, 
  onCloseModal,
  showModal 
}) => {
  if (!customer) {
    return (
      <div className="mt-3">
        <div className="w-full p-2 bg-gray-100 rounded-lg text-center">
          <Ticket size={16} className="inline mr-1 text-gray-400" />
          <span className="text-xs text-gray-500">Identifique um cliente para usar cupons</span>
        </div>
      </div>
    )
  }

  if (!coupon) {
    return (
      <div className="mt-3">
        <button
          onClick={onOpenModal}
          className="w-full flex items-center justify-center gap-2 p-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-600 transition-colors"
        >
          <Ticket size={16} />
          <span className="text-sm">Adicionar cupom de desconto</span>
        </button>
        
        {availableCoupons.length > 0 && (
          <div className="mt-2 p-2 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-700 mb-2 flex items-center gap-1">
              <Percent size={12} />
              Cupons disponíveis para você:
            </p>
            <div className="flex flex-wrap gap-1">
              {availableCoupons.slice(0, 3).map(c => (
                <button
                  key={c.id}
                  onClick={() => onApplyCoupon(c)}
                  className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                >
                  {c.code} ({c.discount_type === 'percent' ? `${c.discount_value}%` : `R$ ${c.discount_value}`})
                </button>
              ))}
            </div>
          </div>
        )}

        <CouponModal
          isOpen={showModal}
          onClose={onCloseModal}
          availableCoupons={availableCoupons}
          couponCode={couponCode}
          setCouponCode={setCouponCode}
          couponError={couponError}
          onApply={onApplyCoupon}
        />
      </div>
    )
  }

  return (
    <div className="mt-3">
      <div className="bg-green-50 border border-green-200 rounded-lg p-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Ticket size={16} className="text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-800">{coupon.code}</p>
              <p className="text-xs text-green-600">
                {coupon.discount_type === 'percent' 
                  ? `${coupon.discount_value}% de desconto`
                  : `R$ ${coupon.discount_value} de desconto`}
              </p>
            </div>
          </div>
          <button onClick={onRemoveCoupon} className="text-red-500 hover:text-red-700">
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

const CouponModal = ({ isOpen, onClose, availableCoupons, couponCode, setCouponCode, couponError, onApply }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Adicionar Cupom" size="sm">
      <div className="space-y-4">
        <div className="text-center">
          <Ticket size={48} className="mx-auto text-blue-600 mb-3" />
          <p className="text-gray-600 mb-4">Digite o código do cupom de desconto</p>
        </div>
        
        {availableCoupons.length > 0 && (
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-xs text-blue-700 mb-2 font-medium">Seus cupons disponíveis:</p>
            <div className="flex flex-wrap gap-2">
              {availableCoupons.map(c => (
                <button
                  key={c.id}
                  onClick={() => onApply(c)}
                  className="text-xs px-2 py-1 bg-white border border-blue-300 text-blue-700 rounded hover:bg-blue-100 transition-colors"
                >
                  {c.code}
                </button>
              ))}
            </div>
          </div>
        )}
        
        <input
          type="text"
          placeholder="Ex: PRIMEIRACOMPRA"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 uppercase"
          onKeyPress={(e) => e.key === 'Enter' && onApply()}
        />
        {couponError && <p className="text-xs text-red-600">{couponError}</p>}
        
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button onClick={() => onApply()} className="flex-1">
            Aplicar Cupom
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default CouponSelector