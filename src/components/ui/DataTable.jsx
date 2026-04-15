// src/components/ui/DataTable.jsx
import React, { useState, useEffect } from 'react'
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from '../../lib/icons'

const DataTable = ({ 
  columns,
  data,
  onRowClick,
  actions,
  emptyMessage = "Nenhum dado encontrado",
  className = "",
  striped = true,
  hover = true,
  pagination = true,
  itemsPerPageOptions = [20, 50, 100],
  defaultItemsPerPage = 20,
  showTotalItems = true
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const [sortedData, setSortedData] = useState([])
  
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(defaultItemsPerPage)

  const safeData = Array.isArray(data) ? data : []

  // Resetar página quando os dados mudarem
  useEffect(() => {
    setCurrentPage(1)
  }, [safeData.length, itemsPerPage])

  // Ordenar dados
  useEffect(() => {
    if (!sortConfig.key) {
      setSortedData(safeData)
      return
    }

    const sorted = [...safeData].sort((a, b) => {
      const aValue = a?.[sortConfig.key]
      const bValue = b?.[sortConfig.key]
      
      if (aValue == null && bValue == null) return 0
      if (aValue == null) return 1
      if (bValue == null) return -1
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue)
      }
      
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
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const renderCell = (row, column, index) => {
    if (!row || !column) return null
    
    if (column.render) {
      const rendered = column.render(row, index)
      // Garantir que retorna algo renderizável
      return rendered ?? null
    }
    if (column.key) {
      const value = row[column.key]
      return value ?? null
    }
    return null
  }

  // ✅ Função segura para obter label da ação
  const getActionLabel = (action, row) => {
    if (!action) return ''
    if (typeof action.label === 'function') {
      try {
        return action.label(row) || ''
      } catch {
        return ''
      }
    }
    return action.label || ''
  }

  // ✅ Função segura para verificar se ação está desabilitada
  const isActionDisabled = (action, row) => {
    if (!action) return false
    if (typeof action.disabled === 'function') {
      try {
        return action.disabled(row) || false
      } catch {
        return false
      }
    }
    return action.disabled || false
  }

  // ✅ Função segura para verificar se ação deve ser mostrada
  const shouldShowAction = (action, row) => {
    if (!action) return true
    if (typeof action.show === 'function') {
      try {
        return action.show(row) !== false
      } catch {
        return true
      }
    }
    return true
  }

  // ✅ Filtrar ações válidas
  const getValidActions = (row) => {
    if (!actions || !Array.isArray(actions)) return []
    
    return actions.filter(action => {
      if (!action) return false
      if (!action.onClick) return false
      if (!shouldShowAction(action, row)) return false
      return true
    })
  }

  const goToFirstPage = () => setCurrentPage(1)
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(1, prev - 1))
  const goToNextPage = () => setCurrentPage(prev => Math.min(totalPages, prev + 1))
  const goToLastPage = () => setCurrentPage(totalPages)

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value))
    setCurrentPage(1)
  }

  const getPageNumbers = () => {
    const pages = []
    const maxPagesToShow = 5
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      let start = Math.max(1, currentPage - 2)
      let end = Math.min(totalPages, start + maxPagesToShow - 1)
      
      if (end - start < maxPagesToShow - 1) {
        start = Math.max(1, end - maxPagesToShow + 1)
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
    }
    
    return pages
  }

  const hasActions = actions && Array.isArray(actions) && actions.length > 0

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.filter(col => col != null).map((column, idx) => (
                <th
                  key={idx}
                  onClick={() => column.sortable !== false && column.key && handleSort(column.key)}
                  className={`
                    px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider
                    ${column.sortable !== false && column.key ? 'cursor-pointer hover:bg-gray-100' : ''}
                    ${column.width ? `w-[${column.width}]` : ''}
                  `}
                  style={column.width ? { width: column.width } : {}}
                >
                  <div className="flex items-center gap-1">
                    {column.header}
                    {column.sortable !== false && sortConfig.key === column.key && (
                      sortConfig.direction === 'asc' 
                        ? <ChevronUp size={14} />
                        : <ChevronDown size={14} />
                    )}
                  </div>
                </th>
              ))}
              {hasActions && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              )}
            </tr>
          </thead>
          <tbody className={`divide-y divide-gray-200 ${hover ? 'hover:divide-gray-300' : ''}`}>
            {currentItems.length === 0 ? (
              <tr>
                <td 
                  colSpan={columns.length + (hasActions ? 1 : 0)} 
                  className="px-6 py-12 text-center text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              currentItems.map((row, rowIndex) => {
                const validActions = getValidActions(row)
                
                return (
                  <tr
                    key={row?.id || rowIndex}
                    onClick={() => row && onRowClick?.(row, rowIndex)}
                    className={`
                      ${onRowClick ? 'cursor-pointer' : ''}
                      ${hover ? 'hover:bg-gray-50 transition-colors' : ''}
                      ${striped && rowIndex % 2 === 1 ? 'bg-gray-50' : ''}
                    `}
                  >
                    {columns.filter(col => col != null).map((column, colIndex) => (
                      <td
                        key={colIndex}
                        className={`px-6 py-4 whitespace-nowrap text-sm ${column.className || ''}`}
                      >
                        {renderCell(row, column, indexOfFirstItem + rowIndex)}
                      </td>
                    ))}
                    {hasActions && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          {validActions.map((action, actionIndex) => {
                            const renderActionIcon = () => {
                              const Icon = action.icon
                              if (!Icon) return null
                              
                              try {
                                return React.createElement(Icon, { size: 16 })
                              } catch (error) {
                                // Fallback: tentar como componente
                                try {
                                  const Element = Icon
                                  return <Element size={16} />
                                } catch {
                                  return null
                                }
                              }
                            }
                            
                            return (
                              <button
                                key={actionIndex}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  action.onClick(row, indexOfFirstItem + rowIndex)
                                }}
                                className={`
                                  p-1.5 rounded-lg transition-colors
                                  ${action.className || 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}
                                  ${isActionDisabled(action, row) ? 'opacity-50 cursor-not-allowed' : ''}
                                `}
                                title={getActionLabel(action, row)}
                                disabled={isActionDisabled(action, row)}
                              >
                                {renderActionIcon()}
                              </button>
                            )
                          })}
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
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            {showTotalItems && (
              <div className="text-sm text-gray-600">
                Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, totalItems)} de {totalItems} registros
              </div>
            )}

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Itens por página:</span>
              <select
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
                className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {itemsPerPageOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={goToFirstPage}
                disabled={currentPage === 1}
                className={`p-2 rounded-md transition-colors ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'}`}
                title="Primeira página"
              >
                <ChevronsLeft size={18} />
              </button>
              
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className={`p-2 rounded-md transition-colors ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'}`}
                title="Página anterior"
              >
                <ChevronLeft size={18} />
              </button>

              <div className="flex gap-1 mx-1">
                {getPageNumbers().map(pageNum => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`min-w-[32px] h-8 px-2 rounded-md text-sm font-medium transition-colors ${currentPage === pageNum ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-200'}`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-md transition-colors ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'}`}
                title="Próxima página"
              >
                <ChevronRight size={18} />
              </button>
              
              <button
                onClick={goToLastPage}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-md transition-colors ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'}`}
                title="Última página"
              >
                <ChevronsRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DataTable