import React from 'react'
import { Users, Shield, UserPlus, Calendar } from '../../lib/icons'

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

const UserStats = ({ users }) => {
  const totalUsers = users.length
  const adminCount = users.filter(u => u.role === 'admin').length
  const managerCount = users.filter(u => u.role === 'gerente').length
  const operatorCount = users.filter(u => u.role === 'operador').length

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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