import React from 'react'
import DataFilters from '@components/ui/DataFilters'
import StatusFilter from '@components/ui/StatusFilter'
import ViewModeToggle from '@components/ui/ViewModeToggle'

const BudgetFilters = ({ 
  searchTerm, 
  onSearchChange, 
  statusFilter, 
  onStatusChange,
  viewMode,
  onViewModeChange 
}) => (
  <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4 mb-4 sm:mb-6">
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
      <DataFilters value={searchTerm} onChange={onSearchChange} />
      <div className="flex gap-2">
        <StatusFilter value={statusFilter} onChange={onStatusChange} />
        <ViewModeToggle mode={viewMode} onChange={onViewModeChange} />
      </div>
    </div>
  </div>
)

export default BudgetFilters
