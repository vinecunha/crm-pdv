// src/hooks/useNotificationTriggers.js
import { useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import * as notificationService from '../services/notificationService'

export const useNotificationTriggers = () => {
  const { profile } = useAuth()
  const lastCheckRef = useRef(new Date().toISOString())
  
  useEffect(() => {
    if (!profile) return
    
    // Verificar metas a cada 5 minutos
    const goalInterval = setInterval(async () => {
      await checkGoalsAchieved(profile.id)
    }, 5 * 60 * 1000)
    
    // Verificar aniversariantes uma vez por dia
    const birthdayInterval = setInterval(async () => {
      await checkBirthdayCustomers()
    }, 24 * 60 * 60 * 1000)
    
    // Verificar estoque baixo a cada hora
    const stockInterval = setInterval(async () => {
      await checkLowStock()
    }, 60 * 60 * 1000)
    
    return () => {
      clearInterval(goalInterval)
      clearInterval(birthdayInterval)
      clearInterval(stockInterval)
    }
  }, [profile])
  
  return null
}

// Funções auxiliares
async function checkGoalsAchieved(userId) {
  // Buscar metas e vendas recentes
  // Se meta foi atingida e ainda não notificada, notificar
}

async function checkBirthdayCustomers() {
  const today = new Date()
  const { data: customers } = await supabase
    .from('customers')
    .select('*')
    .eq('birth_date', today.toISOString().split('T')[0])
  
  // Notificar para cada cliente
}

async function checkLowStock() {
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .lte('stock_quantity', supabase.raw('min_stock'))
  
  // Notificar para cada produto
}