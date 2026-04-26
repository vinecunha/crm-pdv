import React from 'react'
import { Ticket, CheckCircle, Globe, Users } from '@lib/icons'
import StatCard from '@components/ui/StatCard'

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
