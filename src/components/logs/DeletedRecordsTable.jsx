// src/components/logs/DeletedRecordsTable.jsx
import React from 'react'
import { RotateCcw, Eye } from '@lib/icons'
import { useTableStrategy } from '@hooks/useTableStrategy'
import { formatDateTime } from '@utils/formatters'

// ✅ MAPEAMENTO DE LABELS
const DEFAULT_ACTION_LABELS = {
  'restore': 'Restaurar',
  'view': 'Ver detalhes',
}

// ✅ Componente de Legenda
const ActionsLegend = ({ actions }) => {
  if (!actions || actions.length === 0) return null

  const validActions = actions.filter(action => action && action.show !== false)
  if (validActions.length === 0) return null

  const actionItems = validActions.map(action => {
    let label = ''
    if (typeof action.label === 'string') {
      label = action.label
    } else if (action.id) {
      label = DEFAULT_ACTION_LABELS[action.id] || action.id
    } else {
      label = 'Ação'
    }
    label = label.charAt(0).toUpperCase() + label.slice(1)
    return { label, icon: action.icon }
  }).filter(item => item.label && item.label !== 'Ação')

  if (actionItems.length === 0) return null

  const renderMiniIcon = (IconComponent) => {
    if (!IconComponent) return null
    try {
      if (React.isValidElement(IconComponent)) return React.cloneElement(IconComponent, { size: 11 })
      if (typeof IconComponent === 'function') return <IconComponent size={11} />
      return null
    } catch { return null }
  }

  return (
    <div className="flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-gray-500 mb-2 ml-1">
      <span className="font-medium dark:text-gray-400">Ações:</span>
      {actionItems.map((item, index) => (
        <React.Fragment key={index}>
          <div className="flex items-center gap-0.5 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            {item.icon && renderMiniIcon(item.icon)}
            <span className="whitespace-nowrap">{item.label}</span>
          </div>
          {index < actionItems.length - 1 && <span className="text-gray-300 dark:text-gray-600">•</span>}
        </React.Fragment>
      ))}
    </div>
  )
}

const DeletedRecordsTable = ({ records, onRestore, canRestore, onViewDetails }) => {
  const TableComponent = useTableStrategy(records, 100)

  const columns = [
    {
      key: '_typeLabel',
      header: 'Tipo',
      sortable: true,
      width: '100px',
      render: (row) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          row._type === 'product' 
            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' 
            : 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
        }`}>
          {row._typeLabel}
        </span>
      )
    },
    {
      key: 'name',
      header: 'Nome',
      sortable: true,
      width: '25%',
      render: (row) => <span className="font-medium text-gray-900 dark:text-white">{row.name}</span>
    },
    {
      key: 'deleted_at',
      header: 'Deletado em',
      sortable: true,
      width: '160px',
      render: (row) => <div className="text-sm text-gray-500 dark:text-gray-400">{formatDateTime(row.deleted_at)}</div>
    },
    {
      key: 'deleter',
      header: 'Deletado por',
      width: '180px',
      render: (row) => <div className="text-sm text-gray-600 dark:text-gray-300">{row.deleter?.full_name || row.deleter?.email || 'Sistema'}</div>
    },
    {
      key: 'actions',
      header: '',
      width: '80px',
      render: (row) => (
        <div className="flex items-center gap-2">
          {onViewDetails && (
            <button onClick={(e) => { e.stopPropagation(); onViewDetails(row) }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors" title="Ver detalhes">
              <Eye size={16} className="text-gray-500 dark:text-gray-400" />
            </button>
          )}
          {canRestore && (
            <button onClick={(e) => { e.stopPropagation(); onRestore(row) }} className="p-2 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors" title="Restaurar">
              <RotateCcw size={16} className="text-green-600 dark:text-green-400" />
            </button>
          )}
        </div>
      )
    }
  ]

  // ✅ Ações com id para a legenda
  const actions = [
    { id: 'view', label: 'Ver detalhes', icon: Eye, show: !!onViewDetails },
    { id: 'restore', label: 'Restaurar', icon: RotateCcw, show: canRestore }
  ].filter(a => a.show)

  return (
    <div className="space-y-4">
      {/* ✅ LEGENDA ADICIONADA MANUALMENTE */}
      <ActionsLegend actions={actions} />

      <TableComponent
        columns={columns}
        data={records}
        onRowClick={onViewDetails}
        emptyMessage="Nenhum registro deletado encontrado"
        striped
        hover
        showTotalItems
      />
    </div>
  )
}

export default DeletedRecordsTable