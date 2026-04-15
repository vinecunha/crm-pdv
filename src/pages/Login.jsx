import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock } from '../lib/icons'
import { useAuth } from '../contexts/AuthContext'
import { useRateLimit } from '../hooks/useRateLimit'
import { supabase } from '../lib/supabase'

import LoginHeader from '../components/auth/LoginHeader'
import LoginFooter from '../components/auth/LoginFooter'
import { BlockedAlert, AttemptsIndicator } from '../components/auth/RateLimitIndicator'
import ErrorAlert from '../components/auth/ErrorAlert'
import FormInput from '../components/forms/FormInput'
import Button from '../components/ui/Button'
import { formShortcuts } from '../utils/formShortcuts'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [companySettings, setCompanySettings] = useState(null)
  const [loadingSettings, setLoadingSettings] = useState(true)

  const { login, user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  
  const { isBlocked, remainingAttempts, timeRemaining, recordAttempt } = useRateLimit(5, 15 * 60 * 1000)

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
        company_name: 'Sistema', 
        primary_color: '#2563eb', 
        secondary_color: '#7c3aed', 
        company_logo_url: null 
      })
    } catch {
      setCompanySettings({ 
        company_name: 'Sistema', 
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
            login_count: supabase.raw('COALESCE(login_count, 0) + 1')
          })
          .eq('id', userId)
      }
    } catch (error) {
      console.warn('Erro ao atualizar last_login:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (isBlocked) {
      setError(`Muitas tentativas. Tente novamente em ${timeRemaining} minuto(s).`)
      return
    }
    
    setLoading(true)
    try {
      await login(email, password)
      recordAttempt(true)
    } catch (err) {
      recordAttempt(false)
      
      if (err.message.includes('bloqueado') || 
          err.message.includes('inativo') || 
          err.message.includes('Conta bloqueada')) {
        setError(err.message)
      } else {
        setError(remainingAttempts <= 1 
          ? 'Última tentativa! Email ou senha incorretos.'
          : `Email ou senha incorretos. ${remainingAttempts - 1} tentativa(s) restante(s).`
        )
      }
    } finally {
      setLoading(false)
    }
  }

  const formatTimeRemaining = (minutes) => {
    if (minutes <= 0) return 'menos de 1 minuto'
    if (minutes === 1) return '1 minuto'
    return `${minutes} minutos`
  }

  const primaryColor = companySettings?.primary_color || '#2563eb'
  const secondaryColor = companySettings?.secondary_color || '#7c3aed'
  const companyName = companySettings?.company_name || 'Sistema'
  const logoUrl = companySettings?.company_logo_url

  const gradientStyle = { 
    background: `linear-gradient(135deg, ${primaryColor}15, ${secondaryColor}15)` 
  }

  if (authLoading || loadingSettings) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={gradientStyle}>
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
    <div className="min-h-screen flex items-center justify-center p-4" style={gradientStyle}>
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <LoginHeader 
          companyName={companyName} 
          logoUrl={logoUrl} 
          primaryColor={primaryColor} 
        />

        <div className="space-y-6">
          {isBlocked && (
            <BlockedAlert 
              timeRemaining={timeRemaining} 
              formatTimeRemaining={formatTimeRemaining} 
            />
          )}
          
          <ErrorAlert 
            error={error} 
            remainingAttempts={remainingAttempts} 
          />
          
          {!isBlocked && !error && (
            <AttemptsIndicator 
              remainingAttempts={remainingAttempts} 
              primaryColor={primaryColor} 
            />
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput
              label="Email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              disabled={loading || isBlocked}
              icon={Mail}
              autoComplete="email"
              autoFocus
            />

            <FormInput
              label="Senha"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading || isBlocked}
              icon={Lock}
              autoComplete="current-password"
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              disabled={isBlocked}
              shortcut={{ key: 'Enter', description: 'Entrar' }}
              className="mt-6"
              style={{ 
                backgroundColor: primaryColor,
                '--tw-ring-color': primaryColor 
              }}
            >
              Entrar
            </Button>
          </form>
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