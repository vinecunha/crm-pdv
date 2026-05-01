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

export const setupCompany = async (companyData) => {
  const { data, error } = await supabase
    .rpc('setup_company', {
      p_company_name: companyData.company_name,
      p_cnpj: companyData.cnpj || null,
      p_email: companyData.email || null,
      p_phone: companyData.phone || null,
      p_address: companyData.address || null,
      p_city: companyData.city || null,
      p_state: companyData.state || null,
      p_zip_code: companyData.zip_code || null,
      p_primary_color: companyData.primary_color || '#2563eb',
      p_secondary_color: companyData.secondary_color || '#7c3aed',
      p_company_logo_url: companyData.company_logo_url || null,
      p_favicon: companyData.favicon || null,
      p_domain: companyData.domain || null,
      p_social_media: companyData.social_media || {},
      p_custom_css: companyData.custom_css || null
    })
  
  if (error) {
    logger.error('❌ Erro ao configurar empresa:', error)
    throw error
  }
  
  return data
}
