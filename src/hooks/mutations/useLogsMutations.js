// src/hooks/mutations/useLogsMutations.js
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'

const restoreRecord = async ({ tableName, recordId }) => {
  const { data, error } = await supabase.rpc('restore_record', { 
    p_table_name: tableName, 
    p_record_id: recordId 
  })
  if (error) throw error
  return data
}

export const useLogsMutations = (callbacks = {}) => {
  const queryClient = useQueryClient()

  const {
    onRecordRestored,
    onError
  } = callbacks

  const restoreMutation = useMutation({
    mutationFn: restoreRecord,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['deleted-records'] })
      queryClient.invalidateQueries({ queryKey: ['logs'] })
      onRecordRestored?.(data)
    },
    onError: (error) => {
      onError?.(error)
    }
  })

  return {
    restoreMutation,
    isPending: restoreMutation.isPending
  }
}
