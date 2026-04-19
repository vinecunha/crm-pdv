export const useBudgetMutations = () => {
  const queryClient = useQueryClient()
  const { profile } = useAuth()
  const { logCreate, logAction, logError } = useSystemLogs()
  
  const createBudget = useMutation({
    mutationFn: (data) => budgetService.createBudget(data, profile),
    onSuccess: async (budget) => {
      await logCreate('budget', budget.id, { /* ... */ })
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
    },
    // ...
  })
  
  const updateStatus = useMutation({
    // ...
  })
  
  const convertToSale = useMutation({
    // ...
  })
  
  return { createBudget, updateStatus, convertToSale }
}