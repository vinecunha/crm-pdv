/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { secureStorage } from '../utils/secureStorage'
import { sanitizeInput } from '../utils/sanitize' 
import { logger } from '../utils/logger' 

const logger = {
  log: (...args) => import.meta.env.DEV && logger.log(...args),
  warn: (...args) => import.meta.env.DEV && console.warn(...args),
  error: (...args) => console.error(...args),
}

const AuthContext = createContext(null)

const LOGIN_ATTEMPTS_KEY = 'login_attempts'
const MAX_LOGIN_ATTEMPTS = 5
const LOGIN_BLOCK_DURATION = 15 * 60 * 1000

// ==============================
// VALIDAÇÃO DE FORÇA DA SENHA
// ==============================
export const validatePasswordStrength = (password) => {
  if (!password || password.length < 8) {
    return { valid: false, score: 0, message: 'A senha deve ter pelo menos 8 caracteres' }
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
  
  const getStrengthWidth = () => `${(strength.score / 5) * 100}%`
  
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

  const getPermissions = useCallback((role) => {
    const permissions = {
      admin: {
        roleName: 'Administrador',
        roleColor: 'from-purple-600 to-purple-700',
        canViewDashboard: true, canViewSales: true, canCreateSales: true,
        canCancelSales: true, canApplyDiscount: true, canViewProducts: true,
        canCreateProducts: true, canEditProducts: true, canManageStock: true,
        canViewCustomers: true, canCreateCustomers: true, canEditCustomers: true,
        canCommunicateWithCustomers: true, canViewCoupons: true, canCreateCoupons: true,
        canEditCoupons: true, canViewCashier: true, canCloseCashier: true,
        canViewReports: true, canExportReports: true, canViewUsers: true,
        canViewLogs: true, canViewSettings: true,
      },
      gerente: {
        roleName: 'Gerente',
        roleColor: 'from-blue-500 to-cyan-500',
        canViewDashboard: true, canViewSales: true, canCreateSales: true,
        canCancelSales: true, canApplyDiscount: true, canViewSalesList: true,
        canViewProducts: true, canCreateProducts: true, canEditProducts: true,
        canManageStock: true, canViewCustomers: true, canCreateCustomers: true,
        canEditCustomers: true, canCommunicateWithCustomers: true, canViewCoupons: true,
        canCreateCoupons: true, canEditCoupons: true, canViewCashier: true,
        canCloseCashier: true, canViewReports: true, canExportReports: true,
        canViewUsers: false, canViewLogs: true, canViewSettings: false,
      },
      operador: {
        roleName: 'Operador',
        roleColor: 'from-gray-500 to-gray-600',
        canViewDashboard: true, canViewSales: true, canCreateSales: true,
        canCancelSales: false, canApplyDiscount: false, canViewSalesList: false,
        canViewProducts: true, canCreateProducts: false, canEditProducts: false,
        canManageStock: false, canViewCustomers: true, canCreateCustomers: true,
        canEditCustomers: false, canCommunicateWithCustomers: false, canViewCoupons: false,
        canCreateCoupons: false, canEditCoupons: false, canViewCashier: false,
        canCloseCashier: false, canViewReports: false, canExportReports: false,
        canViewUsers:0, canViewLogs: false, canViewSettings: false,
      }
    }
    return permissions[role] || permissions.operador
  }, [])

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

  const fetchFullProfileFromDB = useCallback(async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()
      
      if (error) throw error
      
      if (data) {
        if (data.status && data.status !== 'active') {
          logger.warn('⚠️ Usuário com status não ativo:', data.status)
        }
        secureStorage.set('profile', data)
        return data
      }
      return null
    } catch (error) {
      logger.error('❌ Erro ao buscar profile do banco:', error.message)
      return null
    }
  }, [])

  const syncProfile = useCallback(async (userData, forceDBFetch = false) => {
    if (!userData) return null
    
    const jwtProfile = buildProfileFromJWT(userData)
    
    if (jwtProfile) {
      setProfile(jwtProfile)
      secureStorage.set('profile', jwtProfile)
      secureStorage.set('user_role', jwtProfile.role)
    }
    
    if (forceDBFetch) {
      const dbProfile = await fetchFullProfileFromDB(userData.id)
      if (dbProfile) {
        const mergedProfile = { ...jwtProfile, ...dbProfile }
        setProfile(mergedProfile)
        secureStorage.set('profile', mergedProfile)
        return mergedProfile
      }
    }
    
    return jwtProfile
  }, [buildProfileFromJWT, fetchFullProfileFromDB])

  const checkLoginRateLimit = useCallback(() => {
    try {
      const stored = secureStorage.get(LOGIN_ATTEMPTS_KEY)
      if (!stored) return { blocked: false, remaining: MAX_LOGIN_ATTEMPTS }
      
      const { attempts, blockedUntil } = stored
      
      if (blockedUntil && Date.now() < blockedUntil) {
        const minutesLeft = Math.ceil((blockedUntil - Date.now()) / 60000)
        return { blocked: true, remaining: 0, minutesLeft, message: `Muitas tentativas. Tente novamente em ${minutesLeft} minuto(s).` }
      }
      
      if (blockedUntil && Date.now() >= blockedUntil) {
        secureStorage.remove(LOGIN_ATTEMPTS_KEY)
        return { blocked: false, remaining: MAX_LOGIN_ATTEMPTS }
      }
      
      return { blocked: false, remaining: MAX_LOGIN_ATTEMPTS - (attempts || 0) }
    } catch {
      return { blocked: false, remaining: MAX_LOGIN_ATTEMPTS }
    }
  }, [])

  const recordLoginAttempt = useCallback(async (success, email = null) => {
    try {
      if (success) {
        secureStorage.remove(LOGIN_ATTEMPTS_KEY)
        return
      }
      
      const stored = secureStorage.get(LOGIN_ATTEMPTS_KEY)
      const attempts = (stored?.attempts || 0) + 1
      
      if (attempts >= MAX_LOGIN_ATTEMPTS) {
        secureStorage.set(LOGIN_ATTEMPTS_KEY, { attempts, blockedUntil: Date.now() + LOGIN_BLOCK_DURATION })
        
        if (email) {
          try {
            await supabase
              .from('profiles')
              .update({ status: 'locked', updated_at: new Date().toISOString() })
              .eq('email', email)
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

  // ==============================
  // LOGIN COM SANITIZAÇÃO
  // ==============================
  const login = async (email, password) => {
    try {
      const rateLimit = checkLoginRateLimit()
      if (rateLimit.blocked) throw new Error(rateLimit.message)
      
      // ✅ Sanitizar email
      const safeEmail = sanitizeInput(email)
      
      if (!safeEmail || !safeEmail.includes('@')) throw new Error('Email inválido')
      if (!password || password.length < 1) throw new Error('Senha é obrigatória')
      
      setLoading(true)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: safeEmail.trim().toLowerCase(),
        password,
      })

      if (error) {
        await recordLoginAttempt(false, safeEmail)
        throw error
      }
      
      if (data.user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('status')
          .eq('id', data.user.id)
          .single()
        
        if (profileError) throw profileError
        
        if (profileData?.status && profileData.status !== 'active') {
          await supabase.auth.signOut()
          await recordLoginAttempt(false, safeEmail)
          
          const messages = {
            'inactive': 'Usuário inativo. Contate o administrador.',
            'blocked': 'Usuário bloqueado. Contate o administrador.',
            'locked': 'Conta bloqueada por excesso de tentativas.'
          }
          throw new Error(messages[profileData.status] || 'Acesso negado.')
        }
        
        await recordLoginAttempt(true)
        setUser(data.user)
        await syncProfile(data.user, true)
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
  // REGISTRO COM SANITIZAÇÃO
  // ==============================
  const register = async (email, password, fullName) => {
    try {
      const passwordValidation = validatePasswordStrength(password)
      if (!passwordValidation.valid) throw new Error(passwordValidation.message)
      
      // ✅ Sanitizar entradas
      const safeEmail = sanitizeInput(email)
      const safeFullName = sanitizeInput(fullName)
      
      setLoading(true)
      
      const { data, error } = await supabase.auth.signUp({
        email: safeEmail.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: safeFullName,
            display_name: safeFullName.split(' ')[0]
          }
        }
      })

      if (error) throw error
      
      setLoading(false)
      return data
    } catch (error) {
      logger.error('❌ Erro no registro:', error.message)
      setLoading(false)
      throw error
    }
  }

  const changePassword = async (newPassword) => {
    try {
      const passwordValidation = validatePasswordStrength(newPassword)
      if (!passwordValidation.valid) throw new Error(passwordValidation.message)
      
      setLoading(true)
      const { data, error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      
      setLoading(false)
      return data
    } catch (error) {
      logger.error('❌ Erro ao alterar senha:', error.message)
      setLoading(false)
      throw error
    }
  }

  const resetPassword = async (email) => {
    try {
      const safeEmail = sanitizeInput(email) // ✅ Sanitizar
      
      const { data, error } = await supabase.auth.resetPasswordForEmail(
        safeEmail.trim().toLowerCase(),
        { redirectTo: `${window.location.origin}/reset-password` }
      )

      if (error) throw error
      return data
    } catch (error) {
      logger.error('❌ Erro ao solicitar reset:', error.message)
      throw error
    }
  }

  const logout = async () => {
    try {
      setLoading(true)
      
      secureStorage.remove('profile')
      secureStorage.remove('user_role')
      secureStorage.remove(LOGIN_ATTEMPTS_KEY)
      
      setUser(null)
      setProfile(null)
      
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      setLoading(false)
    } catch (error) {
      logger.error('❌ Erro no logout:', error.message)
      setLoading(false)
      throw error
    }
  }

  const refreshSession = useCallback(async () => {
    if (isRefreshing) return
    setIsRefreshing(true)
    
    try {
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
        }
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

    const initializeAuth = async () => {
      try {
        const cachedProfile = secureStorage.get('profile')
        if (cachedProfile) setProfile(cachedProfile)
        
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) throw error
        
        if (session?.user) {
          setUser(session.user)
          await syncProfile(session.user, true)
        } else {
          secureStorage.remove('profile')
          secureStorage.remove('user_role')
          setProfile(null)
          setUser(null)
        }
      } catch (err) {
        logger.error('❌ Erro na inicialização:', err.message)
        setUser(null)
        setProfile(null)
        secureStorage.remove('profile')
        secureStorage.remove('user_role')
      } finally {
        setLoading(false)
      }
    }
    
    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          secureStorage.remove('profile')
          secureStorage.remove('user_role')
          secureStorage.remove(LOGIN_ATTEMPTS_KEY)
          setUser(null)
          setProfile(null)
          return
        }
        
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user)
          await syncProfile(session.user, true)
        }
        
        if (event === 'TOKEN_REFRESHED' && session?.user) {
          setUser(session.user)
          await syncProfile(session.user, false)
        }
        
        if (event === 'USER_UPDATED' && session?.user) {
          setUser(session.user)
          await syncProfile(session.user, true)
        }
        
        if (event === 'TOKEN_REFRESH_FAILED') {
          await logout()
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [syncProfile])

  useEffect(() => {
    if (!user) return
    
    const interval = setInterval(async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error || !session) await logout()
      } catch (error) {
        logger.error('Erro ao verificar sessão:', error.message)
      }
    }, 30 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [user])

  const permissions = getPermissions(profile?.role)

  const value = {
    user, profile, loading, login, logout, register, changePassword,
    resetPassword, refreshSession, isAuthenticated: !!user && !!profile,
    isAdmin: profile?.role === 'admin', isManager: profile?.role === 'gerente',
    isOperator: profile?.role === 'operador', permissions,
    roleName: permissions.roleName, roleColor: permissions.roleColor,
    hasPermission: (perm) => permissions[perm] === true,
    checkLoginRateLimit, validatePasswordStrength,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}