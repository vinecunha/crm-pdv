// src/hooks/queries/useSettingsQueries.js
import { useQuery } from '@tanstack/react-query'
import * as settingsService from '@services/system/settingsService'

export const useSettingsQueries = (isAdmin) => {
  const { 
    data: companySettings,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['company-settings'],
    queryFn: settingsService.fetchCompanySettings,
    enabled: isAdmin,
    staleTime: 0,
  })

  return {
    companySettings,
    isLoading,
    error,
    refetch
  }
}
