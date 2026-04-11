import React from 'react'
import DataFilters from '../../ui/DataFilters'

const SalesFilters = ({ searchTerm, setSearchTerm, onFilterChange }) => {
  const filterConfig = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'all', label: 'Todos' },
        { value: 'completed', label: 'Concluídas' },
        { value: 'cancelled', label: 'Canceladas' },
        { value: 'pending', label: 'Pendentes' }
      ]
    },
    {
      key: 'payment_method',
      label: 'Forma de Pagamento',
      type: 'select',
      options: [
        { value: 'all', label: 'Todos' },
        { value: 'cash', label: 'Dinheiro' },
        { value: 'credit_card', label: 'Cartão Crédito' },
        { value: 'debit_card', label: 'Cartão Débito' },
        { value: 'pix', label: 'PIX' }
      ]
    },
    {
      key: 'start_date',
      label: 'Data inicial',
      type: 'date'
    },
    {
      key: 'end_date',
      label: 'Data final',
      type: 'date'
    }
  ]

  return (
    <DataFilters
      searchPlaceholder="Buscar por nº venda, cliente ou telefone..."
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      filters={filterConfig}
      onFilterChange={onFilterChange}
      showFilters={true}
    />
  )
}

export default SalesFilters