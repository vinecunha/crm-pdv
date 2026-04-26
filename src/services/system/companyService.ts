// src/services/companyService.js
import { supabase } from '@lib/supabase'
import { logger } from '@utils/logger'

export const fetchCompanySettings = async () => {
  const { data, error } = await supabase
    .from('company_settings')
    .select('*')
    .limit(1)
    .single()
  
  if (error) {
    logger.error('❌ Erro ao buscar configurações da empresa:', error)
    return null
  }
  
  return data
}
