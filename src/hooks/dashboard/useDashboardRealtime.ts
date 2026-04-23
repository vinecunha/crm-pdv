import { useRealtime } from '@/hooks/utils/useRealTime'
import { useAuth } from '@contexts/AuthContext'
import { useQueryClient } from '@tanstack/react-query'

export const useDashboardRealtime = (enabled: boolean = true): void => {
  const queryClient = useQueryClient()

  useRealtime({
    table: 'sales',
    event: 'INSERT',
    onChange: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
    enabled
  })
}