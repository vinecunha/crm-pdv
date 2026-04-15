import React, { useState, useMemo } from 'react'
import { User, Phone, Gift, Star, TrendingDown, Calendar, MessageSquare, Edit, Trash2 } from '../../lib/icons'
import { useTableStrategy } from '../../hooks/useTableStrategy'
import Badge from '../Badge'
import { formatCurrency, formatDate } from '../../utils/formatters'

// ✅ MAPEAMENTO DE LABELS (idêntico ao DataTable)
const DEFAULT_ACTION_LABELS = {
  'communicate': 'Comunicar',
  'campaign': 'Campanha',
  'edit': 'Editar',
  'delete': 'Excluir',
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
    <div className="flex items-center gap-1.5 text-[11px] text-gray-400 p-2 m-0">
      <span className="font-medium">Ações:</span>
      {actionItems.map((item, index) => (
        <React.Fragment key={index}>
          <div className="flex items-center gap-0.5 hover:text-gray-600 transition-colors">
            {item.icon && renderMiniIcon(item.icon)}
            <span className="whitespace-nowrap">{item.label}</span>
          </div>
          {index < actionItems.length - 1 && <span className="text-gray-300">•</span>}
        </React.Fragment>
      ))}
    </div>
  )
}

const CustomerTable = ({ customers, onEdit, onDelete, onCommunicate, onSendCampaign }) => {
  const TableComponent = useTableStrategy(customers, 100)
  const [filterType, setFilterType] = useState('all')

  const rfvLabels = {
    'A1': 'VIP / Campeão', 'A2': 'Leal', 'B1': 'Potencial',
    'B2': 'Em Atenção', 'C1': 'Em Risco', 'C3': 'Inativo'
  }

  const getFilteredCustomers = useMemo(() => {
    const today = new Date()
    switch(filterType) {
      case 'birthday':
        return customers.filter(c => {
          if (!c.birth_date) return false
          const birth = new Date(c.birth_date)
          return birth.getMonth() === today.getMonth() && birth.getDate() === today.getDate()
        })
      case 'vip':
        return customers.filter(c => c.rfv_score === 'A1' || c.rfv_score === 'A2' || c.rfv_score === 'B1')
      case 'inactive':
        return customers.filter(c => c.rfv_recency > 30 || c.rfv_score?.startsWith('C'))
      case 'no_purchase':
        return customers.filter(c => !c.last_purchase || c.total_purchases === 0)
      default:
        return customers
    }
  }, [customers, filterType])

  const filteredCustomers = getFilteredCustomers

  const getStatusBadge = (status) => {
    return status === 'active' ? <Badge variant="success">Ativo</Badge> : <Badge variant="danger">Inativo</Badge>
  }

  const getRfvBadge = (score) => {
    if (!score) return <span className="text-gray-400 text-xs">-</span>
    const colors = {
      'A1': 'bg-green-100 text-green-800 border-green-300', 'A2': 'bg-green-50 text-green-700 border-green-200',
      'A3': 'bg-emerald-50 text-emerald-700 border-emerald-200', 'B1': 'bg-blue-100 text-blue-800 border-blue-300',
      'B2': 'bg-blue-50 text-blue-700 border-blue-200', 'B3': 'bg-sky-50 text-sky-700 border-sky-200',
      'C1': 'bg-yellow-100 text-yellow-800 border-yellow-300', 'C2': 'bg-orange-100 text-orange-800 border-orange-300',
      'C3': 'bg-red-100 text-red-800 border-red-300'
    }
    const colorClass = colors[score] || 'bg-gray-100 text-gray-800 border-gray-300'
    const label = rfvLabels[score] || score
    return (
      <span title={`${label} (Recência • Frequência • Valor)`} className={`px-2 py-0.5 rounded-full text-xs font-medium border ${colorClass} cursor-help`}>
        {score}
      </span>
    )
  }

  const getFilterCount = (type) => {
    const today = new Date()
    switch(type) {
      case 'birthday':
        return customers.filter(c => {
          if (!c.birth_date) return false
          const birth = new Date(c.birth_date)
          return birth.getMonth() === today.getMonth() && birth.getDate() === today.getDate()
        }).length
      case 'vip': return customers.filter(c => c.rfv_score === 'A1' || c.rfv_score === 'A2' || c.rfv_score === 'B1').length
      case 'inactive': return customers.filter(c => c.rfv_recency > 30 || c.rfv_score?.startsWith('C')).length
      case 'no_purchase': return customers.filter(c => !c.last_purchase || c.total_purchases === 0).length
      default: return customers.length
    }
  }

  const isBirthday = (customer) => {
    if (!customer.birth_date) return false
    const today = new Date()
    const birth = new Date(customer.birth_date)
    return birth.getMonth() === today.getMonth() && birth.getDate() === today.getDate()
  }

  // ✅ Ações com id e ícones
  const actions = [
    { id: 'communicate', label: 'Comunicar', icon: MessageSquare },
    { id: 'campaign', label: 'Campanha', icon: Gift, show: (row) => isBirthday(row) || row?.rfv_score?.startsWith('C') },
    { id: 'edit', label: 'Editar', icon: Edit },
    { id: 'delete', label: 'Excluir', icon: Trash2 }
  ]

  const columns = [
    { key: 'name', header: 'Cliente', sortable: true, width: '22%', minWidth: '200px',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <User size={16} className="text-blue-600" />
            </div>
            {isBirthday(row) && <div className="absolute -top-1 -right-1 w-4 h-4 bg-pink-500 rounded-full flex items-center justify-center"><Gift size={10} className="text-white" /></div>}
          </div>
          <div className="min-w-0"><div className="font-medium text-gray-900 truncate">{row.name || '-'}</div><div className="text-xs text-gray-500 truncate">{row.email || '-'}</div></div>
        </div>
      )
    },
    { key: 'rfv_score', header: 'RFV', sortable: true, width: '80px', render: (row) => getRfvBadge(row.rfv_score) },
    { key: 'phone', header: 'Telefone', width: '140px', render: (row) => (<div className="flex items-center gap-2"><Phone size={14} className="text-gray-400 flex-shrink-0" /><span className="truncate">{row.phone || '-'}</span></div>) },
    { key: 'total_purchases', header: 'Total Compras', sortable: true, width: '120px', render: (row) => (<span className="font-medium text-green-600">{formatCurrency(row.total_purchases)}</span>) },
    { key: 'last_purchase', header: 'Última Compra', sortable: true, width: '120px',
      render: (row) => {
        if (!row.last_purchase) return <span className="text-gray-400">-</span>
        const days = Math.floor((new Date() - new Date(row.last_purchase)) / (1000 * 60 * 60 * 24))
        return (<div><div>{formatDate(row.last_purchase)}</div>{days > 30 && <div className="text-xs text-orange-500 flex items-center gap-1"><TrendingDown size={10} />{days} dias</div>}</div>)
      }
    },
    { key: 'status', header: 'Status', width: '90px', render: (row) => getStatusBadge(row.status) },
    { key: 'actions', header: 'Ações', width: '120px',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button onClick={(e) => { e.stopPropagation(); onCommunicate(row) }} className="p-2 hover:bg-blue-50 rounded-lg transition-colors group" title="Comunicar"><MessageSquare size={16} className="text-blue-500 group-hover:text-blue-600" /></button>
          {(isBirthday(row) || row.rfv_score?.startsWith('C')) && <button onClick={(e) => { e.stopPropagation(); onSendCampaign(row) }} className="p-2 hover:bg-pink-50 rounded-lg transition-colors group" title={isBirthday(row) ? "Campanha de Aniversário" : "Campanha de Reconquista"}><Gift size={16} className="text-pink-500 group-hover:text-pink-600" /></button>}
          <button onClick={(e) => { e.stopPropagation(); onEdit(row) }} className="p-2 hover:bg-gray-100 rounded-lg transition-colors group" title="Editar"><Edit size={16} className="text-gray-500 group-hover:text-gray-700" /></button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(row) }} className="p-2 hover:bg-red-50 rounded-lg transition-colors group" title="Excluir"><Trash2 size={16} className="text-red-500 group-hover:text-red-600" /></button>
        </div>
      )
    }
  ]

  const filterOptions = [
    { value: 'all', label: 'Todos', icon: User, count: customers.length },
    { value: 'birthday', label: 'Aniversariantes', icon: Gift, count: getFilterCount('birthday'), color: 'pink' },
    { value: 'vip', label: 'Clientes VIP', icon: Star, count: getFilterCount('vip'), color: 'yellow' },
    { value: 'inactive', label: 'Inativos', icon: TrendingDown, count: getFilterCount('inactive'), color: 'orange' },
    { value: 'no_purchase', label: 'Sem Compras', icon: Calendar, count: getFilterCount('no_purchase'), color: 'gray' }
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        {filterOptions.map(option => {
          const Icon = option.icon
          const isActive = filterType === option.value
          const colorClasses = { pink: 'bg-pink-100 text-pink-700 border-pink-300', yellow: 'bg-yellow-100 text-yellow-700 border-yellow-300', orange: 'bg-orange-100 text-orange-700 border-orange-300', gray: 'bg-gray-100 text-gray-700 border-gray-300' }
          return (
            <button key={option.value} onClick={() => setFilterType(option.value)} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${isActive ? (colorClasses[option.color] || 'bg-blue-100 text-blue-700 border-blue-300') : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}>
              <Icon size={14} /><span>{option.label}</span><span className={`px-1.5 py-0.5 rounded-full text-xs ${isActive ? 'bg-white/50' : 'bg-gray-200'}`}>{option.count}</span>
            </button>
          )
        })}
      </div>

      {/* ✅ LEGENDA IDÊNTICA AO DATATABLE */}
      <ActionsLegend actions={actions} />

      <TableComponent
        columns={columns} data={filteredCustomers} onRowClick={onEdit}
        emptyMessage={filterType !== 'all' ? `Nenhum cliente encontrado neste filtro` : "Nenhum cliente encontrado"}
        striped hover showTotalItems totalLabel={`${filteredCustomers.length} cliente(s)`}
      />
    </div>
  )
}

export default CustomerTable