/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

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
  // SALVAR/CARREGAR DO LOCALSTORAGE
  // ==============================
  const saveProfileToStorage = useCallback((profileData) => {
    if (profileData) {
      localStorage.setItem('user_profile', JSON.stringify(profileData))
      localStorage.setItem('user_role', profileData.role)
    }
  }, [])

  const loadProfileFromStorage = useCallback(() => {
    const storedProfile = localStorage.getItem('user_profile')
    if (storedProfile) {
      try {
        return JSON.parse(storedProfile)
      } catch (e) {
        return null
      }
    }
    return null
  }, [])

  // ==============================
  // BUSCAR PROFILE COM FALLBACK LOCAL
  // ==============================
  const fetchProfile = useCallback(async (userId, forceRefresh = false) => {
    // Se não for forced refresh, tenta usar o cache primeiro
    if (!forceRefresh) {
      const cachedProfile = loadProfileFromStorage()
      if (cachedProfile && cachedProfile.id === userId) {
        console.log('📦 Usando profile do cache local:', cachedProfile.role)
        return cachedProfile
      }
    }
    
    try {
      console.log('🔍 Buscando profile no servidor...')
      
      // Promise com timeout de 3 segundos
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout na requisição')), 3000)
      })
      
      const fetchPromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()
      
      const { data, error } = await Promise.race([fetchPromise, timeoutPromise])
      
      if (error) throw error
      
      if (data) {
        console.log('✅ Profile encontrado no servidor:', data.role)
        saveProfileToStorage(data)
        return data
      }
      
      console.log('⚠️ Profile não encontrado no servidor')
      return null
    } catch (error) {
      console.error('❌ Erro ao buscar profile:', error.message)
      // Em caso de erro, tenta o cache
      const cachedProfile = loadProfileFromStorage()
      if (cachedProfile) {
        console.log('📦 Usando cache devido a erro:', cachedProfile.role)
        return cachedProfile
      }
      return null
    }
  }, [loadProfileFromStorage, saveProfileToStorage])

  // ==============================
  // LOGIN
  // ==============================
  const login = async (email, password) => {
    try {
      console.log('🔐 Tentando login para:', email)
      setLoading(true)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })

      if (error) throw error
      
      console.log('✅ Login realizado, buscando profile...')
      
      // Busca o profile e salva no cache
      if (data.user) {
        const profileData = await fetchProfile(data.user.id, true) // Force refresh
        if (profileData) {
          setProfile(profileData)
          setUser(data.user)
        } else {
          console.error('❌ Profile não encontrado para o usuário:', data.user.id)
        }
      }
      
      setLoading(false)
      return data
    } catch (error) {
      console.error('❌ Erro no login:', error)
      setLoading(false)
      throw error
    }
  }

  // ==============================
  // LOGOUT
  // ==============================
  const logout = async () => {
    try {
      console.log('🚪 Iniciando logout...')
      setLoading(true)
      
      // Limpa cache
      localStorage.removeItem('user_profile')
      localStorage.removeItem('user_role')
      
      setUser(null)
      setProfile(null)
      
      const { error } = await supabase.auth.signOut()
      
      if (error) throw error
      
      console.log('✅ Logout concluído')
      setLoading(false)
      
    } catch (error) {
      console.error('❌ Erro no logout:', error)
      setLoading(false)
      throw error
    }
  }

  // ==============================
  // EFFECT PRINCIPAL - RÁPIDO
  // ==============================
  useEffect(() => {
    let isMounted = true
    
    console.log('🚀 Inicializando AuthProvider...')

    const initializeAuth = async () => {
      try {
        // 1. PRIMEIRO: Tenta carregar do cache local (instantâneo)
        const cachedProfile = loadProfileFromStorage()
        if (cachedProfile) {
          console.log('✅ Cache local encontrado, exibindo imediatamente:', cachedProfile.role)
          setProfile(cachedProfile)
        }
        
        // 2. Busca a sessão atual
        console.log('🔍 Verificando sessão no Supabase...')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) throw error
        
        if (session?.user) {
          console.log('✅ Sessão encontrada:', session.user.id)
          setUser(session.user)
          
          // 3. Busca o profile atualizado (mas sem travar a UI)
          const profileData = await fetchProfile(session.user.id, true)
          if (isMounted && profileData) {
            console.log('🔄 Atualizando com dados frescos do servidor:', profileData.role)
            setProfile(profileData)
          } else if (isMounted && !profileData) {
            console.warn('⚠️ Profile não encontrado, limpando cache...')
            localStorage.removeItem('user_profile')
            localStorage.removeItem('user_role')
          }
        } else {
          console.log('❌ Sem sessão ativa')
          // Limpa cache se não tem sessão
          localStorage.removeItem('user_profile')
          localStorage.removeItem('user_role')
          setProfile(null)
        }
      } catch (err) {
        console.error('Erro na inicialização:', err)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }
    
    initializeAuth()

    // Listener para mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('📢 Auth event:', event)
        
        if (!isMounted) return
        
        if (event === 'SIGNED_OUT') {
          localStorage.removeItem('user_profile')
          localStorage.removeItem('user_role')
          setUser(null)
          setProfile(null)
          setLoading(false)
          return
        }
        
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user)
          const profileData = await fetchProfile(session.user.id, true)
          if (isMounted && profileData) {
            setProfile(profileData)
          }
          if (isMounted) setLoading(false)
        }
      }
    )

    return () => {
      console.log('🧹 Cleanup')
      isMounted = false
      subscription.unsubscribe()
    }
  }, [fetchProfile, loadProfileFromStorage])

  // Debug
  useEffect(() => {
    console.log('📊 Estado - loading:', loading, 'role:', profile?.role)
  }, [loading, profile])

  const permissions = getPermissions(profile?.role)

  const value = {
    user,
    profile,
    loading,
    login,
    logout,

    isAuthenticated: !!user && !!profile,
    isAdmin: profile?.role === 'admin',
    isManager: profile?.role === 'gerente',
    isOperator: profile?.role === 'operador',

    permissions,
    roleName: permissions.roleName,
    roleColor: permissions.roleColor,

    hasPermission: (perm) => permissions[perm] === true,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}