import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@lib/supabase'
import { setupCompany, fetchCompanySettings } from '@services/system/companyService'
import { logger } from '@utils/logger'

interface SetupData {
  company_name: string
  cnpj?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  primary_color?: string
  secondary_color?: string
  domain?: string
}

interface UseSetupReturn {
  loading: boolean
  checking: boolean
  error: string
  checkExisting: () => Promise<boolean>
  createCompany: (data: SetupData) => Promise<{ success: boolean; error?: string }>
}

export const useSetup = (): UseSetupReturn => {
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const checkExisting = async (): Promise<boolean> => {
    try {
      const settings = await fetchCompanySettings()
      if (settings) {
        navigate('/login', { replace: true })
        return true
      }
      setChecking(false)
      return false
    } catch (err) {
      setChecking(false)
      return false
    }
  }

  const createCompany = async (data: SetupData) => {
    setLoading(true)
    setError('')
    
    try {
      const result = await setupCompany({
        company_name: data.company_name,
        cnpj: data.cnpj || null,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        zip_code: data.zip_code || null,
        primary_color: data.primary_color || '#2563eb',
        secondary_color: data.secondary_color || '#7c3aed',
        domain: data.domain || null
      })

      if (result?.error) {
        throw new Error(result.error)
      }

      return { success: true }
    } catch (err: any) {
      const message = err.message || 'Erro ao configurar empresa'
      setError(message)
      logger.error('Erro no setup:', err)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    checking,
    error,
    checkExisting,
    createCompany
  }
}
