import { useEffect, useRef } from 'react'
import { useAuth } from '@contexts/AuthContext'
import { supabase } from '@lib/supabase'
import { logger } from '@utils/logger'
import type { Customer, Product } from '@/types'

// Baseado em: public.goals
interface Goal {
  id: string // uuid
  user_id: string // uuid, FK auth.users
  goal_type: 'daily' | 'monthly' | 'yearly' // text com CHECK
  target_amount: number // numeric(10,2)
  created_at: string | null // timestamp with time zone
  updated_at: string | null // timestamp with time zone
  created_by: string | null // uuid, FK auth.users
  updated_by: string | null // uuid, FK auth.users
}

// Baseado em: public.sales (campos relevantes)
interface Sale {
  final_amount: number | null // numeric(10,2)
  created_at: string | null // timestamp with time zone
}

// Baseado em: public.profiles (campos relevantes)
interface Manager {
  id: string // uuid
}

export const useNotificationTriggers = (): null => {
  const { profile } = useAuth()
  const notifiedGoalsRef = useRef<Set<string>>(new Set())
  const notifiedBirthdaysRef = useRef<Set<string>>(new Set())
  const notifiedLowStockRef = useRef<Set<string>>(new Set())
  
  useEffect(() => {
    if (!profile) return
    
    checkGoalsAchieved(profile.id)
    checkBirthdayCustomers()
    if (['admin', 'gerente'].includes(profile.role)) {
      checkLowStock()
    }
    
    const goalInterval = setInterval(async () => {
      await checkGoalsAchieved(profile.id)
    }, 5 * 60 * 1000)
    
    const birthdayInterval = setInterval(async () => {
      await checkBirthdayCustomers()
    }, 60 * 60 * 1000)
    
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
  
  async function checkGoalsAchieved(userId: string): Promise<void> {
    if (!userId) return
    
    try {
      const { data: goals, error: goalsError } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
      
      if (goalsError) {
        logger.error('Erro ao buscar metas:', goalsError)
        return
      }
      
      if (!goals || goals.length === 0) return
      
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
      
      const revenueLast30Days = (sales as Sale[])?.reduce((sum, s) => sum + (s.final_amount || 0), 0) || 0
      
      const { data: yearlySales } = await supabase
        .from('sales')
        .select('final_amount')
        .eq('created_by', userId)
        .eq('status', 'completed')
        .gte('created_at', startOfYear.toISOString())
      
      const revenueThisYear = (yearlySales as Sale[])?.reduce((sum, s) => sum + (s.final_amount || 0), 0) || 0
      
      for (const goal of goals as Goal[]) {
        const goalKey = `${goal.goal_type}-${goal.target_amount}`
        
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
        
        if (currentAmount >= goal.target_amount) {
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
  
  async function checkBirthdayCustomers(): Promise<void> {
    try {
      const today = new Date()
      const todayStr = today.toISOString().split('T')[0]
      
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
      
      const birthdayCustomers = (customers as Customer[]).filter(customer => {
        if (!customer.birth_date) return false
        const birthDate = new Date(customer.birth_date)
        return birthDate.getMonth() === today.getMonth() && 
               birthDate.getDate() === today.getDate()
      })
      
      for (const customer of birthdayCustomers) {
        const notificationKey = `birthday-${customer.id}-${todayStr}`
        
        if (notifiedBirthdaysRef.current.has(notificationKey)) continue
        
        const { data: managers } = await supabase
          .from('profiles')
          .select('id')
          .in('role', ['admin', 'gerente'])
          .eq('status', 'active')
        
        if (managers && managers.length > 0) {
          const notifications = (managers as Manager[]).map(manager => ({
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
  
  async function checkLowStock(): Promise<void> {
    try {
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
      
      const lowStockProducts = (products as Product[]).filter(p => 
        (p.stock_quantity || 0) <= (p.min_stock || 5)
      )
      
      if (lowStockProducts.length === 0) return
      
      const { data: managers } = await supabase
        .from('profiles')
        .select('id')
        .in('role', ['admin', 'gerente'])
        .eq('status', 'active')
      
      if (!managers || managers.length === 0) return
      
      const productsToNotify = lowStockProducts.slice(0, 5)
      
      for (const product of productsToNotify) {
        const notificationKey = `lowstock-${product.id}-${product.stock_quantity}`
        
        if (notifiedLowStockRef.current.has(notificationKey)) continue
        
        const notifications = (managers as Manager[]).map(manager => ({
          user_id: manager.id,
          title: '⚠️ Estoque Baixo',
          message: `${product.name} está com apenas ${product.stock_quantity} ${product.unit || 'un'} em estoque!`,
          type: 'warning',
          link: '/products',
          entity_type: 'product',
          entity_id: product.id,
          read: false,
          created_at: new Date().toISOString()
        }))
        
        await supabase.from('notifications').insert(notifications)
        notifiedLowStockRef.current.add(notificationKey)
        logger.log(`✅ Notificação de estoque baixo enviada para ${product.name}`)
      }
      
      if (lowStockProducts.length > 5) {
        const notificationKey = `lowstock-batch-${lowStockProducts.length}`
        
        if (!notifiedLowStockRef.current.has(notificationKey)) {
          const notifications = (managers as Manager[]).map(manager => ({
            user_id: manager.id,
            title: '⚠️ Múltiplos Produtos com Estoque Baixo',
            message: `Existem ${lowStockProducts.length} produtos com estoque abaixo do mínimo. Verifique o relatório de estoque.`,
            type: 'warning',
            link: '/reports?tab=stock',
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