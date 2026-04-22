// src/hooks/useCashierHandlers.js
import { useCallback } from 'react'
import { formatCurrency } from '@utils/formatters'

export const useCashierHandlers = ({
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
}) => {

  const openClosingModal = useCallback(() => {
    if (!summary) {
      showFeedback('error', 'Nenhum dado para fechar')
      return
    }
    setShowClosingModal(true)
  }, [summary, showFeedback, setShowClosingModal])

  const handleClosing = useCallback(() => {
    closingMutation.mutate({
      closingData: { dateRange, declaredValues, summary },
      profile
    })
  }, [dateRange, declaredValues, summary, profile, closingMutation])

  const handleRefresh = useCallback(() => {
    refetchSummary()
    refetchHistory()
  }, [refetchSummary, refetchHistory])

  const openHistoryModal = useCallback(() => {
    setShowHistoryModal(true)
  }, [setShowHistoryModal])

  const viewClosingDetails = useCallback((closing) => {
    setSelectedClosing(closing)
    setShowDetailsModal(true)
  }, [setSelectedClosing, setShowDetailsModal])

  const handlePrint = useCallback((closing) => {
    // Implementar impressão
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html><head><title>Fechamento ${closing.closing_date}</title></head><body>
        <h1>Fechamento ${closing.closing_date}</h1>
        <pre>${JSON.stringify(closing, null, 2)}</pre>
      </body></html>
    `)
    printWindow.document.close()
    printWindow.print()
  }, [])

  return {
    openClosingModal,
    handleClosing,
    handleRefresh,
    openHistoryModal,
    viewClosingDetails,
    handlePrint
  }
}