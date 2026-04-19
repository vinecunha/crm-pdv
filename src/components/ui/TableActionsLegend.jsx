import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { HelpCircle, X, ChevronDown, ChevronUp } from '../../lib/icons'

const DEFAULT_LABELS = {
  'edit': 'Editar',
  'delete': 'Excluir',
  'view': 'Visualizar',
  'details': 'Ver detalhes',
  'campaign': 'Campanha',
  'communicate': 'Comunicar',
  'manage': 'Gerenciar',
  'customers': 'Clientes',
  'approve': 'Aprovar',
  'reject': 'Rejeitar',
  'activate': 'Ativar',
  'deactivate': 'Desativar',
  'toggle': 'Alternar',
  'copy': 'Copiar',
  'download': 'Download',
  'upload': 'Upload',
  'print': 'Imprimir',
  'refresh': 'Atualizar',
  'filter': 'Filtrar',
  'search': 'Buscar',
  'add': 'Adicionar',
  'remove': 'Remover',
  'save': 'Salvar',
  'cancel': 'Cancelar',
  'confirm': 'Confirmar',
  'send': 'Enviar',
  'reply': 'Responder',
  'forward': 'Encaminhar',
  'archive': 'Arquivar',
  'restore': 'Restaurar',
  'export': 'Exportar',
  'import': 'Importar',
  'sync': 'Sincronizar',
  'settings': 'Configurações',
  'preview': 'Pré-visualizar',
  'duplicate': 'Duplicar',
  'move': 'Mover',
  'assign': 'Atribuir',
  'unassign': 'Desatribuir',
  'lock': 'Bloquear',
  'unlock': 'Desbloquear',
  'pin': 'Fixar',
  'unpin': 'Desafixar',
  'star': 'Favoritar',
  'unstar': 'Desfavoritar',
  'share': 'Compartilhar',
  'link': 'Copiar link',
  'qr': 'QR Code',
  'barcode': 'Código de barras',
  'pay': 'Pagar',
  'refund': 'Reembolsar',
  'invoice': 'Faturar',
  'receipt': 'Recibo',
}

// Hook para detectar clique fora
const useClickOutside = (ref, handler) => {
  useEffect(() => {
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) return
      handler(event)
    }
    
    document.addEventListener('mousedown', listener)
    document.addEventListener('touchstart', listener)
    
    return () => {
      document.removeEventListener('mousedown', listener)
      document.removeEventListener('touchstart', listener)
    }
  }, [ref, handler])
}

// Componente de Badge para ações individuais
const ActionBadge = ({ item, showIcon, size, variant = 'default' }) => {
  const renderMiniIcon = (IconComponent) => {
    if (!IconComponent) return null
    
    try {
      if (React.isValidElement(IconComponent)) {
        return React.cloneElement(IconComponent, { size: size === 'xs' ? 10 : 12 })
      }
      if (typeof IconComponent === 'function') {
        return <IconComponent size={size === 'xs' ? 10 : 12} />
      }
      return null
    } catch {
      return null
    }
  }

  const variantClasses = {
    default: 'bg-white/50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-600',
    solid: 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 shadow-sm',
    outline: 'bg-transparent border-gray-300 dark:border-gray-600'
  }

  return (
    <div 
      className={`
        flex items-center rounded-full px-2 py-0.5 border
        ${variantClasses[variant]}
      `}
      title={item.description || item.label}
    >
      {showIcon && item.icon && (
        <span className="mr-1 opacity-60">
          {renderMiniIcon(item.icon)}
        </span>
      )}
      <span className="whitespace-nowrap">{item.label}</span>
      {item.description && (
        <span className="ml-1 text-gray-400 dark:text-gray-500">ⓘ</span>
      )}
    </div>
  )
}

// Componente de Dropdown para ações agrupadas
const ActionsDropdown = ({ items, showIcon, onClose }) => {
  const dropdownRef = useRef(null)
  const [searchTerm, setSearchTerm] = useState('')
  
  useClickOutside(dropdownRef, onClose)

  const filteredItems = useMemo(() => {
    if (!searchTerm) return items
    return items.filter(item => 
      item.label.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [items, searchTerm])

  return (
    <div 
      ref={dropdownRef}
      className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 min-w-[200px] max-h-[300px] overflow-hidden"
    >
      {items.length > 10 && (
        <div className="p-2 border-b border-gray-200 dark:border-gray-700">
          <input
            type="text"
            placeholder="Buscar ação..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            autoFocus
          />
        </div>
      )}
      
      <div className="max-h-[250px] overflow-y-auto p-1">
        {filteredItems.length === 0 ? (
          <div className="p-3 text-center text-gray-500 dark:text-gray-400 text-sm">
            Nenhuma ação encontrada
          </div>
        ) : (
          <div className="space-y-1">
            {filteredItems.map((item, index) => (
              <div 
                key={index}
                className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                {showIcon && item.icon && (
                  <span className="mr-2 opacity-60">
                    {typeof item.icon === 'function' && <item.icon size={14} />}
                  </span>
                )}
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {item.label}
                </span>
                {item.description && (
                  <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">
                    {item.description}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="p-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
        {filteredItems.length} ação{filteredItems.length !== 1 ? 's' : ''}
      </div>
    </div>
  )
}

// Componente principal
const TableActionsLegend = ({ 
  actions = [], 
  position = 'bottom',
  variant = 'subtle',
  size = 'sm',
  maxItems = 8,
  showIcon = true,
  className = '',
  // Novas props com valores padrão retrocompatíveis
  collapsible = false,
  defaultExpanded = false,
  showCount = true,
  emptyMessage = 'Nenhuma ação disponível',
  onActionClick,
  groupSimilar = false,
  badgeVariant = 'default',
  compact = false,
  title = 'Ações',
  showSearch = true,
  showClearButton = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [showDropdown, setShowDropdown] = useState(false)
  const [clearedActions, setClearedActions] = useState([])
  const containerRef = useRef(null)

  // Filtrar ações válidas (retrocompatível)
  const validActions = useMemo(() => {
    return actions.filter(action => {
      if (!action) return false
      if (typeof action.show === 'function') return true
      if (action.show === false) return false
      return true
    })
  }, [actions])

  // Processar itens de ação (retrocompatível)
  const actionItems = useMemo(() => {
    return validActions
      .filter(action => !clearedActions.includes(action.id || action.name))
      .map(action => {
        let label = ''
        let icon = action.icon
        
        if (typeof action.label === 'string') {
          label = action.label
        } else if (action.id) {
          label = DEFAULT_LABELS[action.id] || action.id
        } else if (action.name) {
          label = DEFAULT_LABELS[action.name] || action.name
        } else {
          label = 'Ação'
        }
        
        label = label.charAt(0).toUpperCase() + label.slice(1)
        
        return { 
          label, 
          icon, 
          action,
          id: action.id || action.name,
          description: action.description,
          onClick: action.onClick
        }
      })
  }, [validActions, clearedActions])

  // Agrupar ações similares (nova funcionalidade)
  const groupedActions = useMemo(() => {
    if (!groupSimilar) return { ungrouped: actionItems }
    
    const groups = {}
    actionItems.forEach(item => {
      const baseAction = item.id?.replace(/[0-9]/g, '') || 'other'
      if (!groups[baseAction]) groups[baseAction] = []
      groups[baseAction].push(item)
    })
    
    return groups
  }, [actionItems, groupSimilar])

  const handleActionClick = useCallback((item) => {
    if (item.onClick) {
      item.onClick(item.action)
    }
    if (onActionClick) {
      onActionClick(item)
    }
  }, [onActionClick])

  const handleClearAction = useCallback((actionId) => {
    setClearedActions(prev => [...prev, actionId])
  }, [])

  const handleClearAll = useCallback(() => {
    setClearedActions(actionItems.map(item => item.id))
  }, [actionItems])

  const handleReset = useCallback(() => {
    setClearedActions([])
    setIsExpanded(defaultExpanded)
  }, [defaultExpanded])

  if (actionItems.length === 0) {
    if (!showCount) return null
    return (
      <div className={`text-gray-400 dark:text-gray-500 text-sm ${className}`}>
        {emptyMessage}
      </div>
    )
  }

  // Modo compacto (nova funcionalidade)
  if (compact) {
    return (
      <div className={`relative inline-block ${className}`} ref={containerRef}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-1 px-2 py-1 text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <span>{title}</span>
          <span className="bg-blue-500 text-white rounded-full px-1.5 py-0.5 text-xs">
            {actionItems.length}
          </span>
          <ChevronDown size={14} className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
        </button>
        
        {showDropdown && (
          <ActionsDropdown 
            items={actionItems} 
            showIcon={showIcon}
            onClose={() => setShowDropdown(false)}
          />
        )}
      </div>
    )
  }

  const displayItems = isExpanded ? actionItems : actionItems.slice(0, maxItems)
  const hasMore = actionItems.length > maxItems && !isExpanded

  const variantClasses = {
    subtle: 'bg-gray-50 dark:bg-black/50 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700',
    outline: 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600',
    filled: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600'
  }

  const sizeClasses = {
    xs: 'text-[10px] px-2 py-1 gap-1',
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-sm px-3 py-2 gap-2'
  }

  return (
    <div className={`relative ${className}`}>
      <div 
        className={`
          flex items-center flex-wrap rounded-lg border
          ${variantClasses[variant]} 
          ${sizeClasses[size]}
          ${position === 'top' ? 'mb-3' : 'mt-3'}
          ${collapsible ? 'cursor-pointer' : ''}
        `}
        onClick={collapsible ? () => setIsExpanded(!isExpanded) : undefined}
      >
        <span className="font-medium text-gray-500 dark:text-gray-400 mr-1">
          {title}:
        </span>
        
        {showCount && (
          <span className="mr-2 text-gray-400 dark:text-gray-500">
            ({actionItems.length})
          </span>
        )}
        
        {Object.entries(groupedActions).map(([group, items]) => (
          <React.Fragment key={group}>
            {group !== 'ungrouped' && items.length > 1 ? (
              <div className="relative group">
                <button className="flex items-center bg-blue-50 dark:bg-blue-900/30 rounded-full px-2 py-0.5 border border-blue-200 dark:border-blue-700">
                  <span>{items[0].label.split(' ')[0]}</span>
                  <span className="ml-1 text-xs bg-blue-200 dark:bg-blue-800 px-1 rounded">
                    {items.length}
                  </span>
                </button>
                
                <div className="absolute hidden group-hover:block top-full left-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 p-2 min-w-[150px]">
                  {items.map((item, idx) => (
                    <div key={idx} className="text-sm py-1">
                      {item.label}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              items.map((item, index) => (
                <ActionBadge 
                  key={index}
                  item={item}
                  showIcon={showIcon}
                  size={size}
                  variant={badgeVariant}
                />
              ))
            )}
          </React.Fragment>
        ))}
        
        {hasMore && !collapsible && (
          <button
            onClick={() => setIsExpanded(true)}
            className="ml-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline text-xs font-medium"
          >
            +{actionItems.length - maxItems} mais
          </button>
        )}
        
        {isExpanded && hasMore && !collapsible && (
          <button
            onClick={() => setIsExpanded(false)}
            className="ml-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:underline text-xs"
          >
            Ver menos
          </button>
        )}

        {collapsible && (
          <span className="ml-auto">
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </span>
        )}

        {showClearButton && clearedActions.length > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleReset()
            }}
            className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            title="Restaurar todas as ações"
          >
            <X size={12} />
          </button>
        )}
      </div>
    </div>
  )
}

// Versão compacta melhorada (retrocompatível)
export const TableActionsLegendCompact = ({ 
  actions = [], 
  className = '',
  position = 'bottom',
  showCount = true,
  maxItems = 5
}) => {
  const [showTooltip, setShowTooltip] = useState(false)
  const tooltipRef = useRef(null)
  
  useClickOutside(tooltipRef, () => setShowTooltip(false))
  
  const validActions = useMemo(() => {
    return actions.filter(action => action && action.show !== false)
  }, [actions])
  
  if (validActions.length === 0) return null
  
  const displayActions = validActions.slice(0, maxItems)
  const remainingCount = validActions.length - maxItems
  
  return (
    <div className={`relative inline-block ${className}`}>
      <button
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip(!showTooltip)}
        className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        aria-label="Ver ações disponíveis"
      >
        <HelpCircle size={14} />
        {showCount && (
          <span className="ml-1 text-xs bg-gray-200 dark:bg-gray-700 px-1 rounded">
            {validActions.length}
          </span>
        )}
      </button>
      
      {showTooltip && (
        <div 
          ref={tooltipRef}
          className={`
            absolute z-50 p-3 bg-gray-800 dark:bg-black text-white text-xs rounded-lg shadow-lg min-w-[180px]
            ${position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'}
            left-0
          `}
        >
          <div className="font-medium mb-2 text-gray-300">Ações disponíveis:</div>
          <div className="space-y-1.5">
            {displayActions.map((action, index) => {
              const label = typeof action.label === 'string' 
                ? action.label 
                : DEFAULT_LABELS[action.id] || DEFAULT_LABELS[action.name] || 'Ação'
              
              return (
                <div key={index} className="flex items-center gap-2">
                  {action.icon && (
                    <span className="opacity-70">
                      {typeof action.icon === 'function' && <action.icon size={12} />}
                    </span>
                  )}
                  <span className="capitalize">{label}</span>
                  {action.description && (
                    <span className="ml-auto text-gray-400 text-[10px]">
                      {action.description}
                    </span>
                  )}
                </div>
              )
            })}
            {remainingCount > 0 && (
              <div className="text-gray-400 text-xs pt-1 border-t border-gray-700 mt-1">
                +{remainingCount} outra{remainingCount !== 1 ? 's' : ''} ação{remainingCount !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default TableActionsLegend