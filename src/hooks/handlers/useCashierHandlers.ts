import { useCallback } from 'react'

// Baseado em: public.cashier_closing
interface CashierClosing {
  id: number
  closing_date: string
  start_time: string | null
  end_time: string | null
  total_sales: number | null
  total_discounts: number | null
  total_cancellations: number | null
  total_cash: number | null
  total_card: number | null
  total_pix: number | null
  expected_total: number | null
  declared_total: number | null
  difference: number | null
  notes: string | null
  closed_by: string | null
  closed_at: string | null
  status: string | null
  details: Record<string, unknown> | null
  created_at: string | null
}

interface DateRange {
  startDate: string
  endDate: string
  [key: string]: unknown
}

interface DeclaredValues {
  cash: number
  card: number
  pix: number
  [key: string]: unknown
}

interface Summary {
  totalSales: number
  totalDiscounts: number
  totalCancellations: number
  totalCash: number
  totalCard: number
  totalPix: number
  expectedTotal: number
  [key: string]: unknown
}

interface Profile {
  id: string
  [key: string]: unknown
}

interface MutationResult<T> {
  mutate: (data: T, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => void
}

interface UseCashierHandlersProps {
  profile: Profile | null
  dateRange: DateRange
  declaredValues: DeclaredValues
  summary: Summary | null
  closingMutation: MutationResult<{
    closingData: { dateRange: DateRange; declaredValues: DeclaredValues; summary: Summary }
    profile: Profile | null
  }>
  refetchSummary: () => void
  refetchHistory: () => void
  setShowClosingModal: (show: boolean) => void
  setShowHistoryModal: (show: boolean) => void
  setShowDetailsModal: (show: boolean) => void
  setSelectedClosing: (closing: CashierClosing | null) => void
  showFeedback: (type: 'success' | 'error' | 'info', message: string) => void
}

interface UseCashierHandlersReturn {
  openClosingModal: () => void
  handleClosing: () => void
  handleRefresh: () => void
  openHistoryModal: () => void
  viewClosingDetails: (closing: CashierClosing) => void
  handlePrint: (closing: CashierClosing) => void
}

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
}: UseCashierHandlersProps): UseCashierHandlersReturn => {

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

  const viewClosingDetails = useCallback((closing: CashierClosing) => {
    setSelectedClosing(closing)
    setShowDetailsModal(true)
  }, [setSelectedClosing, setShowDetailsModal])

  const handlePrint = useCallback((closing: CashierClosing) => {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html><head><title>Fechamento ${closing.closing_date}</title></head><body>
          <h1>Fechamento ${closing.closing_date}</h1>
          <pre>${JSON.stringify(closing, null, 2)}</pre>
        </body></html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
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