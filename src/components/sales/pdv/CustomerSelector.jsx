import React from 'react'
import { User, Phone, X } from '../../lib/icons'

const CustomerSelector = ({ customer, onClear, onOpenModal }) => {
  if (!customer) {
    return (
      <button
        onClick={onOpenModal}
        className="w-full flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <User size={16} className="text-gray-500" />
          <span className="text-sm">Cliente não identificado</span>
        </div>
        <Phone size={14} className="text-gray-400" />
      </button>
    )
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-2">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <User size={16} className="text-green-600" />
          <div>
            <p className="text-sm font-medium text-green-800">{customer.name}</p>
            <p className="text-xs text-green-600">{customer.phone}</p>
          </div>
        </div>
        <button
          onClick={onClear}
          className="text-red-500 hover:text-red-700"
          title="Remover cliente"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}

export default CustomerSelector