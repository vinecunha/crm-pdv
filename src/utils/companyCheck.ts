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
    // Em caso de erro de rede/banco, não redireciona para /setup
    // para evitar apagar uma company que possa existir
    return { exists: true, redirectTo: '/login' }
  }
}
