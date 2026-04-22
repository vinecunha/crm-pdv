import React, { useState, useMemo, useCallback } from 'react'
import { 
  User, 
  Phone, 
  Gift, 
  Star, 
  TrendingDown, 
  Calendar, 
  MessageSquare, 
  Edit, 
  Trash2,
  Mail,
  MapPin,
  Award,
  Clock,
  RefreshCw,
  Download,
  Filter,
  Users as UsersIcon,
  Cake,
  Crown,
  AlertCircle
} from '@lib/icons'
import { useTableStrategy } from '@hooks/useTableStrategy'
import Badge from '../Badge'
import { formatCurrency, formatDate } from '@utils/formatters'

// ✅ MAPEAMENTO DE LABELS (mantido)
const DEFAULT_ACTION_LABELS = {
  'communicate': 'Comunicar',
  'campaign': 'Campanha',
  'edit': 'Editar',
  'delete': 'Excluir',
}

// ✅ Componente de Legenda (mantido)
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
    <div className="flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-gray-500 p-2 m-0">
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

const CustomerTable = ({ 
  customers, 
  onEdit, 
  onDelete, 
  onCommunicate, 
  onSendCampaign,
  
  // Novas props opcionais
  onRefresh,
  onExport,
  loading = false,
  enableSearch = true,
  enableExport = true,
  enableRefresh = true,
  enableSelection = false,
  onSelectionChange,
  compact = false,
  showSummary = true,
  showFilters = true
}) => {
  const TableComponent = useTableStrategy(customers, 100)
  const [filterType, setFilterType] = useState('all')
  const [selectedCustomers, setSelectedCustomers] = useState([])
  const safeCustomers = Array.isArray(customers) ? customers : []

  // Labels RFV
  const rfvLabels = {
    'A1': 'VIP / Campeão', 
    'A2': 'Leal', 
    'A3': 'Promissor',
    'B1': 'Potencial',
    'B2': 'Em Atenção', 
    'B3': 'Novo',
    'C1': 'Em Risco', 
    'C2': 'Adormecido',
    'C3': 'Inativo'
  }

  // Filtro de clientes
  const filteredCustomers = useMemo(() => {
    const today = new Date()
    switch(filterType) {
      case 'birthday':
        return safeCustomers.filter(c => {
          if (!c.birth_date) return false
          const birth = new Date(c.birth_date)
          return birth.getMonth() === today.getMonth() && birth.getDate() === today.getDate()
        })
      case 'vip':
        return safeCustomers.filter(c => c.rfv_score === 'A1' || c.rfv_score === 'A2' || c.rfv_score === 'B1')
      case 'inactive':
        return safeCustomers.filter(c => c.rfv_recency > 30 || c.rfv_score?.startsWith('C'))
      case 'no_purchase':
        return safeCustomers.filter(c => !c.last_purchase || c.total_purchases === 0)
      default:
        return safeCustomers
    }
  }, [safeCustomers, filterType])

  // Status badge
  const getStatusBadge = useCallback((status) => {
    return status === 'active' 
      ? <Badge variant="success">Ativo</Badge> 
      : <Badge variant="danger">Inativo</Badge>
  }, [])

  // RFV Badge
  const getRfvBadge = useCallback((score) => {
    if (!score) return <span className="text-gray-400 dark:text-gray-500 text-xs">-</span>
    
    const colors = {
      'A1': 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700', 
      'A2': 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
      'A3': 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800', 
      'B1': 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700',
      'B2': 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800', 
      'B3': 'bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800',
      'C1': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700', 
      'C2': 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-700',
      'C3': 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700'
    }
    
    const colorClass = colors[score] || 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-600'
    const label = rfvLabels[score] || score
    
    return (
      <span 
        title={`${label} (Recência • Frequência • Valor)`} 
        className={`px-2 py-0.5 rounded-full text-xs font-medium border ${colorClass} cursor-help`}
      >
        {score}
      </span>
    )
  }, [])

  // Verificar aniversariante
  const isBirthday = useCallback((customer) => {
    if (!customer?.birth_date) return false
    const today = new Date()
    const birth = new Date(customer.birth_date)
    return birth.getMonth() === today.getMonth() && birth.getDate() === today.getDate()
  }, [])

  // Contagem por filtro
  const getFilterCount = useCallback((type) => {
    const today = new Date()
    switch(type) {
      case 'birthday':
        return safeCustomers.filter(c => {
          if (!c.birth_date) return false
          const birth = new Date(c.birth_date)
          return birth.getMonth() === today.getMonth() && birth.getDate() === today.getDate()
        }).length
      case 'vip': 
        return safeCustomers.filter(c => c.rfv_score === 'A1' || c.rfv_score === 'A2' || c.rfv_score === 'B1').length
      case 'inactive': 
        return safeCustomers.filter(c => c.rfv_recency > 30 || c.rfv_score?.startsWith('C')).length
      case 'no_purchase': 
        return safeCustomers.filter(c => !c.last_purchase || c.total_purchases === 0).length
      default: 
        return safeCustomers.length
    }
  }, [safeCustomers])

  // Estatísticas
  const stats = useMemo(() => {
    if (!safeCustomers.length) return null
    
    const total = safeCustomers.length
    const active = safeCustomers.filter(c => c.status === 'active').length
    const vip = safeCustomers.filter(c => c.rfv_score?.startsWith('A')).length
    const withEmail = safeCustomers.filter(c => c.email).length
    const withPhone = safeCustomers.filter(c => c.phone).length
    const birthdaysThisMonth = safeCustomers.filter(c => {
      if (!c.birth_date) return false
      const today = new Date()
      const birth = new Date(c.birth_date)
      return birth.getMonth() === today.getMonth()
    }).length
    const avgPurchases = safeCustomers.reduce((sum, c) => sum + (c.total_purchases || 0), 0) / total
    
    return {
      total,
      active,
      vip,
      withEmail,
      withPhone,
      birthdaysThisMonth,
      avgPurchases
    }
  }, [safeCustomers])

  // Ações
  const actions = useMemo(() => [
    { 
      id: 'communicate', 
      label: 'Comunicar', 
      icon: MessageSquare,
      onClick: onCommunicate,
      className: 'text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30'
    },
    { 
      id: 'campaign', 
      label: 'Campanha', 
      icon: Gift, 
      onClick: onSendCampaign,
      show: (row) => isBirthday(row) || row?.rfv_score?.startsWith('C'),
      className: 'text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 hover:bg-pink-50 dark:hover:bg-pink-900/30'
    },
    { 
      id: 'edit', 
      label: 'Editar', 
      icon: Edit,
      onClick: onEdit,
      className: 'text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
    },
    { 
      id: 'delete', 
      label: 'Excluir', 
      icon: Trash2,
      onClick: onDelete,
      className: 'text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30'
    }
  ], [onCommunicate, onSendCampaign, onEdit, onDelete, isBirthday])

  // Colunas
  const columns = useMemo(() => [
    { 
      key: 'name', 
      header: 'Cliente', 
      sortable: true, 
      searchable: true,
      minWidth: '220px',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              isBirthday(row) 
                ? 'bg-gradient-to-br from-pink-100 to-pink-200 dark:from-pink-900/30 dark:to-pink-800/30' 
                : 'bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30'
            }`}>
              <User size={18} className={isBirthday(row) ? 'text-pink-600 dark:text-pink-400' : 'text-blue-600 dark:text-blue-400'} />
            </div>
            {isBirthday(row) && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 rounded-full flex items-center justify-center shadow-lg">
                <Gift size={12} className="text-white" />
              </div>
            )}
            {row.rfv_score?.startsWith('A') && !isBirthday(row) && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                <Crown size={10} className="text-white" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="font-medium text-gray-900 dark:text-white truncate">
              {row.name || '-'}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-1">
              <Mail size={10} />
              {row.email || 'Sem email'}
            </div>
            {row.city && (
              <div className="text-xs text-gray-400 dark:text-gray-500 truncate flex items-center gap-1 mt-0.5">
                <MapPin size={10} />
                {row.city}{row.state ? `/${row.state}` : ''}
              </div>
            )}
          </div>
        </div>
      )
    },
    { 
      key: 'rfv_score', 
      header: 'RFV', 
      sortable: true, 
      width: '90px', 
      render: (row) => getRfvBadge(row.rfv_score) 
    },
    { 
      key: 'phone', 
      header: 'Telefone', 
      searchable: true,
      width: '150px', 
      render: (row) => (
        <div className="flex items-center gap-2">
          <Phone size={14} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
          <span className="truncate text-gray-900 dark:text-white">{row.phone || '-'}</span>
        </div>
      ) 
    },
    { 
      key: 'total_purchases', 
      header: 'Total Compras', 
      sortable: true, 
      width: '130px', 
      render: (row) => (
        <div>
          <span className="font-semibold text-green-600 dark:text-green-400">
            {formatCurrency(row.total_purchases || 0)}
          </span>
          {row.purchase_count > 0 && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {row.purchase_count} compra{row.purchase_count > 1 ? 's' : ''}
            </div>
          )}
        </div>
      ) 
    },
    { 
      key: 'last_purchase', 
      header: 'Última Compra', 
      sortable: true, 
      width: '130px',
      render: (row) => {
        if (!row.last_purchase) return <span className="text-gray-400 dark:text-gray-500">-</span>
        const days = Math.floor((new Date() - new Date(row.last_purchase)) / (1000 * 60 * 60 * 24))
        const isInactive = days > 30
        
        return (
          <div>
            <div className="text-gray-900 dark:text-white">{formatDate(row.last_purchase)}</div>
            {isInactive && (
              <div className="text-xs text-orange-500 dark:text-orange-400 flex items-center gap-1">
                <TrendingDown size={10} />
                {days} dias
              </div>
            )}
            {!isInactive && days <= 7 && (
              <div className="text-xs text-green-500 dark:text-green-400 flex items-center gap-1">
                <Clock size={10} />
                Recente
              </div>
            )}
          </div>
        )
      }
    },
    { 
      key: 'status', 
      header: 'Status', 
      sortable: true,
      width: '100px', 
      render: (row) => getStatusBadge(row.status) 
    }
  ], [getRfvBadge, getStatusBadge, isBirthday])

  // Opções de filtro
  const filterOptions = useMemo(() => [
    { value: 'all', label: 'Todos', icon: UsersIcon, count: safeCustomers.length, color: 'blue' },
    { value: 'birthday', label: 'Aniversariantes', icon: Cake, count: getFilterCount('birthday'), color: 'pink' },
    { value: 'vip', label: 'Clientes VIP', icon: Crown, count: getFilterCount('vip'), color: 'yellow' },
    { value: 'inactive', label: 'Inativos', icon: AlertCircle, count: getFilterCount('inactive'), color: 'orange' },
    { value: 'no_purchase', label: 'Sem Compras', icon: Calendar, count: getFilterCount('no_purchase'), color: 'gray' }
  ], [safeCustomers, getFilterCount])

  // Handlers
  const handleSelectionChange = useCallback((selectedIds) => {
    setSelectedCustomers(selectedIds)
    onSelectionChange?.(selectedIds)
  }, [onSelectionChange])

  const handleRefresh = useCallback(async () => {
    if (onRefresh) {
      await onRefresh()
    }
  }, [onRefresh])

  const exportFilename = useMemo(() => {
    const date = new Date().toISOString().split('T')[0]
    return `clientes-${date}.csv`
  }, [])

  // Campos para busca
  const searchFields = useMemo(() => 
    columns
      .filter(col => col.searchable)
      .map(col => col.key)
  , [columns])

  return (
    <div className="space-y-4">
      {/* Cards de estatísticas */}
      {showSummary && stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
            <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 p-3">
            <div className="text-xs text-green-600 dark:text-green-400">Ativos</div>
            <div className="text-xl font-bold text-green-700 dark:text-green-300">{stats.active}</div>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 p-3">
            <div className="text-xs text-yellow-600 dark:text-yellow-400">VIP</div>
            <div className="text-xl font-bold text-yellow-700 dark:text-yellow-300">{stats.vip}</div>
          </div>
          <div className="bg-pink-50 dark:bg-pink-900/20 rounded-lg border border-pink-200 dark:border-pink-800 p-3">
            <div className="text-xs text-pink-600 dark:text-pink-400">Aniversariantes deste mês</div>
            <div className="text-xl font-bold text-pink-700 dark:text-pink-300">{stats.birthdaysThisMonth}</div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-3">
            <div className="text-xs text-blue-600 dark:text-blue-400">Com Email</div>
            <div className="text-xl font-bold text-blue-700 dark:text-blue-300">{stats.withEmail}</div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800 p-3">
            <div className="text-xs text-purple-600 dark:text-purple-400">Com Telefone</div>
            <div className="text-xl font-bold text-purple-700 dark:text-purple-300">{stats.withPhone}</div>
          </div>
          <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800 p-3">
            <div className="text-xs text-indigo-600 dark:text-indigo-400">Média Compras</div>
            <div className="text-xl font-bold text-indigo-700 dark:text-indigo-300">
              {formatCurrency(stats.avgPurchases)}
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      {showFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          {filterOptions.map(option => {
            const Icon = option.icon
            const isActive = filterType === option.value
            const colorClasses = { 
              pink: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 border-pink-300 dark:border-pink-700', 
              yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700', 
              orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700', 
              gray: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600',
              blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700'
            }
            return (
              <button 
                key={option.value} 
                onClick={() => setFilterType(option.value)} 
                className={`
                  flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all border
                  ${isActive 
                    ? (colorClasses[option.color] || 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700') 
                    : 'bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }
                `}
              >
                <Icon size={14} />
                <span>{option.label}</span>
                <span className={`
                  px-1.5 py-0.5 rounded-full text-xs 
                  ${isActive ? 'bg-white/50 dark:bg-black/20' : 'bg-gray-200 dark:bg-gray-700 dark:text-gray-300'}
                `}>
                  {option.count}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* Legenda de ações */}
      <ActionsLegend actions={actions} />

      {/* Tabela principal */}
      <TableComponent
        // Props existentes
        columns={columns} 
        data={filteredCustomers} 
        actions={actions}
        onRowClick={onEdit}
        emptyMessage={filterType !== 'all' ? `Nenhum cliente encontrado neste filtro` : "Nenhum cliente encontrado"}
        striped 
        hover 
        showTotalItems
        
        // Novas funcionalidades
        id="tabela-clientes"
        // searchable={enableSearch}
        // searchPlaceholder="Buscar por nome, email, telefone..."
        // searchFields={searchFields}
        exportable={enableExport}
        exportFilename={exportFilename}
        refreshable={enableRefresh && !!onRefresh}
        onRefresh={handleRefresh}
        loading={loading}
        selectable={enableSelection}
        onSelectionChange={handleSelectionChange}
        compact={compact}
        stickyHeader={true}
        itemsPerPageOptions={[10, 20, 50, 100]}
      />

      {/* Ações em massa */}
      {enableSelection && selectedCustomers.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {selectedCustomers.length} cliente{selectedCustomers.length > 1 ? 's' : ''} selecionado{selectedCustomers.length > 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const selected = safeCustomers.filter(c => selectedCustomers.includes(c.id))
                selected.forEach(c => onCommunicate(c))
              }}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-1"
            >
              <MessageSquare size={14} />
              Comunicar selecionados
            </button>
            <button
              onClick={() => {
                const selected = safeCustomers.filter(c => selectedCustomers.includes(c.id))
                onSendCampaign(selected)
              }}
              className="px-3 py-1.5 text-sm bg-pink-600 text-white rounded-md hover:bg-pink-700 transition-colors flex items-center gap-1"
            >
              <Gift size={14} />
              Campanha
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default CustomerTable