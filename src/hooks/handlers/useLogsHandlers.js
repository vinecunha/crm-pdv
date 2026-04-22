// src/hooks/useLogsHandlers.js
import { useCallback, useMemo } from 'react'

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
}) => {

  const getActionColor = useCallback((action) => {
    const colors = {
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

  const getActionLabel = useCallback((action) => {
    const labels = {
      CREATE: 'Criação', UPDATE: 'Atualização', DELETE: 'Exclusão',
      LOGIN_SUCCESS: 'Login', LOGIN_FAILED: 'Login Falhou', LOGOUT: 'Logout',
      VIEW: 'Visualização', ERROR: 'Erro'
    }
    return labels[action] || action
  }, [])

  const formatDateCard = useCallback((date) => {
    if (!date) return '-'
    const now = new Date()
    const logDate = new Date(date)
    const diffHours = (now - logDate) / (1000 * 60 * 60)
    if (diffHours < 1) return `Há ${Math.floor((now - logDate) / (1000 * 60))} minutos`
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

  const handleExportLogs = useCallback(async () => {
    if (!logs.length) return
    
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
      showFeedback('error', 'Erro ao exportar logs')
    } finally {
      setExporting(false)
    }
  }, [logs, getActionLabel, setExporting, showFeedback])

  const openLogDetails = useCallback((log) => {
    setSelectedLog(log)
  }, [setSelectedLog])

  const closeLogDetails = useCallback(() => {
    setSelectedLog(null)
  }, [setSelectedLog])

  const openRestoreModal = useCallback((record) => {
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

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab)
  }, [setActiveTab])

  return {
    // Actions
    getActionColor,
    getActionLabel,
    formatDateCard,
    handleRefresh,
    handleExportLogs,
    handleTabChange,
    
    // Modal handlers
    openLogDetails,
    closeLogDetails,
    openRestoreModal,
    closeRestoreModal,
    handleRestore,
    
    // Setters
    setSearchTerm,
    setFilters
  }
}