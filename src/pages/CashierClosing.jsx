// pages/CashierClosing.jsx
import React, { useState, useEffect } from 'react'
import { 
  DollarSign, CreditCard, Banknote, QrCode, 
  TrendingUp, TrendingDown, Users, Package,
  Calendar, Clock, CheckCircle, XCircle,
  Printer, Download, Eye, Ban, RefreshCw,
  User, FileText, AlertCircle, ChevronRight,
  Calculator
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext.jsx'
import FeedbackMessage from '../components/ui/FeedbackMessage'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import DataLoadingSkeleton from '../components/ui/DataLoadingSkeleton'
import DataTable from '../components/ui/DataTable'
import DataFilters from '../components/ui/DataFilters'
import DataCards from '../components/ui/DataCards'
import SplashScreen from '../components/ui/SplashScreen'
import { formatCurrency, formatNumber, formatDate, formatDateTime } from '../utils/formatters'
import useSystemLogs from '../hooks/useSystemLogs'
import useLogger from '../hooks/useLogger'

const CashierClosing = () => {
  const { profile } = useAuth()
  const { logAction, logError } = useSystemLogs()
  const { logComponentAction, logComponentError, logCreate } = useLogger('CashierClosing')
  
  // Estados
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [closingHistory, setClosingHistory] = useState([])
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })
  const [selectedUser, setSelectedUser] = useState('all')
  const [users, setUsers] = useState([])
  
  // Modais
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
  
  // Feedback
  const [feedback, setFeedback] = useState({ show: false, type: 'success', message: '' })

  useEffect(() => {
    fetchUsers()
    fetchClosingHistory()
    generateSummary()
    
    logComponentAction('ACCESS_PAGE', null, {
      page: 'cashier_closing',
      user_email: profile?.email
    })
  }, [])

  useEffect(() => {
    if (dateRange.start && dateRange.end) {
      generateSummary()
    }
  }, [dateRange, selectedUser])

  const showFeedback = (type, message) => {
    setFeedback({ show: true, type, message })
    setTimeout(() => setFeedback({ show: false, type: 'success', message: '' }), 3000)
  }

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .order('full_name')
      
      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
    }
  }

  const fetchClosingHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('cashier_closing')
        .select('*')
        .order('closed_at', { ascending: false })
        .limit(50)
      
      if (error) throw error
      setClosingHistory(data || [])
    } catch (error) {
      console.error('Erro ao carregar histórico:', error)
    }
  }

  const generateSummary = async () => {
    setLoading(true)
    setGenerating(true)
    
    try {
      const startDate = new Date(dateRange.start)
      startDate.setHours(0, 0, 0, 0)
      
      const endDate = new Date(dateRange.end)
      endDate.setHours(23, 59, 59, 999)
      
      const { data, error } = await supabase
        .rpc('get_cashier_summary', {
          p_start_date: startDate.toISOString(),
          p_end_date: endDate.toISOString(),
          p_user_id: selectedUser === 'all' ? null : selectedUser
        })
      
      if (error) throw error
      
      setSummary(data)
      
      // Inicializar valores declarados
      if (data?.meios_pagamento) {
        const declared = {
          cash: data.meios_pagamento.find(m => m.payment_method === 'cash')?.total || 0,
          credit_card: data.meios_pagamento.find(m => m.payment_method === 'credit_card')?.total || 0,
          debit_card: data.meios_pagamento.find(m => m.payment_method === 'debit_card')?.total || 0,
          pix: data.meios_pagamento.find(m => m.payment_method === 'pix')?.total || 0,
          notes: ''
        }
        setDeclaredValues(declared)
      }
      
      await logComponentAction('GENERATE_SUMMARY', null, {
        period: dateRange,
        user_id: selectedUser
      })
      
    } catch (error) {
      console.error('Erro ao gerar resumo:', error)
      await logComponentError(error, {
        action: 'generate_summary',
        dateRange,
        selectedUser
      })
      showFeedback('error', 'Erro ao gerar resumo do caixa')
    } finally {
      setLoading(false)
      setGenerating(false)
    }
  }

  const handleClosing = async () => {
    if (!summary) return
    
    setGenerating(true)
    
    try {
      const totalDeclared = declaredValues.cash + declaredValues.credit_card + 
                           declaredValues.debit_card + declaredValues.pix
      const expectedTotal = summary.resumo?.total_liquido || 0
      const difference = totalDeclared - expectedTotal
      
      const { data, error } = await supabase
        .from('cashier_closing')
        .insert([{
          closing_date: new Date().toISOString().split('T')[0],
          start_time: new Date(dateRange.start).toISOString(),
          end_time: new Date(dateRange.end).toISOString(),
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
          status: difference === 0 ? 'closed' : (Math.abs(difference) > 10 ? 'alert' : 'adjusted'),
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
      
      await logComponentAction('CLOSE_CASHIER', data.id, {
        period: dateRange,
        expected_total: expectedTotal,
        declared_total: totalDeclared,
        difference: difference
      })
      
      showFeedback('success', 'Fechamento de caixa realizado com sucesso!')
      setShowClosingModal(false)
      fetchClosingHistory()
      
      // Gerar relatório para impressão
      setSelectedClosing(data)
      setShowDetailsModal(true)
      
    } catch (error) {
      console.error('Erro ao fechar caixa:', error)
      await logComponentError(error, {
        action: 'close_cashier',
        dateRange,
        declaredValues
      })
      showFeedback('error', 'Erro ao realizar fechamento de caixa')
    } finally {
      setGenerating(false)
    }
  }

  const getDifferenceColor = (difference) => {
    if (difference === 0) return 'text-green-600'
    if (Math.abs(difference) < 10) return 'text-yellow-600'
    return 'text-red-600'
  }

  // Cards de resumo
  const summaryCards = summary ? [
    {
      title: 'Total de Vendas',
      value: formatCurrency(summary.resumo?.total_vendas || 0),
      icon: DollarSign,
      color: 'blue',
      subtitle: `${formatNumber(summary.resumo?.total_itens || 0)} itens vendidos`
    },
    {
      title: 'Descontos',
      value: formatCurrency(summary.resumo?.total_descontos || 0),
      icon: TrendingDown,
      color: 'orange',
      subtitle: `${((summary.resumo?.total_descontos / summary.resumo?.total_vendas) * 100 || 0).toFixed(1)}% do total`
    },
    {
      title: 'Cancelamentos',
      value: formatCurrency(summary.resumo?.total_cancelamentos || 0),
      icon: XCircle,
      color: 'red',
      subtitle: 'Vendas canceladas'
    },
    {
      title: 'Ticket Médio',
      value: formatCurrency(summary.resumo?.ticket_medio || 0),
      icon: TrendingUp,
      color: 'green',
      subtitle: `${formatNumber(summary.resumo?.total_clientes || 0)} clientes atendidos`
    }
  ] : []

  // Configuração da tabela de vendas por usuário
  const userSalesColumns = [
    {
      key: 'user_name',
      header: 'Operador',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          <User size={16} className="text-gray-400" />
          <span className="font-medium">{row.user_name || 'Sistema'}</span>
        </div>
      )
    },
    {
      key: 'total_vendas',
      header: 'Vendas',
      sortable: true,
      render: (row) => (
        <div className="text-center">
          <span className="font-semibold">{formatNumber(row.total_vendas)}</span>
        </div>
      )
    },
    {
      key: 'total_valor',
      header: 'Valor Total',
      sortable: true,
      render: (row) => (
        <div className="font-semibold text-green-600">
          {formatCurrency(row.total_valor)}
        </div>
      )
    },
    {
      key: 'total_descontos',
      header: 'Descontos',
      sortable: true,
      render: (row) => (
        <div className="text-orange-600">
          {formatCurrency(row.total_descontos)}
        </div>
      )
    },
    {
      key: 'media_ticket',
      header: 'Ticket Médio',
      sortable: true,
      render: (row) => (
        <div>{formatCurrency(row.media_ticket)}</div>
      )
    }
  ]

  // Configuração da tabela de meios de pagamento
  const paymentColumns = [
    {
      key: 'payment_method',
      header: 'Forma de Pagamento',
      render: (row) => {
        const icons = {
          cash: Banknote,
          credit_card: CreditCard,
          debit_card: CreditCard,
          pix: QrCode
        }
        const Icon = icons[row.payment_method] || DollarSign
        const labels = {
          cash: 'Dinheiro',
          credit_card: 'Cartão Crédito',
          debit_card: 'Cartão Débito',
          pix: 'PIX'
        }
        return (
          <div className="flex items-center gap-2">
            <Icon size={18} className="text-gray-500" />
            <span>{labels[row.payment_method] || row.payment_method}</span>
          </div>
        )
      }
    },
    {
      key: 'count',
      header: 'Qtd. Vendas',
      render: (row) => (
        <div className="text-center font-medium">{formatNumber(row.count)}</div>
      )
    },
    {
      key: 'total',
      header: 'Valor Total',
      render: (row) => (
        <div className="font-semibold text-green-600">
          {formatCurrency(row.total)}
        </div>
      )
    }
  ]

  // Configuração da tabela de histórico
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
      render: (row) => formatCurrency(row.expected_total)
    },
    {
      key: 'declared_total',
      header: 'Declarado',
      render: (row) => formatCurrency(row.declared_total)
    },
    {
      key: 'difference',
      header: 'Diferença',
      render: (row) => (
        <span className={`font-semibold ${getDifferenceColor(row.difference)}`}>
          {formatCurrency(row.difference)}
        </span>
      )
    },
    {
      key: 'closed_by',
      header: 'Fechado por',
      render: (row) => {
        const user = users.find(u => u.id === row.closed_by)
        return user?.full_name || user?.email || 'Sistema'
      }
    },
    {
      key: 'closed_at',
      header: 'Data/Hora',
      render: (row) => formatDateTime(row.closed_at)
    }
  ]

  const historyActions = [
    {
      label: 'Ver detalhes',
      icon: <Eye size={18} />,
      className: 'text-blue-600 hover:text-blue-800',
      onClick: (row) => {
        setSelectedClosing(row)
        setShowDetailsModal(true)
      }
    },
    {
      label: 'Imprimir',
      icon: <Printer size={18} />,
      className: 'text-gray-600 hover:text-gray-800',
      onClick: (row) => {
        logComponentAction('PRINT_CLOSING', row.id, {
          closing_date: row.closing_date
        })
        window.print()
      }
    }
  ]

  if (loading && !summary) {
    return <DataLoadingSkeleton />
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Feedback */}
        {feedback.show && (
          <div className="mb-4">
            <FeedbackMessage
              type={feedback.type}
              message={feedback.message}
              onClose={() => setFeedback({ show: false, type: 'success', message: '' })}
            />
          </div>
        )}

        {/* Cabeçalho */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Fechamento de Caixa</h1>
            <p className="text-gray-600 mt-1">Controle e conciliação de vendas por período</p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => setShowHistoryModal(true)}
              icon={FileText}
            >
              Histórico
            </Button>
            <Button 
              onClick={() => setShowClosingModal(true)}
              icon={CheckCircle}
              disabled={generating || !summary}
            >
              Fechar Caixa
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Inicial
              </label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Final
              </label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Operador
              </label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos os operadores</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.full_name || user.email}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button onClick={generateSummary} loading={generating} variant="primary">
              <RefreshCw size={16} className="mr-2" />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Cards de Resumo */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {summaryCards.map((card, index) => {
              const Icon = card.icon
              const colorClasses = {
                blue: 'border-blue-500 bg-blue-50',
                orange: 'border-orange-500 bg-orange-50',
                red: 'border-red-500 bg-red-50',
                green: 'border-green-500 bg-green-50'
              }
              const iconColors = {
                blue: 'text-blue-600',
                orange: 'text-orange-600',
                red: 'text-red-600',
                green: 'text-green-600'
              }
              
              return (
                <div key={index} className={`bg-white rounded-lg shadow-sm p-4 border-l-4 ${colorClasses[card.color]}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">{card.title}</p>
                      <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                      {card.subtitle && (
                        <p className="text-xs text-gray-500 mt-1">{card.subtitle}</p>
                      )}
                    </div>
                    <div className={`w-12 h-12 rounded-full ${colorClasses[card.color]} flex items-center justify-center`}>
                      <Icon size={24} className={iconColors[card.color]} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Meios de Pagamento */}
        {summary && summary.meios_pagamento?.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard size={20} />
              Vendas por Meio de Pagamento
            </h2>
            <DataTable
              columns={paymentColumns}
              data={summary.meios_pagamento}
              pagination={false}
              striped={true}
            />
          </div>
        )}

        {/* Vendas por Usuário */}
        {summary && summary.vendas_por_usuario?.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users size={20} />
              Desempenho por Operador
            </h2>
            <DataTable
              columns={userSalesColumns}
              data={summary.vendas_por_usuario}
              pagination={false}
              striped={true}
            />
          </div>
        )}

        {/* Resumo Final */}
        {summary && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-sm p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Total de Vendas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(summary.resumo?.total_vendas || 0)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Descontos</p>
                <p className="text-2xl font-bold text-orange-600">
                  -{formatCurrency(summary.resumo?.total_descontos || 0)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Valor Líquido</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(summary.resumo?.total_liquido || 0)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Fechamento */}
        <Modal
          isOpen={showClosingModal}
          onClose={() => !generating && setShowClosingModal(false)}
          title="Fechamento de Caixa"
          size="lg"
          isLoading={generating}
        >
          {summary && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Resumo do Período</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Período:</span>
                    <span className="font-medium">
                      {formatDate(dateRange.start)} a {formatDate(dateRange.end)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total de Vendas:</span>
                    <span>{formatCurrency(summary.resumo?.total_vendas || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Descontos:</span>
                    <span className="text-orange-600">-{formatCurrency(summary.resumo?.total_descontos || 0)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-semibold">Valor Esperado:</span>
                    <span className="font-bold text-green-600">
                      {formatCurrency(summary.resumo?.total_liquido || 0)}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-3">Valores Declarados</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Banknote size={20} className="text-green-600" />
                      <span>Dinheiro</span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      value={declaredValues.cash}
                      onChange={(e) => setDeclaredValues({ ...declaredValues, cash: parseFloat(e.target.value) || 0 })}
                      className="w-40 px-3 py-1 text-right border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white border rounded-lg">
                    <div className="flex items-center gap-2">
                      <CreditCard size={20} className="text-blue-600" />
                      <span>Cartão Crédito</span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      value={declaredValues.credit_card}
                      onChange={(e) => setDeclaredValues({ ...declaredValues, credit_card: parseFloat(e.target.value) || 0 })}
                      className="w-40 px-3 py-1 text-right border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white border rounded-lg">
                    <div className="flex items-center gap-2">
                      <CreditCard size={20} className="text-purple-600" />
                      <span>Cartão Débito</span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      value={declaredValues.debit_card}
                      onChange={(e) => setDeclaredValues({ ...declaredValues, debit_card: parseFloat(e.target.value) || 0 })}
                      className="w-40 px-3 py-1 text-right border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white border rounded-lg">
                    <div className="flex items-center gap-2">
                      <QrCode size={20} className="text-emerald-600" />
                      <span>PIX</span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      value={declaredValues.pix}
                      onChange={(e) => setDeclaredValues({ ...declaredValues, pix: parseFloat(e.target.value) || 0 })}
                      className="w-40 px-3 py-1 text-right border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observações
                </label>
                <textarea
                  value={declaredValues.notes}
                  onChange={(e) => setDeclaredValues({ ...declaredValues, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Informações adicionais sobre o fechamento..."
                />
              </div>

              {(() => {
                const totalDeclared = declaredValues.cash + declaredValues.credit_card + 
                                     declaredValues.debit_card + declaredValues.pix
                const expectedTotal = summary.resumo?.total_liquido || 0
                const difference = totalDeclared - expectedTotal
                
                return (
                  <div className={`p-4 rounded-lg ${
                    difference === 0 ? 'bg-green-50' : 
                    Math.abs(difference) < 10 ? 'bg-yellow-50' : 'bg-red-50'
                  }`}>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium">Total Declarado</p>
                        <p className="text-xl font-bold">{formatCurrency(totalDeclared)}</p>
                      </div>
                      <ChevronRight size={24} className="text-gray-400" />
                      <div>
                        <p className="text-sm font-medium">Valor Esperado</p>
                        <p className="text-xl font-bold">{formatCurrency(expectedTotal)}</p>
                      </div>
                      <ChevronRight size={24} className="text-gray-400" />
                      <div>
                        <p className="text-sm font-medium">Diferença</p>
                        <p className={`text-xl font-bold ${getDifferenceColor(difference)}`}>
                          {formatCurrency(difference)}
                        </p>
                      </div>
                    </div>
                    {Math.abs(difference) > 10 && (
                      <div className="mt-3 flex items-center gap-2 text-sm text-red-700 bg-red-100 p-2 rounded">
                        <AlertCircle size={16} />
                        Atenção: Diferença significativa detectada. Verifique os valores.
                      </div>
                    )}
                  </div>
                )
              })()}

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowClosingModal(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={handleClosing} loading={generating} className="flex-1">
                  Confirmar Fechamento
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Modal de Histórico */}
        <Modal
          isOpen={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
          title="Histórico de Fechamentos"
          size="xl"
        >
          <DataTable
            columns={historyColumns}
            data={closingHistory}
            actions={historyActions}
            emptyMessage="Nenhum fechamento encontrado"
            striped={true}
            hover={true}
            pagination={true}
            itemsPerPageOptions={[20, 50, 100]}
            defaultItemsPerPage={20}
          />
        </Modal>

        {/* Modal de Detalhes */}
        <Modal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          title={`Detalhes do Fechamento - ${selectedClosing?.closing_date ? formatDate(selectedClosing.closing_date) : ''}`}
          size="xl"
        >
          {selectedClosing && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-xs text-gray-500">Data do Fechamento</p>
                  <p className="font-medium">{formatDateTime(selectedClosing.closed_at)}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-xs text-gray-500">Fechado por</p>
                  <p className="font-medium">
                    {users.find(u => u.id === selectedClosing.closed_by)?.full_name || 'Sistema'}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-medium text-gray-900 mb-3">Resumo do Período</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500">Total de Vendas</p>
                    <p className="font-semibold">{formatCurrency(selectedClosing.total_sales)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Descontos</p>
                    <p className="font-semibold text-orange-600">-{formatCurrency(selectedClosing.total_discounts)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Cancelamentos</p>
                    <p className="font-semibold text-red-600">{formatCurrency(selectedClosing.total_cancellations)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Valor Esperado</p>
                    <p className="font-semibold text-green-600">{formatCurrency(selectedClosing.expected_total)}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-medium text-gray-900 mb-3">Valores Declarados</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Dinheiro</span>
                    <span className="font-medium">{formatCurrency(selectedClosing.total_cash)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cartões</span>
                    <span className="font-medium">{formatCurrency(selectedClosing.total_card)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>PIX</span>
                    <span className="font-medium">{formatCurrency(selectedClosing.total_pix)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-semibold">Total Declarado</span>
                    <span className="font-bold">{formatCurrency(selectedClosing.declared_total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Diferença</span>
                    <span className={`font-bold ${getDifferenceColor(selectedClosing.difference)}`}>
                      {formatCurrency(selectedClosing.difference)}
                    </span>
                  </div>
                </div>
              </div>

              {selectedClosing.notes && (
                <div className="border-t pt-4">
                  <h3 className="font-medium text-gray-900 mb-2">Observações</h3>
                  <p className="text-gray-600 text-sm">{selectedClosing.notes}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowDetailsModal(false)} className="flex-1">
                  Fechar
                </Button>
                <Button onClick={() => window.print()} className="flex-1">
                  <Printer size={16} className="mr-2" />
                  Imprimir
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  )
}

export default CashierClosing