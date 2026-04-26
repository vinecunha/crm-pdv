// src/pages/CashierClosing.jsx
import React, { useState } from 'react'
import { FileText, RefreshCw, Calculator, AlertCircle } from '@lib/icons'
import { useAuth } from '@contexts/AuthContext'
import { useUI } from '@contexts/UIContext'
import Button from '@components/ui/Button'
import DataLoadingSkeleton from '@components/ui/DataLoadingSkeleton'
import PageHeader from '@components/ui/PageHeader'
import { formatDate } from '@utils/formatters'

// Componentes
import CashierSummaryCards from '@components/cashier/CashierSummaryCards'
import CashierTotalBanner from '@components/cashier/CashierTotalBanner'
import CashierFilters from '@components/cashier/CashierFilters'
import CashierModalsContainer from '@components/cashier/CashierModalsContainer'

// ✅ Hooks centralizados
import { useCashierHandlers } from '@hooks/handlers'
import { useCashierMutations } from '@hooks/mutations'
import { useCashierQueries } from '@hooks/queries/useCashierQueries'

const today = new Date()
const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

const CashierClosing = () => {
  const { profile } = useAuth()

  // Estado
  const [dateRange, setDateRange] = useState({ start: todayStr, end: todayStr })
  const [selectedUser, setSelectedUser] = useState('all')
  const [showClosingModal, setShowClosingModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedClosing, setSelectedClosing] = useState(null)
  const [declaredValues, setDeclaredValues] = useState({
    cash: 0, credit_card: 0, debit_card: 0, pix: 0, notes: ''
  })

  // ✅ Queries centralizadas
  const {
    users,
    closingHistory,
    refetchHistory,
    summary,
    isLoadingSummary,
    summaryError,
    refetchSummary,
    isFetchingSummary
  } = useCashierQueries({ dateRange, selectedUser })

  // ✅ Mutations
  const { closingMutation } = useCashierMutations({
    onSuccess: () => {
      showFeedback('success', 'Fechamento realizado com sucesso!')
      setShowClosingModal(false)
      setDeclaredValues({ cash: 0, credit_card: 0, debit_card: 0, pix: 0, notes: '' })
    },
    onError: (error) => {
      showFeedback('error', 'Erro ao fechar caixa: ' + error.message)
    }
  })

  const { showFeedback } = useUI()

  // ✅ Handlers
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
