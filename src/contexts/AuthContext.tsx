/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { supabase, type User, type Session } from '@lib/supabase'
import { sanitizeInput } from '@utils/sanitize' 
import { logger } from '@utils/logger' 

interface Profile {
  id: string
  email: string
  full_name: string
  display_name: string
  role: string
  created_at: string
  updated_at: string
}

interface PasswordStrength {
  valid: boolean
  score: number
  message: string
  checks?: Record<string, boolean>
}

interface Permissions {
  roleName: string
  roleColor: string
  [key: string]: unknown
}

const AuthContext = createContext<{
  user: User | null
  profile: Profile | null
  loading: boolean
  login: (email: string, password: string) => Promise<any>
  logout: () => Promise<void>
  register: (email: string, password: string, fullName: string) => Promise<any>
  changePassword: (newPassword: string) => Promise<any>
  resetPassword: (email: string) => Promise<any>
  refreshSession: () => Promise<void>
  isAuthenticated: boolean
  isAdmin: boolean
  isManager: boolean
  isOperator: boolean
  permissions: Permissions
  roleName: string
  roleColor: string
  hasPermission: (perm: string) => boolean
  validatePasswordStrength: (password: string) => PasswordStrength
} | null>(null)

// NOTE: Rate limiting moved to server-side (Supabase Edge Function or database)
// Client-side rate limiting was bypassable via localStorage clearing/incognito mode

// ==============================
// VALIDAÇÃO DE FORÇA DA SENHA
// ==============================
interface PasswordChecks {
  hasUpperCase: boolean
  hasLowerCase: boolean
  hasNumbers: boolean
  hasSpecialChar: boolean
  isLongEnough: boolean
}

export const validatePasswordStrength = (password: string): PasswordStrength => {
  if (!password || password.length < 8) {
    return { valid: false, score: 0, message: 'A senha deve ter pelo menos 8 caracteres' }
  }
  
  let score = 0
  const checks: PasswordChecks = {
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

export const usePasswordStrength = (password: string) => {
  const [strength, setStrength] = useState<PasswordStrength>({ valid: false, score: 0, message: '' })
  
  useEffect(() => {
    if (password) {
      setStrength(validatePasswordStrength(password))
    } else {
      setStrength({ valid: false, score: 0, message: '' })
    }
  }, [password])
  
  const getStrengthColor = (): string => {
    if (strength.score <= 2) return 'bg-red-500'
    if (strength.score === 3) return 'bg-yellow-500'
    if (strength.score === 4) return 'bg-green-500'
    return 'bg-green-600'
  }
  
  const getStrengthWidth = (): string => `${(strength.score / 5) * 100}%`
  
  return { ...strength, color: getStrengthColor(), width: getStrengthWidth() }
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)
  const initialized = useRef<boolean>(false)

  const getPermissions = useCallback((role: string): Permissions => {
    // NOTE: These are DEFAULT permissions for UI display only.
    // Actual access control MUST be enforced by:
    // 1. Supabase RLS policies on tables
    // 2. Edge Functions for sensitive operations
    // 3. Backend role checks in API calls
    // 
    // For finer control, permissions should be stored in the database
    // (e.g., profile.role_permissions JSONB column) and fetched with the profile.
    const permissions: Record<string, Permissions> = {
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
        canViewLogs: true, canViewSettings: true, canViewTasks: true, canViewCommissions: true,
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
        canViewUsers: false, canViewLogs: true, canViewSettings: false, canViewTasks: true
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
        canViewUsers: false, canViewLogs: false, canViewSettings: false, canViewTasks: true
      }
    }
    return permissions[role] || permissions.operador
  }, [])

  const buildProfileFromJWT = useCallback((userData: User): Profile | null => {
    if (!userData) return null
    const role = userData.app_metadata?.role || userData.user_metadata?.role || 'operador'
    const fullName = userData.user_metadata?.full_name || userData.email?.split('@')[0] || 'Usuário'
    return {
      id: userData.id,
      email: userData.email || '',
      full_name: fullName,
      display_name: userData.user_metadata?.display_name || fullName.split(' ')[0] || '',
      role: role,
      created_at: userData.created_at || '',
      updated_at: userData.updated_at || ''
    }
  }, [])

  const fetchFullProfileFromDB = useCallback(async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()
      
      if (error) throw error
      
      if (data) {
        const profileData: Profile = {
          ...data,
          id: userId, // Força o ID a ser o UUID do auth
          profile_id: data.id // Preserva o ID da tabela profiles se necessário
        }
        if (profileData.status && profileData.status !== 'active') {
          logger.warn('⚠️ Usuário com status não ativo:', profileData.status)
        }
        
        localStorage.setItem('profile', JSON.stringify(profileData))
        return profileData
      }
      return null
    } catch (error: any) {
      logger.error('❌ Erro ao buscar profile do banco:', error.message)
      return null
    }
  }, [])

  const syncProfile = useCallback(async (userData: User | null, forceDBFetch = false): Promise<Profile | null> => {
    if (!userData) return null
    
    const jwtProfile = buildProfileFromJWT(userData)
    
    if (jwtProfile) {
      setProfile(jwtProfile)
      localStorage.setItem('profile', JSON.stringify(jwtProfile))
      localStorage.setItem('user_role', jwtProfile.role)
    }
    
    if (forceDBFetch) {
      const dbProfile = await fetchFullProfileFromDB(userData.id)
      if (dbProfile) {
        // Role: JWT has precedence when explicitly defined via app_metadata.
        // If JWT returned the fallback 'operador' (app_metadata empty),
        // use the role from the database as source of truth.
        const mergedProfile: Profile = { 
          ...dbProfile, 
          id: jwtProfile.id, // Force ID from auth.users
          role: jwtProfile.role !== 'operador'
              ? jwtProfile.role          // JWT has explicit role → use it
              : (dbProfile.role || 'operador'), // JWT empty → use database
          email: jwtProfile.email, // Force email from auth.users
        }
        setProfile(mergedProfile)
        localStorage.setItem('profile', JSON.stringify(mergedProfile))
        return mergedProfile
      }
    }
    
    return jwtProfile
  }, [buildProfileFromJWT, fetchFullProfileFromDB])

  // ==============================
  // LOGIN COM SANITIZAÇÃO
  // ==============================
  const login = async (email: string, password: string): Promise<any> => {
    try {
      const safeEmail = sanitizeInput(email)
      
      if (!safeEmail || !safeEmail.includes('@')) throw new Error('Email inválido')
      if (!password || password.length < 1) throw new Error('Senha é obrigatória')
      
      setLoading(true)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: safeEmail.trim().toLowerCase(),
        password,
      })

      if (error) throw error
      
      if (data.user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('status')
          .eq('id', data.user.id)
          .single()
        
        if (profileError) throw profileError
        
        if (profileData?.status && profileData.status !== 'active') {
          await supabase.auth.signOut()
          
          const messages: Record<string, string> = {
            'inactive': 'Usuário inativo. Contate o administrador.',
            'blocked': 'Usuário bloqueado. Contate o administrador.',
            'locked': 'Conta bloqueada por excesso de tentativas.'
          }
          throw new Error(messages[profileData.status] || 'Acesso negado.')
        }
        
        setUser(data.user)
        await syncProfile(data.user, true)
      }
      
      setLoading(false)
      return data
      
    } catch (error: any) {
      logger.error('❌ Erro no login:', error.message)
      setLoading(false)
      throw error
    }
  }

  // ==============================
  // REGISTRO COM SANITIZAÇÃO
  // ==============================
  const register = async (email: string, password: string, fullName: string): Promise<any> => {
    try {
      const passwordValidation = validatePasswordStrength(password)
      if (!passwordValidation.valid) throw new Error(passwordValidation.message)
      
      const safeEmail = sanitizeInput(email)
      const safeFullName = sanitizeInput(fullName)
      
      setLoading(true)
      
      const { data, error } = await supabase.auth.signUp({
        email: safeEmail.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: safeFullName,
            display_name: safeFullName.split(' ')[0] || ''
          }
        }
      })

      if (error) throw error
      
      setLoading(false)
      return data
    } catch (error: any) {
      logger.error('❌ Erro no registro:', error.message)
      setLoading(false)
      throw error
    }
  }

  const changePassword = async (newPassword: string): Promise<any> => {
    try {
      const passwordValidation = validatePasswordStrength(newPassword)
      if (!passwordValidation.valid) throw new Error(passwordValidation.message)
      
      setLoading(true)
      const { data, error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      
      setLoading(false)
      return data
    } catch (error: any) {
      logger.error('❌ Erro ao alterar senha:', error.message)
      setLoading(false)
      throw error
    }
  }

  const resetPassword = async (email: string): Promise<any> => {
    try {
      const safeEmail = sanitizeInput(email)
      
      const { data, error } = await supabase.auth.resetPasswordForEmail(
        safeEmail.trim().toLowerCase(),
        { redirectTo: `${window.location.origin}/reset-password` }
      )

      if (error) throw error
      return data
    } catch (error: any) {
      logger.error('❌ Erro ao solicitar reset:', error.message)
      throw error
    }
  }

  const logout = async (): Promise<void> => {
    try {
      setLoading(true)
      
       localStorage.removeItem('profile')
       localStorage.removeItem('user_role')
      
      setUser(null)
      setProfile(null)
      
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      setLoading(false)
    } catch (error: any) {
      logger.error('❌ Erro no logout:', error.message)
      setLoading(false)
      throw error
    }
  }

  const refreshSession = useCallback(async (): Promise<void> => {
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
          setProfile(freshProfile as Profile)
           localStorage.setItem('profile', JSON.stringify(freshProfile))
        }
      }
    } catch (error: any) {
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
       const cachedProfile = localStorage.getItem('profile')
       if (cachedProfile) setProfile(JSON.parse(cachedProfile))
        
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) throw error
        
         if (session?.user) {
           setUser(session.user)
           await syncProfile(session.user, true)
         } else {
           localStorage.removeItem('profile')
           localStorage.removeItem('user_role')
           setProfile(null)
           setUser(null)
         }
       } catch (err) {
         logger.error('❌ Erro na inicialização:', err.message)
         setUser(null)
         setProfile(null)
         localStorage.removeItem('profile')
         localStorage.removeItem('user_role')
       } finally {
         setLoading(false)
       }
     }
     
     initializeAuth()

     const { data: { subscription } } = supabase.auth.onAuthStateChange(
       async (event, session) => {
         if (event === 'SIGNED_OUT') {
           localStorage.removeItem('profile')
           localStorage.removeItem('user_role')
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
    hasPermission: (perm) => {
      // NOTE: This only controls UI visibility, NOT actual access.
      // All data access must be protected by Supabase RLS policies.
      return permissions[perm] === true
    },
    validatePasswordStrength,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
