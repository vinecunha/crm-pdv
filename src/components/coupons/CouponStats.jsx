import React from 'react'
import { Ticket, CheckCircle, Globe, Users } from '../../lib/icons'

const StatCard = ({ label, value, sublabel, icon: Icon, variant = 'default' }) => {
  const variants = {
    default: 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700',
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
    orange: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
  }

  const iconColors = {
    default: 'text-gray-600 dark:text-gray-400',
    success: 'text-green-600 dark:text-green-400',
    info: 'text-blue-600 dark:text-blue-400',
    purple: 'text-purple-600 dark:text-purple-400',
    orange: 'text-orange-600 dark:text-orange-400'
  }

  return (
    <div className={`${variants[variant]} rounded-xl border p-5 transition-all hover:shadow-md`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          {sublabel && <p className="text-xs text-gray-400 dark:text-gray-500">{sublabel}</p>}
        </div>
        <div className="p-2.5 rounded-lg bg-white/50 dark:bg-gray-800/50">
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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