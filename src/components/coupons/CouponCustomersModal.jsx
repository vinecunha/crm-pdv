import React, { useState, useEffect } from 'react'
import { Ticket, UserPlus, UserMinus, Search } from '../../lib/icons'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { formatCurrency } from '../../utils/formatters'

const CouponCustomersModal = ({ 
  isOpen, 
  onClose, 
  coupon, 
  allowedCustomers, 
  setAllowedCustomers,
  customers,
  onAddCustomer,
  onRemoveCustomer,
  loading  
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredCustomers, setFilteredCustomers] = useState([])

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = customers.filter(c => 
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone?.includes(searchTerm)
      )
      setFilteredCustomers(filtered)
    } else {
      setFilteredCustomers([])
    }
  }, [searchTerm, customers])

  if (!coupon) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Clientes Permitidos - ${coupon.code}`} size="lg">
      <div className="space-y-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <Ticket size={20} className="text-blue-600 dark:text-blue-400" />
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-300">{coupon.name}</p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                {coupon.discount_type === 'percent' 
                  ? `${coupon.discount_value}% de desconto`
                  : `${formatCurrency(coupon.discount_value)} de desconto`}
              </p>
            </div>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={16} />
          <input
            type="text"
            placeholder="Buscar cliente para adicionar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg placeholder-gray-400 dark:placeholder-gray-500"
          />
        </div>

        {filteredCustomers.length > 0 && (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg max-h-48 overflow-y-auto">
            {filteredCustomers.map(customer => {
              const isAllowed = allowedCustomers.some(ac => ac.customer_id === customer.id)
              return (
                <div key={customer.id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{customer.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{customer.phone}</p>
                  </div>
                  <Button
                    size="sm"
                    variant={isAllowed ? 'outline' : 'primary'}
                    disabled={isAllowed || loading} 
                    onClick={() => onAddCustomer(customer)}
                  >
                    {isAllowed ? 'Já adicionado' : 'Adicionar'}
                  </Button>
                </div>
              )
            })}
          </div>
        )}

        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Clientes Permitidos ({allowedCustomers.length})
          </h3>
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg max-h-64 overflow-y-auto">
            {allowedCustomers.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">Nenhum cliente permitido</p>
            ) : (
              allowedCustomers.map(ac => (
                <div key={ac.customer_id} className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 last:border-0">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{ac.customers?.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{ac.customers?.phone}</p>
                  </div>
                  <button
                    onClick={() => onRemoveCustomer(ac.customer_id)}
                    className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 p-1"
                    disabled={loading}
                  >
                    <UserMinus size={18} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button variant="outline" onClick={onClose}>Fechar</Button>
      </div>
    </Modal>
  )
}

export default CouponCustomersModal