import React from 'react'
import DataFilters from '../ui/DataFilters'

const DateRangeFilter = ({ 
  activeTab, 
  dateRange, 
  setDateRange, 
  customDateRange, 
  setCustomDateRange,
  paymentMethodFilter,
  setPaymentMethodFilter,
  categoryFilter,
  setCategoryFilter 
}) => {
  return (
    <div className="mb-6">
      <DataFilters
        searchPlaceholder=""
        searchValue=""
        onSearchChange={() => {}}
        showFilters={true}
        filters={[
          {
            key: 'dateRange',
            label: 'Período',
            type: 'select',
            options: [
              { value: 'today', label: 'Hoje' },
              { value: 'week', label: 'Últimos 7 dias' },
              { value: 'month', label: 'Últimos 30 dias' },
              { value: 'year', label: 'Último ano' },
              { value: 'custom', label: 'Personalizado' }
            ]
          },
          ...(activeTab === 'sales' || activeTab === 'operators' ? [{
            key: 'paymentMethod',
            label: 'Forma de Pagamento',
            type: 'select',
            options: [
              { value: '', label: 'Todos' },
              { value: 'cash', label: 'Dinheiro' },
              { value: 'credit', label: 'Crédito' },
              { value: 'debit', label: 'Débito' },
              { value: 'pix', label: 'PIX' }
            ]
          }] : []),
          ...(activeTab === 'stock' ? [{
            key: 'category',
            label: 'Categoria',
            type: 'select',
            options: [
              { value: '', label: 'Todas' },
              { value: 'Alimentos', label: 'Alimentos' },
              { value: 'Bebidas', label: 'Bebidas' },
              { value: 'Limpeza', label: 'Limpeza' }
            ]
          }] : [])
        ]}
        onFilterChange={(filters) => {
          setDateRange(filters.dateRange || 'month')
          setPaymentMethodFilter(filters.paymentMethod || '')
          setCategoryFilter(filters.category || '')
        }}
      />
      
      {dateRange === 'custom' && (
        <div className="mt-3 flex gap-3 items-center">
          <input
            type="date"
            value={customDateRange.start}
            onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
            className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg"
          />
          <span className="text-gray-500 dark:text-gray-400">até</span>
          <input
            type="date"
            value={customDateRange.end}
            onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
            className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg"
          />
        </div>
      )}
    </div>
  )
}

export default DateRangeFilter