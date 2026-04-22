// src/hooks/pdv/usePDVSearch.js
import { useState, useCallback, useMemo } from 'react'

export const usePDVSearch = (products) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [categories, setCategories] = useState([])

  const filteredProducts = useMemo(() => {
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

  const updateCategories = useCallback((productsList) => {
    if (productsList.length > 0) {
      setCategories([...new Set(productsList.map(p => p.category).filter(Boolean))])
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