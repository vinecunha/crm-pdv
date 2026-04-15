import React, { useState } from 'react'
import { HelpCircle, X } from '../../lib/icons'

// Mapeamento de ações comuns para labels amigáveis
const DEFAULT_LABELS = {
  // Ações padrão
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

const TableActionsLegend = ({ 
  actions = [], 
  position = 'bottom', // 'bottom', 'top', 'inline'
  variant = 'subtle', // 'subtle', 'outline', 'filled'
  size = 'sm', // 'xs', 'sm', 'md'
  maxItems = 8,
  showIcon = true,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

  // Filtrar ações válidas e extrair labels
  const validActions = actions.filter(action => {
    if (!action) return false
    if (typeof action.show === 'function') return true // Não podemos avaliar sem row
    if (action.show === false) return false
    return true
  })

  // Extrair labels das ações
  const actionItems = validActions.map(action => {
    let label = ''
    let icon = action.icon
    
    // Tentar obter label de várias formas
    if (typeof action.label === 'string') {
      label = action.label
    } else if (action.id) {
      label = DEFAULT_LABELS[action.id] || action.id
    } else if (action.name) {
      label = DEFAULT_LABELS[action.name] || action.name
    } else {
      // Tentar extrair do className ou outros atributos
      label = 'Ação'
    }
    
    // Capitalizar primeira letra
    label = label.charAt(0).toUpperCase() + label.slice(1)
    
    return { label, icon, action }
  })

  // Se não houver ações, não renderiza nada
  if (actionItems.length === 0) return null

  const displayItems = isExpanded ? actionItems : actionItems.slice(0, maxItems)
  const hasMore = actionItems.length > maxItems

  // Classes de estilo baseadas no variant
  const variantClasses = {
    subtle: 'bg-gray-50 text-gray-600 border-gray-200',
    outline: 'bg-white text-gray-700 border-gray-300',
    filled: 'bg-gray-100 text-gray-800 border-gray-300'
  }

  const sizeClasses = {
    xs: 'text-[10px] px-2 py-1 gap-1',
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-sm px-3 py-2 gap-2'
  }

  // Renderizar ícone da ação (versão miniatura)
  const renderMiniIcon = (IconComponent) => {
    if (!IconComponent) return null
    
    try {
      if (React.isValidElement(IconComponent)) {
        return React.cloneElement(IconComponent, { size: 12 })
      }
      if (typeof IconComponent === 'function') {
        return <IconComponent size={12} />
      }
      return null
    } catch {
      return null
    }
  }

  return (
    <div className={`relative ${className}`}>
      <div 
        className={`
          flex items-center flex-wrap rounded-lg border
          ${variantClasses[variant]} 
          ${sizeClasses[size]}
          ${position === 'top' ? 'mb-3' : 'mt-3'}
        `}
      >
        {/* Título "Ações:" */}
        <span className="font-medium text-gray-500 mr-1">Ações:</span>
        
        {/* Lista de ações */}
        {displayItems.map((item, index) => (
          <div 
            key={index} 
            className="flex items-center bg-white/50 rounded-full px-2 py-0.5 border border-gray-200 shadow-sm"
            title={item.label}
          >
            {showIcon && item.icon && (
              <span className="mr-1 opacity-60">
                {renderMiniIcon(item.icon)}
              </span>
            )}
            <span className="whitespace-nowrap">{item.label}</span>
          </div>
        ))}
        
        {/* Botão "Ver mais" se houver mais ações */}
        {hasMore && !isExpanded && (
          <button
            onClick={() => setIsExpanded(true)}
            className="ml-1 text-blue-600 hover:text-blue-800 hover:underline text-xs font-medium"
          >
            +{actionItems.length - maxItems} mais
          </button>
        )}
        
        {/* Botão "Ver menos" se expandido */}
        {isExpanded && hasMore && (
          <button
            onClick={() => setIsExpanded(false)}
            className="ml-1 text-gray-500 hover:text-gray-700 hover:underline text-xs"
          >
            Ver menos
          </button>
        )}
      </div>
    </div>
  )
}

// Versão compacta com tooltip (para espaços reduzidos)
export const TableActionsLegendCompact = ({ actions = [], className = '' }) => {
  const [showTooltip, setShowTooltip] = useState(false)
  
  const validActions = actions.filter(action => action && action.show !== false)
  if (validActions.length === 0) return null
  
  return (
    <div className={`relative inline-block ${className}`}>
      <button
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="text-gray-400 hover:text-gray-600 transition-colors"
      >
        <HelpCircle size={14} />
      </button>
      
      {showTooltip && (
        <div className="absolute bottom-full left-0 mb-2 p-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg z-50 min-w-[150px]">
          <div className="font-medium mb-1">Ações disponíveis:</div>
          <div className="space-y-1">
            {validActions.map((action, index) => {
              const label = typeof action.label === 'string' 
                ? action.label 
                : DEFAULT_LABELS[action.id] || 'Ação'
              return (
                <div key={index} className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                  <span className="capitalize">{label}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default TableActionsLegend