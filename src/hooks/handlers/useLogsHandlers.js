import { useCallback, useMemo } from 'react'

// Baseado em: public.system_logs
interface SystemLog {
  id: string
  user_id: string | null
  user_email: string | null
  user_role: string | null
  action: string
  entity_type: string | null
  entity_id: string | null
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  ip_address: string | null
  user_agent: string | null
  details: Record<string, unknown> | null
  created_at: string | null
}

interface DeletedRecord {
  id: number
  _type: string
  _typeLabel: string
  name?: string
  [key: string]: unknown
}

interface Filters {
  [key: string]: string
}

interface FeedbackState {
  message: string | null
  type: 'success' | 'error' | 'info' | 'warning'
}

interface ActionColorClass {
  [key: string]: string
}

interface ActionLabel {
  [key: string]: string
}

interface MutationResult<T> {
  mutate: (data: T, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => void
}

interface UseLogsHandlersProps {
  logs: SystemLog[]
  deletedRecords: DeletedRecord[]
  activeTab: string
  setActiveTab: (tab: string) => void
  searchTerm: string
  setSearchTerm: (term: string) => void
  filters: Filters
  setFilters: (filters: Filters) => void
  selectedLog: SystemLog | null
  setSelectedLog: (log: SystemLog | null) => void
  selectedRecord: DeletedRecord | null
  setSelectedRecord: (record: DeletedRecord | null) => void
  showRestoreModal: boolean
  setShowRestoreModal: (show: boolean) => void
  exporting: boolean
  setExporting: (exporting: boolean) => void
  restoreMutation: MutationResult<{
    tableName: string
    recordId: number
    recordType: string
  }>
  refetchLogs: () => void
  refetchDeleted: () => void
  showFeedback: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void
}

interface UseLogsHandlersReturn {
  getActionColor: (action: string) => string
  getActionLabel: (action: string) => string
  formatDateCard: (date: string | null) => string
  handleRefresh: () => void
  handleExportLogs: () => Promise<void>
  handleTabChange: (tab: string) => void
  openLogDetails: (log: SystemLog) => void
  closeLogDetails: () => void
  openRestoreModal: (record: DeletedRecord) => void
  closeRestoreModal: () => void
  handleRestore: () => void
  setSearchTerm: (term: string) => void
  setFilters: (filters: Filters) => void
}

export const useLogsHandlers = ({
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
}: UseLogsHandlersProps): UseLogsHandlersReturn => {

  const getActionColor = useCallback((action: string): string => {
    const colors: ActionColorClass = {
      CREATE: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30',
      UPDATE: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30',
      DELETE: 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30',
      LOGIN_SUCCESS: 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30',
      LOGIN_FAILED: 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30',
      LOGOUT: 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30',
      VIEW: 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-800',
      ERROR: 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30'
    }
    return colors[action] || colors.VIEW
  }, [])

  const getActionLabel = useCallback((action: string): string => {
    const labels: ActionLabel = {
      CREATE: 'Criação', UPDATE: 'Atualização', DELETE: 'Exclusão',
      LOGIN_SUCCESS: 'Login', LOGIN_FAILED: 'Login Falhou', LOGOUT: 'Logout',
      VIEW: 'Visualização', ERROR: 'Erro'
    }
    return labels[action] || action
  }, [])

  const formatDateCard = useCallback((date: string | null): string => {
    if (!date) return '-'
    const now = new Date()
    const logDate = new Date(date)
    const diffHours = (now.getTime() - logDate.getTime()) / (1000 * 60 * 60)
    if (diffHours < 1) return `Há ${Math.floor((now.getTime() - logDate.getTime()) / (1000 * 60))} minutos`
    if (diffHours < 24) return `Há ${Math.floor(diffHours)} horas`
    return logDate.toLocaleDateString('pt-BR')
  }, [])

  const handleRefresh = useCallback(() => {
    if (activeTab === 'logs') {
      refetchLogs()
    } else {
      refetchDeleted()
    }
  }, [activeTab, refetchLogs, refetchDeleted])

  const handleExportLogs = useCallback(async (): Promise<void> => {
    if (!logs.length) return
    
    setExporting(true)
    try {
      const csvData = logs.map(log => ({
        Data: new Date(log.created_at as string).toLocaleString('pt-BR'),
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
      showFeedback('error', 'Erro ao exportar logs')
    } finally {
      setExporting(false)
    }
  }, [logs, getActionLabel, setExporting, showFeedback])

  const openLogDetails = useCallback((log: SystemLog) => {
    setSelectedLog(log)
  }, [setSelectedLog])

  const closeLogDetails = useCallback(() => {
    setSelectedLog(null)
  }, [setSelectedLog])

  const openRestoreModal = useCallback((record: DeletedRecord) => {
    setSelectedRecord(record)
    setShowRestoreModal(true)
  }, [setSelectedRecord, setShowRestoreModal])

  const closeRestoreModal = useCallback(() => {
    setShowRestoreModal(false)
    setSelectedRecord(null)
  }, [setShowRestoreModal, setSelectedRecord])

  const handleRestore = useCallback(() => {
    if (!selectedRecord) return
    
    restoreMutation.mutate({
      tableName: selectedRecord._type === 'product' ? 'products' : 'customers',
      recordId: selectedRecord.id,
      recordType: selectedRecord._typeLabel
    })
  }, [selectedRecord, restoreMutation])

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab)
  }, [setActiveTab])

  return {
    getActionColor,
    getActionLabel,
    formatDateCard,
    handleRefresh,
    handleExportLogs,
    handleTabChange,
    openLogDetails,
    closeLogDetails,
    openRestoreModal,
    closeRestoreModal,
    handleRestore,
    setSearchTerm,
    setFilters
  }
}