import React from 'react'
import DataCards from '../ui/DataCards'
import DataFilters from '../ui/DataFilters'
import DataEmptyState from '../ui/DataEmptyState'
import StockCountSessionCard from './StockCountSessionCard'
import { Plus } from '../../lib/icons'

const StockCountSessionsView = ({
  sessions,
  searchTerm,
  setSearchTerm,
  activeFilters,
  setActiveFilters,
  onStartCounting,
  onViewDetails,
  onNewSession
}) => {
  const safeSessions = Array.isArray(sessions) ? sessions : []
  
  const filteredSessions = safeSessions.filter(s => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      return s.name?.toLowerCase().includes(search) ||
             s.description?.toLowerCase().includes(search) ||
             s.responsible?.toLowerCase().includes(search)
    }
    
    if (activeFilters.status) {
      return s.status === activeFilters.status
    }
    
    return true
  })

  if (safeSessions.length === 0) {
    return (
      <DataEmptyState
        title="Nenhum balanço realizado"
        description="Inicie seu primeiro balanço de estoque para conferir e ajustar as quantidades."
        icon="clipboard"
        action={{
          label: "Iniciar Balanço",
          icon: <Plus size={18} />,
          onClick: onNewSession
        }}
      />
    )
  }

  return (
    <>
      <div className="mb-6">
        <DataFilters
          searchPlaceholder="Buscar balanços por nome, descrição ou responsável..."
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          filters={[
            {
              key: 'status',
              label: 'Status',
              type: 'select',
              options: [
                { value: '', label: 'Todos' },
                { value: 'in_progress', label: 'Em Andamento' },
                { value: 'completed', label: 'Concluídos' },
                { value: 'cancelled', label: 'Cancelados' }
              ]
            }
          ]}
          onFilterChange={(filters) => setActiveFilters({ status: filters.status })}
          searchDebounceDelay={300}
          className="dark:bg-gray-800 dark:border-gray-700"
          inputClassName="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
          selectClassName="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          labelClassName="dark:text-gray-300"
          buttonClassName="dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:border-gray-600"
        />
      </div>

      <DataCards
        data={filteredSessions}
        renderCard={(session) => (
          <StockCountSessionCard
            session={session}
            onContinue={onStartCounting}
            onViewDetails={onViewDetails}
          />
        )}
        keyExtractor={(item) => item.id}
        columns={3}
        gap={4}
      />
    </>
  )
}

export default StockCountSessionsView