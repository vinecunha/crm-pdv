// src/pages/Login.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@contexts/AuthContext'
import { useRateLimit } from '@/hooks/utils/useRateLimit'
import { supabase } from '@lib/supabase'

import LoginHeader from '@components/auth/LoginHeader'
import LoginFooter from '@components/auth/LoginFooter'
import LoginForm from '@components/auth/LoginForm'
import { BlockedAlert, AttemptsIndicator } from '@components/auth/RateLimitIndicator'
import ErrorAlert from '@components/auth/ErrorAlert'
import { logger } from '@utils/logger'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [companySettings, setCompanySettings] = useState(null)
  const [loadingSettings, setLoadingSettings] = useState(true)

  const { login, user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  
  const { 
    isBlocked, 
    remainingAttempts, 
    timeRemaining, 
    recordAttempt, 
    checkRateLimit 
  } = useRateLimit()

  useEffect(() => { 
    fetchCompanySettings() 
  }, [])

  useEffect(() => {
    if (!authLoading && user) {
      updateLastLogin(user.id)
      navigate('/dashboard', { replace: true })
    }
  }, [user, authLoading, navigate])

  const fetchCompanySettings = async () => {
    try {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .limit(1)
        .single()
      
      if (error) throw error
      
      setCompanySettings(data || { 
        company_name: 'Sistema PDV', 
        primary_color: '#2563eb', 
        secondary_color: '#7c3aed', 
        company_logo_url: null 
      })
    } catch {
      setCompanySettings({ 
        company_name: 'Sistema PDV', 
        primary_color: '#2563eb', 
        secondary_color: '#7c3aed', 
        company_logo_url: null 
      })
    } finally {
      setLoadingSettings(false)
    }
  }

  const updateLastLogin = async (userId) => {
    try {
      const { error } = await supabase.rpc('update_user_login_info', { user_id: userId })
      if (error) {
        await supabase
          .from('profiles')
          .update({ 
            last_login: new Date().toISOString(),
            login_count: supabase.raw('COALESCE(login_count, 0) + 1', [])
          })
          .eq('id', userId)
      }
    } catch (error) {
      logger.warn('Erro ao atualizar last_login:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    // Verificar rate limit antes de tentar login
    if (email) {
      await checkRateLimit(email)
    }
    
    if (isBlocked) {
      setError(`Muitas tentativas. Tente novamente em ${formatTimeRemaining(timeRemaining)}.`)
      return
    }
    
    setLoading(true)
    try {
      await login(email, password)
      // Login bem-sucedido - limpar rate limit
      await recordAttempt(true, email)
    } catch (err) {
      // Login falhou - registrar tentativa
      await recordAttempt(false, email)
      
      // Atualizar estado após registro
      if (email) {
        await checkRateLimit(email)
      }
      
      if (err.message.includes('bloqueado') || 
          err.message.includes('inativo') || 
          err.message.includes('Conta bloqueada') ||
          err.message.includes('locked')) {
        setError(err.message)
      } else if (err.message.includes('Invalid login credentials')) {
        setError(remainingAttempts <= 1 
          ? 'Última tentativa! Email ou senha incorretos.'
          : `Email ou senha incorretos. ${remainingAttempts - 1} tentativa(s) restante(s).`
        )
      } else {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const formatTimeRemaining = (minutes) => {
    if (!minutes || minutes <= 0) return 'menos de 1 minuto'
    if (minutes === 1) return '1 minuto'
    return `${minutes} minutos`
  }

  const primaryColor = companySettings?.primary_color || '#2563eb'
  const secondaryColor = companySettings?.secondary_color || '#7c3aed'
  const companyName = companySettings?.company_name || 'Sistema PDV'
  const logoUrl = companySettings?.company_logo_url

  const gradientStyle = { 
    background: `linear-gradient(135deg, ${primaryColor}15, ${secondaryColor}15)` 
  }

  if (authLoading || loadingSettings) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-black" style={gradientStyle}>
        <div 
          className="animate-spin rounded-full h-10 w-10 border-b-2" 
          style={{ borderColor: primaryColor }} 
        />
      </div>
    )
  }

  if (user) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 dark:bg-black" style={gradientStyle}>
      <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8">
        <LoginHeader 
          companyName={companyName} 
          logoUrl={logoUrl} 
          primaryColor={primaryColor} 
        />

        <div className="space-y-4">
          {isBlocked && (
            <BlockedAlert 
              timeRemaining={timeRemaining} 
              formatTimeRemaining={formatTimeRemaining} 
            />
          )}
          
          <ErrorAlert error={error} />
          
          {!isBlocked && remainingAttempts < 5 && remainingAttempts > 0 && (
            <AttemptsIndicator 
              remainingAttempts={remainingAttempts} 
              primaryColor={primaryColor} 
            />
          )}

          <LoginForm
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            onSubmit={handleSubmit}
            loading={loading}
            isBlocked={isBlocked}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
          />
        </div>

        <LoginFooter 
          companyName={companyName} 
          cnpj={companySettings?.cnpj} 
        />
      </div>
    </div>
  )
}

export default Login
