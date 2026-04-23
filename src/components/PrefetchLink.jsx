import React from 'react'
import { Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'

// Importar as mesmas funções de prefetch
const prefetchFunctions = {
  products: async () => {
    const { supabase } = await import('../lib/supabase')
    return supabase.from('products').select('*').eq('is_active', true).order('name')
  },
  customers: async () => {
    const { supabase } = await import('../lib/supabase')
    return supabase.from('customers').select('*').order('name')
  },
  sales: async () => {
    const { supabase } = await import('../lib/supabase')
    return supabase.from('sales').select('*').order('created_at', { ascending: false }).limit(50)
  },
  coupons: async () => {
    const { supabase } = await import('../lib/supabase')
    return supabase.from('coupons').select('*').eq('is_active', true)
  },
  'stock-count-sessions': async () => {
    const { supabase } = await import('../lib/supabase')
    return supabase.from('stock_count_sessions').select('*').order('created_at', { ascending: false }).limit(20)
  },
  users: async () => {
    const { supabase } = await import('../lib/supabase')
    return supabase.from('profiles').select('*').order('created_at', { ascending: false })
  },
  logs: async () => {
    const { supabase } = await import('../lib/supabase')
    return supabase.from('system_logs').select('*').order('created_at', { ascending: false }).limit(100)
  },
}

const routeToQueryMap = {
  '/products': ['products'],
  '/customers': ['customers'],
  '/sales-list': ['sales'],
  '/sales': ['sales'],
  '/coupons': ['coupons'],
  '/stock-count': ['stock-count-sessions'],
  '/users': ['users'],
  '/logs': ['logs'],
}

const PrefetchLink = ({ to, children, prefetch = true, ...props }) => {
  const queryClient = useQueryClient()

  const handleMouseEnter = async () => {
    if (!prefetch) return

    const queriesToPrefetch = routeToQueryMap[to] || []
    if (queriesToPrefetch.length === 0) return

    for (const queryKey of queriesToPrefetch) {
      const existingData = queryClient.getQueryData([queryKey])
      if (existingData) continue

      const prefetchFn = prefetchFunctions[queryKey]
      if (!prefetchFn) continue

      try {
        await queryClient.prefetchQuery({
          queryKey: [queryKey],
          queryFn: prefetchFn,
          staleTime: 5 * 60 * 1000,
        })
      } catch (error) {
        // Silencioso - não atrapalha UX
      }
    }
  }

  return (
    <Link to={to} onMouseEnter={handleMouseEnter} {...props}>
      {children}
    </Link>
  )
}

export default PrefetchLink
