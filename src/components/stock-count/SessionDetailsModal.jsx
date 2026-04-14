// src/components/stock-count/SessionDetailsModal.jsx
import React from 'react'
import { X, CheckCircle, AlertTriangle, Clock, Package, DollarSign, Calendar, User, MapPin, FileText, PackageSearch } from '../../lib/icons'
import Button from '../ui/Button'
import Badge from '../Badge'
import StatCard from '../ui/StatCard'
import { formatCurrency, formatDateTime, formatNumber } from '../../utils/formatters'
import DataLoadingSkeleton from '../ui/DataLoadingSkeleton'

const SessionDetailsModal = ({ isOpen, onClose, session, items, isLoading }) => {
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

  // Calcular estatísticas
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

  const hasItems = items && items.length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center flex-shrink-0">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Detalhes do Balanço
            </h3>
            {session && (
              <p className="text-sm text-gray-500 mt-0.5">
                {session.name} • {formatDateTime(session.created_at)}
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {isLoading ? (
          <div className="p-6 flex-1 overflow-y-auto">
            <DataLoadingSkeleton type="cards" rows={4} />
          </div>
        ) : session ? (
          <div className="flex-1 overflow-y-auto">
            {/* Informações da Sessão */}
            <div className="p-6 border-b border-gray-100 bg-gray-50">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Data</p>
                    <p className="text-sm font-medium">{formatDateTime(session.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <User size={16} className="text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Responsável</p>
                    <p className="text-sm font-medium">{session.responsible || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Local</p>
                    <p className="text-sm font-medium">{session.location || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Status</p>
                    {getStatusBadge(session.status)}
                  </div>
                </div>
              </div>
              
              {session.description && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Descrição</p>
                  <p className="text-sm text-gray-700">{session.description}</p>
                </div>
              )}
            </div>

            {/* Cards de Resumo - Usando seu StatCard */}
            <div className="p-6 border-b border-gray-100">
              <h4 className="text-sm font-semibold text-gray-700 mb-4">Resumo da Contagem</h4>
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

            {/* Valores */}
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign size={16} className="text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Valores (Custo)</span>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Sistema</p>
                    <p className="font-semibold">{formatCurrency(totalSystemValue)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Contado</p>
                    <p className="font-semibold">{formatCurrency(totalCountedValue)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Diferença</p>
                    <p className={`font-semibold ${totalDifference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(totalDifference)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de Itens */}
            <div className="p-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-4">Itens da Contagem</h4>
              
              {!hasItems ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                  <PackageSearch size={48} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">Nenhum item encontrado</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Esta sessão ainda não possui itens cadastrados
                  </p>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr className="text-xs text-gray-500 uppercase">
                        <th className="px-4 py-3 text-left">Produto</th>
                        <th className="px-4 py-3 text-right">Sistema</th>
                        <th className="px-4 py-3 text-right">Contado</th>
                        <th className="px-4 py-3 text-right">Diferença</th>
                        <th className="px-4 py-3 text-center">Status</th>
                        <th className="px-4 py-3 text-left">Contado em</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {items.map((item) => {
                        const difference = item.counted_quantity !== null 
                          ? item.counted_quantity - item.system_quantity 
                          : null
                        
                        return (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <Package size={16} className="text-gray-400 flex-shrink-0" />
                                <div>
                                  <p className="font-medium text-gray-900 text-sm">
                                    {item.product?.name || 'Produto não encontrado'}
                                  </p>
                                  {item.product?.code && (
                                    <p className="text-xs text-gray-500">{item.product.code}</p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="font-medium text-sm">{formatNumber(item.system_quantity)}</span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="font-medium text-sm">
                                {item.counted_quantity !== null ? formatNumber(item.counted_quantity) : '-'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              {difference !== null ? (
                                <span className={`font-medium text-sm ${difference === 0 ? 'text-green-600' : difference > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                  {difference > 0 ? '+' : ''}{formatNumber(difference)}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {getItemStatusBadge(item.status || 'pending')}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {item.counted_at ? formatDateTime(item.counted_at) : '-'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-12 text-center text-gray-500 flex-1 flex items-center justify-center">
            <div>
              <AlertTriangle size={48} className="text-yellow-400 mx-auto mb-3" />
              <p className="font-medium">Nenhum dado encontrado</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end flex-shrink-0">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  )
}

export default SessionDetailsModal