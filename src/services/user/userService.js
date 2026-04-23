import { supabase } from '@lib/supabase'
import { sanitizeObject } from '@utils/sanitize'

/**
 * Buscar todos os usuários
 */
export const fetchUsers = async (filters = {}) => {
  let query = supabase.from('profiles').select('*')
  if (filters?.role) query = query.eq('role', filters.role)
  
  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

/**
 * Buscar usuários bloqueados
 */
export const fetchBlockedUsers = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  
  return (data || []).map(u => ({ ...u, status: u.status || 'active' }))
}

/**
 * Buscar usuário por ID
 */
export const fetchUserById = async (id) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data
}

/**
 * Buscar usuário por matrícula
 */
export const fetchUserByRegistration = async (registrationNumber) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('registration_number', registrationNumber)
    .single()
  
  if (error) throw error
  return data
}

/**
 * Gerar próximo número de matrícula
 */
export const generateRegistrationNumber = async () => {
  const { data, error } = await supabase
    .rpc('generate_registration_number')
  
  if (error) throw error
  return data
}

/**
 * Criar usuário
 */
export const createUser = async (userData) => {
  const safeData = sanitizeObject(userData)
  
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: safeData.email,
    password: safeData.password,
    options: { 
      data: { 
        full_name: safeData.full_name, 
        role: safeData.role,
        registration_number: safeData.registration_number
      } 
    }
  })
  
  if (authError) throw authError
  
  // Se tiver matrícula definida, atualizar o perfil
  if (safeData.registration_number) {
    await supabase
      .from('profiles')
      .update({ registration_number: safeData.registration_number })
      .eq('id', authData.user.id)
  }
  
  return authData.user
}

/**
 * Atualizar usuário
 */
export const updateUser = async (id, userData) => {
  const safeData = sanitizeObject(userData)
  
  const { error } = await supabase
    .from('profiles')
    .update(safeData)
    .eq('id', id)
  
  if (error) throw error
  return { id, ...safeData }
}

export const updateUserPreferences = async (userId, preferences) => {
  const { data, error } = await supabase.rpc('update_user_preferences', {
    p_user_id: userId,
    p_dark_mode: preferences.dark_mode,
    p_sidebar_collapsed: preferences.sidebar_collapsed,
    p_table_density: preferences.table_density
  })

  if (error) throw error
  return data
}

/**
 * Atualizar status do usuário
 */
export const updateUserStatus = async (id, status) => {
  const { error } = await supabase
    .from('profiles')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
  return { id, status }
}

/**
 * Excluir usuário completamente
 */
export const deleteUser = async (userId) => {
  const { data, error } = await supabase.rpc('delete_user_completely', { user_id: userId })
  if (error) throw error
  if (data && !data.success) throw new Error(data.error)
  return userId
}

/**
 * Desbloquear todos os usuários
 */
export const unlockAllUsers = async (userIds) => {
  for (const id of userIds) {
    await supabase
      .from('profiles')
      .update({ status: 'active', updated_at: new Date().toISOString() })
      .eq('id', id)
  }
  return userIds.length
}
