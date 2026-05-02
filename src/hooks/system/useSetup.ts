import { useState, useEffect } from 'react'
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
  admin_email?: string
  admin_password?: string
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
        // Verificar se usuário já está logado
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          // Usuário já está logado, redireciona para home
          navigate('/', { replace: true })
        } else {
          // Usuário não está logado, vai para login
          navigate('/login', { replace: true })
        }
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
      // 1. Criar a empresa
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

      if (!result) {
        throw new Error('Nenhuma resposta do servidor')
      }

      if (result.error) {
        logger.error('Erro retornado pela RPC:', result.error)
        const message = result.error?.message 
          || result.error?.details 
          || result.error?.hint 
          || JSON.stringify(result.error)
        throw new Error(message)
      }

      // 2. Criar usuário admin se email e senha foram fornecidos
      if (data.admin_email && data.admin_password) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: data.admin_email,
          password: data.admin_password,
          options: {
            data: {
              full_name: 'Administrador',
              role: 'admin'
            }
          }
        })

        if (authError) {
          logger.error('Erro ao criar usuário admin:', authError)
          throw new Error('Empresa criada, mas erro ao criar usuário admin: ' + authError.message)
        }

        if (!authData.user) {
          throw new Error('Empresa criada, mas falha ao criar usuário admin')
        }

        logger.info('✅ Usuário admin criado:', authData.user.email)

        // 3. Garantir que o perfil foi criado com role admin
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: authData.user.id,
            email: authData.user.email,
            full_name: 'Administrador',
            role: 'admin'
          }, {
            onConflict: 'id'
          })

        if (profileError) {
          logger.error('Erro ao criar perfil admin:', profileError)
          throw new Error('Empresa criada, mas erro ao criar perfil: ' + profileError.message)
        }

        logger.info('✅ Perfil admin configurado com sucesso')
      }

      logger.info('✅ Empresa configurada com sucesso')
      return { success: true }
    } catch (err: any) {
      const message = err?.message || err?.error || JSON.stringify(err)
      logger.error('❌ Erro no setup:', { error: err, message })
      setError(message)
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