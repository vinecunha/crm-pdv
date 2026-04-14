import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { RefreshCw, X, RotateCcw, Database, FileText } from '../lib/icons'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import DataLoadingSkeleton from '../components/ui/DataLoadingSkeleton'
import DataEmptyState from '../components/ui/DataEmptyState'
import DataCards from '../components/ui/DataCards'
import Button from '../components/ui/Button'
import FeedbackMessage from '../components/ui/FeedbackMessage'
import StatCard from '../components/ui/StatCard'

import LogFilters from '../components/logs/LogFilters'
import LogTable from '../components/logs/LogTable'
import LogCard from '../components/logs/LogCard'
import LogDetailsModal from '../components/logs/LogDetailsModal'
import DeletedRecordsTable from '../components/logs/DeletedRecordsTable'
import DeletedRecordCard from '../components/logs/DeletedRecordCard'
import RestoreConfirmModal from '../components/logs/RestoreConfirmModal'

// ============= API Functions =============
const fetchLogs = async ({ queryKey }) => {
  const [, { filters, searchTerm }] = queryKey
  
  let query = supabase.from('system_logs').select('*').order('created_at', { ascending: false }).limit(1000)
  
  if (filters.action) query = query.eq('action', filters.action)
  if (filters.entity_type) query = query.eq('entity_type', filters.entity_type)
  if (filters.user_role) query = query.eq('user_role', filters.user_role)
  if (filters.date_from) query = query.gte('created_at', filters.date_from)
  if (filters.date_to) query = query.lte('created_at', `${filters.date_to} 23:59:59`)

  const { data, error } = await query
  if (error) throw error

  let filteredData = data || []
  if (searchTerm) {
    const searchLower = searchTerm.toLowerCase()
    filteredData = filteredData.filter(log =>
      log.user_email?.toLowerCase().includes(searchLower) ||
      log.action?.toLowerCase().includes(searchLower) ||
      log.entity_type?.toLowerCase().includes(searchLower)
    )
  }
  
  return filteredData
}

const fetchDeletedRecords = async () => {
  const [productsRes, customersRes] = await Promise.all([
    supabase.from('products')
      .select('*, deleter:deleted_by(email, full_name)')
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false }),
    supabase.from('customers')
      .select('*, deleter:deleted_by(email, full_name)')
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false })
  ])

  const products = (productsRes.data || []).map(p => ({ 
    ...p, 
    _type: 'product', 
    _typeLabel: 'Produto' 
  }))
  
  const customers = (customersRes.data || []).map(c => ({ 
    ...c, 
    _type: 'customer', 
    _typeLabel: 'Cliente' 
  }))

  return [...products, ...customers].sort((a, b) => 
    new Date(b.deleted_at) - new Date(a.deleted_at)
  )
}

const restoreRecord = async ({ tableName, recordId }) => {
  const { data, error } = await supabase.rpc('restore_record', {
    p_table_name: tableName,
    p_record_id: recordId
  })
  
  if (error) throw error
  return data
}

// ============= Componente Principal =============
const Logs = () => {
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  
  const [activeTab, setActiveTab] = useState('logs')
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({})
  const [selectedLog, setSelectedLog] = useState(null)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [showRestoreModal, setShowRestoreModal] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [feedback, setFeedback] = useState({ show: false, type: 'success', message: '' })

  const isAdmin = profile?.role === 'admin'
  const isGerente = profile?.role === 'gerente'
  const canView = isAdmin || isGerente
  const canRestore = isAdmin

  // ============= Queries =============
  const { 
    data: logs = [], 
    isLoading: loadingLogs,
    error: logsError,
    refetch: refetchLogs,
    isFetching: isFetchingLogs
  } = useQuery({
    queryKey: ['logs', { filters, searchTerm }],
    queryFn: fetchLogs,
    enabled: canView && activeTab === 'logs',
  })

  const { 
    data: deletedRecords = [], 
    isLoading: loadingDeleted,
    error: deletedError,
    refetch: refetchDeleted,
    isFetching: isFetchingDeleted
  } = useQuery({
    queryKey: ['deleted-records'],
    queryFn: fetchDeletedRecords,
    enabled: canView && activeTab === 'deleted',
  })

  // ============= Mutation =============
  const restoreMutation = useMutation({
    mutationFn: restoreRecord,
    onSuccess: (_, variables) => {
      showFeedback('success', `${variables.recordType} restaurado com sucesso!`)
      queryClient.invalidateQueries({ queryKey: ['deleted-records'] })
      queryClient.invalidateQueries({ queryKey: ['logs'] })
      setShowRestoreModal(false)
      setSelectedRecord(null)
    },
    onError: (error) => {
      showFeedback('error', 'Erro ao restaurar: ' + error.message)
    }
  })

  // ============= Estatísticas Calculadas =============
  const logStats = React.useMemo(() => {
    const today = new Date().toDateString()
    return {
      total: logs.length,
      errors: logs.filter(l => l.action === 'ERROR').length,
      today: logs.filter(l => new Date(l.created_at).toDateString() === today).length,
      uniqueUsers: new Set(logs.map(l => l.user_email).filter(Boolean)).size
    }
  }, [logs])

  const deletedStats = React.useMemo(() => {
    const products = deletedRecords.filter(r => r._type === 'product').length
    const customers = deletedRecords.filter(r => r._type === 'customer').length
    return {
      products,
      customers,
      total: deletedRecords.length
    }
  }, [deletedRecords])

  // ============= Handlers =============
  const showFeedback = (type, message) => {
    setFeedback({ show: true, type, message })
    setTimeout(() => setFeedback({ show: false }), 3000)
  }

  const getActionColor = (action) => {
    const colors = {
      CREATE: 'text-green-600 bg-green-100',
      UPDATE: 'text-blue-600 bg-blue-100',
      DELETE: 'text-red-600 bg-red-100',
      LOGIN_SUCCESS: 'text-purple-600 bg-purple-100',
      LOGIN_FAILED: 'text-red-600 bg-red-100',
      LOGOUT: 'text-orange-600 bg-orange-100',
      VIEW: 'text-gray-600 bg-gray-100',
      ERROR: 'text-red-600 bg-red-100'
    }
    return colors[action] || colors.VIEW
  }

  const getActionLabel = (action) => {
    const labels = {
      CREATE: 'Criação', UPDATE: 'Atualização', DELETE: 'Exclusão',
      LOGIN_SUCCESS: 'Login', LOGIN_FAILED: 'Login Falhou', LOGOUT: 'Logout',
      VIEW: 'Visualização', ERROR: 'Erro'
    }
    return labels[action] || action
  }

  const formatDateCard = (date) => {
    if (!date) return '-'
    const now = new Date()
    const logDate = new Date(date)
    const diffHours = (now - logDate) / (1000 * 60 * 60)
    if (diffHours < 1) return `Há ${Math.floor((now - logDate) / (1000 * 60))} minutos`
    if (diffHours < 24) return `Há ${Math.floor(diffHours)} horas`
    return logDate.toLocaleDateString('pt-BR')
  }

  const exportLogs = async () => {
    setExporting(true)
    try {
      const csvData = logs.map(log => ({
        Data: new Date(log.created_at).toLocaleString('pt-BR'),
        Usuário: log.user_email || 'Sistema',
        Papel: log.user_role || '-',
        Ação: getActionLabel(log.action),
        Entidade: log.entity_type || '-',
        IP: log.ip_address || '-'
      }))
      const headers = Object.keys(csvData[0])
      const csv = [headers.join(','), ...csvData.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))].join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `logs_${new Date().toISOString().slice(0, 19)}.csv`
      link.click()
    } catch (error) {
      console.error('Erro ao exportar:', error)
    } finally {
      setExporting(false)
    }
  }

  const handleRefresh = () => {
    if (activeTab === 'logs') {
      refetchLogs()
    } else {
      refetchDeleted()
    }
  }

  const openRestoreModal = (record) => {
    setSelectedRecord(record)
    setShowRestoreModal(true)
  }

  const handleRestore = () => {
    if (!selectedRecord) return
    
    restoreMutation.mutate({
      tableName: selectedRecord._type === 'product' ? 'products' : 'customers',
      recordId: selectedRecord.id,
      recordType: selectedRecord._typeLabel
    })
  }

  const isLoading = activeTab === 'logs' ? loadingLogs : loadingDeleted
  const isFetching = activeTab === 'logs' ? isFetchingLogs : isFetchingDeleted

  if (!canView) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 rounded-full p-4 inline-block mb-4">
            <X className="h-12 w-12 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-red-600">Acesso Restrito</h2>
          <p className="mt-2 text-gray-600">Apenas administradores e gerentes podem acessar.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {feedback.show && (
          <FeedbackMessage type={feedback.type} message={feedback.message} onClose={() => setFeedback({ show: false })} />
        )}

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Database className="text-blue-600" />
                Auditoria do Sistema
              </h1>
              <p className="text-gray-500 mt-1">
                Logs de atividades e registros excluídos
                {isFetching && (
                  <span className="ml-2 inline-flex items-center text-xs text-gray-400">
                    <RefreshCw size={12} className="animate-spin mr-1" />
                    Atualizando...
                  </span>
                )}
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={handleRefresh} 
                loading={isLoading} 
                icon={RefreshCw}
              >
                Atualizar
              </Button>
              {activeTab === 'logs' && logs.length > 0 && (
                <Button variant="outline" onClick={exportLogs} loading={exporting}>
                  Exportar CSV
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex gap-6">
            <button
              onClick={() => setActiveTab('logs')}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'logs' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileText size={16} />
              Logs do Sistema
            </button>
            <button
              onClick={() => setActiveTab('deleted')}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'deleted' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <RotateCcw size={16} />
              Registros Deletados
              {deletedStats.total > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-red-100 text-red-600 rounded-full text-xs font-bold">
                  {deletedStats.total}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Conteúdo da Aba Logs */}
        {activeTab === 'logs' && (
          <>
            {/* Estatísticas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard label="Total de Logs" value={logStats.total} icon={FileText} variant="info" />
              <StatCard label="Erros" value={logStats.errors} icon={X} variant={logStats.errors > 0 ? 'danger' : 'default'} />
              <StatCard label="Hoje" value={logStats.today} icon={RefreshCw} variant="success" />
              <StatCard label="Usuários Ativos" value={logStats.uniqueUsers} icon={FileText} variant="default" />
            </div>

            <LogFilters 
              searchTerm={searchTerm} 
              setSearchTerm={setSearchTerm} 
              filters={filters} 
              setFilters={setFilters} 
              onExport={exportLogs} 
              exporting={exporting} 
              logsLength={logs.length} 
            />

            {loadingLogs && <DataLoadingSkeleton />}

            {!loadingLogs && logs.length === 0 && (
              <DataEmptyState 
                title="Nenhum log encontrado" 
                description={searchTerm || Object.keys(filters).length > 0 ? "Tente ajustar os filtros" : "O sistema ainda não registrou atividades"} 
                icon="logs" 
              />
            )}

            {!loadingLogs && logs.length > 0 && (
              <>
                <div className="block lg:hidden">
                  <DataCards 
                    data={logs} 
                    renderCard={(log) => (
                      <LogCard 
                        log={log} 
                        onViewDetails={setSelectedLog} 
                        getActionColor={getActionColor} 
                        getActionLabel={getActionLabel} 
                        formatDateCard={formatDateCard} 
                      />
                    )} 
                    keyExtractor={(l) => l.id} 
                    columns={1} 
                    gap={3} 
                  />
                </div>
                <div className="hidden lg:block">
                  <LogTable 
                    logs={logs} 
                    onViewDetails={setSelectedLog} 
                    getActionColor={getActionColor} 
                    getActionLabel={getActionLabel} 
                  />
                </div>
              </>
            )}

            <LogDetailsModal 
              isOpen={!!selectedLog} 
              onClose={() => setSelectedLog(null)} 
              log={selectedLog} 
              getActionLabel={getActionLabel} 
            />
          </>
        )}

        {/* Conteúdo da Aba Deletados */}
        {activeTab === 'deleted' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <StatCard label="Total Deletados" value={deletedStats.total} icon={Database} variant="warning" />
              <StatCard label="Produtos" value={deletedStats.products} icon={FileText} variant="info" />
              <StatCard label="Clientes" value={deletedStats.customers} icon={FileText} variant="purple" />
            </div>

            {loadingDeleted && <DataLoadingSkeleton />}

            {!loadingDeleted && deletedRecords.length === 0 && (
              <DataEmptyState 
                title="Nenhum registro deletado" 
                description="Registros excluídos aparecerão aqui para possível restauração" 
                icon="trash" 
              />
            )}

            {!loadingDeleted && deletedRecords.length > 0 && (
              <>
                <div className="block lg:hidden">
                  <DataCards 
                    data={deletedRecords} 
                    renderCard={(record) => (
                      <DeletedRecordCard 
                        record={record} 
                        onRestore={openRestoreModal} 
                        canRestore={canRestore} 
                      />
                    )} 
                    keyExtractor={(r) => `${r._type}-${r.id}`} 
                    columns={1} 
                    gap={3} 
                  />
                </div>
                <div className="hidden lg:block">
                  <DeletedRecordsTable 
                    records={deletedRecords} 
                    onRestore={openRestoreModal} 
                    canRestore={canRestore} 
                  />
                </div>
              </>
            )}

            <RestoreConfirmModal 
              isOpen={showRestoreModal} 
              onClose={() => setShowRestoreModal(false)} 
              record={selectedRecord} 
              onConfirm={handleRestore} 
              isLoading={restoreMutation.isPending} 
            />
          </>
        )}
      </div>
    </div>
  )
}

export default Logs