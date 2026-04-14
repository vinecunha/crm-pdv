import React, { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

// ============= Funções de Prefetch =============
const prefetchFunctions = {
  dashboard: async () => {
    const today = new Date().toISOString().split('T')[0]
    return supabase.from('sales').select('*').gte('created_at', today)
  },
  
  'recent-sales': async () => {
    return supabase.from('sales').select('*').order('created_at', { ascending: false }).limit(10)
  },
  
  'top-products': async () => {
    return supabase.from('sale_items')
      .select('product_id, quantity, product:products(name)')
      .order('created_at', { ascending: false })
      .limit(100)
  },

  products: async () => {
    return supabase.from('products').select('*').eq('is_active', true).order('name')
  },
  
  categories: async () => {
    return supabase.from('products').select('category').not('category', 'is', null)
  },

  customers: async () => {
    return supabase.from('customers').select('*').order('name')
  },

  sales: async () => {
    return supabase.from('sales').select('*').order('created_at', { ascending: false }).limit(50)
  },

  'active-products': async () => {
    return supabase.from('products').select('*').eq('is_active', true).gt('stock_quantity', 0)
  },

  'recent-customers': async () => {
    return supabase.from('customers').select('*').order('created_at', { ascending: false }).limit(10)
  },

  coupons: async () => {
    return supabase.from('coupons').select('*').eq('is_active', true)
  },

  'stock-count-sessions': async () => {
    return supabase.from('stock_count_sessions').select('*').order('created_at', { ascending: false }).limit(20)
  },

  'sales-summary': async () => {
    const today = new Date()
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    return supabase.from('sales').select('*').gte('created_at', startOfMonth.toISOString())
  },

  'operator-performance': async () => {
    return supabase.from('sales').select('created_by, final_amount')
  },

  users: async () => {
    return supabase.from('profiles').select('*').order('created_at', { ascending: false })
  },

  logs: async () => {
    return supabase.from('system_logs').select('*').order('created_at', { ascending: false }).limit(100)
  },

  'company-settings': async () => {
    return supabase.from('company_settings').select('*').limit(1).single()
  },
}

// ============= Configuração de Prefetch por Rota =============
const routePrefetchConfig = {
  '/dashboard': ['dashboard', 'recent-sales', 'top-products'],
  '/products': ['products', 'categories'],
  '/customers': ['customers', 'recent-customers'],
  '/sales': ['active-products', 'recent-customers', 'coupons'],
  '/sales-list': ['sales'],
  '/coupons': ['coupons'],
  '/stock-count': ['stock-count-sessions', 'products'],
  '/reports': ['sales-summary', 'operator-performance', 'products'],
  '/users': ['users'],
  '/logs': ['logs'],
  '/settings': ['company-settings'],
  '/cashier': ['sales', 'products'],
}

// ============= Componente Principal =============
const PrefetchRoute = ({ children }) => {
  const location = useLocation()
  const queryClient = useQueryClient()
  const prefetchInProgress = useRef(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (prefetchInProgress.current) return
      
      const prefetchForRoute = async () => {
        const queriesToPrefetch = routePrefetchConfig[location.pathname] || []
        
        if (queriesToPrefetch.length === 0) return
        
        prefetchInProgress.current = true

        // Executar em paralelo para mais performance
        const prefetchPromises = queriesToPrefetch.map(async (queryKey) => {
          const prefetchFn = prefetchFunctions[queryKey]
          if (!prefetchFn) return null

          // Verificar se já está em cache
          const existingData = queryClient.getQueryData([queryKey])
          if (existingData) return null

          // Fazer prefetch (não await para não bloquear)
          return queryClient.prefetchQuery({
            queryKey: [queryKey],
            queryFn: prefetchFn,
            staleTime: 5 * 60 * 1000,
          }).catch(() => {
            // Silencioso - falha no prefetch não deve quebrar nada
          })
        })

        // Aguardar todos os prefetches
        await Promise.allSettled(prefetchPromises)
        prefetchInProgress.current = false
      }

      prefetchForRoute()
    }, 50)

    return () => clearTimeout(timer)
  }, [location.pathname, queryClient])

  return children
}

export default PrefetchRoute