import React, { useState, useEffect } from 'react'
import { Search } from '../../lib/icons'

const CouponForm = ({ 
  formData, 
  setFormData, 
  isEditing, 
  customers, 
  selectedCustomers, 
  setSelectedCustomers 
}) => {
  const [customerSearch, setCustomerSearch] = useState('')
  const [filteredCustomers, setFilteredCustomers] = useState([])

  useEffect(() => {
    setFilteredCustomers(customers)
  }, [customers])

  const handleCustomerSearch = (search) => {
    setCustomerSearch(search)
    if (search.trim()) {
      const filtered = customers.filter(c => 
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.phone?.includes(search) ||
        c.email?.toLowerCase().includes(search.toLowerCase())
      )
      setFilteredCustomers(filtered)
    } else {
      setFilteredCustomers(customers)
    }
  }

  const toggleCustomerSelection = (customerId) => {
    setSelectedCustomers(prev => 
      prev.includes(customerId) 
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    )
  }

  return (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Código *</label>
          <input
            type="text"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            placeholder="Ex: PRIMEIRACOMPRA"
            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 uppercase placeholder-gray-400 dark:placeholder-gray-500"
            disabled={isEditing}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Nome *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ex: Desconto Primeira Compra"
            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 placeholder-gray-400 dark:placeholder-gray-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Descrição</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={2}
          placeholder="Descrição do cupom..."
          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 placeholder-gray-400 dark:placeholder-gray-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Tipo de Desconto *</label>
          <select
            value={formData.discount_type}
            onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="percent">Percentual (%)</option>
            <option value="fixed">Valor Fixo (R$)</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Valor do Desconto *</label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.discount_value}
              onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
              placeholder={formData.discount_type === 'percent' ? 'Ex: 10' : 'Ex: 10.00'}
              className="w-full px-3 py-2 pr-8 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 placeholder-gray-400 dark:placeholder-gray-500"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
              {formData.discount_type === 'percent' ? '%' : 'R$'}
            </span>
          </div>
        </div>
      </div>

      {formData.discount_type === 'percent' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Desconto Máximo (opcional)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.max_discount}
            onChange={(e) => setFormData({ ...formData, max_discount: e.target.value })}
            placeholder="Ex: 50.00"
            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 placeholder-gray-400 dark:placeholder-gray-500"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Valor Mínimo da Compra</label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={formData.min_purchase}
          onChange={(e) => setFormData({ ...formData, min_purchase: e.target.value })}
          placeholder="Ex: 100.00"
          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 placeholder-gray-400 dark:placeholder-gray-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Data Inicial</label>
          <input
            type="date"
            value={formData.valid_from}
            onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Data Final</label>
          <input
            type="date"
            value={formData.valid_to}
            onChange={(e) => setFormData({ ...formData, valid_to: e.target.value })}
            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Limite de Uso</label>
          <input
            type="number"
            min="0"
            value={formData.usage_limit}
            onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
            placeholder="Sem limite"
            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 placeholder-gray-400 dark:placeholder-gray-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Abrangência</label>
          <select
            value={formData.is_global ? 'global' : 'restricted'}
            onChange={(e) => setFormData({ 
              ...formData, 
              is_global: e.target.value === 'global'
            })}
            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="global">Global (todos os clientes)</option>
            <option value="restricted">Restrito (clientes específicos)</option>
          </select>
        </div>
      </div>

      {!formData.is_global && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Clientes Permitidos</label>
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
            <div className="mb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={16} />
                <input
                  type="text"
                  placeholder="Buscar clientes..."
                  value={customerSearch}
                  onChange={(e) => handleCustomerSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg text-sm placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {filteredCustomers.map(customer => (
                <label key={customer.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedCustomers.includes(customer.id)}
                    onChange={() => toggleCustomerSelection(customer.id)}
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 dark:text-blue-400 focus:ring-blue-500 dark:bg-gray-800"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{customer.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{customer.phone}</div>
                  </div>
                </label>
              ))}
              {filteredCustomers.length === 0 && (
                <p className="text-center text-gray-500 dark:text-gray-400 text-sm py-4">Nenhum cliente encontrado</p>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {selectedCustomers.length} cliente(s) selecionado(s)
          </p>
        </div>
      )}

      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            className="rounded border-gray-300 dark:border-gray-600 text-blue-600 dark:text-blue-400 focus:ring-blue-500 dark:bg-gray-800"
          />
          <span className="text-sm text-gray-700 dark:text-gray-200">Cupom ativo</span>
        </label>
      </div>
    </div>
  )
}

export default CouponForm