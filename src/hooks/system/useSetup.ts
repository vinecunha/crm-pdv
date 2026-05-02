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
        // Sempre vai para /login — o AuthContext cuida de redirecionar
        // para /dashboard se o usuário já estiver autenticado com profile
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
      // 1. Criar usuário admin PRIMEIRO se email e senha foram fornecidos
      let adminUserId: string | null = null;
      
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
          throw new Error('Erro ao criar usuário admin: ' + authError.message)
        }

        if (!authData.user) {
          throw new Error('Falha ao criar usuário admin')
        }

        adminUserId = authData.user.id
        logger.info('✅ Usuário admin criado:', authData.user.email)

        // Encerrar a sessão criada pelo signUp para não interferir no fluxo
        // O usuário admin vai fazer login manualmente na tela de login
        await supabase.auth.signOut()
      }

      // 2. Criar a empresa e passar o ID do admin para criar o perfil
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
        domain: data.domain || null,
        admin_user_id: adminUserId  // Passar o ID do admin para criar o perfil
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

      // 3. Se ainda não criou o perfil (fallback), criar manualmente
      if (adminUserId) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: adminUserId,
            email: data.admin_email,
            full_name: 'Administrador',
            role: 'admin',
            status: 'active'
          }, {
            onConflict: 'id'
          })

        if (profileError) {
          logger.warn('Aviso: perfil pode já ter sido criado via RPC:', profileError.message)
        } else {
          logger.info('✅ Perfil admin configurado com sucesso')
        }
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