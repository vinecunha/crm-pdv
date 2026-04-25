import React from 'react'
import { Grid, List } from '@lib/icons'

const ViewModeToggle = ({ 
  mode, 
  onChange,
  className = "" 
}) => {
  return (
    <div className={`flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden ${className}`}>
      <button
        onClick={() => onChange('cards')}
        className={`p-2 transition-colors ${
          mode === 'cards'
            ? 'bg-blue-500 text-white'
            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
        }`}
        title="Visualizar em cards"
      >
        <Grid size={18} />
      </button>
      <button
        onClick={() => onChange('table')}
        className={`p-2 transition-colors ${
          mode === 'table'
            ? 'bg-blue-500 text-white'
            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
        }`}
        title="Visualizar em tabela"
      >
        <List size={18} />
      </button>
    </div>
  )
}

export default ViewModeToggle
