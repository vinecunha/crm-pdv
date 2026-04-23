// src/hooks/queries/useCashierQueries.js
import { useQuery } from '@tanstack/react-query'
import { fetchUsers, fetchClosingHistory, fetchCashierSummary } from '@services/cashier/cashierService'

export const useCashierQueries = ({ dateRange, selectedUser }) => {
  // Query de usuários (operadores)
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    staleTime: 30 * 60 * 1000,
  })

  // Query de histórico de fechamentos
  const { data: closingHistory = [], refetch: refetchHistory } = useQuery({
    queryKey: ['closing-history'],
    queryFn: fetchClosingHistory,
    staleTime: 5 * 60 * 1000,
  })

  // Query de resumo do caixa
  const { 
    data: summary,
    isLoading: isLoadingSummary,
    error: summaryError,
    refetch: refetchSummary,
    isFetching: isFetchingSummary
  } = useQuery({
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
