import React from 'react'
import DataFilters from '@components/ui/DataFilters'

const UserFilters = ({ searchTerm, setSearchTerm, filters, setFilters }) => {
  const filterConfig = [
    {
      key: 'role',
      label: 'Papel',
      type: 'select',
      options: [
        { value: '', label: 'Todos os papéis' },
        { value: 'admin', label: 'Administrador' },
        { value: 'gerente', label: 'Gerente' },
        { value: 'operador', label: 'Operador' }
      ]
    }
  ]

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  return (
    <DataFilters
      searchPlaceholder="Buscar usuários por nome ou email..."
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      filters={filterConfig}
      onFilterChange={handleFilterChange}
      showFilters={true}
    />
  )
}

export default UserFilters