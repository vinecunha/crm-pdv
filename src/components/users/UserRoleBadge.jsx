import React from 'react'

const UserRoleBadge = ({ role, size = 'sm' }) => {
  const config = {
    admin: { label: 'Administrador', variant: 'purple', icon: '👑' },
    gerente: { label: 'Gerente', variant: 'info', icon: '⭐' },
    operador: { label: 'Operador', variant: 'default', icon: '👤' }
  }
  
  const { label, variant, icon } = config[role] || config.operador
  const sizes = { sm: 'text-xs px-2 py-0.5', md: 'text-sm px-2.5 py-1' }
  const variants = {
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300',
    info: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
    default: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300'
  }
  
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${variants[variant]} ${sizes[size]}`}>
      <span>{icon}</span>
      <span>{label}</span>
    </span>
  )
}

export default UserRoleBadge
