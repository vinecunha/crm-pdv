// src/services/search/index.ts
import { SearchFilters, SearchResult } from '@/types/search'
import { searchProducts } from './searchProducts'
import { searchCustomers } from './searchCustomers'
import { searchSales } from './searchSales'
import { searchTasks } from './searchTasks'
import { searchBudgets } from './searchBudgets'
import { searchCoupons } from './searchCoupons'
import { searchUsers } from './searchUsers'
import { searchRoutes } from './searchRoutes'

export async function performGlobalSearch(filters: SearchFilters): Promise<SearchResult[]> {
  const results = await Promise.all([
    searchProducts(filters),
    searchCustomers(filters),
    searchSales(filters),
    searchTasks(filters),
    searchBudgets(filters),
    searchCoupons(filters),
    searchUsers(filters),
  ])

  // Achatar resultados
  const flatResults = results.flat()

  // Adicionar rotas do sistema
  const routeResults = searchRoutes(filters)

  return [...flatResults, ...routeResults]
}