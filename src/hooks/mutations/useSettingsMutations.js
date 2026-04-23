// src/hooks/mutations/useSettingsMutations.js
import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as settingsService from '@services/system/settingsService'

export const useSettingsMutations = (callbacks = {}) => {
  const queryClient = useQueryClient()

  const {
    onSettingsSaved,
    onError
  } = callbacks

  const saveMutation = useMutation({
    mutationFn: settingsService.saveCompanySettings,
    onSuccess: (data) => {
      queryClient.setQueryData(['company-settings'], data)
      onSettingsSaved?.(data)
    },
    onError: (error) => {
      onError?.(error)
    }
  })

  return {
    saveMutation,
    isPending: saveMutation.isPending
  }
}
