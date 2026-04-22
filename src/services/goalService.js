// src/services/goalService.js
import { supabase } from '@lib/supabase'
import * as notificationService from '@services/notificationService'

/**
 * Buscar metas de um usuário
 * @returns {Promise<Object>} Objeto com metas e flag isDefault
 */
export const fetchUserGoals = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
    
    if (error) throw error
    
    // Se não tem dados no banco, retornar com flag isDefault: true
    if (!data || data.length === 0) {
      return {
        daily: { target_amount: 1000, isDefault: true },
        monthly: { target_amount: 20000, isDefault: true },
        yearly: { target_amount: 240000, isDefault: true },
        _allDefault: true
      }
    }
    
    // Verificar quais tipos existem no banco
    const existingTypes = new Set(data.map(g => g.goal_type))
    const allTypes = ['daily', 'monthly', 'yearly']
    const missingTypes = allTypes.filter(t => !existingTypes.has(t))
    
    // Converter para objeto por tipo
    const goals = {}
    
    data.forEach(goal => {
      goals[goal.goal_type] = {
        ...goal,
        isDefault: false
      }
    })
    
    // Preencher tipos faltantes com valores padrão
    const defaultValues = {
      daily: 1000,
      monthly: 20000,
      yearly: 240000
    }
    
    missingTypes.forEach(type => {
      goals[type] = {
        target_amount: defaultValues[type],
        isDefault: true
      }
    })
    
    // Flag global se TODOS são padrão
    goals._allDefault = missingTypes.length === 3
    goals._hasMissingTypes = missingTypes.length > 0
    goals._missingTypes = missingTypes
    
    return goals
    
  } catch (error) {
    console.error('❌ Erro ao buscar metas:', error)
    
    // Em caso de erro, retornar com flag isDefault: true
    return {
      daily: { target_amount: 1000, isDefault: true },
      monthly: { target_amount: 20000, isDefault: true },
      yearly: { target_amount: 240000, isDefault: true },
      _allDefault: true,
      _error: error.message
    }
  }
}

/**
 * Buscar metas padrão do sistema
 */
export const fetchDefaultGoals = async () => {
  try {
    // Tentar buscar de uma tabela de configurações
    const { data, error } = await supabase
      .from('system_settings')
      .select('default_goals')
      .maybeSingle()
    
    if (!error && data?.default_goals) {
      return {
        ...data.default_goals,
        isDefault: false
      }
    }
  } catch (error) {
    console.warn('⚠️ Erro ao buscar metas padrão do sistema:', error)
  }
  
  // Fallback para valores hardcoded
  return {
    daily: 1000,
    monthly: 20000,
    yearly: 240000,
    isDefault: true
  }
}

/**
 * Salvar ou atualizar meta
 */
export const saveGoal = async (userId, goalType, targetAmount, createdBy) => {
  try {
    // Buscar meta antiga para comparação (se existir)
    const { data: oldGoal } = await supabase
      .from('goals')
      .select('target_amount')
      .eq('user_id', userId)
      .eq('goal_type', goalType)
      .maybeSingle()
    
    // Verificar se já existe
    const { data: existing } = await supabase
      .from('goals')
      .select('id')
      .eq('user_id', userId)
      .eq('goal_type', goalType)
      .maybeSingle()
    
    let result
    
    if (existing) {
      // Atualizar
      const { data, error } = await supabase
        .from('goals')
        .update({
          target_amount: targetAmount,
          updated_by: createdBy,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single()
      
      if (error) throw error
      result = data
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
      result = data
    }
    
    return {
      ...result,
      isDefault: false
    }
    
  } catch (error) {
    console.error('❌ Erro ao salvar meta:', error)
    throw error
  }
}

/**
 * Salvar múltiplas metas de uma vez
 */
export const saveAllGoals = async (userId, goals, createdBy) => {
  const promises = Object.entries(goals).map(([type, amount]) => 
    saveGoal(userId, type, amount, createdBy)
  )
  
  const results = await Promise.all(promises)
  
  return {
    goals: results,
    isDefault: false,
    savedCount: results.length
  }
}

/**
 * Buscar metas de toda a equipe (para gerentes/admins)
 */
export const fetchTeamGoals = async (userRole, userId) => {
  try {
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
    
    // Marcar metas padrão
    return (data || []).map(goal => ({
      ...goal,
      isDefault: false
    }))
    
  } catch (error) {
    console.error('❌ Erro ao buscar metas da equipe:', error)
    return []
  }
}

/**
 * Verificar se as metas são apenas valores padrão
 */
export const areGoalsDefault = (goals) => {
  if (!goals) return true
  return goals._allDefault === true
}

/**
 * Verificar se há tipos de meta faltando
 */
export const getMissingGoalTypes = (goals) => {
  if (!goals || !goals._missingTypes) return []
  return goals._missingTypes
}

/**
 * Verificar progresso das metas e notificar se atingiu
 */
export const checkAndNotifyGoalAchievement = async (userId) => {
  try {
    // Buscar metas do usuário
    const goals = await fetchUserGoals(userId)
    
    // Se são metas padrão, não verificar
    if (goals._allDefault) return
    
    // Buscar vendas para calcular progresso
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfYear = new Date(now.getFullYear(), 0, 1)
    
    // Buscar vendas concluídas
    const { data: sales, error } = await supabase
      .from('sales')
      .select('final_amount, created_at')
      .eq('created_by', userId)
      .eq('status', 'completed')
      .gte('created_at', startOfYear.toISOString())
    
    if (error) throw error
    
    if (!sales || sales.length === 0) return
    
    // Calcular totais por período
    const totals = {
      daily: 0,
      monthly: 0,
      yearly: 0
    }
    
    sales.forEach(sale => {
      const saleDate = new Date(sale.created_at)
      const amount = sale.final_amount || 0
      
      // Anual (todas as vendas)
      totals.yearly += amount
      
      // Mensal
      if (saleDate >= startOfMonth) {
        totals.monthly += amount
      }
      
      // Diário
      if (saleDate >= startOfDay) {
        totals.daily += amount
      }
    })
    
    // Verificar cada tipo de meta
    const goalTypes = ['daily', 'monthly', 'yearly']
    
    for (const type of goalTypes) {
      const goal = goals[type]
      
      // Pular se é meta padrão ou já foi notificada
      if (!goal || goal.isDefault || goal.notified) continue
      
      const currentAmount = totals[type]
      const targetAmount = goal.target_amount
      
      // Verificar se atingiu a meta
      if (currentAmount >= targetAmount) {
        // Notificar usuário
        await notificationService.notifyGoalAchieved(
          userId,
          type,
          currentAmount,
          targetAmount
        )
        
        // Marcar como notificado para não repetir
        await supabase
          .from('goals')
          .update({ 
            notified: true,
            achieved_at: new Date().toISOString(),
            achieved_amount: currentAmount
          })
          .eq('user_id', userId)
          .eq('goal_type', type)
        
        console.log(`✅ Meta ${type} atingida para usuário ${userId}: ${currentAmount}/${targetAmount}`)
      }
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar metas:', error)
  }
}

/**
 * Resetar flag de notificação para novo período
 */
export const resetGoalNotification = async (userId, goalType) => {
  try {
    await supabase
      .from('goals')
      .update({ 
        notified: false,
        achieved_at: null,
        achieved_amount: null
      })
      .eq('user_id', userId)
      .eq('goal_type', goalType)
    
    return true
  } catch (error) {
    console.error('❌ Erro ao resetar notificação:', error)
    return false
  }
}

/**
 * Atualizar progresso da meta (chamado após cada venda)
 */
export const updateGoalProgress = async (userId, saleAmount) => {
  try {
    // Verificar se atingiu alguma meta com esta venda
    await checkAndNotifyGoalAchievement(userId)
    
    return true
  } catch (error) {
    console.error('❌ Erro ao atualizar progresso da meta:', error)
    return false
  }
}