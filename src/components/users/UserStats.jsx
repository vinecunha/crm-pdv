import React from 'react'
import { Users, Shield, UserPlus, Calendar } from '@lib/icons'

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
    <div className={`${variants[variant]} rounded-xl border p-5 transition-all hover:shadow-md dark:hover:shadow-gray-900/50`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          {sublabel && <p className="text-xs text-gray-400 dark:text-gray-500">{sublabel}</p>}
        </div>
        <div className="p-2.5 rounded-lg bg-white/50 dark:bg-black/50">
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