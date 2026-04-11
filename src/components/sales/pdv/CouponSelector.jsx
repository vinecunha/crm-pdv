import React from 'react'
import { Ticket, Percent, X } from 'lucide-react'
import Modal from '../../ui/Modal'
import Button from '../../ui/Button'

const CouponModal = ({ isOpen, onClose, availableCoupons, couponCode, setCouponCode, couponError, onApply }) => {
  const handleApply = () => {
    if (onApply) {
      onApply()
    }
  }

  const handleApplySpecific = (coupon) => {
    if (onApply) {
      onApply(coupon)
    }
  }

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
                  type="button"
                  onClick={() => handleApplySpecific(c)}
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
          onKeyPress={(e) => e.key === 'Enter' && handleApply()}
        />
        {couponError && <p className="text-xs text-red-600">{couponError}</p>}
        
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button onClick={handleApply} className="flex-1">
            Aplicar Cupom
          </Button>
        </div>
      </div>
    </Modal>
  )
}

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
  const handleApplyCoupon = (specificCoupon = null) => {
    console.log('🎫 Aplicando cupom:', specificCoupon || couponCode)
    if (onApplyCoupon) {
      onApplyCoupon(specificCoupon)
    }
  }

  if (!customer) {
    return (
      <div className="mt-3">
        <div className="w-full p-3 bg-gray-100 rounded-xl text-center border border-gray-200">
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
          type="button"
          onClick={onOpenModal}
          className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-500 hover:text-blue-600 transition-all"
        >
          <Ticket size={18} />
          <span className="text-sm font-medium">Adicionar cupom de desconto</span>
        </button>
        
        {availableCoupons.length > 0 && (
          <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
            <p className="text-xs text-blue-700 mb-2 flex items-center gap-1 font-medium">
              <Percent size={12} />
              Cupons disponíveis para você:
            </p>
            <div className="flex flex-wrap gap-2">
              {availableCoupons.slice(0, 4).map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleApplyCoupon(c)}
                  className="text-xs px-3 py-1.5 bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors shadow-sm"
                >
                  <span className="font-mono font-bold">{c.code}</span>
                  <span className="ml-1 text-blue-500">
                    ({c.discount_type === 'percent' ? `${c.discount_value}%` : `R$ ${c.discount_value}`})
                  </span>
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
          onApply={handleApplyCoupon}
        />
      </div>
    )
  }

  return (
    <div className="mt-3">
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Ticket size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-green-800 font-mono">{coupon.code}</p>
              <p className="text-xs text-green-600">
                {coupon.discount_type === 'percent' 
                  ? `${coupon.discount_value}% de desconto`
                  : `R$ ${coupon.discount_value} de desconto`}
              </p>
            </div>
          </div>
          <button 
            onClick={onRemoveCoupon} 
            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            title="Remover cupom"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default CouponSelector