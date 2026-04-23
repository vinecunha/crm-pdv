import { useQuery } from '@tanstack/react-query'
import { fetchUsers, fetchClosingHistory, fetchCashierSummary } from '@services/cashier/cashierService'

// Baseado em: public.profiles (operadores)
interface User {
  id: string
  email: string
  role: string
  full_name: string | null
  [key: string]: unknown
}

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

interface CashierSummary {
  totalSales: number
  totalDiscounts: number
  totalCancellations: number
  totalCash: number
  totalCard: number
  totalPix: number
  expectedTotal: number
  [key: string]: unknown
}

interface DateRange {
  start: string
  end: string
}

interface UseCashierQueriesProps {
  dateRange: DateRange
  selectedUser: string | null
}

interface UseCashierQueriesReturn {
  users: User[]
  closingHistory: CashierClosing[]
  refetchHistory: () => Promise<unknown>
  summary: CashierSummary | undefined
  isLoadingSummary: boolean
  summaryError: Error | null
  refetchSummary: () => Promise<unknown>
  isFetchingSummary: boolean
}

export const useCashierQueries = ({
  dateRange,
  selectedUser
}: UseCashierQueriesProps): UseCashierQueriesReturn => {
  
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: fetchUsers,
    staleTime: 30 * 60 * 1000,
  })

  const { data: closingHistory = [], refetch: refetchHistory } = useQuery<CashierClosing[]>({
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
  } = useQuery<CashierSummary>({
    queryKey: ['cashier-summary', { 
      startDate: dateRange.start, 
      endDate: dateRange.end, 
      userId: selectedUser 
    }],
    queryFn: fetchCashierSummary,
    enabled: !!(dateRange.start && dateRange.end),
    staleTime: 2 * 60 * 1000,
  })

  return {
    users,
    closingHistory,
    refetchHistory,
    summary,
    isLoadingSummary,
    summaryError,
    refetchSummary,
    isFetchingSummary
  }
}