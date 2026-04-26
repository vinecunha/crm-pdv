import React from 'react'
import { Users, Shield, UserPlus, Calendar } from '@lib/icons'
import StatCard from '@components/ui/StatCard'

const UserStats = ({ users }) => {
  const totalUsers = users.length
  const adminCount = users.filter(u => u.role === 'admin').length
  const managerCount = users.filter(u => u.role === 'gerente').length
  const operatorCount = users.filter(u => u.role === 'operador').length

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
      <StatCard
        label="Total de Usuários"
        value={totalUsers}
        icon={Users}
        variant="info"
      />
      <StatCard
        label="Administradores"
        value={adminCount}
        sublabel={`${totalUsers > 0 ? Math.round((adminCount / totalUsers) * 100) : 0}% do total`}
        icon={Shield}
        variant="purple"
      />
      <StatCard
        label="Gerentes"
        value={managerCount}
        icon={UserPlus}
        variant="success"
      />
      <StatCard
        label="Operadores"
        value={operatorCount}
        icon={Users}
        variant="default"
      />
    </div>
  )
}

export default UserStats
