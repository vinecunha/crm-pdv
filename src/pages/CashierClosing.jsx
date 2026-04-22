// src/pages/CashierClosing.jsx
import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FileText, RefreshCw, Calculator, AlertCircle } from '@lib/icons'
import { useAuth } from '@contexts/AuthContext'
import FeedbackMessage from '@components/ui/FeedbackMessage'
import Button from '@components/ui/Button'
import DataLoadingSkeleton from '@components/ui/DataLoadingSkeleton'
import PageHeader from '@components/ui/PageHeader'
import { formatDate } from '@utils/formatters'

// Componentes
import CashierSummaryCards from '@components/cashier/CashierSummaryCards'
import CashierTotalBanner from '@components/cashier/CashierTotalBanner'
import CashierFilters from '@components/cashier/CashierFilters'
import CashierModalsContainer from '@components/cashier/CashierModalsContainer'

// Hooks e Services
import { useCashierHandlers } from '@/hooks/handlers'
import { 
  fetchUsers, 
  fetchClosingHistory, 
  fetchCashierSummary, 
  createCashierClosing 
} from '@services/cashierService'

const today = new Date()
const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

const CashierClosing = () => {
  const { profile } = useAuth()
  const queryClient = useQueryClient()

  // Estado
  const [dateRange, setDateRange] = useState({ start: todayStr, end: todayStr })
  const [selectedUser, setSelectedUser] = useState('all')
  const [feedback, setFeedback] = useState({ show: false, type: 'success', message: '' })
  const [showClosingModal, setShowClosingModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedClosing, setSelectedClosing] = useState(null)
  const [declaredValues, setDeclaredValues] = useState({
    cash: 0, credit_card: 0, debit_card: 0, pix: 0, notes: ''
  })

  // Queries
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    staleTime: 30 * 60 * 1000,
  })

  const { data: closingHistory = [], refetch: refetchHistory } = useQuery({
    queryKey: ['closing-history'],
    queryFn: fetchClosingHistory,
    staleTime: 5 * 60 * 1000,
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
    staleTime: 2 * 60 * 1000,
  })

  const closingMutation = useMutation({
    mutationFn: createCashierClosing,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['closing-history'] })
      queryClient.invalidateQueries({ queryKey: ['cashier-summary'] })
      
      const diff = result.difference
      const diffMessage = diff === 0 ? 'Caixa fechou com valor exato!' : 
        `Diferença de ${formatCurrency(Math.abs(diff))} ${diff > 0 ? 'a maior' : 'a menor'}`
      
      showFeedback('success', `Fechamento realizado! ${diffMessage}`)
      setShowClosingModal(false)
    },
    onError: (error) => {
      showFeedback('error', 'Erro ao realizar fechamento: ' + error.message)
    }
  })

  const showFeedback = (type, message) => {
    setFeedback({ show: true, type, message })
    setTimeout(() => setFeedback({ show: false, type: 'success', message: '' }), 3000)
  }

  // Handlers
  const handlers = useCashierHandlers({
    profile,
    dateRange,
    declaredValues,
    summary,
    closingMutation,
    refetchSummary,
    refetchHistory,
    setShowClosingModal,
    setShowHistoryModal,
    setShowDetailsModal,
    setSelectedClosing,
    showFeedback
  })

  // Header actions
  const headerActions = [
    { label: 'Histórico', icon: FileText, onClick: handlers.openHistoryModal, variant: 'outline' },
    { label: 'Atualizar', icon: RefreshCw, onClick: handlers.handleRefresh, loading: isFetchingSummary, variant: 'outline' },
    { label: 'Fechar Caixa', icon: Calculator, onClick: handlers.openClosingModal, variant: 'primary', disabled: !summary || closingMutation.isPending }
  ]

  // Error state
  if (summaryError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle size={48} className="text-red-500 dark:text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Erro ao carregar dados</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{summaryError.message}</p>
          <Button onClick={handlers.handleRefresh} icon={RefreshCw}>Tentar novamente</Button>
        </div>
      </div>
    )
  }

  if (isLoadingSummary && !summary) return <DataLoadingSkeleton />

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {feedback.show && (
          <FeedbackMessage type={feedback.type} message={feedback.message} onClose={() => setFeedback({ show: false })} />
        )}

        <PageHeader
          title="Fechamento de Caixa"
          description={`${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}`}
          icon={Calculator}
          actions={headerActions}
        />

        <CashierFilters
          dateRange={dateRange}
          setDateRange={setDateRange}
          selectedUser={selectedUser}
          setSelectedUser={setSelectedUser}
          users={users}
          isFetching={isFetchingSummary}
        />

        {summary && (
          <>
            <CashierSummaryCards summary={summary} />
            <CashierTotalBanner summary={summary} />
          </>
        )}

        <CashierModalsContainer
          showClosingModal={showClosingModal}
          setShowClosingModal={setShowClosingModal}
          summary={summary}
          dateRange={dateRange}
          declaredValues={declaredValues}
          setDeclaredValues={setDeclaredValues}
          onConfirmClosing={handlers.handleClosing}
          isClosingPending={closingMutation.isPending}
          showHistoryModal={showHistoryModal}
          setShowHistoryModal={setShowHistoryModal}
          history={closingHistory}
          users={users}
          onViewDetails={handlers.viewClosingDetails}
          onPrint={handlers.handlePrint}
          showDetailsModal={showDetailsModal}
          setShowDetailsModal={setShowDetailsModal}
          selectedClosing={selectedClosing}
        />
      </div>
    </div>
  )
}

export default CashierClosing