import React from 'react'
import { Package, Users, FileText, ShoppingCart, AlertCircle, Unlock, Trash2  } from '../../lib/icons'

const iconMap = {
  users: Users,
  products: Package,
  orders: ShoppingCart,
  logs: FileText,
  unlock: Unlock, 
  trash: Trash2,
  default: AlertCircle
}

const DataEmptyState = ({
  title = "Nenhum dado encontrado",
  description = "Não há registros para exibir no momento.",
  icon = "default",
  action,
  className = ""
}) => {
  const Icon = iconMap[icon] || iconMap.default

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-8 sm:p-12 text-center dark:bg-gray-900 dark:border-gray-700 ${className}`}>
      <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4 dark:bg-gray-800">
        <Icon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
      </div>
      <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2 dark:text-white">
        {title}
      </h3>
      <p className="text-sm text-gray-500 mb-4 dark:text-gray-400">
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors dark:bg-blue-700 dark:hover:bg-blue-600"
        >
          {action.icon}
          {action.label}
        </button>
      )}
    </div>
  )
}

export default DataEmptyState