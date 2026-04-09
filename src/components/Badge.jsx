const Badge = ({ variant = 'default', children }) => {
  const variants = {
    admin: 'bg-purple-100 text-purple-800',
    gerente: 'bg-blue-100 text-blue-800',
    operador: 'bg-gray-100 text-gray-800',
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-red-100 text-red-800',
    default: 'bg-gray-100 text-gray-800'
  }
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  )
}

export default Badge