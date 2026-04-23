import { useState, useCallback, useMemo } from 'react'

// Baseado em: public.products
interface Product {
  id: number
  code: string | null
  name: string
  description: string | null
  category: string | null
  unit: string | null
  price: number | null
  stock_quantity: number | null
  is_active: boolean | null
  barcode?: string | null
  [key: string]: unknown
}

interface UsePDVSearchReturn {
  searchTerm: string
  selectedCategory: string
  categories: string[]
  filteredProducts: Product[]
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>
  setSelectedCategory: React.Dispatch<React.SetStateAction<string>>
  updateCategories: (productsList: Product[]) => void
  clearSearch: () => void
}

export const usePDVSearch = (products: Product[]): UsePDVSearchReturn => {
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [categories, setCategories] = useState<string[]>([])

  const filteredProducts = useMemo((): Product[] => {
    let filtered = [...products]
    
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(p => 
        p.name?.toLowerCase().includes(search) || 
        p.code?.toLowerCase().includes(search) ||
        p.barcode?.toLowerCase().includes(search)
      )
    }
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory)
    }
    
    return filtered
  }, [products, searchTerm, selectedCategory])

  const updateCategories = useCallback((productsList: Product[]) => {
    if (productsList.length > 0) {
      setCategories([...new Set(productsList.map(p => p.category).filter(Boolean))] as string[])
    }
  }, [])

  const clearSearch = useCallback(() => {
    setSearchTerm('')
    setSelectedCategory('all')
  }, [])

  return {
    searchTerm,
    selectedCategory,
    categories,
    filteredProducts,
    setSearchTerm,
    setSelectedCategory,
    updateCategories,
    clearSearch
  }
}