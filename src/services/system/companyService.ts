// src/services/companyService.ts
import { supabase } from '@lib/supabase'
import { logger } from '@utils/logger'

export const fetchCompanySettings = async () => {
  const { data, error } = await supabase
    .from('company_settings')
    .select('*')
    .limit(1)
    .maybeSingle()
  
  if (error) {
    logger.error('❌ Erro ao buscar configurações da empresa:', error)
    return null
  }
  
  return data
}

export const setupCompany = async (companyData: any) => {
  try {
    // Generate slug from company name
    const slug = companyData.company_name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    
    // Insert into companies table
    const { error: companyError } = await supabase
      .from('companies')
      .insert({
        name: companyData.company_name,
        slug: slug,
        domain: companyData.domain || null,
        settings: {
          cnpj: companyData.cnpj || null,
          email: companyData.email || null,
          phone: companyData.phone || null,
          address: companyData.address || null,
          city: companyData.city || null,
          state: companyData.state || null,
          zip_code: companyData.zip_code || null,
          social_media: companyData.social_media || {},
          custom_css: companyData.custom_css || null
        }
      })
      .select()
      .single()
    
    if (companyError) {
      logger.error('❌ Erro ao criar empresa:', companyError)
      throw new Error(companyError.message || 'Erro ao criar empresa')
    }
    
    // Insert into company_settings table
    const { error: settingsError } = await supabase
      .from('company_settings')
      .insert({
        company_name: companyData.company_name,
        company_logo_url: companyData.company_logo_url || null,
        favicon: companyData.favicon || null,
        domain: companyData.domain || null,
        email: companyData.email || null,
        phone: companyData.phone || null,
        address: companyData.address || null,
        city: companyData.city || null,
        state: companyData.state || null,
        zip_code: companyData.zip_code || null,
        cnpj: companyData.cnpj || null,
        social_media: companyData.social_media || {},
        primary_color: companyData.primary_color || '#2563eb',
        secondary_color: companyData.secondary_color || '#7c3aed',
        custom_css: companyData.custom_css || null
      })
      .select()
      .single()
    
    if (settingsError) {
      logger.error('❌ Erro ao criar configurações:', settingsError)
      throw new Error(settingsError.message || 'Erro ao criar configurações')
    }
    
    return true
  } catch (error: any) {
    logger.error('❌ Erro ao configurar empresa:', error)
    throw new Error(error.message || 'Erro ao configurar empresa')
  }
}
