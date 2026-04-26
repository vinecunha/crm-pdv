// src/pages/Logs.jsx
import React, { useState, useMemo } from 'react'
import { RefreshCw, X, RotateCcw, Database, FileText } from '@lib/icons'
import { useAuth } from '@contexts/AuthContext'
import { useUI } from '@contexts/UIContext'

import DataLoadingSkeleton from '@components/ui/DataLoadingSkeleton'
import DataEmptyState from '@components/ui/DataEmptyState'
import DataCards from '@components/ui/DataCards'
import Button from '@components/ui/Button'
import StatCard from '@components/ui/StatCard'
import PageHeader from '@components/ui/PageHeader'

import LogFilters from '@components/logs/LogFilters'
import LogTable from '@components/logs/LogTable'
import LogCard from '@components/logs/LogCard'
import DeletedRecordsTable from '@components/logs/DeletedRecordsTable'
import DeletedRecordCard from '@components/logs/DeletedRecordCard'
import LogsModalsContainer from '@components/logs/LogsModalsContainer'

// ✅ Hooks centralizados
import { useLogsHandlers } from '@hooks/handlers'
import { useLogsQueries } from '@hooks/queries/useLogsQueries'
import { useLogsMutations } from '@hooks/mutations/useLogsMutations'

const Logs = () => {
  const { profile } = useAuth()
  
  const [activeTab, setActiveTab] = useState('logs')
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({})
  const [selectedLog, setSelectedLog] = useState(null)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [showRestoreModal, setShowRestoreModal] = useState(false)
  const [exporting, setExporting] = useState(false)

  const isAdmin = profile?.role === 'admin'
  const isGerente = profile?.role === 'gerente'
  const canView = isAdmin || isGerente
  const canRestore = isAdmin

  // ✅ Queries centralizadas
  const {
    logs,
    loadingLogs,
    refetchLogs,
    isFetchingLogs,
    deletedRecords,
    loadingDeleted,
    refetchDeleted,
    isFetchingDeleted
  } = useLogsQueries({ filters, searchTerm, activeTab, canView })

  // ✅ Mutations com callbacks
  const { restoreMutation } = useLogsMutations({
    onRecordRestored: () => {
      showFeedback('success', 'Registro restaurado com sucesso!')
      setShowRestoreModal(false)
      setSelectedRecord(null)
    },
    onError: (error) => {
      showFeedback('error', 'Erro ao restaurar: ' + error.message)
    }
  })

  const { showFeedback } = useUI()

  const handlers = useLogsHandlers({
    logs,
    deletedRecords,
    activeTab,
    setActiveTab,
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    selectedLog,
    setSelectedLog,
    selectedRecord,
    setSelectedRecord,
    showRestoreModal,
    setShowRestoreModal,
    exporting,
    setExporting,
    restoreMutation,
    refetchLogs,
    refetchDeleted,
    showFeedback
  })

  const logStats = useMemo(() => {
    const today = new Date().toDateString()
    return {
      total: logs.length,
      errors: logs.filter(l => l.action === 'ERROR').length,
      today: logs.filter(l => new Date(l.created_at).toDateString() === today).length,
      uniqueUsers: new Set(logs.map(l => l.user_email).filter(Boolean)).size
    }
  }, [logs])

  const deletedStats = useMemo(() => {
    const products = deletedRecords.filter(r => r._type === 'product').length
    const customers = deletedRecords.filter(r => r._type === 'customer').length
    return { products, customers, total: deletedRecords.length }
  }, [deletedRecords])

  const isLoading = activeTab === 'logs' ? loadingLogs : loadingDeleted
  const isFetching = activeTab === 'logs' ? isFetchingLogs : isFetchingDeleted

  const headerActions = [
    { label: 'Atualizar', icon: RefreshCw, onClick: handlers.handleRefresh, loading: isLoading, variant: 'outline' },
    ...(activeTab === 'logs' && logs.length > 0 ? [{ label: 'Exportar CSV', icon: FileText, onClick: handlers.handleExportLogs, loading: exporting, variant: 'outline' }] : [])
  ]

  if (!canView) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center px-4">
        <div className="text-center">
          <div className="bg-red-100 dark:bg-red-900/30 rounded-full p-4 inline-block mb-4">
            <X className="h-12 w-12 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400">Acesso Restrito</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Apenas administradores e gerentes podem acessar.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <PageHeader
          title="Auditoria do Sistema"
          description={
            <>
              Logs de atividades e registros excluídos
              {isFetching && (
                <span className="ml-2 inline-flex items-center text-xs text-gray-400 dark:text-gray-500">
                  <RefreshCw size={12} className="animate-spin mr-1" />
                  <span className="hidden sm:inline">Atualizando...</span>
                </span>
              )}
            </>
          }
          icon={Database}
          actions={headerActions}
        />

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-4 sm:mb-6">
          <nav className="flex gap-4 sm:gap-6 overflow-x-auto">
            <button onClick={() => handlers.handleTabChange('logs')} className={`pb-2 sm:pb-3 text-xs sm:text-sm font-medium border-b-2 transition-colors flex items-center gap-1 sm:gap-2 whitespace-nowrap ${activeTab === 'logs' ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
              <FileText size={14} /> Logs do Sistema
            </button>
            <button onClick={() => handlers.handleTabChange('deleted')} className={`pb-2 sm:pb-3 text-xs sm:text-sm font-medium border-b-2 transition-colors flex items-center gap-1 sm:gap-2 whitespace-nowrap ${activeTab === 'deleted' ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
              <RotateCcw size={14} /> Registros Deletados
              {deletedStats.total > 0 && <span className="ml-1 px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full text-[10px] sm:text-xs font-bold">{deletedStats.total}</span>}
            </button>
          </nav>
        </div>
        
        {activeTab === 'logs' && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
              <StatCard label="Total de Logs" value={logStats.total} icon={FileText} variant="info" />
              <StatCard label="Erros" value={logStats.errors} icon={X} variant={logStats.errors > 0 ? 'danger' : 'default'} />
              <StatCard label="Hoje" value={logStats.today} icon={RefreshCw} variant="success" />
              <StatCard label="Usuários Ativos" value={logStats.uniqueUsers} icon={FileText} variant="default" />
            </div>

            <LogFilters searchTerm={searchTerm} setSearchTerm={handlers.setSearchTerm} filters={filters} setFilters={handlers.setFilters} onExport={handlers.handleExportLogs} exporting={exporting} logsLength={logs.length} />

            {loadingLogs && <DataLoadingSkeleton />}
            {!loadingLogs && logs.length === 0 && <DataEmptyState title="Nenhum log encontrado" description={searchTerm || Object.keys(filters).length > 0 ? "Tente ajustar os filtros" : "O sistema ainda não registrou atividades"} icon="logs" />}

            {!loadingLogs && logs.length > 0 && (
              <>
                <div className="block lg:hidden">
                  <DataCards data={logs} renderCard={(log) => <LogCard log={log} onViewDetails={handlers.openLogDetails} getActionColor={handlers.getActionColor} getActionLabel={handlers.getActionLabel} formatDateCard={handlers.formatDateCard} />} keyExtractor={(l) => l.id} columns={1} gap={2} />
                </div>
                <div className="hidden lg:block">
                  <LogTable logs={logs} onViewDetails={handlers.openLogDetails} getActionColor={handlers.getActionColor} getActionLabel={handlers.getActionLabel} />
                </div>
              </>
            )}
          </>
        )}

        {activeTab === 'deleted' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
              <StatCard label="Total Deletados" value={deletedStats.total} icon={Database} variant="warning" />
              <StatCard label="Produtos" value={deletedStats.products} icon={FileText} variant="info" />
              <StatCard label="Clientes" value={deletedStats.customers} icon={FileText} variant="purple" />
            </div>

            {loadingDeleted && <DataLoadingSkeleton />}
            {!loadingDeleted && deletedRecords.length === 0 && <DataEmptyState title="Nenhum registro deletado" description="Registros excluídos aparecerão aqui para possível restauração" icon="trash" />}

            {!loadingDeleted && deletedRecords.length > 0 && (
              <>
                <div className="block lg:hidden">
                  <DataCards data={deletedRecords} renderCard={(record) => <DeletedRecordCard record={record} onRestore={handlers.openRestoreModal} canRestore={canRestore} />} keyExtractor={(r) => `${r._type}-${r.id}`} columns={1} gap={2} />
                </div>
                <div className="hidden lg:block">
                  <DeletedRecordsTable records={deletedRecords} onRestore={handlers.openRestoreModal} canRestore={canRestore} />
                </div>
              </>
            )}
          </>
        )}

        <LogsModalsContainer
          selectedLog={selectedLog}
          onCloseLogDetails={handlers.closeLogDetails}
          getActionLabel={handlers.getActionLabel}
          showRestoreModal={showRestoreModal}
          onCloseRestoreModal={handlers.closeRestoreModal}
          selectedRecord={selectedRecord}
          onConfirmRestore={handlers.handleRestore}
          isRestoring={restoreMutation.isPending}
        />
      </div>
    </div>
  )
}

export default Logs
