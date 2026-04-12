/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { secureStorage } from '../utils/secureStorage'

// Logger condicional (só loga em desenvolvimento)
const logger = {
  log: (...args) => import.meta.env.DEV && console.log(...args),
  warn: (...args) => import.meta.env.DEV && console.warn(...args),
  error: (...args) => console.error(...args),
}

const AuthContext = createContext(null)

// Rate limiting para login
const LOGIN_ATTEMPTS_KEY = 'login_attempts'
const MAX_LOGIN_ATTEMPTS = 5
const LOGIN_BLOCK_DURATION = 15 * 60 * 1000 // 15 minutos

// ==============================
// VALIDAÇÃO DE FORÇA DA SENHA
// ==============================
export const validatePasswordStrength = (password) => {
  if (!password || password.length < 8) {
    return { 
      valid: false, 
      score: 0,
      message: 'A senha deve ter pelo menos 8 caracteres' 
    }
  }
  
  let score = 0
  const checks = {
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumbers: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    isLongEnough: password.length >= 12
  }
  
  if (checks.hasUpperCase) score++
  if (checks.hasLowerCase) score++
  if (checks.hasNumbers) score++
  if (checks.hasSpecialChar) score++
  if (checks.isLongEnough) score++
  
  // Requisitos mínimos
  if (!checks.hasUpperCase) {
    return { valid: false, score, message: 'A senha deve conter pelo menos uma letra maiúscula' }
  }
  if (!checks.hasLowerCase) {
    return { valid: false, score, message: 'A senha deve conter pelo menos uma letra minúscula' }
  }
  if (!checks.hasNumbers) {
    return { valid: false, score, message: 'A senha deve conter pelo menos um número' }
  }
  
  let message = ''
  if (score <= 2) message = 'Senha fraca'
  else if (score === 3) message = 'Senha média'
  else if (score === 4) message = 'Senha forte'
  else message = 'Senha muito forte'
  
  return { valid: true, score, message, checks }
}

// Hook para validação de senha em tempo real
export const usePasswordStrength = (password) => {
  const [strength, setStrength] = useState({ valid: false, score: 0, message: '' })
  
  useEffect(() => {
    if (password) {
      setStrength(validatePasswordStrength(password))
    } else {
      setStrength({ valid: false, score: 0, message: '' })
    }
  }, [password])
  
  const getStrengthColor = () => {
    if (strength.score <= 2) return 'bg-red-500'
    if (strength.score === 3) return 'bg-yellow-500'
    if (strength.score === 4) return 'bg-green-500'
    return 'bg-green-600'
  }
  
  const getStrengthWidth = () => {
    return `${(strength.score / 5) * 100}%`
  }
  
  return { ...strength, color: getStrengthColor(), width: getStrengthWidth() }
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const initialized = useRef(false)

  // ==============================
  // PERMISSÕES
  // ==============================
  const getPermissions = useCallback((role) => {
    const permissions = {
      admin: {
        roleName: 'Administrador',
        roleColor: 'from-purple-600 to-purple-700',
        canViewDashboard: true,
        canViewSales: true,
        canViewProducts: true,
        canManageStock: true,
        canViewCustomers: true,
        canViewCoupons: true,
        canViewReports: true,
        canViewUsers: true,
        canViewLogs: true,
        canViewSettings: true,
      },
      gerente: {
        roleName: 'Gerente',
        roleColor: 'from-blue-500 to-cyan-500',
        canViewDashboard: true,
        canViewSales: true,
        canViewProducts: true,
        canManageStock: true,
        canViewCustomers: true,
        canViewCoupons: true,
        canViewReports: true,
        canViewUsers: false,
        canViewLogs: false,
        canViewSettings: false,
      },
      operador: {
        roleName: 'Operador',
        roleColor: 'from-gray-500 to-gray-600',
        canViewDashboard: true,
        canViewSales: true,
        canViewProducts: false,
        canViewCustomers: false,
        canViewReports: false,
        canViewUsers: false,
        canViewLogs: false,
        canViewSettings: false,
      }
    }
    return permissions[role] || permissions.operador
  }, [])

  // ==============================
  // CONSTRUIR PROFILE A PARTIR DO JWT
  // ==============================
  const buildProfileFromJWT = useCallback((userData) => {
    if (!userData) return null
    const role = userData.app_metadata?.role || 'operador'
    const fullName = userData.user_metadata?.full_name || userData.email?.split('@')[0] || 'Usuário'
    return {
      id: userData.id,
      email: userData.email,
      full_name: fullName,
      display_name: userData.user_metadata?.display_name || fullName.split(' ')[0],
      role: role,
      created_at: userData.created_at,
      updated_at: userData.updated_at
    }
  }, [])

  // ==============================
  // BUSCAR PROFILE COMPLETO DO BANCO
  // ==============================
  const fetchFullProfileFromDB = useCallback(async (userId) => {
    try {
      logger.log('🔍 Buscando profile completo no banco...')
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()
      
      if (error) throw error
      
      if (data) {
        // Verificar status
        if (data.status && data.status !== 'active') {
          logger.warn('⚠️ Usuário com status não ativo:', data.status)
        }
        logger.log('✅ Profile encontrado no banco')
        secureStorage.set('profile', data)
        return data
      }
      return null
    } catch (error) {
      logger.error('❌ Erro ao buscar profile do banco:', error.message)
      return null
    }
  }, [])

  // ==============================
  // VERIFICAR STATUS DO USUÁRIO (EDGE FUNCTION)
  // ==============================
  const checkUserStatus = useCallback(async (userId) => {
    try {
      logger.log('🔒 Verificando status do usuário...')
      
      const { data, error } = await supabase.functions.invoke('check-user-status', {
        body: { user_id: userId }
      })
      
      if (error) {
        logger.error('❌ Erro ao chamar Edge Function:', error)
        return { allowed: true } // Fail open
      }
      
      logger.log('📊 Resultado da verificação:', data)
      return data
      
    } catch (error) {
      logger.error('❌ Erro ao verificar status:', error)
      return { allowed: true } // Fail open
    }
  }, [])

  // ==============================
  // SINCRONIZAR PROFILE (JWT + BANCO)
  // ==============================
  const syncProfile = useCallback(async (userData, forceDBFetch = false) => {
    if (!userData) return null
    
    const jwtProfile = buildProfileFromJWT(userData)
    
    if (jwtProfile) {
      setProfile(jwtProfile)
      secureStorage.set('profile', jwtProfile)
      secureStorage.set('user_role', jwtProfile.role)
      logger.log('📦 Profile carregado do JWT:', jwtProfile.role)
    }
    
    if (forceDBFetch) {
      fetchFullProfileFromDB(userData.id).then(dbProfile => {
        if (dbProfile) {
          setProfile(prev => ({ ...prev, ...dbProfile }))
          secureStorage.set('profile', { ...jwtProfile, ...dbProfile })
          logger.log('🔄 Profile atualizado com dados do banco')
        }
      }).catch(err => {
        logger.warn('⚠️ Não foi possível buscar dados complementares:', err.message)
      })
    }
    
    return jwtProfile
  }, [buildProfileFromJWT, fetchFullProfileFromDB])

  // ==============================
  // VERIFICAR RATE LIMIT DE LOGIN
  // ==============================
  const checkLoginRateLimit = useCallback(() => {
    try {
      const stored = secureStorage.get(LOGIN_ATTEMPTS_KEY)
      if (!stored) return { blocked: false, remaining: MAX_LOGIN_ATTEMPTS }
      
      const { attempts, blockedUntil } = stored
      
      if (blockedUntil && Date.now() < blockedUntil) {
        const minutesLeft = Math.ceil((blockedUntil - Date.now()) / 60000)
        return { 
          blocked: true, 
          remaining: 0, 
          minutesLeft,
          message: `Muitas tentativas. Tente novamente em ${minutesLeft} minuto(s).`
        }
      }
      
      if (blockedUntil && Date.now() >= blockedUntil) {
        secureStorage.remove(LOGIN_ATTEMPTS_KEY)
        return { blocked: false, remaining: MAX_LOGIN_ATTEMPTS }
      }
      
      return { 
        blocked: false, 
        remaining: MAX_LOGIN_ATTEMPTS - (attempts || 0)
      }
    } catch {
      return { blocked: false, remaining: MAX_LOGIN_ATTEMPTS }
    }
  }, [])

  // ==============================
  // REGISTRAR TENTATIVA DE LOGIN
  // ==============================
  const recordLoginAttempt = useCallback(async (success, email = null) => {
    try {
      if (success) {
        secureStorage.remove(LOGIN_ATTEMPTS_KEY)
        return
      }
      
      const stored = secureStorage.get(LOGIN_ATTEMPTS_KEY)
      const attempts = (stored?.attempts || 0) + 1
      
      if (attempts >= MAX_LOGIN_ATTEMPTS) {
        secureStorage.set(LOGIN_ATTEMPTS_KEY, {
          attempts,
          blockedUntil: Date.now() + LOGIN_BLOCK_DURATION
        })
        
        // Se temos email, atualizar status no banco para 'locked'
        if (email) {
          try {
            await supabase
              .from('profiles')
              .update({ status: 'locked', updated_at: new Date().toISOString() })
              .eq('email', email)
            logger.log('🔒 Usuário bloqueado por excesso de tentativas:', email)
          } catch (err) {
            logger.error('Erro ao bloquear usuário:', err)
          }
        }
      } else {
        secureStorage.set(LOGIN_ATTEMPTS_KEY, { attempts, blockedUntil: null })
      }
    } catch (error) {
      logger.error('Erro ao registrar tentativa de login:', error)
    }
  }, [])

  const login = async (email, password) => {
    try {
      const rateLimit = checkLoginRateLimit()
      if (rateLimit.blocked) {
        throw new Error(rateLimit.message)
      }
      
      if (!email || !email.includes('@')) {
        throw new Error('Email inválido')
      }
      
      if (!password || password.length < 1) {
        throw new Error('Senha é obrigatória')
      }
      
      logger.log('🔐 Tentando login para:', email)
      setLoading(true)
      
      // 1. Fazer login
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })

      if (error) {
        await recordLoginAttempt(false, email)
        throw error
      }
      
      // 2. VERIFICAR STATUS DO USUÁRIO (ADICIONAR ESTE BLOCO)
      if (data.user) {
        logger.log('🔒 Verificando status do usuário...')
        
        // Verificar status diretamente no banco (mais confiável)
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('status')
          .eq('id', data.user.id)
          .single()
        
        if (profileError) {
          logger.error('❌ Erro ao buscar status:', profileError)
        } else if (profile) {
          logger.log('📊 Status do usuário:', profile.status)
          
          if (profile.status && profile.status !== 'active') {
            // Usuário bloqueado - fazer logout
            logger.warn('❌ Acesso negado. Status:', profile.status)
            await supabase.auth.signOut()
            await recordLoginAttempt(false, email)
            
            const messages = {
              'inactive': 'Usuário inativo. Contate o administrador.',
              'blocked': 'Usuário bloqueado. Contate o administrador.',
              'locked': 'Conta bloqueada por excesso de tentativas. Contate o administrador.'
            }
            throw new Error(messages[profile.status] || 'Acesso negado.')
          }
        }
        
        // 3. Status OK - continuar
        logger.log('✅ Status verificado, acesso permitido')
        await recordLoginAttempt(true)
        await syncProfile(data.user, true)
        setUser(data.user)
      }
      
      setLoading(false)
      return data
      
    } catch (error) {
      logger.error('❌ Erro no login:', error.message)
      setLoading(false)
      throw error
    }
  }

  // ==============================
  // REGISTRO COM VALIDAÇÃO DE SENHA
  // ==============================
  const register = async (email, password, fullName) => {
    try {
      const passwordValidation = validatePasswordStrength(password)
      if (!passwordValidation.valid) {
        throw new Error(passwordValidation.message)
      }
      
      logger.log('📝 Registrando novo usuário:', email)
      setLoading(true)
      
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: fullName,
            display_name: fullName.split(' ')[0]
          }
        }
      })

      if (error) throw error
      
      logger.log('✅ Registro realizado')
      setLoading(false)
      return data
    } catch (error) {
      logger.error('❌ Erro no registro:', error.message)
      setLoading(false)
      throw error
    }
  }

  // ==============================
  // ALTERAR SENHA COM VALIDAÇÃO
  // ==============================
  const changePassword = async (newPassword) => {
    try {
      const passwordValidation = validatePasswordStrength(newPassword)
      if (!passwordValidation.valid) {
        throw new Error(passwordValidation.message)
      }
      
      logger.log('🔑 Alterando senha...')
      setLoading(true)
      
      const { data, error } = await supabase.auth.updateUser({ password: newPassword })

      if (error) throw error
      
      logger.log('✅ Senha alterada com sucesso')
      setLoading(false)
      return data
    } catch (error) {
      logger.error('❌ Erro ao alterar senha:', error.message)
      setLoading(false)
      throw error
    }
  }

  // ==============================
  // RESETAR SENHA (ESQUECI MINHA SENHA)
  // ==============================
  const resetPassword = async (email) => {
    try {
      logger.log('📧 Solicitando reset de senha para:', email)
      
      const { data, error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        { redirectTo: `${window.location.origin}/reset-password` }
      )

      if (error) throw error
      
      logger.log('✅ Email de reset enviado')
      return data
    } catch (error) {
      logger.error('❌ Erro ao solicitar reset:', error.message)
      throw error
    }
  }

  // ==============================
  // LOGOUT
  // ==============================
  const logout = async () => {
    try {
      logger.log('🚪 Iniciando logout...')
      setLoading(true)
      
      secureStorage.remove('profile')
      secureStorage.remove('user_role')
      secureStorage.remove(LOGIN_ATTEMPTS_KEY)
      
      setUser(null)
      setProfile(null)
      
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      logger.log('✅ Logout concluído')
      setLoading(false)
      
    } catch (error) {
      logger.error('❌ Erro no logout:', error.message)
      setLoading(false)
      throw error
    }
  }

  // ==============================
  // REFRESH SESSION
  // ==============================
  const refreshSession = useCallback(async () => {
    if (isRefreshing) return
    setIsRefreshing(true)
    
    try {
      logger.log('🔄 Atualizando sessão e perfil...')
      
      const { data: { session }, error: sessionError } = await supabase.auth.refreshSession()
      if (sessionError) throw sessionError
      
      if (session?.user) {
        setUser(session.user)
        
        const { data: freshProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        
        if (!profileError && freshProfile) {
          setProfile(freshProfile)
          secureStorage.set('profile', freshProfile)
          logger.log('✅ Perfil recarregado do banco')
        }
        
        logger.log('✅ Sessão atualizada')
      }
    } catch (error) {
      logger.error('❌ Erro ao atualizar sessão:', error.message)
    } finally {
      setIsRefreshing(false)
    }
  }, [isRefreshing])

  // ==============================
  // EFFECT PRINCIPAL - INICIALIZAÇÃO
  // ==============================
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    
    logger.log('🚀 Inicializando AuthProvider...')

    const initializeAuth = async () => {
      try {
        const cachedProfile = secureStorage.get('profile')
        if (cachedProfile) {
          logger.log('✅ Cache seguro encontrado, exibindo imediatamente')
          setProfile(cachedProfile)
        }
        
        logger.log('🔍 Verificando sessão no Supabase...')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) throw error
        
        if (session?.user) {
          logger.log('✅ Sessão encontrada')
          setUser(session.user)
          await syncProfile(session.user, true)
        } else {
          logger.log('❌ Sem sessão ativa')
          secureStorage.remove('profile')
          secureStorage.remove('user_role')
          setProfile(null)
        }
      } catch (err) {
        logger.error('Erro na inicialização:', err.message)
      } finally {
        setLoading(false)
      }
    }
    
    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        logger.log('📢 Auth event:', event)
        
        if (event === 'SIGNED_OUT') {
          secureStorage.remove('profile')
          secureStorage.remove('user_role')
          secureStorage.remove(LOGIN_ATTEMPTS_KEY)
          setUser(null)
          setProfile(null)
          setLoading(false)
          return
        }
        
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user)
          await syncProfile(session.user, true)
          setLoading(false)
        }
        
        if (event === 'TOKEN_REFRESHED' && session?.user) {
          setUser(session.user)
          await syncProfile(session.user, false)
        }
        
        if (event === 'TOKEN_REFRESH_FAILED') {
          logger.warn('⚠️ Token refresh falhou, fazendo logout...')
          await logout()
        }
      }
    )

    return () => {
      logger.log('🧹 Cleanup AuthProvider')
      subscription.unsubscribe()
    }
  }, [syncProfile, logout])

  // ==============================
  // VERIFICAÇÃO PERIÓDICA DE SESSÃO
  // ==============================
  useEffect(() => {
    if (!user) return
    
    const interval = setInterval(async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error || !session) {
          logger.warn('⚠️ Sessão expirada, fazendo logout...')
          await logout()
        }
      } catch (error) {
        logger.error('Erro ao verificar sessão:', error.message)
      }
    }, 30 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [user, logout])

  // ==============================
  // VALORES DO CONTEXTO
  // ==============================
  const permissions = getPermissions(profile?.role)

  const value = {
    user,
    profile,
    loading,
    login,
    logout,
    register,
    changePassword,
    resetPassword,
    refreshSession,

    isAuthenticated: !!user && !!profile,
    isAdmin: profile?.role === 'admin',
    isManager: profile?.role === 'gerente',
    isOperator: profile?.role === 'operador',

    permissions,
    roleName: permissions.roleName,
    roleColor: permissions.roleColor,

    hasPermission: (perm) => permissions[perm] === true,
    
    checkLoginRateLimit,
    validatePasswordStrength,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}