// src/components/ui/DataTable.jsx
import React, { useState, useEffect } from 'react'
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from '../../lib/icons'

const DEFAULT_ACTION_LABELS = {
  'edit': 'Editar', 'delete': 'Excluir', 'view': 'Visualizar', 'details': 'Ver detalhes',
  'campaign': 'Campanha', 'communicate': 'Comunicar', 'manage': 'Gerenciar', 
  'customers': 'Clientes', 'approve': 'Aprovar', 'reject': 'Rejeitar', 
  'activate': 'Ativar', 'deactivate': 'Desativar', 'toggle': 'Alternar', 
  'copy': 'Copiar', 'print': 'Imprimir', 'refresh': 'Atualizar', 'send': 'Enviar',
}

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
    } else if (action.name) {
      label = DEFAULT_ACTION_LABELS[action.name] || action.name
    } else {
      label = action.title || 'Ação'
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
      <span className="font-medium">Ações:</span>
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

const DataTable = ({ 
  columns, data, onRowClick, actions, emptyMessage = "Nenhum dado encontrado",
  className = "", striped = true, hover = true, pagination = true,
  itemsPerPageOptions = [20, 50, 100], defaultItemsPerPage = 20, showTotalItems = true,
  showActionsLegend = true,
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const [sortedData, setSortedData] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(defaultItemsPerPage)

  const safeData = Array.isArray(data) ? data : []

  useEffect(() => { setCurrentPage(1) }, [safeData.length, itemsPerPage])

  useEffect(() => {
    if (!sortConfig.key) { setSortedData(safeData); return }
    const sorted = [...safeData].sort((a, b) => {
      const aValue = a?.[sortConfig.key], bValue = b?.[sortConfig.key]
      if (aValue == null && bValue == null) return 0
      if (aValue == null) return 1
      if (bValue == null) return -1
      if (typeof aValue === 'string' && typeof bValue === 'string')
        return sortConfig.direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
    setSortedData(sorted)
  }, [safeData, sortConfig])

  const totalItems = sortedData?.length || 0
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = sortedData?.slice(indexOfFirstItem, indexOfLastItem) || []

  const handleSort = (key) => {
    if (!key) return
    setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }))
  }

  const renderCell = (row, column, index) => {
    if (!row || !column) return null
    if (column.render) return column.render(row, index) ?? null
    if (column.key) return row[column.key] ?? null
    return null
  }

  const getActionLabel = (action, row) => {
    if (!action) return ''
    if (typeof action.label === 'function') { try { return action.label(row) || '' } catch { return '' } }
    return action.label || ''
  }

  const isActionDisabled = (action, row) => {
    if (!action) return false
    if (typeof action.disabled === 'function') { try { return action.disabled(row) || false } catch { return false } }
    return action.disabled || false
  }

  const shouldShowAction = (action, row) => {
    if (!action) return true
    if (typeof action.show === 'function') { try { return action.show(row) !== false } catch { return true } }
    return true
  }

  const getValidActions = (row) => {
    if (!actions || !Array.isArray(actions)) return []
    return actions.filter(action => action && action.onClick && shouldShowAction(action, row))
  }

  const renderActionIcon = (action) => {
    const Icon = action.icon
    if (!Icon) return null
    if (React.isValidElement(Icon)) return !Icon.props.size ? React.cloneElement(Icon, { size: 16 }) : Icon
    if (typeof Icon === 'string' || typeof Icon === 'number') return <span className="text-base leading-none">{Icon}</span>
    if (typeof Icon === 'function') {
      try { return <Icon size={16} /> } 
      catch { try { return React.createElement(Icon, { size: 16 }) } catch { return null } }
    }
    if (Icon && typeof Icon === 'object' && Icon.$$typeof) {
      try { return React.createElement(Icon, { size: 16 }) } catch { return null }
    }
    return null
  }

  const goToFirstPage = () => setCurrentPage(1)
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(1, prev - 1))
  const goToNextPage = () => setCurrentPage(prev => Math.min(totalPages, prev + 1))
  const goToLastPage = () => setCurrentPage(totalPages)
  const handleItemsPerPageChange = (e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1) }

  const getPageNumbers = () => {
    const pages = [], maxPagesToShow = 5
    if (totalPages <= maxPagesToShow) { for (let i = 1; i <= totalPages; i++) pages.push(i) }
    else {
      let start = Math.max(1, currentPage - 2), end = Math.min(totalPages, start + maxPagesToShow - 1)
      if (end - start < maxPagesToShow - 1) start = Math.max(1, end - maxPagesToShow + 1)
      for (let i = start; i <= end; i++) pages.push(i)
    }
    return pages
  }

  const hasActions = actions && Array.isArray(actions) && actions.length > 0

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
      {hasActions && showActionsLegend && (
        <div className="px-6 pt-4 pb-2 border-b border-gray-100 dark:border-gray-700">
          <ActionsLegend actions={actions} />
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              {columns.filter(col => col != null).map((column, idx) => (
                <th key={idx} onClick={() => column.sortable !== false && column.key && handleSort(column.key)}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider ${column.sortable !== false && column.key ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700' : ''}`}
                  style={column.width ? { width: column.width } : {}}>
                  <div className="flex items-center gap-1">
                    {column.header}
                    {column.sortable !== false && sortConfig.key === column.key && (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                  </div>
                </th>
              ))}
              {hasActions && <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ações</th>}
            </tr>
          </thead>
          <tbody className={`divide-y divide-gray-200 dark:divide-gray-700 ${hover ? 'hover:divide-gray-300 dark:hover:divide-gray-600' : ''}`}>
            {currentItems.length === 0 ? (
              <tr><td colSpan={columns.length + (hasActions ? 1 : 0)} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">{emptyMessage}</td></tr>
            ) : (
              currentItems.map((row, rowIndex) => {
                const validActions = getValidActions(row)
                return (
                  <tr key={row?.id || rowIndex} onClick={() => row && onRowClick?.(row, rowIndex)}
                    className={`${onRowClick ? 'cursor-pointer' : ''} ${hover ? 'hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors' : ''} ${striped && rowIndex % 2 === 1 ? 'bg-gray-50 dark:bg-gray-900/50' : ''}`}>
                    {columns.filter(col => col != null).map((column, colIndex) => (
                      <td key={colIndex} className={`px-6 py-4 whitespace-nowrap text-sm ${column.className || ''}`}>
                        {renderCell(row, column, indexOfFirstItem + rowIndex)}
                      </td>
                    ))}
                    {hasActions && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          {validActions.map((action, actionIndex) => (
                            <button key={actionIndex} onClick={(e) => { e.stopPropagation(); action.onClick(row, indexOfFirstItem + rowIndex) }}
                              className={`p-1.5 rounded-lg transition-colors ${typeof action.className === 'function' ? action.className(row) : (action.className || 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700')} ${isActionDisabled(action, row) ? 'opacity-50 cursor-not-allowed' : ''}`}
                              title={getActionLabel(action, row)} disabled={isActionDisabled(action, row)}>
                              {renderActionIcon(action)}
                            </button>
                          ))}
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {pagination && totalItems > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            {showTotalItems && <div className="text-sm text-gray-600 dark:text-gray-400">Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, totalItems)} de {totalItems} registros</div>}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Itens por página:</span>
              <select value={itemsPerPage} onChange={handleItemsPerPageChange} className="px-2 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md text-sm">
                {itemsPerPageOptions.map(option => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={goToFirstPage} disabled={currentPage === 1} className={`p-2 rounded-md ${currentPage === 1 ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}><ChevronsLeft size={18} /></button>
              <button onClick={goToPreviousPage} disabled={currentPage === 1} className={`p-2 rounded-md ${currentPage === 1 ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}><ChevronLeft size={18} /></button>
              <div className="flex gap-1 mx-1">
                {getPageNumbers().map(pageNum => (
                  <button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={`min-w-[32px] h-8 px-2 rounded-md text-sm font-medium ${currentPage === pageNum ? 'bg-blue-600 text-white dark:bg-blue-700' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>{pageNum}</button>
                ))}
              </div>
              <button onClick={goToNextPage} disabled={currentPage === totalPages} className={`p-2 rounded-md ${currentPage === totalPages ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}><ChevronRight size={18} /></button>
              <button onClick={goToLastPage} disabled={currentPage === totalPages} className={`p-2 rounded-md ${currentPage === totalPages ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}><ChevronsRight size={18} /></button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DataTable