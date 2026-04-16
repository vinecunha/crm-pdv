import React, { useRef, useState, useEffect } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from '../../lib/icons'

const VirtualTable = ({
  columns,
  data,
  actions,
  onRowClick,
  emptyMessage = "Nenhum dado encontrado",
  striped = true,
  hover = true,
  rowHeight = 56,
  overscan = 10,
  className = "",
}) => {
  const parentRef = useRef(null)
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const [sortedData, setSortedData] = useState(data)

  // Ordenação
  useEffect(() => {
    if (!sortConfig.key) {
      setSortedData(data)
      return
    }

    const sorted = [...data].sort((a, b) => {
      const aVal = a[sortConfig.key]
      const bVal = b[sortConfig.key]

      if (aVal === null || aVal === undefined) return 1
      if (bVal === null || bVal === undefined) return -1

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal
      }

      const aStr = String(aVal).toLowerCase()
      const bStr = String(bVal).toLowerCase()

      if (sortConfig.direction === 'asc') {
        return aStr.localeCompare(bStr)
      } else {
        return bStr.localeCompare(aStr)
      }
    })

    setSortedData(sorted)
  }, [data, sortConfig])

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  // Virtualização
  const virtualizer = useVirtualizer({
    count: sortedData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: overscan,
  })

  const virtualRows = virtualizer.getVirtualItems()

  // Calcular padding para manter o scroll correto
  const totalSize = virtualizer.getTotalSize()
  const paddingTop = virtualRows.length > 0 ? virtualRows[0]?.start || 0 : 0
  const paddingBottom = virtualRows.length > 0 
    ? totalSize - (virtualRows[virtualRows.length - 1]?.end || 0) 
    : 0

  if (sortedData.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
        <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
      {/* Cabeçalho da Tabela */}
      <div className="bg-gray-50 dark:bg-gray-950/50 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="flex items-center">
          {columns.map((column, index) => {
            const width = column.width || `${100 / columns.length}%`
            return (
              <div
                key={column.key}
                className="px-4 py-3 text-left"
                style={{ width, minWidth: column.minWidth }}
              >
                {column.sortable ? (
                  <button
                    onClick={() => handleSort(column.key)}
                    className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-200"
                  >
                    {column.header}
                    <span className="flex flex-col">
                      <ChevronUp
                        size={12}
                        className={`
                          ${sortConfig.key === column.key && sortConfig.direction === 'asc'
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-gray-400 dark:text-gray-600'
                          }
                        `}
                      />
                      <ChevronDown
                        size={12}
                        className={`
                          -mt-1
                          ${sortConfig.key === column.key && sortConfig.direction === 'desc'
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-gray-400 dark:text-gray-600'
                          }
                        `}
                      />
                    </span>
                  </button>
                ) : (
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {column.header}
                  </span>
                )}
              </div>
            )
          })}
          {actions && actions.length > 0 && (
            <div className="px-4 py-3 text-right" style={{ width: actions.length * 48 + 16 }}>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Ações
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Corpo da Tabela Virtualizado */}
      <div
        ref={parentRef}
        className="overflow-auto"
        style={{ height: '600px', maxHeight: 'calc(100vh - 300px)' }}
      >
        <div style={{ height: `${totalSize}px`, position: 'relative' }}>
          {paddingTop > 0 && <div style={{ height: `${paddingTop}px` }} />}
          
          {virtualRows.map((virtualRow) => {
            const row = sortedData[virtualRow.index]
            const rowIndex = virtualRow.index
            
            return (
              <div
                key={row.id || rowIndex}
                data-index={rowIndex}
                ref={virtualizer.measureElement}
                className={`
                  flex items-center border-b border-gray-100 dark:border-gray-700
                  ${striped && rowIndex % 2 === 0 
                    ? 'bg-gray-50 dark:bg-gray-950/50' 
                    : 'bg-white dark:bg-gray-900'}
                  ${hover ? 'hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors' : ''}
                  ${onRowClick ? 'cursor-pointer' : ''}
                `}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((column) => {
                  const width = column.width || `${100 / columns.length}%`
                  return (
                    <div
                      key={column.key}
                      className="px-4 py-3"
                      style={{ width, minWidth: column.minWidth }}
                    >
                      {column.render ? column.render(row) : row[column.key]}
                    </div>
                  )
                })}
                
                {actions && actions.length > 0 && (
                  <div 
                    className="px-4 py-3 flex justify-end gap-1"
                    style={{ width: actions.length * 48 + 16 }}
                  >
                    {actions.map((action, idx) => {
                      const isDisabled = action.disabled?.(row) || false
                      return (
                        <button
                          key={idx}
                          onClick={(e) => {
                            e.stopPropagation()
                            !isDisabled && action.onClick(row)
                          }}
                          disabled={isDisabled}
                          className={`
                            p-2 rounded-lg transition-colors
                            ${action.className || 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'}
                            ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                          `}
                          title={typeof action.label === 'function' ? action.label(row) : action.label}
                        >
                          {action.icon}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
          
          {paddingBottom > 0 && <div style={{ height: `${paddingBottom}px` }} />}
        </div>
      </div>
    </div>
  )
}

export default VirtualTable