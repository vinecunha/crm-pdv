// src/hooks/useGoals.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchUserGoals, saveAllGoals, areGoalsDefault } from '@services/goalService'

export const useGoals = (userId) => {
  const queryClient = useQueryClient()
  
  const { data: goals, isLoading } = useQuery({
    queryKey: ['goals', userId],
    queryFn: () => fetchUserGoals(userId),
    enabled: !!userId
  })
  
  const saveGoalsMutation = useMutation({
    mutationFn: ({ goals, createdBy }) => saveAllGoals(userId, goals, createdBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals', userId] })
    }
  })
  
  // Valores padrão para fallback
  const defaultGoals = {
    daily: { target_amount: 1000, isDefault: true },
    monthly: { target_amount: 20000, isDefault: true },
    yearly: { target_amount: 240000, isDefault: true }
  }
  
  const currentGoals = goals || defaultGoals
  const isUsingDefaults = areGoalsDefault(currentGoals)
  
  return {
    goals: currentGoals,
    isLoading,
    saveGoals: saveGoalsMutation.mutateAsync,
    isSaving: saveGoalsMutation.isPending,
    isUsingDefaults,
    hasError: goals?._error || false
  }
}