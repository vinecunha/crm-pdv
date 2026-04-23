import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchUserGoals, saveAllGoals, areGoalsDefault } from '@services/seller/goalService'

// Baseado em: public.goals
interface Goal {
  id: string
  user_id: string
  goal_type: 'daily' | 'monthly' | 'yearly'
  target_amount: number
  created_at: string | null
  updated_at: string | null
  created_by: string | null
  updated_by: string | null
}

interface GoalsData {
  daily: { target_amount: number; isDefault: boolean; id?: string }
  monthly: { target_amount: number; isDefault: boolean; id?: string }
  yearly: { target_amount: number; isDefault: boolean; id?: string }
  _error?: boolean
}

interface UseGoalsReturn {
  goals: GoalsData
  isLoading: boolean
  saveGoals: (params: { goals: GoalsData; createdBy: string }) => Promise<unknown>
  isSaving: boolean
  isUsingDefaults: boolean
  hasError: boolean
}

export const useGoals = (userId: string | null): UseGoalsReturn => {
  const queryClient = useQueryClient()
  
  const { data: goals, isLoading } = useQuery<GoalsData>({
    queryKey: ['goals', userId],
    queryFn: () => fetchUserGoals(userId as string),
    enabled: !!userId
  })
  
  const saveGoalsMutation = useMutation({
    mutationFn: ({ goals, createdBy }: { goals: GoalsData; createdBy: string }) => 
      saveAllGoals(userId as string, goals, createdBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals', userId] })
    }
  })
  
  const defaultGoals: GoalsData = {
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