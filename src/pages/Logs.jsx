import React, { useState, useEffect } from 'react'
import { RefreshCw, X, RotateCcw, Database, FileText } from 'lucide-react'
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

const Logs = () => {
  const { profile } = useAuth()
  const [activeTab, setActiveTab] = useState('logs')
  const [logs, setLogs] = useState([])
  const [deletedRecords, setDeletedRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingDeleted, setLoadingDeleted] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({})
  const [selectedLog, setSelectedLog] = useState(null)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [showRestoreModal, setShowRestoreModal] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [feedback, setFeedback] = useState({ show: false, type: 'success', message: '' })
  const [stats, setStats] = useState({ total: 0, errors: 0, today: 0, uniqueUsers: 0 })
  const [deletedStats, setDeletedStats] = useState({ products: 0, customers: 0, total: 0 })

  const isAdmin = profile?.role === 'admin'
  const isGerente = profile?.role === 'gerente'
  const canView = isAdmin || isGerente
  const canRestore = isAdmin

  useEffect(() => {
    if (canView) {
      fetchLogs()
      fetchDeletedRecords()
    }
  }, [filters, searchTerm])

  const showFeedback = (type, message) => {
    setFeedback({ show: true, type, message })
    setTimeout(() => setFeedback({ show: false }), 3000)
  }

  // ========== FUNÇÕES DOS LOGS ==========
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

  const fetchLogs = async () => {
    setLoading(true)
    try {
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
      setLogs(filteredData)

      const today = new Date().toDateString()
      setStats({
        total: filteredData.length,
        errors: filteredData.filter(l => l.action === 'ERROR').length,
        today: filteredData.filter(l => new Date(l.created_at).toDateString() === today).length,
        uniqueUsers: new Set(filteredData.map(l => l.user_email).filter(Boolean)).size
      })
    } catch (error) {
      console.error('Erro ao buscar logs:', error)
    } finally {
      setLoading(false)
    }
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

  // ========== FUNÇÕES DOS REGISTROS DELETADOS ==========
  const fetchDeletedRecords = async () => {
    setLoadingDeleted(true)
    try {
      const [productsRes, customersRes] = await Promise.all([
        supabase.from('products').select('*, deleter:deleted_by(email, full_name)').not('deleted_at', 'is', null).order('deleted_at', { ascending: false }),
        supabase.from('customers').select('*, deleter:deleted_by(email, full_name)').not('deleted_at', 'is', null).order('deleted_at', { ascending: false })
      ])

      const products = productsRes.data || []
      const customers = customersRes.data || []

      const allDeleted = [
        ...products.map(p => ({ ...p, _type: 'product', _typeLabel: 'Produto' })),
        ...customers.map(c => ({ ...c, _type: 'customer', _typeLabel: 'Cliente' }))
      ].sort((a, b) => new Date(b.deleted_at) - new Date(a.deleted_at))

      setDeletedRecords(allDeleted)
      setDeletedStats({
        products: products.length,
        customers: customers.length,
        total: allDeleted.length
      })
    } catch (error) {
      console.error('Erro ao buscar deletados:', error)
    } finally {
      setLoadingDeleted(false)
    }
  }

  const handleRestore = async () => {
    if (!selectedRecord) return

    setIsRestoring(true)
    try {
      const { data, error } = await supabase.rpc('restore_record', {
        p_table_name: selectedRecord._type === 'product' ? 'products' : 'customers',
        p_record_id: selectedRecord.id
      })

      if (error) throw error

      showFeedback('success', `${selectedRecord._typeLabel} restaurado com sucesso!`)
      setShowRestoreModal(false)
      setSelectedRecord(null)
      fetchDeletedRecords()
      fetchLogs()
    } catch (error) {
      showFeedback('error', 'Erro ao restaurar: ' + error.message)
    } finally {
      setIsRestoring(false)
    }
  }

  const openRestoreModal = (record) => {
    setSelectedRecord(record)
    setShowRestoreModal(true)
  }

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
              <p className="text-gray-500 mt-1">Logs de atividades e registros excluídos</p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={activeTab === 'logs' ? fetchLogs : fetchDeletedRecords} 
                loading={activeTab === 'logs' ? loading : loadingDeleted} 
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
              <StatCard label="Total de Logs" value={stats.total} icon={FileText} variant="info" />
              <StatCard label="Erros" value={stats.errors} icon={X} variant={stats.errors > 0 ? 'danger' : 'default'} />
              <StatCard label="Hoje" value={stats.today} icon={RefreshCw} variant="success" />
              <StatCard label="Usuários Ativos" value={stats.uniqueUsers} icon={FileText} variant="default" />
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

            {loading && <DataLoadingSkeleton />}

            {!loading && logs.length === 0 && (
              <DataEmptyState 
                title="Nenhum log encontrado" 
                description={searchTerm || Object.keys(filters).length > 0 ? "Tente ajustar os filtros" : "O sistema ainda não registrou atividades"} 
                icon="logs" 
              />
            )}

            {!loading && logs.length > 0 && (
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
            {/* Estatísticas de Deletados */}
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
              isLoading={isRestoring} 
            />
          </>
        )}
      </div>
    </div>
  )
}

export default Logs