// src/pages/SalesList.jsx
import React, { useState } from 'react'
import { 
  Eye, Ban, Printer, Search, Filter, RefreshCw,
  FileText, DollarSign, Ticket, Download, XCircle, CheckCircle, Clock, ShoppingCart, Receipt
} from '@lib/icons'
import { useAuth } from '@contexts/AuthContext'
import FeedbackMessage from '@components/ui/FeedbackMessage'
import DataLoadingSkeleton from '@components/ui/DataLoadingSkeleton'
import DataTable from '@components/ui/DataTable'
import DataCards from '@components/ui/DataCards'
import SalesListCard from '@components/sales/management/SalesListCard' 
import Button from '@components/ui/Button'
import Badge from '@components/Badge'
import PageHeader from '@components/ui/PageHeader'
import { formatCurrency, formatNumber, formatDateTime } from '@utils/formatters'
import { useSystemLogs } from '@hooks/system/useSystemLogs'
import useLogger from '@hooks/system/useLogger'
import useDebounce from '@/hooks/utils/useDebounce'
import useMediaQuery from '@/hooks/utils/useMediaQuery'
import SalesListModalsContainer from '@components/sales/management/SalesListModalsContainer'

// ✅ Hooks centralizados
import { useSalesListHandlers } from '@hooks/handlers'
import { useSaleMutations } from '@hooks/mutations'
import { useSalesListQueries } from '@hooks/queries/useSalesListQueries'

const StatCard = ({ label, value, sublabel, icon: Icon, variant = 'default' }) => {
  // ... (permanece igual)
}

const SalesList = () => {
  const { profile } = useAuth()
  const { logAction } = useSystemLogs()
  const { logComponentAction, logComponentError } = useLogger('SalesList')

  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [receiptSale, setReceiptSale] = useState(null)
  const [receiptItems, setReceiptItems] = useState([])
  const [isLoadingReceiptItems, setIsLoadingReceiptItems] = useState(false)

  const isMobile = useMediaQuery('(max-width: 768px)')
  const [viewMode, setViewMode] = useState('auto')
  
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

  const effectiveViewMode = viewMode === 'auto' 
    ? (isMobile ? 'cards' : 'table')
    : viewMode

  const canCancelDirectly = profile?.role === 'admin' || profile?.role === 'gerente'
  const canRequestCancellation = profile?.role === 'operador'

  const paymentIcons = { cash: '💵', credit_card: '💳', debit_card: '🏧', pix: '📱' }
  const paymentLabels = { cash: 'Dinheiro', credit_card: 'Crédito', debit_card: 'Débito', pix: 'PIX' }

  // ✅ Queries centralizadas
  const {
    sales,
    isLoading,
    error,
    refetch,
    isFetching,
    saleItems,
    isLoadingItems
  } = useSalesListQueries({ debouncedSearchTerm, filters, selectedSale, showDetailsModal })

  // ✅ Mutations com callbacks
  const { cancelMutation } = useSaleMutations(profile, {
    onSaleCancelled: (data, variables) => {
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
    onError: (error) => {
      showFeedback('error', `Erro ao cancelar: ${error.message}`)
    }
  })

  const showFeedback = (type, message) => {
    setFeedback({ show: true, type, message })
    setTimeout(() => setFeedback({ show: false, type: 'success', message: '' }), 3000)
  }

  // ✅ Handlers
  const handlers = useSalesListHandlers({
    profile,
    canCancelDirectly,
    canRequestCancellation,
    selectedSale,
    setSelectedSale,
    cancelReason,
    setCancelReason,
    cancelNotes,
    setCancelNotes,
    receiptSale,
    setReceiptSale,
    receiptItems,
    setReceiptItems,
    setIsLoadingReceiptItems,
    showReceiptModal,
    setShowReceiptModal,
    showDetailsModal,
    setShowDetailsModal,
    showCancelModal,
    setShowCancelModal,
    cancelMutation,
    refetch,
    showFeedback,
    logComponentAction,
    logAction
  })

  React.useEffect(() => {
    logComponentAction('ACCESS_PAGE', null, { page: 'sales_list', user_email: profile?.email })
  }, [])

  const renderSaleCard = (sale) => (
    <SalesListCard
      sale={sale}
      onViewDetails={handlers.viewSaleDetails}
      onReceipt={handlers.openReceipt} 
      onCancel={handlers.openCancelModal}
      onPrint={handlers.openReceipt}
      canCancel={canCancelDirectly}
      canRequestCancellation={canRequestCancellation}
    />
  )

  const summary = React.useMemo(() => {
    const salesArray = Array.isArray(sales) ? sales : []
    const completed = salesArray.filter(s => s.status === 'completed')
    const cancelled = salesArray.filter(s => s.status === 'cancelled')
    
    return {
      totalAmount: completed.reduce((sum, s) => sum + (s.final_amount || 0), 0),
      totalDiscount: completed.reduce((sum, s) => sum + (s.discount_amount || 0), 0),
      completedCount: completed.length,
      cancelledCount: cancelled.length,
      totalCount: salesArray.length,
      averageTicket: completed.length > 0 
        ? completed.reduce((sum, s) => sum + (s.final_amount || 0), 0) / completed.length 
        : 0
    }
  }, [sales])

  const columns = [
    {
      key: 'sale_number',
      header: 'Venda',
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-white text-sm">#{row.sale_number}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{formatDateTime(row.created_at)}</p>
        </div>
      )
    },
    {
      key: 'customer_name',
      header: 'Cliente',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
            {row.customer_name?.charAt(0) || 'C'}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{row.customer_name || 'Cliente não identificado'}</p>
            {row.customer_phone && <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{row.customer_phone}</p>}
          </div>
        </div>
      )
    },
    {
      key: 'payment_method',
      header: 'Pagamento',
      render: (row) => (
        <div className="flex items-center gap-1">
          <span className="text-base sm:text-lg">{paymentIcons[row.payment_method] || '💰'}</span>
          <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">{paymentLabels[row.payment_method] || row.payment_method}</span>
        </div>
      )
    },
    {
      key: 'final_amount',
      header: 'Total',
      sortable: true,
      render: (row) => (
        <div className="text-right">
          <p className="font-semibold text-gray-900 dark:text-white text-sm">{formatCurrency(row.final_amount)}</p>
          {row.discount_amount > 0 && <p className="text-xs text-green-600 dark:text-green-400">-{formatCurrency(row.discount_amount)}</p>}
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row) => {
        const config = {
          completed: { label: 'Concluída', variant: 'success', icon: CheckCircle },
          cancelled: { label: 'Cancelada', variant: 'danger', icon: XCircle },
          pending: { label: 'Pendente', variant: 'warning', icon: Clock }
        }
        const c = config[row.status] || config.completed
        return <Badge variant={c.variant} size="sm">{c.label}</Badge>
      }
    }
  ]

  const actions = [
    { 
      label: 'Ver detalhes', 
      icon: <Eye size={16} />, 
      onClick: handlers.viewSaleDetails, 
      className: 'text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30' 
    },
    { 
      label: 'Recibo', 
      icon: <Receipt size={16} />, 
      onClick: handlers.openReceipt, 
      className: 'text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30' 
    },
    ...(canCancelDirectly || canRequestCancellation ? [{
      label: canCancelDirectly ? 'Cancelar' : 'Solicitar',
      icon: <Ban size={16} />,
      onClick: handlers.openCancelModal,
      className: canCancelDirectly ? 'text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30' : 'text-gray-500 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/30',
      disabled: handlers.isCancelActionDisabled
    }] : []),
    { 
      label: 'Imprimir', 
      icon: <Printer size={16} />, 
      onClick: handlers.openReceipt,
      className: 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700' 
    }
  ]

  const headerActions = [
    {
      label: 'Atualizar',
      icon: RefreshCw,
      onClick: handlers.handleRefresh,
      loading: isLoading,
      variant: 'outline'
    },
    {
      label: 'Exportar',
      icon: Download,
      onClick: handlers.handleExport,
      variant: 'outline'
    }
  ]

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Erro ao carregar vendas</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error.message}</p>
          <Button onClick={() => refetch()}>Tentar novamente</Button>
        </div>
      </div>
    )
  }

  if (isLoading && sales.length === 0) return <DataLoadingSkeleton />

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {feedback.show && <FeedbackMessage type={feedback.type} message={feedback.message} onClose={() => setFeedback({ show: false })} />}

        <PageHeader
          title="Gestão de Vendas"
          description={
            <>
              Visualize, cancele e gerencie todas as vendas realizadas
              {isFetching && <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">atualizando...</span>}
            </>
          }
          icon={ShoppingCart}
          actions={headerActions}
        />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
          <StatCard label="Total de Vendas" value={formatNumber(summary.totalCount)} sublabel={`${summary.completedCount} concluídas`} icon={FileText} variant="info" />
          <StatCard label="Faturamento" value={formatCurrency(summary.totalAmount)} sublabel={`Ticket: ${formatCurrency(summary.averageTicket)}`} icon={DollarSign} variant="success" />
          <StatCard label="Descontos" value={formatCurrency(summary.totalDiscount)} sublabel={`${((summary.totalDiscount / summary.totalAmount) * 100 || 0).toFixed(1)}%`} icon={Ticket} variant="purple" />
          <StatCard label="Cancelamentos" value={formatNumber(summary.cancelledCount)} sublabel={`${((summary.cancelledCount / summary.totalCount) * 100 || 0).toFixed(1)}%`} icon={Ban} variant={summary.cancelledCount > 0 ? 'warning' : 'default'} />
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <input 
                type="text" 
                placeholder="Buscar por nº venda, cliente ou telefone..." 
                value={localSearchTerm} 
                onChange={(e) => setLocalSearchTerm(e.target.value)} 
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 placeholder-gray-400 dark:placeholder-gray-500" 
              />
              {localSearchTerm !== debouncedSearchTerm && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin dark:border-blue-400" />
                </div>
              )}
            </div>
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)} icon={Filter} size="sm">
              Filtros {Object.values(filters).some(v => v && v !== 'all') && '•'}
            </Button>
          </div>
          
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100 dark:border-gray-700">
              <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg">
                <option value="all">Todos os status</option>
                <option value="completed">Concluídas</option>
                <option value="cancelled">Canceladas</option>
                <option value="pending">Pendentes</option>
              </select>
              <select value={filters.payment_method} onChange={(e) => setFilters({ ...filters, payment_method: e.target.value })} className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg">
                <option value="all">Todas as formas</option>
                <option value="cash">Dinheiro</option>
                <option value="credit_card">Crédito</option>
                <option value="debit_card">Débito</option>
                <option value="pix">PIX</option>
              </select>
              <input type="date" value={filters.start_date} onChange={(e) => setFilters({ ...filters, start_date: e.target.value })} className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg" />
              <input type="date" value={filters.end_date} onChange={(e) => setFilters({ ...filters, end_date: e.target.value })} className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg" />
            </div>
          )}
        </div>

        {effectiveViewMode === 'cards' ? (
          <DataCards
            data={sales}
            renderCard={renderSaleCard}
            keyExtractor={(sale) => sale.id}
            columns={isMobile ? 1 : 2}
            gap={4}
            emptyMessage="Nenhuma venda encontrada"
          />
        ) : (
          <DataTable 
            columns={columns} 
            data={sales} 
            actions={actions} 
            onRowClick={handlers.viewSaleDetails} 
            emptyMessage="Nenhuma venda encontrada" 
            striped 
            hover 
            pagination 
            itemsPerPageOptions={[20, 50, 100]} 
            defaultItemsPerPage={20} 
            showTotalItems 
          />
        )}

        <SalesListModalsContainer
          showDetailsModal={showDetailsModal}
          closeDetailsModal={handlers.closeDetailsModal}
          selectedSale={selectedSale}
          saleItems={saleItems}
          isLoadingItems={isLoadingItems}
          canCancelDirectly={canCancelDirectly}
          canRequestCancellation={canRequestCancellation}
          cancelMutation={cancelMutation}
          openCancelModal={handlers.openCancelModal}
          showCancelModal={showCancelModal}
          closeCancelModal={handlers.closeCancelModal}
          cancelReason={cancelReason}
          setCancelReason={setCancelReason}
          cancelNotes={cancelNotes}
          setCancelNotes={setCancelNotes}
          handleCancelWithApproval={handlers.handleCancelWithApproval}
          profile={profile}
          showReceiptModal={showReceiptModal}
          closeReceiptModal={handlers.closeReceiptModal}
          receiptSale={receiptSale}
          receiptItems={receiptItems}
          isLoadingReceiptItems={isLoadingReceiptItems}
        />
      </div>
    </div>
  )
}

export default SalesList
