// src/hooks/useDashboardRealtime.js
import { useRealtime } from '@/hooks/utils/useRealTime'
import { useAuth } from '@contexts/AuthContext'
import { useQueryClient } from '@tanstack/react-query'

export const useDashboardRealtime = (enabled = true) => {
  const queryClient = useQueryClient()

  useRealtime({
    table: 'sales',
    event: 'INSERT',
    onChange: () => {
      // ✅ Simplesmente invalidar e forçar refetch
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
    enabled
  })
}
