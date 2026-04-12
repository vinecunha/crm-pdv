import React from 'react'
import DataCards from '../ui/DataCards'
import DataFilters from '../ui/DataFilters'
import DataEmptyState from '../ui/DataEmptyState'
import StockCountSessionCard from './StockCountSessionCard'
import { Plus } from 'lucide-react'

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
  const filteredSessions = sessions.filter(s => {
    if (searchTerm) {
      return s.name.toLowerCase().includes(searchTerm.toLowerCase())
    }
    if (activeFilters.status) {
      return s.status === activeFilters.status
    }
    return true
  })

  if (sessions.length === 0) {
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
          searchPlaceholder="Buscar balanços..."
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          filters={[
            {
              key: 'status',
              label: 'Status',
              type: 'select',
              options: [
                { value: 'in_progress', label: 'Em Andamento' },
                { value: 'completed', label: 'Concluídos' },
                { value: 'cancelled', label: 'Cancelados' }
              ]
            }
          ]}
          onFilterChange={setActiveFilters}
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