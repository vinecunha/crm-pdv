import React, { useState, useEffect } from 'react'
import { RefreshCw, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import DataLoadingSkeleton from '../components/ui/DataLoadingSkeleton'
import DataEmptyState from '../components/ui/DataEmptyState'
import DataCards from '../components/ui/DataCards'
import Button from '../components/ui/Button'

import LogStats from '../components/logs/LogStats'
import LogFilters from '../components/logs/LogFilters'
import LogTable from '../components/logs/LogTable'
import LogCard from '../components/logs/LogCard'
import LogDetailsModal from '../components/logs/LogDetailsModal'

const Logs = () => {
  const { profile } = useAuth()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({})
  const [selectedLog, setSelectedLog] = useState(null)
  const [exporting, setExporting] = useState(false)

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
      let query = supabase.from('system_logs').select('*').order('created_at', { ascending: false })
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
    } catch (error) {
      console.error('Erro ao buscar logs:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (profile?.role === 'admin' || profile?.role === 'gerente') fetchLogs()
  }, [profile?.role, filters, searchTerm])

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

  if (profile?.role !== 'admin' && profile?.role !== 'gerente') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 rounded-full p-4 inline-block mb-4">
            <X className="h-12 w-12 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-red-600">Acesso Negado</h2>
          <p className="mt-2 text-gray-600">Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Logs do Sistema</h1>
              <p className="text-gray-500 mt-1">Histórico completo de todas as ações do sistema</p>
            </div>
            <Button onClick={fetchLogs} loading={loading} icon={RefreshCw}>Atualizar</Button>
          </div>
        </div>

        <LogStats logs={logs} />
        <LogFilters searchTerm={searchTerm} setSearchTerm={setSearchTerm} filters={filters} setFilters={setFilters} onExport={exportLogs} exporting={exporting} logsLength={logs.length} />

        {loading && <DataLoadingSkeleton />}

        {!loading && logs.length === 0 && (
          <DataEmptyState title="Nenhum log encontrado" description={searchTerm || Object.keys(filters).length > 0 ? "Tente ajustar os filtros" : "O sistema ainda não registrou atividades"} icon="logs" />
        )}

        {!loading && logs.length > 0 && (
          <>
            <div className="block lg:hidden">
              <DataCards data={logs} renderCard={(log) => <LogCard log={log} onViewDetails={setSelectedLog} getActionColor={getActionColor} getActionLabel={getActionLabel} formatDateCard={formatDateCard} />} keyExtractor={(l) => l.id} columns={1} gap={3} />
            </div>
            <div className="hidden lg:block">
              <LogTable logs={logs} onViewDetails={setSelectedLog} getActionColor={getActionColor} getActionLabel={getActionLabel} />
            </div>
          </>
        )}

        <LogDetailsModal isOpen={!!selectedLog} onClose={() => setSelectedLog(null)} log={selectedLog} getActionLabel={getActionLabel} />
      </div>
    </div>
  )
}

export default Logs