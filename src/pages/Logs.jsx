import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { supabase } from '../lib/supabase'
import { Search, Filter, Calendar, Download, Eye, RefreshCw, X, ChevronRight } from 'lucide-react'
import DataTable from '../components/ui/DataTable'
import DataFilters from '../components/ui/DataFilters'
import DataLoadingSkeleton from '../components/ui/DataLoadingSkeleton'
import DataEmptyState from '../components/ui/DataEmptyState'
import Modal from '../components/ui/Modal'

const Logs = () => {
  const { profile } = useAuth()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({})
  const [selectedLog, setSelectedLog] = useState(null)
  const [exporting, setExporting] = useState(false)

  // ==============================
  // FUNÇÕES AUXILIARES
  // ==============================
  
  const getActionColor = (action) => {
    const colors = {
      CREATE: 'text-green-600 bg-green-100',
      UPDATE: 'text-blue-600 bg-blue-100',
      DELETE: 'text-red-600 bg-red-100',
      LOGIN: 'text-purple-600 bg-purple-100',
      LOGOUT: 'text-orange-600 bg-orange-100',
      LOGIN_SUCCESS: 'text-purple-600 bg-purple-100',
      LOGIN_FAILED: 'text-red-600 bg-red-100',
      ACCESS: 'text-indigo-600 bg-indigo-100',
      VIEW: 'text-gray-600 bg-gray-100',
      ERROR: 'text-red-600 bg-red-100'
    }
    return colors[action] || colors.VIEW
  }

  const getActionLabel = (action) => {
    const labels = {
      CREATE: 'Criação',
      UPDATE: 'Atualização',
      DELETE: 'Exclusão',
      LOGIN: 'Login',
      LOGOUT: 'Logout',
      LOGIN_SUCCESS: 'Login',
      LOGIN_FAILED: 'Login Falhou',
      ACCESS: 'Acesso',
      VIEW: 'Visualização',
      ERROR: 'Erro'
    }
    return labels[action] || action
  }

  const formatDateCard = (date) => {
    if (!date) return '-'
    const now = new Date()
    const logDate = new Date(date)
    const diffHours = (now - logDate) / (1000 * 60 * 60)
    
    if (diffHours < 1) {
      const diffMinutes = Math.floor((now - logDate) / (1000 * 60))
      return `Há ${diffMinutes} minutos`
    }
    if (diffHours < 24) {
      return `Há ${Math.floor(diffHours)} horas`
    }
    return logDate.toLocaleDateString('pt-BR')
  }

  // Definição das colunas da tabela
  const columns = [
    {
      key: 'created_at',
      header: 'Data/Hora',
      sortable: true,
      render: (row) => (
        <div className="text-sm text-gray-500">
          {new Date(row.created_at).toLocaleString('pt-BR')}
        </div>
      )
    },
    {
      key: 'user_email',
      header: 'Usuário',
      sortable: true,
      render: (row) => (
        <div>
          <div className="text-sm font-medium text-gray-900">
            {row.user_email || 'Sistema'}
          </div>
          {row.user_role && (
            <div className="text-xs text-gray-500 capitalize">
              {row.user_role}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'action',
      header: 'Ação',
      sortable: true,
      render: (row) => {
        const color = getActionColor(row.action)
        return (
          <span className={`px-2 py-1 text-xs rounded-full ${color}`}>
            {getActionLabel(row.action)}
          </span>
        )
      }
    },
    {
      key: 'entity_type',
      header: 'Entidade',
      sortable: true,
      render: (row) => (
        <div className="text-sm text-gray-600 capitalize">
          {row.entity_type || '-'}
        </div>
      )
    },
    {
      key: 'details',
      header: 'Detalhes',
      render: (row) => (
        <button
          onClick={() => setSelectedLog(row)}
          className="text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1 text-sm"
        >
          <Eye size={16} />
          Ver detalhes
        </button>
      )
    }
  ]

  // Ações da tabela
  const actions = [
    {
      label: 'Ver detalhes',
      icon: <Eye size={18} />,
      onClick: (row) => setSelectedLog(row),
      className: 'text-blue-600 hover:text-blue-900'
    }
  ]

  // Configuração dos filtros
  const filterConfigs = [
    {
      key: 'action',
      label: 'Ação',
      type: 'select',
      options: [
        { value: 'CREATE', label: 'Criação' },
        { value: 'UPDATE', label: 'Atualização' },
        { value: 'DELETE', label: 'Exclusão' },
        { value: 'LOGIN', label: 'Login' },
        { value: 'LOGIN_SUCCESS', label: 'Login Sucesso' },
        { value: 'LOGIN_FAILED', label: 'Login Falhou' },
        { value: 'LOGOUT', label: 'Logout' },
        { value: 'ACCESS', label: 'Acesso' },
        { value: 'VIEW', label: 'Visualização' },
        { value: 'ERROR', label: 'Erro' }
      ]
    },
    {
      key: 'entity_type',
      label: 'Entidade',
      type: 'select',
      options: [
        { value: 'user', label: 'Usuário' },
        { value: 'product', label: 'Produto' },
        { value: 'customer', label: 'Cliente' },
        { value: 'sale', label: 'Venda' },
        { value: 'access', label: 'Acesso' },
        { value: 'auth', label: 'Autenticação' },
        { value: 'report', label: 'Relatório' }
      ]
    },
    {
      key: 'user_role',
      label: 'Papel do Usuário',
      type: 'select',
      options: [
        { value: 'admin', label: 'Administrador' },
        { value: 'gerente', label: 'Gerente' },
        { value: 'operador', label: 'Operador' }
      ]
    },
    {
      key: 'date_from',
      label: 'Data Inicial',
      type: 'date'
    },
    {
      key: 'date_to',
      label: 'Data Final',
      type: 'date'
    }
  ]

  // Buscar logs
  const fetchLogs = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('system_logs')
        .select('*')
        .order('created_at', { ascending: false })

      // Aplicar filtros
      if (filters.action) {
        query = query.eq('action', filters.action)
      }
      if (filters.entity_type) {
        query = query.eq('entity_type', filters.entity_type)
      }
      if (filters.user_role) {
        query = query.eq('user_role', filters.user_role)
      }
      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from)
      }
      if (filters.date_to) {
        query = query.lte('created_at', `${filters.date_to} 23:59:59`)
      }

      const { data, error } = await query

      if (error) throw error

      // Filtrar por busca textual
      let filteredData = data || []
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        filteredData = filteredData.filter(log =>
          log.user_email?.toLowerCase().includes(searchLower) ||
          log.action?.toLowerCase().includes(searchLower) ||
          log.entity_type?.toLowerCase().includes(searchLower) ||
          JSON.stringify(log.details).toLowerCase().includes(searchLower)
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
    if (profile?.role === 'admin' || profile?.role === 'gerente') {
      fetchLogs()
    }
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
        IP: log.ip_address || '-',
        Detalhes: JSON.stringify(log.details || {})
      }))

      const headers = Object.keys(csvData[0])
      const csv = [
        headers.join(','),
        ...csvData.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
      ].join('\n')

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.href = url
      link.setAttribute('download', `logs_${new Date().toISOString().slice(0, 19)}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Erro ao exportar logs:', error)
    } finally {
      setExporting(false)
    }
  }

  // Verificar acesso
  if (profile?.role !== 'admin' && profile?.role !== 'gerente') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Cabeçalho */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Logs do Sistema</h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">
            Histórico completo de todas as ações do sistema
            {!loading && logs.length > 0 && (
              <span className="ml-2 text-blue-600">({logs.length} registros)</span>
            )}
          </p>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <DataFilters
                searchPlaceholder="Buscar logs..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                filters={filterConfigs}
                onFilterChange={setFilters}
                showFilters={true}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={fetchLogs}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
              <button
                onClick={exportLogs}
                disabled={exporting || logs.length === 0}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Exportar
              </button>
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && <DataLoadingSkeleton type="table" rows={10} columns={5} />}

        {/* Empty State */}
        {!loading && logs.length === 0 && (
          <DataEmptyState
            title="Nenhum log encontrado"
            description={searchTerm || Object.keys(filters).length > 0
              ? "Tente ajustar os filtros ou termos de busca"
              : "O sistema ainda não registrou atividades"
            }
            icon="logs"
          />
        )}

        {/* Cards (Mobile) */}
        {!loading && logs.length > 0 && (
          <>
            <div className="block lg:hidden space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${getActionColor(log.action)}`}>
                          {getActionLabel(log.action)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDateCard(log.created_at)}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900 mt-2">
                        {log.user_email || 'Sistema'}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="space-y-2 text-sm border-t border-gray-100 pt-3">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Data:</span>
                      <span className="text-gray-700">
                        {new Date(log.created_at).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    {log.entity_type && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Entidade:</span>
                        <span className="text-gray-700 capitalize">{log.entity_type}</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedLog(log)}
                    className="w-full mt-3 px-3 py-2 bg-gray-50 text-blue-600 rounded-lg hover:bg-gray-100 text-sm flex items-center justify-center gap-2"
                  >
                    <Eye size={16} /> Ver detalhes
                  </button>
                </div>
              ))}
            </div>

            {/* Tabela (Desktop) */}
            <div className="hidden lg:block">
              <DataTable
                columns={columns}
                data={logs}
                actions={actions}
                emptyMessage="Nenhum log encontrado"
              />
            </div>
          </>
        )}

        {/* Modal de Detalhes */}
        <Modal
          isOpen={!!selectedLog}
          onClose={() => setSelectedLog(null)}
          title="Detalhes do Log"
          size="lg"
        >
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase">Data/Hora</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(selectedLog.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase">Usuário</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedLog.user_email || 'Sistema'}</p>
                  {selectedLog.user_role && (
                    <span className="inline-block mt-1 text-xs text-gray-500 capitalize">
                      {selectedLog.user_role}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase">Ação</label>
                  <p className="mt-1 text-sm text-gray-900">{getActionLabel(selectedLog.action)}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase">Entidade</label>
                  <p className="mt-1 text-sm text-gray-900 capitalize">{selectedLog.entity_type || '-'}</p>
                  {selectedLog.entity_id && (
                    <p className="text-xs text-gray-500 font-mono mt-1 break-all">
                      ID: {selectedLog.entity_id}
                    </p>
                  )}
                </div>
              </div>

              {selectedLog.ip_address && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase">IP Address</label>
                  <p className="mt-1 text-sm text-gray-900 font-mono">{selectedLog.ip_address}</p>
                </div>
              )}

              {selectedLog.user_agent && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase">Navegador</label>
                  <p className="mt-1 text-sm text-gray-900 break-words">{selectedLog.user_agent}</p>
                </div>
              )}

              {selectedLog.old_data && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase">Dados Antigos</label>
                  <pre className="mt-1 p-3 bg-gray-50 rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.old_data, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.new_data && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase">Dados Novos</label>
                  <pre className="mt-1 p-3 bg-gray-50 rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.new_data, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.details && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase">Detalhes</label>
                  <pre className="mt-1 p-3 bg-gray-50 rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    </div>
  )
}

export default Logs