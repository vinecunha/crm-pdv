import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Eye, Ban, Printer, Search, Filter, RefreshCw,
  FileText, DollarSign, Ticket, Download
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import FeedbackMessage from '../components/ui/FeedbackMessage'
import DataLoadingSkeleton from '../components/ui/DataLoadingSkeleton'
import DataTable from '../components/ui/DataTable'
import Button from '../components/ui/Button'
import Badge from '../components/Badge'
import { formatCurrency, formatNumber, formatDateTime } from '../utils/formatters'
import useSystemLogs from '../hooks/useSystemLogs'
import useLogger from '../hooks/useLogger'
import useDebounce from '../hooks/useDebounce'
import CancelSaleModal from '../components/sales/management/CancelSaleModal'

// ============= API Functions =============
const fetchSales = async ({ queryKey }) => {
  const [, { searchTerm, filters }] = queryKey
  
  let query = supabase.from('sales').select('*').order('created_at', { ascending: false })
  
  if (searchTerm?.trim()) {
    query = query.or(`sale_number.ilike.%${searchTerm}%,customer_name.ilike.%${searchTerm}%,customer_phone.ilike.%${searchTerm}%`)
  }
  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }
  if (filters?.start_date) {
    query = query.gte('created_at', filters.start_date)
  }
  if (filters?.end_date) {
    query = query.lte('created_at', filters.end_date)
  }
  if (filters?.payment_method && filters.payment_method !== 'all') {
    query = query.eq('payment_method', filters.payment_method)
  }
  
  const { data, error } = await query
  if (error) throw error
  return data || []
}

const fetchSaleItems = async (saleId) => {
  const { data, error } = await supabase
    .from('sale_items')
    .select('*')
    .eq('sale_id', saleId)
    .order('created_at', { ascending: true })
  
  if (error) throw error
  return data || []
}

const cancelSaleWithApproval = async ({ saleNumber, cancelledBy, approvedBy, reason, notes }) => {
  const { error } = await supabase.rpc('cancel_sale_with_approval', {
    p_sale_number: saleNumber,
    p_cancelled_by: cancelledBy,
    p_approved_by: approvedBy,
    p_cancellation_reason: reason,
    p_cancellation_notes: notes || null
  })
  
  if (error) throw error
  return { saleNumber }
}

// ============= Componentes Internos =============
const StatCard = ({ label, value, sublabel, icon: Icon, variant = 'default' }) => {
  const variants = {
    default: 'bg-white border-gray-200',
    success: 'bg-green-50 border-green-200',
    warning: 'bg-yellow-50 border-yellow-200',
    danger: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200',
    purple: 'bg-purple-50 border-purple-200'
  }

  const iconColors = {
    default: 'text-gray-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    danger: 'text-red-600',
    info: 'text-blue-600',
    purple: 'text-purple-600'
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

// ============= Componente Principal =============
const SalesList = () => {
  const { profile } = useAuth()
  const { logAction } = useSystemLogs()
  const { logComponentAction, logComponentError } = useLogger('SalesList')
  const queryClient = useQueryClient()
  
  // Estados para busca com debounce
  const [localSearchTerm, setLocalSearchTerm] = useState('')
  const debouncedSearchTerm = useDebounce(localSearchTerm, 400)
  
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    status: 'all',
    payment_method: 'all',
    start_date: '',
    end_date: ''
  })
  
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [selectedSale, setSelectedSale] = useState(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelNotes, setCancelNotes] = useState('')
  const [feedback, setFeedback] = useState({ show: false, type: 'success', message: '' })

  const canCancelDirectly = profile?.role === 'admin' || profile?.role === 'gerente'
  const canRequestCancellation = profile?.role === 'operador'

  const paymentIcons = { cash: '💵', credit_card: '💳', debit_card: '🏧', pix: '📱' }
  const paymentLabels = { cash: 'Dinheiro', credit_card: 'Crédito', debit_card: 'Débito', pix: 'PIX' }

  // ============= Queries =============
  const { 
    data: sales = [], 
    isLoading,
    error,
    refetch,
    isFetching
  } = useQuery({
    queryKey: ['sales', { searchTerm: debouncedSearchTerm, filters }],
    queryFn: fetchSales,
    staleTime: 2 * 60 * 1000,
  })

  const { 
    data: saleItems = [],
    isLoading: isLoadingItems
  } = useQuery({
    queryKey: ['sale-items', selectedSale?.id],
    queryFn: () => fetchSaleItems(selectedSale?.id),
    enabled: !!selectedSale?.id && showDetailsModal,
  })

  // ============= Mutation =============
  const cancelMutation = useMutation({
    mutationFn: cancelSaleWithApproval,
    onSuccess: async (data, variables) => {
      await logAction({ 
        action: 'CANCEL_SALE', 
        entityType: 'sale', 
        entityId: selectedSale?.id, 
        details: { 
          sale_number: data.saleNumber, 
          reason: variables.reason,
          cancelled_by: profile?.email,
          approved_by: variables.approvedBy
        }, 
        severity: 'WARNING' 
      })
      
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      
      const message = canCancelDirectly 
        ? `Venda ${data.saleNumber} cancelada!`
        : `Venda ${data.saleNumber} cancelada com aprovação!`
      
      showFeedback('success', message)
      setShowCancelModal(false)
      setShowDetailsModal(false)
      setSelectedSale(null)
      setCancelReason('')
      setCancelNotes('')
    },
    onError: async (error) => {
      showFeedback('error', `Erro ao cancelar: ${error.message}`)
      await logComponentError(error, { action: 'cancel_sale' })
    }
  })

  // ============= Efeitos =============
  React.useEffect(() => {
    logComponentAction('ACCESS_PAGE', null, { page: 'sales_list', user_email: profile?.email })
  }, [])

  // ============= Handlers =============
  const showFeedback = (type, message) => {
    setFeedback({ show: true, type, message })
    setTimeout(() => setFeedback({ show: false, type: 'success', message: '' }), 3000)
  }

  const viewSaleDetails = (sale) => {
    setSelectedSale(sale)
    setShowDetailsModal(true)
    logComponentAction('VIEW_SALE_DETAILS', sale.id, { sale_number: sale.sale_number })
  }

  const handleCancelWithApproval = (approvalData) => {
    cancelMutation.mutate({
      saleNumber: selectedSale.sale_number,
      cancelledBy: profile?.id,
      approvedBy: approvalData.approvedBy,
      approverName: approvalData.approverName,
      approverRole: approvalData.approverRole,
      reason: cancelReason,
      notes: cancelNotes
    })
  }

  const handleExport = () => {
    showFeedback('info', 'Exportação em desenvolvimento')
  }

  // ============= Dados Calculados =============
  const summary = React.useMemo(() => {
    const salesArray = Array.isArray(sales) ? sales : []
    const completed = salesArray.filter(s => s.status === 'completed')
    const cancelled = salesArray.filter(s => s.status === 'cancelled')
    
    return {
      totalAmount: completed.reduce((sum, s) => sum + (s.final_amount || 0), 0),
      totalDiscount: completed.reduce((sum, s) => sum + (s.discount_amount || 0), 0),
      completedCount: completed.length,
      cancelledCount: cancelled.length,
      totalCount: sales.length,
      averageTicket: completed.length > 0 
        ? completed.reduce((sum, s) => sum + (s.final_amount || 0), 0) / completed.length 
        : 0
    }
  }, [sales])

  // ============= Colunas da Tabela =============
  const columns = [
    {
      key: 'sale_number',
      header: 'Venda',
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-medium text-gray-900">#{row.sale_number}</p>
          <p className="text-xs text-gray-500">{formatDateTime(row.created_at)}</p>
        </div>
      )
    },
    {
      key: 'customer_name',
      header: 'Cliente',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
            {row.customer_name?.charAt(0) || 'C'}
          </div>
          <div>
            <p className="font-medium text-gray-900">{row.customer_name || 'Cliente não identificado'}</p>
            {row.customer_phone && <p className="text-xs text-gray-500">{row.customer_phone}</p>}
          </div>
        </div>
      )
    },
    {
      key: 'payment_method',
      header: 'Pagamento',
      render: (row) => (
        <div className="flex items-center gap-1">
          <span className="text-lg">{paymentIcons[row.payment_method] || '💰'}</span>
          <span className="text-sm text-gray-700">{paymentLabels[row.payment_method] || row.payment_method}</span>
        </div>
      )
    },
    {
      key: 'final_amount',
      header: 'Total',
      sortable: true,
      render: (row) => (
        <div className="text-right">
          <p className="font-semibold text-gray-900">{formatCurrency(row.final_amount)}</p>
          {row.discount_amount > 0 && (
            <p className="text-xs text-green-600">-{formatCurrency(row.discount_amount)}</p>
          )}
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row) => {
        const config = {
          completed: { label: 'Concluída', variant: 'success' },
          cancelled: { label: 'Cancelada', variant: 'danger' },
          pending: { label: 'Pendente', variant: 'warning' }
        }
        const c = config[row.status] || config.completed
        return <Badge variant={c.variant}>{c.label}</Badge>
      }
    }
  ]

  const actions = [
    {
      label: 'Ver detalhes',
      icon: <Eye size={16} />,
      onClick: viewSaleDetails,
      className: 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
    },
    ...(canCancelDirectly || canRequestCancellation ? [{
      label: canCancelDirectly ? 'Cancelar' : 'Solicitar Cancelamento',
      icon: <Ban size={16} />,
      onClick: (row) => { 
        setSelectedSale(row)
        setCancelReason('')
        setCancelNotes('')
        setShowCancelModal(true) 
      },
      className: canCancelDirectly 
        ? 'text-gray-500 hover:text-red-600 hover:bg-red-50' 
        : 'text-gray-500 hover:text-orange-600 hover:bg-orange-50',
      disabled: (row) => row.status !== 'completed'
    }] : []),
    {
      label: 'Imprimir',
      icon: <Printer size={16} />,
      onClick: () => showFeedback('info', 'Impressão em desenvolvimento'),
      className: 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
    }
  ]

  // ============= Render =============
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erro ao carregar vendas</h2>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <Button onClick={() => refetch()}>Tentar novamente</Button>
        </div>
      </div>
    )
  }

  if (isLoading && sales.length === 0) return <DataLoadingSkeleton />

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {feedback.show && (
          <FeedbackMessage type={feedback.type} message={feedback.message} onClose={() => setFeedback({ show: false })} />
        )}

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestão de Vendas</h1>
              <p className="text-gray-500 mt-1">
                Visualize, cancele e gerencie todas as vendas realizadas
                {isFetching && (
                  <span className="ml-2 text-xs text-gray-400">atualizando...</span>
                )}
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => refetch()} loading={isLoading} icon={RefreshCw}>
                Atualizar
              </Button>
              <Button variant="outline" onClick={handleExport} icon={Download}>
                Exportar
              </Button>
            </div>
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard 
            label="Total de Vendas" 
            value={formatNumber(summary.totalCount)} 
            sublabel={`${summary.completedCount} concluídas`} 
            icon={FileText} 
            variant="info" 
          />
          <StatCard 
            label="Faturamento" 
            value={formatCurrency(summary.totalAmount)} 
            sublabel={`Ticket: ${formatCurrency(summary.averageTicket)}`} 
            icon={DollarSign} 
            variant="success" 
          />
          <StatCard 
            label="Descontos" 
            value={formatCurrency(summary.totalDiscount)} 
            sublabel={`${((summary.totalDiscount / summary.totalAmount) * 100 || 0).toFixed(1)}%`} 
            icon={Ticket} 
            variant="purple" 
          />
          <StatCard 
            label="Cancelamentos" 
            value={formatNumber(summary.cancelledCount)} 
            sublabel={`${((summary.cancelledCount / summary.totalCount) * 100 || 0).toFixed(1)}%`} 
            icon={Ban} 
            variant={summary.cancelledCount > 0 ? 'warning' : 'default'} 
          />
        </div>

        {/* Barra de Busca e Filtros - COM DEBOUNCE */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[250px] relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nº venda, cliente ou telefone..."
                value={localSearchTerm}
                onChange={(e) => setLocalSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              {/* Indicador de busca em andamento */}
              {localSearchTerm !== debouncedSearchTerm && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)} icon={Filter}>
              Filtros {Object.values(filters).some(v => v && v !== 'all') && '•'}
            </Button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-100">
              <select 
                value={filters.status} 
                onChange={(e) => setFilters({ ...filters, status: e.target.value })} 
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">Todos os status</option>
                <option value="completed">Concluídas</option>
                <option value="cancelled">Canceladas</option>
                <option value="pending">Pendentes</option>
              </select>
              <select 
                value={filters.payment_method} 
                onChange={(e) => setFilters({ ...filters, payment_method: e.target.value })} 
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">Todas as formas</option>
                <option value="cash">Dinheiro</option>
                <option value="credit_card">Crédito</option>
                <option value="debit_card">Débito</option>
                <option value="pix">PIX</option>
              </select>
              <input 
                type="date" 
                value={filters.start_date} 
                onChange={(e) => setFilters({ ...filters, start_date: e.target.value })} 
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm" 
              />
              <input 
                type="date" 
                value={filters.end_date} 
                onChange={(e) => setFilters({ ...filters, end_date: e.target.value })} 
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm" 
              />
            </div>
          )}
        </div>

        {/* Tabela */}
        <DataTable
          columns={columns}
          data={sales}
          actions={actions}
          onRowClick={viewSaleDetails}
          emptyMessage="Nenhuma venda encontrada"
          striped
          hover
          pagination
          itemsPerPageOptions={[20, 50, 100]}
          defaultItemsPerPage={20}
          showTotalItems
        />

        {/* Modal de Detalhes */}
        {showDetailsModal && selectedSale && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30" onClick={() => setShowDetailsModal(false)} />
            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">Detalhes da Venda #{selectedSale.sale_number}</h3>
                  <p className="text-sm text-gray-500">{formatDateTime(selectedSale.created_at)}</p>
                </div>
                <button onClick={() => setShowDetailsModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-xs text-blue-600 font-medium mb-2">CLIENTE</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium">
                      {selectedSale.customer_name?.charAt(0) || 'C'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{selectedSale.customer_name || 'Cliente não identificado'}</p>
                      {selectedSale.customer_phone && <p className="text-sm text-gray-500">{selectedSale.customer_phone}</p>}
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-500 font-medium mb-2">ITENS</p>
                  {isLoadingItems ? (
                    <div className="text-center py-4">
                      <RefreshCw size={20} className="animate-spin mx-auto text-gray-400" />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {saleItems.map((item, i) => (
                        <div key={i} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                          <span className="text-gray-700">{item.product_name} x{item.quantity}</span>
                          <span className="font-medium">{formatCurrency(item.total_price)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t pt-3 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Subtotal</span>
                    <span>{formatCurrency(selectedSale.total_amount)}</span>
                  </div>
                  {selectedSale.discount_amount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-green-600">
                        Desconto {selectedSale.coupon_code && `(${selectedSale.coupon_code})`}
                      </span>
                      <span className="text-green-600">-{formatCurrency(selectedSale.discount_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold pt-2 border-t">
                    <span>Total</span>
                    <span className="text-green-600">{formatCurrency(selectedSale.final_amount)}</span>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowDetailsModal(false)}>Fechar</Button>
                {selectedSale.status === 'completed' && (canCancelDirectly || canRequestCancellation) && (
                  <Button 
                    variant="danger" 
                    onClick={() => { 
                      setShowDetailsModal(false)
                      setCancelReason('')
                      setCancelNotes('')
                      setShowCancelModal(true) 
                    }}
                    disabled={cancelMutation.isPending}
                  >
                    {canCancelDirectly ? 'Cancelar Venda' : 'Solicitar Cancelamento'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal de Cancelamento */}
        <CancelSaleModal
          isOpen={showCancelModal}
          onClose={() => !cancelMutation.isPending && setShowCancelModal(false)}
          sale={selectedSale}
          cancelReason={cancelReason}
          setCancelReason={setCancelReason}
          cancelNotes={cancelNotes}
          setCancelNotes={setCancelNotes}
          onConfirm={handleCancelWithApproval}
          isSubmitting={cancelMutation.isPending}
          currentUser={profile}
        />
      </div>
    </div>
  )
}

export default SalesList