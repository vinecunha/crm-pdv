import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchUserGoals, saveAllGoals } from '../services/goalService'

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
  
  return {
    goals: goals || { daily: 1000, monthly: 20000, yearly: 240000 },
    isLoading,
    saveGoals: saveGoalsMutation.mutateAsync,
    isSaving: saveGoalsMutation.isPending
  }
}