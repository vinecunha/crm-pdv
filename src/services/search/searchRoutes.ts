// src/services/search/searchRoutes.ts
import { SearchResult, SearchFilters } from '@/types/search'
import { BarChart3, ShoppingBag, Settings } from '@lib/icons'

const SYSTEM_ROUTES = [
  { 
    path: '/dashboard', 
    title: 'Dashboard', 
    subtitle: 'Visão geral do sistema', 
    icon: BarChart3 
  },
  { 
    path: '/sales', 
    title: 'PDV', 
    subtitle: 'Ponto de venda', 
    icon: ShoppingBag 
  },
  { 
    path: '/reports', 
    title: 'Relatórios', 
    subtitle: 'Análises e métricas', 
    icon: BarChart3 
  },
  { 
    path: '/settings', 
    title: 'Configurações', 
    subtitle: 'Preferências do sistema', 
    icon: Settings 
  },
]

export function searchRoutes(filters: SearchFilters): SearchResult[] {
  const { query } = filters
  const searchTerm = query.toLowerCase()

  return SYSTEM_ROUTES
    .filter(route => route.title.toLowerCase().includes(searchTerm))
    .map(route => ({
      id: route.path,
      type: 'route' as const,
      title: route.title,
      subtitle: route.subtitle,
      path: route.path,
      icon: route.icon,
      category: 'Sistema'
    }))
}