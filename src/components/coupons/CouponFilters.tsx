import React from 'react'
import DataFilters from '@components/ui/DataFilters'

const CouponFilters = ({ searchTerm, setSearchTerm, filters, setFilters }) => {
  const filterConfig = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'all', label: 'Todos os status' },
        { value: 'active', label: 'Ativos' },
        { value: 'inactive', label: 'Inativos' }
      ]
    },
    {
      key: 'discount_type',
      label: 'Tipo',
      type: 'select',
      options: [
        { value: 'all', label: 'Todos os tipos' },
        { value: 'percent', label: 'Percentual' },
        { value: 'fixed', label: 'Valor Fixo' }
      ]
    },
    {
      key: 'is_global',
      label: 'Abrangência',
      type: 'select',
      options: [
        { value: 'all', label: 'Todas abrangências' },
        { value: 'global', label: 'Global' },
        { value: 'restricted', label: 'Restrito' }
      ]
    }
  ]

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  return (
    <DataFilters
      searchPlaceholder="Buscar por código ou nome..."
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      filters={filterConfig}
      onFilterChange={handleFilterChange}
      showFilters={true}
    />
  )
}

export default CouponFilters