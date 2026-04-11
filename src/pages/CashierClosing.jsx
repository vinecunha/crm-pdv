import React, { useState, useEffect } from 'react'
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

// Componentes internos
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

const CashierClosing = () => {
  const { profile } = useAuth()
  const { logAction } = useSystemLogs()
  const { logCreate, logComponentAction } = useLogger('CashierClosing')
  
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [closing, setClosing] = useState(false)
  
  // CORREÇÃO: Usar data local formatada corretamente
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  
  const [dateRange, setDateRange] = useState({ 
    start: todayStr, 
    end: todayStr 
  })
  const [selectedUser, setSelectedUser] = useState('all')
  const [users, setUsers] = useState([])
  const [feedback, setFeedback] = useState({ show: false, type: 'success', message: '' })

  // Modal de Fechamento
  const [showClosingModal, setShowClosingModal] = useState(false)
  const [declaredValues, setDeclaredValues] = useState({
    cash: 0,
    credit_card: 0,
    debit_card: 0,
    pix: 0,
    notes: ''
  })

  // Modais de Histórico
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [closingHistory, setClosingHistory] = useState([])
  const [selectedClosing, setSelectedClosing] = useState(null)

  const paymentMethods = [
    { key: 'cash', label: 'Dinheiro', icon: '💵', color: 'text-green-600', bgColor: 'bg-green-50' },
    { key: 'credit_card', label: 'Cartão de Crédito', icon: '💳', color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { key: 'debit_card', label: 'Cartão de Débito', icon: '🏧', color: 'text-purple-600', bgColor: 'bg-purple-50' },
    { key: 'pix', label: 'PIX', icon: '📱', color: 'text-teal-600', bgColor: 'bg-teal-50' }
  ]

  useEffect(() => {
    fetchUsers()
    fetchClosingHistory()
    generateSummary()
    logComponentAction('ACCESS_PAGE', null, { page: 'cashier_closing' })
  }, [])

  useEffect(() => {
    if (dateRange.start && dateRange.end) generateSummary()
  }, [dateRange, selectedUser])

  const showFeedback = (type, message) => {
    setFeedback({ show: true, type, message })
    setTimeout(() => setFeedback({ show: false, type: 'success', message: '' }), 3000)
  }

  const fetchUsers = async () => {
    try {
      const { data } = await supabase.from('profiles').select('id, email, full_name').order('full_name')
      setUsers(data || [])
    } catch (error) { console.error('Erro ao carregar usuários:', error) }
  }

  const fetchClosingHistory = async () => {
    try {
      const { data } = await supabase.from('cashier_closing').select('*').order('closed_at', { ascending: false }).limit(30)
      setClosingHistory(data || [])
    } catch (error) { console.error('Erro ao carregar histórico:', error) }
  }

  const generateSummary = async () => {
    setLoading(true)
    try {
      // CORREÇÃO: Criar datas locais corretamente
      const startDate = new Date(dateRange.start + 'T00:00:00')
      const endDate = new Date(dateRange.end + 'T23:59:59.999')
      
      console.log('📊 Buscando resumo...', { 
        start: startDate.toISOString(), 
        end: endDate.toISOString(), 
        user: selectedUser 
      })
      
      const { data, error } = await supabase.rpc('get_cashier_summary', {
        p_start_date: startDate.toISOString(),
        p_end_date: endDate.toISOString(),
        p_user_id: selectedUser === 'all' ? null : selectedUser
      })
      
      if (error) throw error
      
      console.log('✅ Dados recebidos:', data)
      setSummary(data)
      
      // Pré-preencher valores declarados com os valores do sistema
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
      
    } catch (error) {
      console.error('Erro ao gerar resumo:', error)
      showFeedback('error', 'Erro ao carregar dados do caixa')
    } finally {
      setLoading(false)
    }
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

  const handleClosing = async () => {
    setClosing(true)
    try {
      const totalDeclared = declaredValues.cash + declaredValues.credit_card + 
                           declaredValues.debit_card + declaredValues.pix
      const expectedTotal = summary?.resumo?.total_liquido || 0
      const difference = totalDeclared - expectedTotal
      
      const startDate = new Date(dateRange.start + 'T00:00:00')
      const endDate = new Date(dateRange.end + 'T23:59:59.999')
      
      const { data, error } = await supabase
        .from('cashier_closing')
        .insert([{
          closing_date: todayStr,
          start_time: startDate.toISOString(),
          end_time: endDate.toISOString(),
          total_sales: summary.resumo?.total_vendas || 0,
          total_discounts: summary.resumo?.total_descontos || 0,
          total_cancellations: summary.resumo?.total_cancelamentos || 0,
          total_cash: declaredValues.cash,
          total_card: declaredValues.credit_card + declaredValues.debit_card,
          total_pix: declaredValues.pix,
          expected_total: expectedTotal,
          declared_total: totalDeclared,
          difference: difference,
          notes: declaredValues.notes,
          closed_by: profile?.id,
          status: Math.abs(difference) < 0.01 ? 'closed' : 'adjusted',
          details: summary
        }])
        .select()
        .single()
      
      if (error) throw error
      
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
      
      const diffMessage = difference === 0 ? 'Caixa fechou com valor exato!' : 
                          `Diferença de ${formatCurrency(Math.abs(difference))} ${difference > 0 ? 'a maior' : 'a menor'}`
      
      showFeedback('success', `Fechamento realizado! ${diffMessage}`)
      setShowClosingModal(false)
      fetchClosingHistory()
      
    } catch (error) {
      console.error('Erro ao fechar caixa:', error)
      showFeedback('error', 'Erro ao realizar fechamento: ' + error.message)
    } finally {
      setClosing(false)
    }
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

  if (loading && !summary) return <DataLoadingSkeleton />

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
              <Button variant="outline" onClick={generateSummary} loading={loading} icon={RefreshCw}>
                Atualizar
              </Button>
              <Button onClick={openClosingModal} icon={Calculator} disabled={!summary}>
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
            <div className="absolute inset-0 bg-black/30" onClick={() => !closing && setShowClosingModal(false)} />
            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">Fechamento de Caixa</h3>
                  <p className="text-sm text-gray-500">{formatDate(dateRange.start)} - {formatDate(dateRange.end)}</p>
                </div>
                <button onClick={() => !closing && setShowClosingModal(false)} className="text-gray-400 hover:text-gray-600">
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
                            disabled={closing}
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
                    disabled={closing}
                  />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowClosingModal(false)} disabled={closing}>
                  Cancelar
                </Button>
                <Button onClick={handleClosing} loading={closing} icon={Save}>
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

        {/* Modal de Detalhes */}
        {showDetailsModal && selectedClosing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30" onClick={() => setShowDetailsModal(false)} />
            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md max-h-[85vh] overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">Detalhes do Fechamento</h3>
                  <p className="text-sm text-gray-500">{formatDate(selectedClosing.closing_date)}</p>
                </div>
                <button onClick={() => setShowDetailsModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              
              <div className="p-6 overflow-y-auto space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Esperado</p>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(selectedClosing.expected_total)}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Declarado</p>
                    <p className="text-xl font-bold">{formatCurrency(selectedClosing.declared_total)}</p>
                  </div>
                </div>

                <div className={`p-3 rounded-lg ${Math.abs(selectedClosing.difference) < 0.01 ? 'bg-green-50' : 'bg-red-50'}`}>
                  <p className="text-xs text-gray-500">Diferença</p>
                  <p className={`text-xl font-bold ${getDifferenceColor(selectedClosing.difference)}`}>
                    {formatCurrency(selectedClosing.difference)}
                  </p>
                </div>

                <div className="border-t pt-3">
                  <p className="text-xs text-gray-500 mb-2">Detalhamento</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between"><span>Dinheiro</span><span>{formatCurrency(selectedClosing.total_cash)}</span></div>
                    <div className="flex justify-between"><span>Cartões</span><span>{formatCurrency(selectedClosing.total_card)}</span></div>
                    <div className="flex justify-between"><span>PIX</span><span>{formatCurrency(selectedClosing.total_pix)}</span></div>
                  </div>
                </div>

                {selectedClosing.notes && (
                  <div className="border-t pt-3">
                    <p className="text-xs text-gray-500 mb-1">Observações</p>
                    <p className="text-sm text-gray-600">{selectedClosing.notes}</p>
                  </div>
                )}

                <div className="border-t pt-3 text-xs text-gray-500">
                  <p>Fechado por: {users.find(u => u.id === selectedClosing.closed_by)?.full_name || 'Sistema'}</p>
                  <p>Data/Hora: {formatDateTime(selectedClosing.closed_at)}</p>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
                <Button variant="outline" onClick={() => setShowDetailsModal(false)}>Fechar</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CashierClosing