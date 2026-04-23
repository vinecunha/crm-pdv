import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'

interface RestoreRecordParams {
  tableName: string
  recordId: number
  recordType?: string
}

interface RestoreRecordResult {
  success: boolean
  message?: string
  [key: string]: unknown
}

interface LogsCallbacks {
  onRecordRestored?: (data: RestoreRecordResult) => void
  onError?: (error: Error) => void
}

interface UseLogsMutationsReturn {
  restoreMutation: ReturnType<typeof useMutation>
  isPending: boolean
}

const restoreRecord = async ({ tableName, recordId }: RestoreRecordParams): Promise<RestoreRecordResult> => {
  const { data, error } = await supabase.rpc('restore_record', { 
    p_table_name: tableName, 
    p_record_id: recordId 
  })
  if (error) throw error
  return data as RestoreRecordResult
}

export const useLogsMutations = (callbacks: LogsCallbacks = {}): UseLogsMutationsReturn => {
  const queryClient = useQueryClient()

  const {
    onRecordRestored,
    onError
  } = callbacks

  const restoreMutation = useMutation({
    mutationFn: restoreRecord,
    onSuccess: (data: RestoreRecordResult) => {
      queryClient.invalidateQueries({ queryKey: ['deleted-records'] })
      queryClient.invalidateQueries({ queryKey: ['logs'] })
      onRecordRestored?.(data)
    },
    onError: (error: Error) => {
      onError?.(error)
    }
  })

  return {
    restoreMutation,
    isPending: restoreMutation.isPending
  }
}