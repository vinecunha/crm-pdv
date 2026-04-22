// src/hooks/useNotificationTriggers.js
import { useEffect, useRef } from 'react'
import { useAuth } from '@contexts/AuthContext'
import { supabase } from '@lib/supabase'
import { logger } from '@utils/logger'

export const useNotificationTriggers = () => {
  const { profile } = useAuth()
  const notifiedGoalsRef = useRef(new Set())
  const notifiedBirthdaysRef = useRef(new Set())
  const notifiedLowStockRef = useRef(new Set())
  
  useEffect(() => {
    if (!profile) return
    
    // Executar verificações imediatamente ao montar
    checkGoalsAchieved(profile.id)
    checkBirthdayCustomers()
    if (['admin', 'gerente'].includes(profile.role)) {
      checkLowStock()
    }
    
    // Verificar metas a cada 5 minutos
    const goalInterval = setInterval(async () => {
      await checkGoalsAchieved(profile.id)
    }, 5 * 60 * 1000)
    
    // Verificar aniversariantes a cada hora (em vez de uma vez por dia para teste)
    const birthdayInterval = setInterval(async () => {
      await checkBirthdayCustomers()
    }, 60 * 60 * 1000)
    
    // Verificar estoque baixo a cada 30 minutos
    const stockInterval = setInterval(async () => {
      if (['admin', 'gerente'].includes(profile.role)) {
        await checkLowStock()
      }
    }, 30 * 60 * 1000)
    
    return () => {
      clearInterval(goalInterval)
      clearInterval(birthdayInterval)
      clearInterval(stockInterval)
    }
  }, [profile])
  
  /**
   * Verificar metas atingidas
   */
  async function checkGoalsAchieved(userId) {
    if (!userId) return
    
    try {
      // Buscar metas do usuário
      const { data: goals, error: goalsError } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
      
      if (goalsError) {
        logger.error('Erro ao buscar metas:', goalsError)
        return
      }
      
      if (!goals || goals.length === 0) return
      
      // Buscar vendas recentes para calcular progresso
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const startOfYear = new Date(new Date().getFullYear(), 0, 1)
      
      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select('final_amount, created_at')
        .eq('created_by', userId)
        .eq('status', 'completed')
        .gte('created_at', thirtyDaysAgo.toISOString())
      
      if (salesError) {
        logger.error('Erro ao buscar vendas:', salesError)
        return
      }
      
      const revenueLast30Days = sales?.reduce((sum, s) => sum + (s.final_amount || 0), 0) || 0
      
      // Buscar vendas do ano
      const { data: yearlySales } = await supabase
        .from('sales')
        .select('final_amount')
        .eq('created_by', userId)
        .eq('status', 'completed')
        .gte('created_at', startOfYear.toISOString())
      
      const revenueThisYear = yearlySales?.reduce((sum, s) => sum + (s.final_amount || 0), 0) || 0
      
      // Verificar cada meta
      for (const goal of goals) {
        const goalKey = `${goal.goal_type}-${goal.target_amount}`
        
        // Pular se já notificou esta meta
        if (notifiedGoalsRef.current.has(goalKey)) continue
        
        let currentAmount = 0
        let goalLabel = ''
        
        switch (goal.goal_type) {
          case 'daily':
            currentAmount = revenueLast30Days / 30
            goalLabel = 'diária'
            break
          case 'monthly':
            currentAmount = revenueLast30Days
            goalLabel = 'mensal'
            break
          case 'yearly':
            currentAmount = revenueThisYear
            goalLabel = 'anual'
            break
        }
        
        // Verificar se atingiu a meta
        if (currentAmount >= goal.target_amount) {
          // Criar notificação
          await supabase.from('notifications').insert({
            user_id: userId,
            title: '🎉 Meta Atingida!',
            message: `Parabéns! Você atingiu a meta ${goalLabel} de vendas!`,
            type: 'success',
            link: `/sellers/${userId}`,
            entity_type: 'goal',
            entity_id: goal.goal_type,
            read: false,
            created_at: new Date().toISOString()
          })
          
          notifiedGoalsRef.current.add(goalKey)
          logger.log(`✅ Notificação de meta ${goalLabel} enviada para ${userId}`)
        }
      }
      
    } catch (error) {
      logger.error('Erro em checkGoalsAchieved:', error)
    }
  }
  
  /**
   * Verificar aniversariantes do dia
   */
  async function checkBirthdayCustomers() {
    try {
      const today = new Date()
      const todayStr = today.toISOString().split('T')[0]
      
      // Buscar clientes aniversariantes
      const { data: customers, error } = await supabase
        .from('customers')
        .select('*')
        .eq('status', 'active')
        .not('birth_date', 'is', null)
      
      if (error) {
        logger.error('Erro ao buscar aniversariantes:', error)
        return
      }
      
      if (!customers || customers.length === 0) return
      
      // Filtrar aniversariantes de hoje (comparando mês e dia)
      const birthdayCustomers = customers.filter(customer => {
        if (!customer.birth_date) return false
        const birthDate = new Date(customer.birth_date)
        return birthDate.getMonth() === today.getMonth() && 
               birthDate.getDate() === today.getDate()
      })
      
      for (const customer of birthdayCustomers) {
        const notificationKey = `birthday-${customer.id}-${todayStr}`
        
        // Evitar notificações duplicadas no mesmo dia
        if (notifiedBirthdaysRef.current.has(notificationKey)) continue
        
        // Buscar vendedores (admins e gerentes) para notificar
        const { data: managers } = await supabase
          .from('profiles')
          .select('id')
          .in('role', ['admin', 'gerente'])
          .eq('status', 'active')
        
        if (managers && managers.length > 0) {
          const notifications = managers.map(manager => ({
            user_id: manager.id,
            title: '🎂 Cliente Aniversariante!',
            message: `${customer.name} está fazendo aniversário hoje! Que tal enviar um cupom especial?`,
            type: 'info',
            link: `/customers/${customer.id}/communication`,
            entity_type: 'customer',
            entity_id: customer.id,
            read: false,
            created_at: new Date().toISOString()
          }))
          
          await supabase.from('notifications').insert(notifications)
          notifiedBirthdaysRef.current.add(notificationKey)
          logger.log(`✅ Notificação de aniversário enviada para ${customer.name}`)
        }
      }
      
    } catch (error) {
      logger.error('Erro em checkBirthdayCustomers:', error)
    }
  }
  
  /**
   * Verificar produtos com estoque baixo
   */
  async function checkLowStock() {
    try {
      // Buscar produtos com estoque baixo
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .not('min_stock', 'is', null)
      
      if (error) {
        logger.error('Erro ao buscar produtos:', error)
        return
      }
      
      if (!products || products.length === 0) return
      
      // Filtrar produtos com estoque abaixo do mínimo
      const lowStockProducts = products.filter(p => 
        (p.stock_quantity || 0) <= (p.min_stock || 5)
      )
      
      if (lowStockProducts.length === 0) return
      
      // Buscar admins e gerentes para notificar
      const { data: managers } = await supabase
        .from('profiles')
        .select('id')
        .in('role', ['admin', 'gerente'])
        .eq('status', 'active')
      
      if (!managers || managers.length === 0) return
      
      // Agrupar produtos com estoque baixo (máximo 5 por notificação)
      const productsToNotify = lowStockProducts.slice(0, 5)
      
      for (const product of productsToNotify) {
        const notificationKey = `lowstock-${product.id}-${product.stock_quantity}`
        
        // Evitar notificações duplicadas para o mesmo estado de estoque
        if (notifiedLowStockRef.current.has(notificationKey)) continue
        
        const notifications = managers.map(manager => ({
          user_id: manager.id,
          title: '⚠️ Estoque Baixo',
          message: `${product.name} está com apenas ${product.stock_quantity} ${product.unit || 'un'} em estoque!`,
          type: 'warning',
          link: `/products`,
          entity_type: 'product',
          entity_id: product.id,
          read: false,
          created_at: new Date().toISOString()
        }))
        
        await supabase.from('notifications').insert(notifications)
        notifiedLowStockRef.current.add(notificationKey)
        logger.log(`✅ Notificação de estoque baixo enviada para ${product.name}`)
      }
      
      // Se houver mais de 5 produtos, enviar uma notificação resumida
      if (lowStockProducts.length > 5) {
        const notificationKey = `lowstock-batch-${lowStockProducts.length}`
        
        if (!notifiedLowStockRef.current.has(notificationKey)) {
          const notifications = managers.map(manager => ({
            user_id: manager.id,
            title: '⚠️ Múltiplos Produtos com Estoque Baixo',
            message: `Existem ${lowStockProducts.length} produtos com estoque abaixo do mínimo. Verifique o relatório de estoque.`,
            type: 'warning',
            link: `/reports?tab=stock`,
            entity_type: 'product',
            read: false,
            created_at: new Date().toISOString()
          }))
          
          await supabase.from('notifications').insert(notifications)
          notifiedLowStockRef.current.add(notificationKey)
        }
      }
      
    } catch (error) {
      logger.error('Erro em checkLowStock:', error)
    }
  }
  
  return null
}