import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  CheckCircle, FileText, Calendar, Users, RefreshCw,
  TrendingUp, ChevronRight, Eye, Printer, Save, Calculator,
  AlertCircle, X, DollarSign
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import FeedbackMessage from '../components/ui/FeedbackMessage'
import Button from '../components/ui/Button'
import DataLoadingSkeleton from '../components/ui/DataLoadingSkeleton'
import DataTable from '../components/ui/DataTable'
import { formatCurrency, formatNumber, formatDate, formatDateTime } from '../utils/formatters'
import useSystemLogs from '../hooks/useSystemLogs'
import useLogger from '../hooks/useLogger'

// Componentes internos (mantidos)
const StatCard = ({ label, value, sublabel, icon: Icon, variant = 'default' }) => {
  const variants = {
    default: 'bg-white border-gray-200',
    success: 'bg-green-50 border-green-200',
    warning: 'bg-yellow-50 border-yellow-200',
    danger: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200'
  }

  const iconColors = {
    default: 'text-gray-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    danger: 'text-red-600',
    info: 'text-blue-600'
  }

  return (
    <div className={`${variants[variant]} rounded-xl border p-5 transition-all hover:shadow-md`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {sublabel && <p className="text-xs text-gray-400">{sublabel}</p>}
        </div>
        <div className="p-2.5 rounded-lg bg-white/50">
          <Icon size={22} className={iconColors[variant]} />
        </div>
      </div>
    </div>
  )
}

// Funções de API (queries e mutations)
const fetchUsers = async () => {
  const { data, error } = await supabase.from('profiles').select('id, email, full_name').order('full_name')
  if (error) throw error
  return data
}

const fetchClosingHistory = async () => {
  const { data, error } = await supabase.from('cashier_closing').select('*').order('closed_at', { ascending: false }).limit(30)
  if (error) throw error
  return data
}

const fetchCashierSummary = async ({ queryKey }) => {
  const [, { startDate, endDate, userId }] = queryKey
  const start = new Date(startDate + 'T00:00:00')
  const end = new Date(endDate + 'T23:59:59.999')
  
  const { data, error } = await supabase.rpc('get_cashier_summary', {
    p_start_date: start.toISOString(),
    p_end_date: end.toISOString(),
    p_user_id: userId === 'all' ? null : userId
  })
  
  if (error) throw error
  return data
}

const createCashierClosing = async ({ closingData, profile }) => {
  const startDate = new Date(closingData.dateRange.start + 'T00:00:00')
  const endDate = new Date(closingData.dateRange.end + 'T23:59:59.999')
  
  const totalDeclared = closingData.declaredValues.cash + 
                       closingData.declaredValues.credit_card + 
                       closingData.declaredValues.debit_card + 
                       closingData.declaredValues.pix
  const expectedTotal = closingData.summary?.resumo?.total_liquido || 0
  const difference = totalDeclared - expectedTotal
  
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  
  const { data, error } = await supabase
    .from('cashier_closing')
    .insert([{
      closing_date: todayStr,
      start_time: startDate.toISOString(),
      end_time: endDate.toISOString(),
      total_sales: closingData.summary.resumo?.total_vendas || 0,
      total_discounts: closingData.summary.resumo?.total_descontos || 0,
      total_cancellations: closingData.summary.resumo?.total_cancelamentos || 0,
      total_cash: closingData.declaredValues.cash,
      total_card: closingData.declaredValues.credit_card + closingData.declaredValues.debit_card,
      total_pix: closingData.declaredValues.pix,
      expected_total: expectedTotal,
      declared_total: totalDeclared,
      difference: difference,
      notes: closingData.declaredValues.notes,
      closed_by: profile?.id,
      status: Math.abs(difference) < 0.01 ? 'closed' : 'adjusted',
      details: closingData.summary
    }])
    .select()
    .single()
  
  if (error) throw error
  return { data, expectedTotal, totalDeclared, difference }
}

const CashierClosing = () => {
  const { profile } = useAuth()
  const { logAction } = useSystemLogs()
  const { logCreate, logComponentAction } = useLogger('CashierClosing')
  const queryClient = useQueryClient()
  
  // Estado local
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  
  const [dateRange, setDateRange] = useState({ start: todayStr, end: todayStr })
  const [selectedUser, setSelectedUser] = useState('all')
  const [feedback, setFeedback] = useState({ show: false, type: 'success', message: '' })
  const [showClosingModal, setShowClosingModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedClosing, setSelectedClosing] = useState(null)
  const [declaredValues, setDeclaredValues] = useState({
    cash: 0,
    credit_card: 0,
    debit_card: 0,
    pix: 0,
    notes: ''
  })

  // Queries
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    staleTime: 30 * 60 * 1000, // 30 minutos
  })

  const { data: closingHistory = [], refetch: refetchHistory } = useQuery({
    queryKey: ['closing-history'],
    queryFn: fetchClosingHistory,
    staleTime: 5 * 60 * 1000, // 5 minutos
  })

  const { 
    data: summary,
    isLoading: isLoadingSummary,
    error: summaryError,
    refetch: refetchSummary,
    isFetching: isFetchingSummary
  } = useQuery({
    queryKey: ['cashier-summary', { startDate: dateRange.start, endDate: dateRange.end, userId: selectedUser }],
    queryFn: fetchCashierSummary,
    enabled: !!(dateRange.start && dateRange.end),
    staleTime: 2 * 60 * 1000, // 2 minutos
    onSuccess: (data) => {
      // Atualizar valores declarados com os valores do sistema
      if (data?.meios_pagamento) {
        const declared = { cash: 0, credit_card: 0, debit_card: 0, pix: 0, notes: '' }
        data.meios_pagamento.forEach(m => {
          if (m.payment_method === 'cash') declared.cash = m.total || 0
          if (m.payment_method === 'credit_card') declared.credit_card = m.total || 0
          if (m.payment_method === 'debit_card') declared.debit_card = m.total || 0
          if (m.payment_method === 'pix') declared.pix = m.total || 0
        })
        setDeclaredValues(declared)
      }
    },
    onError: (error) => {
      console.error('Erro ao gerar resumo:', error)
      showFeedback('error', 'Erro ao carregar dados do caixa')
    }
  })

  // Mutation para fechamento
  const closingMutation = useMutation({
    mutationFn: createCashierClosing,
    onSuccess: async (result) => {
      const { data, expectedTotal, totalDeclared, difference } = result
      
      // Logs
      await logCreate('cashier_closing', data.id, {
        closing_date: data.closing_date,
        expected_total: expectedTotal,
        declared_total: totalDeclared,
        difference: difference
      })
      
      await logAction({
        action: 'CLOSE_CASHIER',
        entityType: 'cashier_closing',
        entityId: data.id,
        details: { expected_total: expectedTotal, declared_total: totalDeclared, difference }
      })
      
      // Invalidate queries para recarregar dados
      queryClient.invalidateQueries({ queryKey: ['closing-history'] })
      queryClient.invalidateQueries({ queryKey: ['cashier-summary'] })
      
      const diffMessage = difference === 0 ? 'Caixa fechou com valor exato!' : 
                          `Diferença de ${formatCurrency(Math.abs(difference))} ${difference > 0 ? 'a maior' : 'a menor'}`
      
      showFeedback('success', `Fechamento realizado! ${diffMessage}`)
      setShowClosingModal(false)
    },
    onError: (error) => {
      console.error('Erro ao fechar caixa:', error)
      showFeedback('error', 'Erro ao realizar fechamento: ' + error.message)
    }
  })

  // Efeito para log de acesso
  React.useEffect(() => {
    logComponentAction('ACCESS_PAGE', null, { page: 'cashier_closing' })
  }, [])

  const showFeedback = (type, message) => {
    setFeedback({ show: true, type, message })
    setTimeout(() => setFeedback({ show: false, type: 'success', message: '' }), 3000)
  }

  const openClosingModal = () => {
    if (!summary) {
      showFeedback('error', 'Nenhum dado para fechar')
      return
    }
    
    // Atualizar valores declarados com os do sistema antes de abrir
    if (summary?.meios_pagamento) {
      const declared = { ...declaredValues }
      summary.meios_pagamento.forEach(m => {
        if (m.payment_method === 'cash') declared.cash = m.total || 0
        if (m.payment_method === 'credit_card') declared.credit_card = m.total || 0
        if (m.payment_method === 'debit_card') declared.debit_card = m.total || 0
        if (m.payment_method === 'pix') declared.pix = m.total || 0
      })
      setDeclaredValues(declared)
    }
    
    setShowClosingModal(true)
  }

  const handleClosing = () => {
    closingMutation.mutate({
      closingData: {
        dateRange,
        declaredValues,
        summary
      },
      profile
    })
  }

  const handleRefresh = () => {
    refetchSummary()
    refetchHistory()
  }

  const viewClosingDetails = (closing) => {
    setSelectedClosing(closing)
    setShowDetailsModal(true)
  }

  const getDifferenceColor = (difference) => {
    if (Math.abs(difference) < 0.01) return 'text-green-600'
    if (Math.abs(difference) < 10) return 'text-yellow-600'
    return 'text-red-600'
  }

  const paymentMethods = [
    { key: 'cash', label: 'Dinheiro', icon: '💵', color: 'text-green-600', bgColor: 'bg-green-50' },
    { key: 'credit_card', label: 'Cartão de Crédito', icon: '💳', color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { key: 'debit_card', label: 'Cartão de Débito', icon: '🏧', color: 'text-purple-600', bgColor: 'bg-purple-50' },
    { key: 'pix', label: 'PIX', icon: '📱', color: 'text-teal-600', bgColor: 'bg-teal-50' }
  ]

  // Colunas para DataTable do histórico
  const historyColumns = [
    {
      key: 'closing_date',
      header: 'Data',
      sortable: true,
      render: (row) => formatDate(row.closing_date)
    },
    {
      key: 'expected_total',
      header: 'Esperado',
      sortable: true,
      render: (row) => formatCurrency(row.expected_total)
    },
    {
      key: 'declared_total',
      header: 'Declarado',
      sortable: true,
      render: (row) => formatCurrency(row.declared_total)
    },
    {
      key: 'difference',
      header: 'Diferença',
      sortable: true,
      render: (row) => (
        <span className={`font-medium ${getDifferenceColor(row.difference)}`}>
          {formatCurrency(row.difference)}
        </span>
      )
    },
    {
      key: 'closed_by',
      header: 'Operador',
      render: (row) => users.find(u => u.id === row.closed_by)?.full_name || '-'
    },
    {
      key: 'closed_at',
      header: 'Horário',
      render: (row) => formatDateTime(row.closed_at)
    }
  ]

  const historyActions = [
    {
      label: 'Ver detalhes',
      icon: <Eye size={16} />,
      onClick: viewClosingDetails,
      className: 'text-blue-600 hover:text-blue-800 hover:bg-blue-50'
    }
  ]

  const resumo = summary?.resumo || {}
  
  const totalDeclarado = declaredValues.cash + declaredValues.credit_card + 
                        declaredValues.debit_card + declaredValues.pix
  const expectedTotal = resumo.total_liquido || 0
  const difference = totalDeclarado - expectedTotal

  // Tratamento de erro da query principal
  if (summaryError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erro ao carregar dados</h2>
          <p className="text-gray-600 mb-4">{summaryError.message}</p>
          <Button onClick={handleRefresh} icon={RefreshCw}>
            Tentar novamente
          </Button>
        </div>
      </div>
    )
  }

  if (isLoadingSummary && !summary) return <DataLoadingSkeleton />

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Feedback */}
        {feedback.show && (
          <FeedbackMessage type={feedback.type} message={feedback.message} onClose={() => setFeedback({ show: false })} />
        )}

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Fechamento de Caixa</h1>
              <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                <Calendar size={14} />
                <span>{formatDate(dateRange.start)} - {formatDate(dateRange.end)}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowHistoryModal(true)} icon={FileText}>
                Histórico
              </Button>
              <Button 
                variant="outline" 
                onClick={handleRefresh} 
                loading={isFetchingSummary} 
                icon={RefreshCw}
              >
                Atualizar
              </Button>
              <Button onClick={openClosingModal} icon={Calculator} disabled={!summary || closingMutation.isPending}>
                Fechar Caixa
              </Button>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-gray-400" />
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              />
              <span className="text-gray-400">—</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <Users size={16} className="text-gray-400" />
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">Todos os operadores</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.full_name || user.email}</option>
                ))}
              </select>
            </div>
            {isFetchingSummary && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <RefreshCw size={14} className="animate-spin" />
                Atualizando...
              </div>
            )}
          </div>
        </div>

        {summary && (
          <>
            {/* Cards de Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                label="Vendas Totais"
                value={formatCurrency(resumo.total_vendas || 0)}
                sublabel={`${formatNumber(resumo.total_itens || 0)} itens`}
                icon={TrendingUp}
                variant="success"
              />
              <StatCard
                label="Ticket Médio"
                value={formatCurrency(resumo.ticket_medio || 0)}
                sublabel={`${formatNumber(resumo.total_clientes || 0)} clientes`}
                icon={Users}
                variant="info"
              />
              <StatCard
                label="Descontos"
                value={formatCurrency(resumo.total_descontos || 0)}
                sublabel={`${((resumo.total_descontos / resumo.total_vendas) * 100 || 0).toFixed(1)}%`}
                icon={TrendingUp}
                variant="warning"
              />
              <StatCard
                label="Valor Líquido"
                value={formatCurrency(resumo.total_liquido || 0)}
                sublabel="Valor esperado"
                icon={CheckCircle}
                variant="default"
              />
            </div>

            {/* Resumo Final */}
            <div className="mt-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total do Período</p>
                  <p className="text-3xl font-bold text-gray-900">{formatCurrency(resumo.total_liquido || 0)}</p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-right">
                    <p className="text-gray-500">Vendas</p>
                    <p className="font-medium">{formatNumber(resumo.total_vendas || 0)}</p>
                  </div>
                  <ChevronRight size={20} className="text-gray-300" />
                  <div className="text-right">
                    <p className="text-gray-500">Descontos</p>
                    <p className="font-medium text-orange-600">-{formatCurrency(resumo.total_descontos || 0)}</p>
                  </div>
                  <ChevronRight size={20} className="text-gray-300" />
                  <div className="text-right">
                    <p className="text-gray-500">Cancelamentos</p>
                    <p className="font-medium text-red-500">{formatCurrency(resumo.total_cancelamentos || 0)}</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Modal de Fechamento de Caixa */}
        {showClosingModal && summary && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/30" onClick={() => !closingMutation.isPending && setShowClosingModal(false)} />
            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">Fechamento de Caixa</h3>
                  <p className="text-sm text-gray-500">{formatDate(dateRange.start)} - {formatDate(dateRange.end)}</p>
                </div>
                <button onClick={() => !closingMutation.isPending && setShowClosingModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4">
                {/* Valor Esperado - DESTACADO */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-5 text-white shadow-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign size={20} />
                    <p className="text-sm font-medium opacity-90">VALOR ESPERADO PELO SISTEMA</p>
                  </div>
                  <p className="text-4xl font-bold">{formatCurrency(expectedTotal)}</p>
                  <p className="text-xs opacity-75 mt-1">
                    Baseado nas vendas concluídas no período
                  </p>
                </div>

                {/* Valores Declarados */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-3">VALORES DECLARADOS</p>
                  <div className="space-y-2">
                    {paymentMethods.map(({ key, label, icon, color, bgColor }) => {
                      const sistemaValue = summary?.meios_pagamento?.find(m => m.payment_method === key)?.total || 0
                      return (
                        <div key={key} className={`flex items-center justify-between p-3 ${bgColor} rounded-lg border`}>
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{icon}</span>
                            <div>
                              <span className={`font-medium ${color}`}>{label}</span>
                              <p className="text-xs text-gray-500">Sistema: {formatCurrency(sistemaValue)}</p>
                            </div>
                          </div>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={declaredValues[key]}
                            onChange={(e) => setDeclaredValues({ ...declaredValues, [key]: parseFloat(e.target.value) || 0 })}
                            className="w-40 px-3 py-2 text-right border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                            disabled={closingMutation.isPending}
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Total Declarado e Diferença */}
                <div className={`p-4 rounded-xl ${Math.abs(difference) < 0.01 ? 'bg-green-50 border border-green-200' : Math.abs(difference) < 10 ? 'bg-yellow-50 border border-yellow-200' : 'bg-red-50 border border-red-200'}`}>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Declarado</span>
                    <span className="text-2xl font-bold">{formatCurrency(totalDeclarado)}</span>
                  </div>
                  <div className="flex justify-between items-center mt-3 pt-3 border-t">
                    <span className="font-medium">Diferença</span>
                    <span className={`text-2xl font-bold ${getDifferenceColor(difference)}`}>
                      {formatCurrency(difference)}
                    </span>
                  </div>
                  {Math.abs(difference) > 10 && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-red-700 bg-red-100 p-2 rounded">
                      <AlertCircle size={16} />
                      Atenção: Diferença significativa. Verifique os valores declarados.
                    </div>
                  )}
                </div>

                {/* Observações */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                  <textarea
                    value={declaredValues.notes}
                    onChange={(e) => setDeclaredValues({ ...declaredValues, notes: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Observações sobre este fechamento..."
                    disabled={closingMutation.isPending}
                  />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowClosingModal(false)} disabled={closingMutation.isPending}>
                  Cancelar
                </Button>
                <Button onClick={handleClosing} loading={closingMutation.isPending} icon={Save}>
                  Confirmar Fechamento
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Histórico */}
        {showHistoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/30" onClick={() => setShowHistoryModal(false)} />
            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[85vh] overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-lg font-semibold">Histórico de Fechamentos</h3>
                <button onClick={() => setShowHistoryModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              <div className="p-4 overflow-y-auto">
                <DataTable
                  columns={historyColumns}
                  data={closingHistory}
                  actions={historyActions}
                  emptyMessage="Nenhum fechamento realizado"
                  striped
                  hover
                  pagination
                  itemsPerPageOptions={[10, 20, 50]}
                  defaultItemsPerPage={10}
                  showTotalItems
                />
              </div>
              <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
                <Button variant="outline" onClick={() => setShowHistoryModal(false)}>Fechar</Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Detalhes (mantido igual) */}
        {showDetailsModal && selectedClosing && (
          // ... (código do modal de detalhes permanece o mesmo)
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* ... conteúdo do modal de detalhes ... */}
          </div>
        )}
      </div>
    </div>
  )
}

export default CashierClosing