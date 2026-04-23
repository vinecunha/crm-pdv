import { useState, useEffect } from 'react'
import { supabase } from '@lib/supabase'

// Baseado em: public.company_settings
interface CompanySettings {
  id: string // uuid
  company_name: string // character varying(255)
  company_logo: string | null // text
  company_logo_url: string | null // text
  favicon: string | null // text
  domain: string | null // character varying(255)
  email: string | null // character varying(255)
  phone: string | null // character varying(50)
  address: string | null // text
  city: string | null // character varying(100)
  state: string | null // character varying(50)
  zip_code: string | null // character varying(20)
  cnpj: string | null // character varying(20)
  social_media: Record<string, unknown> | null // jsonb
  primary_color: string | null // character varying(7), default '#2563eb'
  secondary_color: string | null // character varying(7), default '#7c3aed'
  custom_css: string | null // text
  created_at: string | null // timestamp without time zone
  updated_at: string | null // timestamp without time zone
}

interface UpdateCompanyResult {
  success: boolean
  data?: CompanySettings
  error?: string
}

interface UseCompanyReturn {
  company: CompanySettings | null
  loading: boolean
  error: string | null
  getCompanyColor: (type?: 'primary' | 'secondary') => string
  updateCompanySettings: (settings: Partial<CompanySettings>) => Promise<UpdateCompanyResult>
  fetchCompanySettings: () => Promise<void>
}

export const useCompany = (): UseCompanyReturn => {
  const [company, setCompany] = useState<CompanySettings | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const getCompanyColor = (type: 'primary' | 'secondary' = 'primary'): string => {
    if (type === 'primary') {
      return company?.primary_color || '#2563eb'
    }
    return company?.secondary_color || '#7c3aed'
  }

  const fetchCompanySettings = async (): Promise<void> => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .limit(1)
        .single()
      
      if (error) throw error
      
      setCompany(data as CompanySettings)
      
      if (data?.primary_color) {
        document.documentElement.style.setProperty('--primary-color', data.primary_color)
      }
      if (data?.secondary_color) {
        document.documentElement.style.setProperty('--secondary-color', data.secondary_color)
      }
      
    } catch (err) {
      console.error('Erro ao buscar configurações da empresa:', err)
      setError((err as Error).message)
      
      setCompany({
        company_name: 'Brasalino Pollo',
        primary_color: '#FF131E',
        secondary_color: '#FFE526'
      } as CompanySettings)
    } finally {
      setLoading(false)
    }
  }

  const updateCompanySettings = async (settings: Partial<CompanySettings>): Promise<UpdateCompanyResult> => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('company_settings')
        .update({
          ...settings,
          updated_at: new Date().toISOString()
        })
        .eq('id', company?.id)
        .select()
        .single()
      
      if (error) throw error
      
      setCompany(data as CompanySettings)
      return { success: true, data: data as CompanySettings }
      
    } catch (err) {
      console.error('Erro ao atualizar configurações:', err)
      return { success: false, error: (err as Error).message }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCompanySettings()
  }, [])

  return {
    company,
    loading,
    error,
    getCompanyColor,
    updateCompanySettings,
    fetchCompanySettings
  }
}