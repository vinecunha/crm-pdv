import React from 'react'
import { User, Phone, X } from '@lib/icons'

const CustomerSelector = ({ customer, onClear, onOpenModal }) => {
  if (!customer) {
    return (
      <button
        onClick={onOpenModal}
        className="w-full flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors dark:bg-gray-900 dark:hover:bg-gray-700"
      >
        <div className="flex items-center gap-2">
          <User size={16} className="text-gray-500 dark:text-gray-400" />
          <span className="text-sm dark:text-gray-300">Cliente não identificado</span>
        </div>
        <Phone size={14} className="text-gray-400 dark:text-gray-500" />
      </button>
    )
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-2 dark:bg-green-900/20 dark:border-green-800">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <User size={16} className="text-green-600 dark:text-green-400" />
          <div>
            <p className="text-sm font-medium text-green-800 dark:text-green-300">{customer.name}</p>
            <p className="text-xs text-green-600 dark:text-green-400">{customer.phone}</p>
          </div>
        </div>
        <button
          onClick={onClear}
          className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          title="Remover cliente"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}

export default CustomerSelector