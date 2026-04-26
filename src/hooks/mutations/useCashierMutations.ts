import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSystemLogs } from '@hooks/system/useSystemLogs'
import * as cashierService from '@services/cashier/cashierService'

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
  start: string
  end: string
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

interface ClosingData {
  dateRange: DateRange
  declaredValues: DeclaredValues
  summary: Summary
}

interface Profile {
  id: string
  [key: string]: unknown
}

interface ClosingResult {
  data: CashierClosing
  expectedTotal: number
  totalDeclared: number
  difference: number
}

interface UseCashierMutationsReturn {
  closingMutation: ReturnType<typeof useMutation>
  isPending: boolean
}

export const useCashierMutations = (callbacks?: { onSuccess?: (result: ClosingResult) => void; onError?: (error: Error) => void }): UseCashierMutationsReturn => {
  const queryClient = useQueryClient()
  const { logCreate } = useSystemLogs()
  const { onSuccess, onError } = callbacks || {}

  const closingMutation = useMutation({
    mutationFn: ({ closingData, profile }: { closingData: ClosingData; profile: Profile | null }) =>
      cashierService.createCashierClosing({ closingData, profile }),
    onSuccess: async (result: ClosingResult) => {
      await logCreate('cashier_closing', result.data.id.toString(), {
        closing_date: result.data.closing_date,
        expected_total: result.expectedTotal,
        declared_total: result.totalDeclared,
        difference: result.difference
      })
      queryClient.invalidateQueries({ queryKey: ['closing-history'] })
      queryClient.invalidateQueries({ queryKey: ['cashier-summary'] })
      onSuccess?.(result)
    },
    onError: (error: Error) => {
      onError?.(error)
    },
  })

  return {
    closingMutation,
    isPending: closingMutation.isPending
  }
}