// src/types/search.ts
import { ComponentType } from 'react'

export interface SearchResult {
  id: string | number
  type: 'product' | 'customer' | 'sale' | 'task' | 'budget' | 'coupon' | 'user' | 'route'
  title: string
  subtitle: string
  path: string
  icon: ComponentType<{ size?: number; className?: string }>
  category: string
  metadata?: Record<string, any>
}

export interface SearchFilters {
  query: string
  role?: string
  limit?: number
}

export interface SearchGroup {
  category: string
  items: SearchResult[]
}

export type SearchHandler = (result: SearchResult) => void