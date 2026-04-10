import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LogIn, User, Lock, AlertCircle, AlertTriangle, Clock, Building } from 'lucide-react'
import { useRateLimit } from '../hooks/useRateLimit'
import { supabase } from '../lib/supabase'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [companySettings, setCompanySettings] = useState(null)
  const [loadingSettings, setLoadingSettings] = useState(true)

  const { login, user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  
  // Rate limit hook
  const { isBlocked, remainingAttempts, timeRemaining, recordAttempt } = useRateLimit(5, 15 * 60 * 1000)

  // Buscar configurações da empresa
  useEffect(() => {
    fetchCompanySettings()
  }, [])

  // Redireciona se já estiver logado
  useEffect(() => {
    if (!authLoading && user) {
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

      if (error) {
        // Fallback para configurações padrão
        console.warn('Configurações da empresa não encontradas:', error)
        setCompanySettings({
          company_name: 'Brasalino Pollo',
          primary_color: '#2563eb',
          secondary_color: '#7c3aed',
          company_logo_url: '/brasalino-pollo.png'
        })
      } else {
        setCompanySettings(data)
      }
    } catch (error) {
      console.error('Erro ao buscar configurações:', error)
      setCompanySettings({
        company_name: 'Brasalino Pollo',
        primary_color: '#2563eb',
        secondary_color: '#7c3aed',
        company_logo_url: '/brasalino-pollo.png'
      })
    } finally {
      setLoadingSettings(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    // Verificar se está bloqueado
    if (isBlocked) {
      setError(`Muitas tentativas. Tente novamente em ${timeRemaining} minuto(s).`)
      return
    }
    
    setLoading(true)

    try {
      await login(email, password)
      recordAttempt(true) // Sucesso - reseta tentativas
      // O useEffect vai redirecionar
    } catch (err) {
      recordAttempt(false) // Falha - incrementa tentativas
      
      // Mensagem personalizada baseada nas tentativas restantes
      if (remainingAttempts <= 1) {
        setError(`Última tentativa! Email ou senha incorretos.`)
      } else {
        setError(`Email ou senha incorretos. ${remainingAttempts - 1} tentativa(s) restante(s).`)
      }
    } finally {
      setLoading(false)
    }
  }

  // Formatar tempo restante
  const formatTimeRemaining = (minutes) => {
    if (minutes <= 0) return 'menos de 1 minuto'
    if (minutes === 1) return '1 minuto'
    return `${minutes} minutos`
  }

  // Aplicar cores da empresa
  const primaryColor = companySettings?.primary_color || '#2563eb'
  const secondaryColor = companySettings?.secondary_color || '#7c3aed'
  const companyName = companySettings?.company_name || 'Brasalino Pollo'
  const logoUrl = companySettings?.company_logo_url || '/brasalino-pollo.png'

  // Estilo do gradiente de fundo
  const gradientStyle = {
    background: `linear-gradient(135deg, ${primaryColor}15, ${secondaryColor}15)`
  }

  // Estilo do botão
  const buttonStyle = {
    backgroundColor: primaryColor
  }

  // Estilo do foco dos inputs
  const focusRingStyle = {
    '--tw-ring-color': primaryColor
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={gradientStyle}>
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        {/* Header com Logo */}
        <div className="text-center mb-8">
          {logoUrl ? (
            <img 
              src={logoUrl} 
              alt={companyName}
              className="h-20 mx-auto mb-4 object-contain"
              onError={(e) => {
                e.target.style.display = 'none'
                // Mostrar fallback
                const fallback = document.createElement('div')
                fallback.className = 'inline-flex items-center justify-center w-20 h-20 rounded-full mb-4'
                fallback.style.backgroundColor = `${primaryColor}20`
                fallback.innerHTML = `<svg>...</svg>` // Ícone de Building
                e.target.parentNode.appendChild(fallback)
              }}
            />
          ) : (
            <div 
              className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4"
              style={{ backgroundColor: `${primaryColor}20` }}
            >
              <Building size={40} style={{ color: primaryColor }} />
            </div>
          )}
          
          <h2 
            className="text-3xl font-bold"
            style={{ color: primaryColor }}
          >
            {companyName}
          </h2>
          <p className="text-gray-600 mt-2">Faça login para acessar o sistema</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Alerta de bloqueio */}
          {isBlocked && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-orange-800 mb-1">
                <Clock size={18} />
                <span className="font-medium">Acesso bloqueado</span>
              </div>
              <p className="text-sm text-orange-700">
                Muitas tentativas incorretas. Tente novamente em {formatTimeRemaining(timeRemaining)}.
              </p>
            </div>
          )}

          {/* Alerta de erro */}
          {error && !isBlocked && (
            <div className={`rounded-lg p-3 flex items-center gap-2 ${
              remainingAttempts <= 2 
                ? 'bg-orange-50 border border-orange-200 text-orange-700' 
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {remainingAttempts <= 2 ? (
                <AlertTriangle size={18} />
              ) : (
                <AlertCircle size={18} />
              )}
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Indicador de tentativas restantes */}
          {!isBlocked && remainingAttempts < 5 && remainingAttempts > 0 && !error && (
            <div 
              className="border rounded-lg p-3"
              style={{ 
                backgroundColor: `${primaryColor}10`,
                borderColor: `${primaryColor}30`
              }}
            >
              <div className="flex items-center justify-between">
                <span 
                  className="text-xs"
                  style={{ color: primaryColor }}
                >
                  Tentativas restantes:
                </span>
                <span 
                  className="text-sm font-medium"
                  style={{ color: primaryColor }}
                >
                  {remainingAttempts} de 5
                </span>
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className="h-1.5 rounded-full transition-all"
                  style={{ 
                    width: `${(remainingAttempts / 5) * 100}%`,
                    backgroundColor: primaryColor
                  }}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg transition-all"
                style={{
                  '--tw-ring-color': primaryColor
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = primaryColor
                  e.target.style.boxShadow = `0 0 0 2px ${primaryColor}20`
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d1d5db'
                  e.target.style.boxShadow = 'none'
                }}
                placeholder="seu@email.com"
                required
                disabled={isBlocked || loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg transition-all"
                onFocus={(e) => {
                  e.target.style.borderColor = primaryColor
                  e.target.style.boxShadow = `0 0 0 2px ${primaryColor}20`
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d1d5db'
                  e.target.style.boxShadow = 'none'
                }}
                placeholder="••••••••"
                required
                disabled={isBlocked || loading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || isBlocked}
            className="w-full text-white font-medium py-2 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:shadow-lg"
            style={{
              backgroundColor: primaryColor,
              '--tw-shadow-color': `${primaryColor}40`
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = secondaryColor
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = primaryColor
            }}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Entrando...
              </>
            ) : isBlocked ? (
              <>
                <Clock size={18} />
                Bloqueado
              </>
            ) : (
              <>
                <LogIn size={18} />
                Entrar
              </>
            )}
          </button>
        </form>

        {/* Rodapé */}
        <div className="mt-6 text-center">
          <p className="text-sm font-medium text-gray-700">
            {companyName}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            © {new Date().getFullYear()} - Todos os direitos reservados
          </p>
          {companySettings?.cnpj && (
            <p className="text-xs text-gray-400 mt-1">
              CNPJ: {companySettings.cnpj}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default Login