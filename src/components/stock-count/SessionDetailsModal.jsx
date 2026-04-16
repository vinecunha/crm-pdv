// src/components/stock-count/SessionDetailsModal.jsx
import React from 'react'
import { X, CheckCircle, AlertTriangle, Clock, Package, DollarSign, Calendar, User, MapPin, FileText, PackageSearch, Eye } from '../../lib/icons'
import Button from '../ui/Button'
import Badge from '../Badge'
import StatCard from '../ui/StatCard'
import DataTable from '../ui/DataTable'
import { formatCurrency, formatDateTime, formatNumber } from '../../utils/formatters'
import DataLoadingSkeleton from '../ui/DataLoadingSkeleton'
import { createAction } from '../../utils/actions'

const SessionDetailsModal = ({ isOpen, onClose, session, items, isLoading, onViewItem }) => {
  if (!isOpen) return null

  const getStatusBadge = (status) => {
    const configs = {
      in_progress: { label: 'Em Andamento', variant: 'warning', icon: Clock },
      completed: { label: 'Finalizado', variant: 'success', icon: CheckCircle },
      cancelled: { label: 'Cancelado', variant: 'danger', icon: X }
    }
    const config = configs[status] || configs.in_progress
    const Icon = config.icon
    return (
      <Badge variant={config.variant}>
        <Icon size={12} className="mr-1" />
        {config.label}
      </Badge>
    )
  }

  const getItemStatusBadge = (status) => {
    const configs = {
      pending: { label: 'Pendente', variant: 'warning' },
      matched: { label: 'Confere', variant: 'success' },
      diverged: { label: 'Divergente', variant: 'danger' }
    }
    const config = configs[status] || configs.pending
    return <Badge variant={config.variant} size="sm">{config.label}</Badge>
  }

  const totalItems = items?.length || 0
  const countedItems = items?.filter(i => i.counted_quantity !== null).length || 0
  const matchedItems = items?.filter(i => i.status === 'matched').length || 0
  const divergedItems = items?.filter(i => i.status === 'diverged').length || 0
  const pendingItems = items?.filter(i => i.status === 'pending' || !i.status).length || 0

  const totalSystemValue = items?.reduce((sum, i) => sum + (i.system_quantity * (i.system_cost || 0)), 0) || 0
  const totalCountedValue = items
    ?.filter(i => i.counted_quantity !== null)
    .reduce((sum, i) => sum + (i.counted_quantity * (i.system_cost || 0)), 0) || 0
  const totalDifference = totalCountedValue - totalSystemValue

  const columns = [
    {
      key: 'product',
      header: 'Produto',
      sortable: true,
      width: '30%',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Package size={16} className="text-gray-400 flex-shrink-0 dark:text-gray-500" />
          <div>
            <p className="font-medium text-gray-900 text-sm dark:text-white">
              {row.product?.name || 'Produto não encontrado'}
            </p>
            {row.product?.code && (
              <p className="text-xs text-gray-500 dark:text-gray-400">{row.product.code}</p>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'system_quantity',
      header: 'Sistema',
      sortable: true,
      width: '120px',
      render: (row) => (
        <span className="font-medium text-sm dark:text-white">{formatNumber(row.system_quantity)}</span>
      )
    },
    {
      key: 'counted_quantity',
      header: 'Contado',
      sortable: true,
      width: '120px',
      render: (row) => (
        <span className="font-medium text-sm dark:text-white">
          {row.counted_quantity !== null ? formatNumber(row.counted_quantity) : '-'}
        </span>
      )
    },
    {
      key: 'difference',
      header: 'Diferença',
      sortable: true,
      width: '120px',
      render: (row) => {
        const difference = row.counted_quantity !== null 
          ? row.counted_quantity - row.system_quantity 
          : null
        
        if (difference === null) return <span className="text-gray-400 dark:text-gray-500">-</span>
        
        return (
          <span className={`font-medium text-sm ${
            difference === 0 
              ? 'text-green-600 dark:text-green-400' 
              : difference > 0 
                ? 'text-blue-600 dark:text-blue-400' 
                : 'text-red-600 dark:text-red-400'
          }`}>
            {difference > 0 ? '+' : ''}{formatNumber(difference)}
          </span>
        )
      }
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      width: '120px',
      render: (row) => getItemStatusBadge(row.status || 'pending')
    },
    {
      key: 'counted_at',
      header: 'Contado em',
      sortable: true,
      width: '160px',
      render: (row) => (
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {row.counted_at ? formatDateTime(row.counted_at) : '-'}
        </span>
      )
    }
  ]

  const actions = onViewItem ? [
    createAction('view', (row) => onViewItem(row), {
      label: 'Ver detalhes',
      className: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/30'
    })
  ] : []

  const hasItems = items && items.length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 dark:bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col dark:bg-gray-800">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center flex-shrink-0 dark:border-gray-700">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Detalhes do Balanço
            </h3>
            {session && (
              <p className="text-sm text-gray-500 mt-0.5 dark:text-gray-400">
                {session.name} • {formatDateTime(session.created_at)}
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">
            <X size={20} />
          </button>
        </div>

        {isLoading ? (
          <div className="p-6 flex-1 overflow-y-auto">
            <DataLoadingSkeleton type="cards" rows={4} />
          </div>
        ) : session ? (
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 border-b border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/50">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-gray-400 dark:text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Data</p>
                    <p className="text-sm font-medium dark:text-white">{formatDateTime(session.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <User size={16} className="text-gray-400 dark:text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Responsável</p>
                    <p className="text-sm font-medium dark:text-white">{session.responsible || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-gray-400 dark:text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Local</p>
                    <p className="text-sm font-medium dark:text-white">{session.location || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-gray-400 dark:text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                    {getStatusBadge(session.status)}
                  </div>
                </div>
              </div>
              
              {session.description && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 mb-1 dark:text-gray-400">Descrição</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{session.description}</p>
                </div>
              )}
            </div>

            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-gray-700 mb-4 dark:text-gray-300">Resumo da Contagem</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <StatCard 
                  label="Total de Itens" 
                  value={formatNumber(totalItems)} 
                  icon={Package} 
                  variant="info" 
                />
                <StatCard 
                  label="Contados" 
                  value={formatNumber(countedItems)} 
                  icon={CheckCircle} 
                  variant="success" 
                />
                <StatCard 
                  label="Conferem" 
                  value={formatNumber(matchedItems)} 
                  icon={CheckCircle} 
                  variant="success" 
                />
                <StatCard 
                  label="Divergentes" 
                  value={formatNumber(divergedItems)} 
                  icon={AlertTriangle} 
                  variant="danger" 
                />
                <StatCard 
                  label="Pendentes" 
                  value={formatNumber(pendingItems)} 
                  icon={Clock} 
                  variant="warning" 
                />
              </div>
            </div>

            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign size={16} className="text-gray-400 dark:text-gray-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Valores (Custo)</span>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Sistema</p>
                    <p className="font-semibold dark:text-white">{formatCurrency(totalSystemValue)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Contado</p>
                    <p className="font-semibold dark:text-white">{formatCurrency(totalCountedValue)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Diferença</p>
                    <p className={`font-semibold ${totalDifference >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {formatCurrency(totalDifference)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-4 dark:text-gray-300">Itens da Contagem</h4>
              
              {!hasItems ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200 dark:bg-gray-900/50 dark:border-gray-700">
                  <PackageSearch size={48} className="text-gray-300 mx-auto mb-3 dark:text-gray-600" />
                  <p className="text-gray-500 font-medium dark:text-gray-400">Nenhum item encontrado</p>
                  <p className="text-sm text-gray-400 mt-1 dark:text-gray-500">
                    Esta sessão ainda não possui itens cadastrados
                  </p>
                </div>
              ) : (
                <DataTable
                  columns={columns}
                  data={items}
                  actions={actions}
                  emptyMessage="Nenhum item encontrado"
                  striped
                  hover
                  showTotalItems
                  showActionsLegend={actions.length > 0}
                />
              )}
            </div>
          </div>
        ) : (
          <div className="p-12 text-center text-gray-500 flex-1 flex items-center justify-center dark:text-gray-400">
            <div>
              <AlertTriangle size={48} className="text-yellow-400 mx-auto mb-3 dark:text-yellow-500" />
              <p className="font-medium">Nenhum dado encontrado</p>
            </div>
          </div>
        )}

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end flex-shrink-0 dark:border-gray-700">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  )
}

export default SessionDetailsModal