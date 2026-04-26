const Badge = ({ variant = 'default', children, className = '' }) => {
  const variants = {
    admin: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300',
    gerente: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
    operador: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300',
    active: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
    inactive: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
    default: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300',
    success: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
    warning: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
    error: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
    info: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
    danger: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
  }
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${variants[variant] || variants.default} ${className}`}>
      {children}
    </span>
  )
}

export default Badge