import React, { useState, useEffect } from 'react'
import { Ticket, UserPlus, UserMinus, Search } from 'lucide-react'
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
  onRemoveCustomer 
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
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <Ticket size={20} className="text-blue-600" />
            <div>
              <p className="text-sm font-medium text-blue-900">{coupon.name}</p>
              <p className="text-xs text-blue-600">
                {coupon.discount_type === 'percent' 
                  ? `${coupon.discount_value}% de desconto`
                  : `${formatCurrency(coupon.discount_value)} de desconto`}
              </p>
            </div>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Buscar cliente para adicionar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        {filteredCustomers.length > 0 && (
          <div className="border rounded-lg max-h-48 overflow-y-auto">
            {filteredCustomers.map(customer => {
              const isAllowed = allowedCustomers.some(ac => ac.customer_id === customer.id)
              return (
                <div key={customer.id} className="flex items-center justify-between p-3 hover:bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-900">{customer.name}</p>
                    <p className="text-xs text-gray-500">{customer.phone}</p>
                  </div>
                  <Button
                    size="sm"
                    variant={isAllowed ? 'outline' : 'primary'}
                    disabled={isAllowed}
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
          <h3 className="text-sm font-medium text-gray-900 mb-2">
            Clientes Permitidos ({allowedCustomers.length})
          </h3>
          <div className="border rounded-lg max-h-64 overflow-y-auto">
            {allowedCustomers.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Nenhum cliente permitido</p>
            ) : (
              allowedCustomers.map(ac => (
                <div key={ac.customer_id} className="flex items-center justify-between p-3 border-b last:border-0">
                  <div>
                    <p className="font-medium text-gray-900">{ac.customers?.name}</p>
                    <p className="text-xs text-gray-500">{ac.customers?.phone}</p>
                  </div>
                  <button
                    onClick={() => onRemoveCustomer(ac.customer_id)}
                    className="text-red-600 hover:text-red-800 p-1"
                  >
                    <UserMinus size={18} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-6 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>Fechar</Button>
      </div>
    </Modal>
  )
}

export default CouponCustomersModal