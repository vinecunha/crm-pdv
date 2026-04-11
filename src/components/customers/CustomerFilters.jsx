import React from 'react'
import DataFilters from '../ui/DataFilters'

const CustomerFilters = ({ 
  searchTerm, 
  setSearchTerm, 
  onFilterChange 
}) => {
  const filters = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'active', label: 'Ativo' },
        { value: 'inactive', label: 'Inativo' }
      ]
    },
    {
      key: 'city',
      label: 'Cidade',
      type: 'text',
      placeholder: 'Digite a cidade'
    }
  ]

  return (
    <DataFilters
      searchPlaceholder="Buscar por nome, e-mail, telefone ou CPF..."
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      filters={filters}
      onFilterChange={onFilterChange}
    />
  )
}

export default CustomerFilters