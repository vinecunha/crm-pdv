// src/components/ui/DataTable.jsx
import React, { 
  useState, 
  useEffect, 
  useMemo, 
  useCallback,
  useRef,
  memo
} from 'react'
import { 
  ChevronUp, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  Search,
  Filter,
  Download,
  RefreshCw,
  Columns,
  Copy,
  Check,
  X,
  Maximize2,
  Minimize2,
  EyeOff,
  Eye,
  Cake
} from '@lib/icons'

// ===== CONSTANTES (mantidas iguais) =====
const DEFAULT_ACTION_LABELS = {
  'edit': 'Editar', 'delete': 'Excluir', 'view': 'Visualizar', 'details': 'Ver detalhes',
  'campaign': 'Campanha', 'communicate': 'Comunicar', 'manage': 'Gerenciar', 
  'customers': 'Clientes', 'approve': 'Aprovar', 'reject': 'Rejeitar', 
  'activate': 'Ativar', 'deactivate': 'Desativar', 'toggle': 'Alternar', 
  'copy': 'Copiar', 'print': 'Imprimir', 'refresh': 'Atualizar', 'send': 'Enviar',
}

// ===== HOOKS INTERNOS (não quebram API externa) =====

// Hook para debounce (otimiza busca)
const useDebounce = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value)
  
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  
  return debouncedValue
}

// Hook para detectar dispositivo móvel
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  return isMobile
}

// Hook para persistência de preferências
const useTablePreferences = (tableId) => {
  const [preferences, setPreferences] = useState(() => {
    if (!tableId) return {}
    try {
      const saved = localStorage.getItem(`datatable_${tableId}`)
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })
  
  const savePreference = useCallback((key, value) => {
    if (!tableId) return
    const newPrefs = { ...preferences, [key]: value }
    setPreferences(newPrefs)
    try {
      localStorage.setItem(`datatable_${tableId}`, JSON.stringify(newPrefs))
    } catch {}
  }, [tableId, preferences])
  
  return { preferences, savePreference }
}

// ===== SUBCOMPONENTES (mantidos iguais, só internamente melhorados) =====

// ActionsLegend - mantido igual
const ActionsLegend = memo(({ actions }) => {
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
})

ActionsLegend.displayName = 'ActionsLegend'

// QuickSearch - NOVO (opcional, não quebra compatibilidade)
const QuickSearch = memo(({ value, onChange, placeholder = "Buscar...", className = "" }) => {
  const [localValue, setLocalValue] = useState(value)
  const debouncedValue = useDebounce(localValue, 300)
  
  useEffect(() => {
    if (debouncedValue !== value) {
      onChange(debouncedValue)
    }
  }, [debouncedValue, onChange, value])
  
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder}
        className="pl-9 pr-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
      />
      {localValue && (
        <button
          onClick={() => setLocalValue('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
})

QuickSearch.displayName = 'QuickSearch'

// ExportButton - NOVO (opcional)
const ExportButton = memo(({ data, columns, filename = "dados.csv" }) => {
  const [exporting, setExporting] = useState(false)
  
  const exportToCSV = useCallback(() => {
    setExporting(true)
    
    try {
      const headers = columns
        .filter(col => col && !col.hidden)
        .map(col => typeof col.header === 'string' ? col.header : col.key || '')
      
      const rows = data.map(row => 
        columns
          .filter(col => col && !col.hidden)
          .map(col => {
            const value = col.key ? row[col.key] : ''
            if (typeof value === 'string' && value.includes(',')) {
              return `"${value}"`
            }
            return value ?? ''
          })
      )
      
      const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = filename
      link.click()
      URL.revokeObjectURL(link.href)
    } catch (error) {
      console.error('Erro ao exportar:', error)
    } finally {
      setTimeout(() => setExporting(false), 500)
    }
  }, [data, columns, filename])
  
  return (
    <button
      onClick={exportToCSV}
      disabled={exporting || !data?.length}
      className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      title="Exportar para CSV"
    >
      {exporting ? (
        <RefreshCw size={18} className="animate-spin" />
      ) : (
        <Download size={18} />
      )}
    </button>
  )
})

ExportButton.displayName = 'ExportButton'

// ColumnToggle - NOVO (opcional)
const ColumnToggle = memo(({ columns, onToggle, visibleColumns }) => {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        title="Mostrar/ocultar colunas"
      >
        <Columns size={18} />
      </button>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[200px] max-h-[300px] overflow-y-auto">
            {columns.filter(col => col && col.key).map((col, idx) => (
              <label
                key={col.key || idx}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={!visibleColumns[col.key]}
                  onChange={() => onToggle(col.key)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="flex-1">{col.header || col.key}</span>
                {visibleColumns[col.key] ? (
                  <Eye size={14} className="text-gray-400" />
                ) : (
                  <EyeOff size={14} className="text-gray-400" />
                )}
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  )
})

ColumnToggle.displayName = 'ColumnToggle'

// ===== COMPONENTE PRINCIPAL (API 100% compatível) =====

const DataTable = ({ 
  // Props existentes (mantidas)
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
  showTotalItems = true,
  showActionsLegend = true,
  
  // NOVAS props (opcionais, não quebram compatibilidade)
  id,                          // ID para persistir preferências
  searchable = false,          // Habilita busca
  searchPlaceholder,           // Placeholder da busca
  searchFields,                // Campos para buscar
  exportable = false,          // Habilita exportação
  exportFilename,              // Nome do arquivo de exportação
  refreshable = false,         // Habilita refresh
  onRefresh,                   // Callback de refresh
  loading = false,             // Estado de loading
  loadingRows = 5,             // Número de linhas no skeleton
  selectable = false,          // Habilita seleção de linhas
  onSelectionChange,           // Callback de seleção
  selectedRows: externalSelectedRows, // Seleção controlada
  stickyHeader = false,        // Header fixo
  compact = false,             // Modo compacto
  bordered = true,             // Mostrar bordas
  fullWidth = true,            // Largura total
}) => {
  // ===== ESTADO (compatível com versão anterior) =====
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(defaultItemsPerPage)
  
  // ===== NOVOS ESTADOS (não quebram compatibilidade) =====
  const [searchTerm, setSearchTerm] = useState('')
  const [hiddenColumns, setHiddenColumns] = useState({})
  const [selectedRows, setSelectedRows] = useState(new Set())
  const [isFullscreen, setIsFullscreen] = useState(false)
  
  // Hooks
  const isMobile = useIsMobile()
  const { preferences, savePreference } = useTablePreferences(id)
  const tableRef = useRef(null)
  
  // Dados seguros
  const safeData = Array.isArray(data) ? data : []
  
  // ===== PROCESSAMENTO DE DADOS (melhorado com useMemo) =====
  
  // Filtrar dados (busca)
  const filteredData = useMemo(() => {
    if (!searchTerm || !searchable) return safeData
    
    const fields = searchFields || columns
      .filter(col => col && col.key && col.searchable !== false)
      .map(col => col.key)
    
    if (fields.length === 0) return safeData
    
    return safeData.filter(row => {
      return fields.some(field => {
        const value = row[field]
        if (value == null) return false
        return String(value).toLowerCase().includes(searchTerm.toLowerCase())
      })
    })
  }, [safeData, searchTerm, searchable, searchFields, columns])
  
  // Ordenar dados
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData
    
    return [...filteredData].sort((a, b) => {
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
  }, [filteredData, sortConfig])
  
  // Colunas visíveis
  const visibleColumns = useMemo(() => {
    return columns.filter(col => col && !hiddenColumns[col.key] && col.hidden !== true)
  }, [columns, hiddenColumns])
  
  // Paginação
  const totalItems = sortedData?.length || 0
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1
  
  useEffect(() => {
    setCurrentPage(1)
  }, [totalItems, itemsPerPage])
  
  const currentItems = useMemo(() => {
    if (!pagination) return sortedData
    const start = (currentPage - 1) * itemsPerPage
    return sortedData.slice(start, start + itemsPerPage)
  }, [sortedData, currentPage, itemsPerPage, pagination])
  
  // ===== HANDLERS (mantidos compatíveis) =====
  
  const handleSort = useCallback((key) => {
    if (!key) return
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }, [])
  
  const handleItemsPerPageChange = useCallback((e) => {
    const value = Number(e.target.value)
    setItemsPerPage(value)
    setCurrentPage(1)
    savePreference('itemsPerPage', value)
  }, [savePreference])
  
  // ===== NOVOS HANDLERS (não quebram compatibilidade) =====
  
  const handleSearch = useCallback((term) => {
    setSearchTerm(term)
    setCurrentPage(1)
  }, [])
  
  const handleColumnToggle = useCallback((key) => {
    setHiddenColumns(prev => {
      const newState = { ...prev, [key]: !prev[key] }
      savePreference('hiddenColumns', newState)
      return newState
    })
  }, [savePreference])
  
  const handleSelectAll = useCallback((checked) => {
    const newSelected = new Set(checked ? currentItems.map(item => item.id) : [])
    setSelectedRows(newSelected)
    onSelectionChange?.(Array.from(newSelected))
  }, [currentItems, onSelectionChange])
  
  const handleSelectRow = useCallback((id, checked) => {
    setSelectedRows(prev => {
      const newSelected = new Set(prev)
      checked ? newSelected.add(id) : newSelected.delete(id)
      onSelectionChange?.(Array.from(newSelected))
      return newSelected
    })
  }, [onSelectionChange])
  
  const handleRefresh = useCallback(async () => {
    if (onRefresh) {
      await onRefresh()
    }
  }, [onRefresh])
  
  const toggleFullscreen = useCallback(() => {
    if (!tableRef.current) return
    
    if (!document.fullscreenElement) {
      tableRef.current.requestFullscreen?.()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen?.()
      setIsFullscreen(false)
    }
  }, [])
  
  // ===== RENDERIZAÇÃO (melhorada mas compatível) =====
  
  const renderCell = useCallback((row, column, index) => {
    if (!row || !column) return null
    if (column.render) return column.render(row, index) ?? null
    if (column.key) {
      const value = row[column.key]
      if (column.format) return column.format(value, row) ?? null
      return value ?? null
    }
    return null
  }, [])
  
  const getActionLabel = useCallback((action, row) => {
    if (!action) return ''
    if (typeof action.label === 'function') {
      try { return action.label(row) || '' } 
      catch { return '' }
    }
    if (action.label) return action.label
    if (action.id) return DEFAULT_ACTION_LABELS[action.id] || action.id
    return ''
  }, [])
  
  const isActionDisabled = useCallback((action, row) => {
    if (!action) return false
    if (typeof action.disabled === 'function') {
      try { return action.disabled(row) || false } 
      catch { return false }
    }
    return action.disabled || false
  }, [])
  
  const shouldShowAction = useCallback((action, row) => {
    if (!action) return true
    if (typeof action.show === 'function') {
      try { return action.show(row) !== false } 
      catch { return true }
    }
    return action.show !== false
  }, [])
  
  const getValidActions = useCallback((row) => {
    if (!actions || !Array.isArray(actions)) return []
    return actions.filter(action => action && action.onClick && shouldShowAction(action, row))
  }, [actions, shouldShowAction])
  
  const renderActionIcon = useCallback((action) => {
    const Icon = action.icon
    if (!Icon) return null
    if (React.isValidElement(Icon)) {
      return !Icon.props.size ? React.cloneElement(Icon, { size: 16 }) : Icon
    }
    if (typeof Icon === 'string' || typeof Icon === 'number') {
      return <span className="text-base leading-none">{Icon}</span>
    }
    if (typeof Icon === 'function') {
      try { return <Icon size={16} /> } 
      catch { try { return React.createElement(Icon, { size: 16 }) } catch { return null } }
    }
    if (Icon && typeof Icon === 'object' && Icon.$$typeof) {
      try { return React.createElement(Icon, { size: 16 }) } catch { return null }
    }
    return null
  }, [])
  
  const getPageNumbers = useCallback(() => {
    const pages = []
    const maxPagesToShow = isMobile ? 3 : 5
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      let start = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2))
      let end = Math.min(totalPages, start + maxPagesToShow - 1)
      
      if (end - start < maxPagesToShow - 1) {
        start = Math.max(1, end - maxPagesToShow + 1)
      }
      
      if (start > 1) pages.push(1, '...')
      for (let i = start; i <= end; i++) pages.push(i)
      if (end < totalPages) pages.push('...', totalPages)
    }
    
    return pages
  }, [totalPages, currentPage, isMobile])
  
  const hasActions = actions && Array.isArray(actions) && actions.length > 0
  const showHeader = searchable || exportable || refreshable
  
  // ===== RENDER =====
  
  return (
    <div 
      ref={tableRef}
      className={`
        bg-white dark:bg-gray-900 rounded-lg shadow-sm 
        ${bordered ? 'border border-gray-200 dark:border-gray-700' : ''} 
        overflow-hidden 
        ${isFullscreen ? 'fixed inset-0 z-50 m-0 rounded-none overflow-auto' : ''}
        ${className}
      `}
    >
      {/* Header com ferramentas (NOVO - não quebra compatibilidade) */}
      {showHeader && (
        <div className="px-4 sm:px-6 py-3 border-b border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1">
            {searchable && (
              <QuickSearch
                value={searchTerm}
                onChange={handleSearch}
                placeholder={searchPlaceholder}
                className="max-w-xs"
              />
            )}
          </div>
          
          <div className="flex items-center gap-1">
            {exportable && (
              <ExportButton 
                data={filteredData} 
                columns={visibleColumns}
                filename={exportFilename}
              />
            )}
            
            <ColumnToggle
              columns={columns}
              visibleColumns={hiddenColumns}
              onToggle={handleColumnToggle}
            />
            
            {refreshable && (
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                title="Atualizar"
              >
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              </button>
            )}
            
            <button
              onClick={toggleFullscreen}
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
            >
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
          </div>
        </div>
      )}
      
      {/* Actions Legend (mantida igual) */}
      {hasActions && showActionsLegend && (
        <div className="px-4 sm:px-6 pt-4 pb-2 border-b border-gray-100 dark:border-gray-700">
          <ActionsLegend actions={actions} />
        </div>
      )}
      
      {/* Tabela */}
      <div className={`overflow-x-auto ${stickyHeader ? 'max-h-[600px]' : ''}`}>
        <table className={`min-w-full divide-y divide-gray-200 dark:divide-gray-700 ${fullWidth ? 'w-full' : ''}`}>
          <thead className={`bg-gray-50 dark:bg-black/50 ${stickyHeader ? 'sticky top-0 z-10' : ''}`}>
            <tr>
              {/* Checkbox de seleção (NOVO) */}
              {selectable && (
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={currentItems.length > 0 && currentItems.every(item => selectedRows.has(item.id))}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
              )}
              
              {visibleColumns.map((column, idx) => (
                <th 
                  key={column.key || idx} 
                  onClick={() => column.sortable !== false && column.key && handleSort(column.key)}
                  className={`
                    ${compact ? 'px-3 py-2' : 'px-4 sm:px-6 py-3'} 
                    text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider 
                    ${column.sortable !== false && column.key ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none' : ''}
                    ${column.className || ''}
                  `}
                  style={column.width ? { width: column.width } : {}}
                >
                  <div className="flex items-center gap-1">
                    {column.header}
                    {column.sortable !== false && sortConfig.key === column.key && (
                      sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    )}
                  </div>
                </th>
              ))}
              
              {hasActions && (
                <th className={`${compact ? 'px-3 py-2' : 'px-4 sm:px-6 py-3'} text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider`}>
                  Ações
                </th>
              )}
            </tr>
          </thead>
          
          <tbody className={`divide-y divide-gray-200 dark:divide-gray-700 ${hover ? 'hover:divide-gray-300 dark:hover:divide-gray-600' : ''}`}>
            {/* Loading Skeleton (NOVO) */}
            {loading ? (
              Array.from({ length: loadingRows }).map((_, idx) => (
                <tr key={`skeleton-${idx}`}>
                  {selectable && <td className="px-4 py-4"><div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" /></td>}
                  {visibleColumns.map((_, colIdx) => (
                    <td key={colIdx} className={`${compact ? 'px-3 py-3' : 'px-4 sm:px-6 py-4'}`}>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-full max-w-[150px]" />
                    </td>
                  ))}
                  {hasActions && (
                    <td className={`${compact ? 'px-3 py-3' : 'px-4 sm:px-6 py-4'}`}>
                      <div className="flex justify-end gap-2">
                        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      </div>
                    </td>
                  )}
                </tr>
              ))
            ) : currentItems.length === 0 ? (
              <tr>
                <td 
                  colSpan={visibleColumns.length + (hasActions ? 1 : 0) + (selectable ? 1 : 0)} 
                  className={`${compact ? 'px-3 py-8' : 'px-6 py-12'} text-center text-gray-500 dark:text-gray-400`}
                >
                  {searchTerm ? 'Nenhum resultado encontrado para sua busca' : emptyMessage}
                </td>
              </tr>
            ) : (
              currentItems.map((row, rowIndex) => {
                const validActions = getValidActions(row)
                const isSelected = selectedRows.has(row.id)
                
                return (
                  <tr 
                    key={row?.id || rowIndex} 
                    onClick={() => row && onRowClick?.(row, rowIndex)}
                    className={`
                      ${onRowClick ? 'cursor-pointer' : ''} 
                      ${hover ? 'hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors' : ''} 
                      ${striped && rowIndex % 2 === 1 ? 'bg-gray-50 dark:bg-black/50' : ''}
                      ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                    `}
                  >
                    {/* Checkbox de seleção (NOVO) */}
                    {selectable && (
                      <td className={`${compact ? 'px-3 py-3' : 'px-4 py-4'}`} onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleSelectRow(row.id, e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                    )}
                    
                    {visibleColumns.map((column, colIndex) => (
                      <td
                        key={colIndex}
                        className={`
                          ${compact ? 'px-3 py-3' : 'px-4 sm:px-6 py-4'} 
                          whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 
                          ${column.className || ''}
                        `}
                      >
                        {renderCell(row, column, (currentPage - 1) * itemsPerPage + rowIndex)}
                      </td>
                    ))}
                    
                    {hasActions && (
                      <td className={`${compact ? 'px-3 py-3' : 'px-4 sm:px-6 py-4'} whitespace-nowrap text-right text-sm font-medium`}>
                        <div className="flex justify-end gap-1 sm:gap-2">
                          {validActions.map((action, actionIndex) => (
                            <button 
                              key={actionIndex} 
                              onClick={(e) => { 
                                e.stopPropagation()
                                action.onClick(row, (currentPage - 1) * itemsPerPage + rowIndex) 
                              }}
                              className={`
                                p-1.5 rounded-lg transition-colors 
                                ${typeof action.className === 'function' ? action.className(row) : (action.className || 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700')} 
                                ${isActionDisabled(action, row) ? 'opacity-50 cursor-not-allowed' : ''}
                              `}
                              title={getActionLabel(action, row)} 
                              disabled={isActionDisabled(action, row)}
                            >
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
      
      {/* Paginação (melhorada para mobile) */}
      {pagination && totalItems > 0 && (
        <div className={`${compact ? 'px-3 py-2' : 'px-4 sm:px-6 py-3 sm:py-4'} border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-black/50`}>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
            {showTotalItems && (
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems} registros
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hidden sm:inline">
                Itens por página:
              </span>
              <select 
                value={itemsPerPage} 
                onChange={handleItemsPerPageChange} 
                className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md"
              >
                {itemsPerPageOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setCurrentPage(1)} 
                disabled={currentPage === 1} 
                className={`p-1.5 sm:p-2 rounded-md ${currentPage === 1 ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
              >
                <ChevronsLeft size={16} />
              </button>
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} 
                disabled={currentPage === 1} 
                className={`p-1.5 sm:p-2 rounded-md ${currentPage === 1 ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
              >
                <ChevronLeft size={16} />
              </button>
              
              <div className="flex gap-0.5 sm:gap-1 mx-0.5 sm:mx-1">
                {getPageNumbers().map((pageNum, idx) => (
                  pageNum === '...' ? (
                    <span key={`ellipsis-${idx}`} className="px-1 sm:px-2 text-gray-400">...</span>
                  ) : (
                    <button 
                      key={pageNum} 
                      onClick={() => setCurrentPage(pageNum)} 
                      className={`min-w-[28px] sm:min-w-[32px] h-7 sm:h-8 px-1 sm:px-2 rounded-md text-xs sm:text-sm font-medium ${currentPage === pageNum ? 'bg-blue-600 text-white dark:bg-blue-700' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                    >
                      {pageNum}
                    </button>
                  )
                ))}
              </div>
              
              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} 
                disabled={currentPage === totalPages} 
                className={`p-1.5 sm:p-2 rounded-md ${currentPage === totalPages ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
              >
                <ChevronRight size={16} />
              </button>
              <button 
                onClick={() => setCurrentPage(totalPages)} 
                disabled={currentPage === totalPages} 
                className={`p-1.5 sm:p-2 rounded-md ${currentPage === totalPages ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
              >
                <ChevronsRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Indicador de seleção (NOVO) */}
      {selectable && selectedRows.size > 0 && (
        <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-200 dark:border-blue-800 flex items-center justify-between">
          <span className="text-sm text-blue-700 dark:text-blue-300">
            {selectedRows.size} {selectedRows.size === 1 ? 'item selecionado' : 'itens selecionados'}
          </span>
          <button
            onClick={() => {
              setSelectedRows(new Set())
              onSelectionChange?.([])
            }}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Limpar seleção
          </button>
        </div>
      )}
    </div>
  )
}

// Memoize para evitar re-renders desnecessários
export default memo(DataTable)
