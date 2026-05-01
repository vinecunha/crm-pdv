// src/utils/companyCheck.ts
import { fetchCompanySettings } from '@services/system/companyService'
import { logger } from '@utils/logger'

export interface CompanyStatus {
  exists: boolean
  redirectTo: string
}

export const checkCompanyExists = async (): Promise<CompanyStatus> => {
  try {
    const settings = await fetchCompanySettings()
    
    if (settings) {
      return { exists: true, redirectTo: '/login' }
    }
    
    return { exists: false, redirectTo: '/setup' }
  } catch (error) {
    logger.error('Erro ao verificar company:', error)
    // Em caso de erro, assumir que não existe company
    return { exists: false, redirectTo: '/setup' }
  }
}
