import React from 'react'
import { RefreshCw } from '../../lib/icons'
import Button from '../ui/Button'

const CashierFilters = ({ 
  dateRange, 
  setDateRange, 
  selectedUser, 
  setSelectedUser, 
  users, 
  onRefresh, 
  loading 
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Data Inicial</label>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Data Final</label>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Operador</label>
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos os operadores</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>{user.full_name || user.email}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex justify-end mt-4">
        <Button onClick={onRefresh} loading={loading} variant="primary">
          <RefreshCw size={16} className="mr-2" />
          Atualizar
        </Button>
      </div>
    </div>
  )
}

export default CashierFilters