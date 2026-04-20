import { supabase } from '../lib/supabase'

/**
 * Buscar metas de um usuário
 */
export const fetchUserGoals = async (userId) => {
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
  
  if (error) throw error
  
  // Converter para objeto por tipo
  const goals = {
    daily: { target_amount: 1000 },
    monthly: { target_amount: 20000 },
    yearly: { target_amount: 240000 }
  }
  
  data?.forEach(goal => {
    goals[goal.goal_type] = goal
  })
  
  return goals
}

/**
 * Buscar metas padrão do sistema
 */
export const fetchDefaultGoals = async () => {
  // Pode vir de uma tabela de configurações
  return {
    daily: 1000,
    monthly: 20000,
    yearly: 240000
  }
}

/**
 * Salvar ou atualizar meta
 */
export const saveGoal = async (userId, goalType, targetAmount, createdBy) => {
  // Verificar se já existe
  const { data: existing } = await supabase
    .from('goals')
    .select('id')
    .eq('user_id', userId)
    .eq('goal_type', goalType)
    .maybeSingle()
  
  if (existing) {
    // Atualizar
    const { data, error } = await supabase
      .from('goals')
      .update({
        target_amount: targetAmount,
        updated_by: createdBy
      })
      .eq('id', existing.id)
      .select()
      .single()
    
    if (error) throw error
    return data
  } else {
    // Criar
    const { data, error } = await supabase
      .from('goals')
      .insert({
        user_id: userId,
        goal_type: goalType,
        target_amount: targetAmount,
        created_by: createdBy,
        updated_by: createdBy
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}

/**
 * Salvar múltiplas metas de uma vez
 */
export const saveAllGoals = async (userId, goals, createdBy) => {
  const promises = Object.entries(goals).map(([type, amount]) => 
    saveGoal(userId, type, amount, createdBy)
  )
  
  return Promise.all(promises)
}

/**
 * Buscar metas de toda a equipe (para gerentes/admins)
 */
export const fetchTeamGoals = async (userRole, userId) => {
  let query = supabase
    .from('goals')
    .select(`
      *,
      user:profiles!goals_user_id_fkey(
        id,
        full_name,
        email,
        role
      )
    `)
  
  if (userRole === 'gerente') {
    // Gerente vê apenas metas de operadores
    const { data: operadores } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'operador')
    
    const operadorIds = operadores?.map(o => o.id) || []
    query = query.in('user_id', operadorIds)
  }
  
  const { data, error } = await query
  
  if (error) throw error
  return data || []
}