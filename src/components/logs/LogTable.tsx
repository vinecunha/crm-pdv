// src/components/logs/LogTable.jsx
import React from 'react'
import { Eye } from '@lib/icons'
import { useTableStrategy } from '@hooks/utils/useTableStrategy'
import { formatDateTime } from '@utils/formatters'

// ✅ MAPEAMENTO DE LABELS (idêntico ao DataTable)
const DEFAULT_ACTION_LABELS = {
  'view': 'Ver detalhes',
}

// ✅ Componente de Legenda IDÊNTICO ao do DataTable
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

const LogTable = ({ logs, onViewDetails, getActionColor, getActionLabel }) => {
  const TableComponent = useTableStrategy(logs, 100)

  const columns = [
    {
      key: 'created_at',
      header: 'Data/Hora',
      sortable: true,
      width: '160px',
      render: (row) => <div className="text-sm text-gray-500 dark:text-gray-400">{formatDateTime(row.created_at)}</div>
    },
    {
      key: 'user_email',
      header: 'Usuário',
      sortable: true,
      width: '20%',
      minWidth: '180px',
      render: (row) => (
        <div className="min-w-0">
          <div className="font-medium text-gray-900 dark:text-white truncate">{row.user_email || 'Sistema'}</div>
          {row.user_role && <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">{row.user_role}</div>}
        </div>
      )
    },
    {
      key: 'action',
      header: 'Ação',
      sortable: true,
      width: '120px',
      render: (row) => {
        const color = getActionColor(row.action)
        return <span className={`px-2 py-1 text-xs rounded-full ${color}`}>{getActionLabel(row.action)}</span>
      }
    },
    {
      key: 'entity_type',
      header: 'Entidade',
      sortable: true,
      width: '120px',
      render: (row) => <div className="text-sm text-gray-600 dark:text-gray-300 capitalize">{row.entity_type || '-'}</div>
    },
    {
      key: 'ip_address',
      header: 'IP',
      width: '130px',
      render: (row) => <div className="text-xs font-mono text-gray-500 dark:text-gray-400">{row.ip_address || '-'}</div>
    },
    {
      key: 'actions',
      header: '',
      width: '60px',
      render: (row) => (
        <button 
          onClick={(e) => { e.stopPropagation(); onViewDetails(row) }} 
          className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors group" 
          title="Ver detalhes"
        >
          <Eye size={16} className="text-blue-500 dark:text-blue-400 group-hover:text-blue-600 dark:group-hover:text-blue-300" />
        </button>
      )
    }
  ]

  // ✅ Ações com id para a legenda
  const actions = [
    { id: 'view', label: 'Ver detalhes', icon: Eye }
  ]

  return (
    <div className="space-y-4">
      {/* ✅ LEGENDA ADICIONADA MANUALMENTE */}
      <ActionsLegend actions={actions} />

      <TableComponent
        columns={columns}
        data={logs}
        onRowClick={onViewDetails}
        emptyMessage="Nenhum log encontrado"
        striped
        hover
        showTotalItems
      />
    </div>
  )
}

export default LogTable
