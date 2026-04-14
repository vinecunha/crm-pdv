import React from 'react'
import { Ticket, CheckCircle, Globe, Users } from '../../lib/icons'

const StatCard = ({ label, value, sublabel, icon: Icon, variant = 'default' }) => {
  const variants = {
    default: 'bg-white border-gray-200',
    success: 'bg-green-50 border-green-200',
    info: 'bg-blue-50 border-blue-200',
    purple: 'bg-purple-50 border-purple-200',
    orange: 'bg-orange-50 border-orange-200'
  }

  const iconColors = {
    default: 'text-gray-600',
    success: 'text-green-600',
    info: 'text-blue-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600'
  }

  return (
    <div className={`${variants[variant]} rounded-xl border p-5 transition-all hover:shadow-md`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {sublabel && <p className="text-xs text-gray-400">{sublabel}</p>}
        </div>
        <div className="p-2.5 rounded-lg bg-white/50">
          <Icon size={22} className={iconColors[variant]} />
        </div>
      </div>
    </div>
  )
}

const CouponStats = ({ coupons }) => {
  const totalCoupons = coupons.length
  const activeCoupons = coupons.filter(c => c.is_active).length
  const globalCoupons = coupons.filter(c => c.is_global).length
  const restrictedCoupons = coupons.filter(c => !c.is_global).length

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard
        label="Total de Cupons"
        value={totalCoupons}
        sublabel="Todos os cupons"
        icon={Ticket}
        variant="info"
      />
      <StatCard
        label="Cupons Ativos"
        value={activeCoupons}
        sublabel={`${totalCoupons > 0 ? Math.round((activeCoupons / totalCoupons) * 100) : 0}% do total`}
        icon={CheckCircle}
        variant="success"
      />
      <StatCard
        label="Cupons Globais"
        value={globalCoupons}
        sublabel="Disponível para todos"
        icon={Globe}
        variant="purple"
      />
      <StatCard
        label="Cupons Restritos"
        value={restrictedCoupons}
        sublabel="Clientes específicos"
        icon={Users}
        variant="orange"
      />
    </div>
  )
}

export default CouponStats