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
    purple: 'bg-purple-100 text-purple-800',
    info: 'bg-blue-100 text-blue-800',
    default: 'bg-gray-100 text-gray-800'
  }
  
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${variants[variant]} ${sizes[size]}`}>
      <span>{icon}</span>
      <span>{label}</span>
    </span>
  )
}

export default UserRoleBadge
// export default