import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { useBudgetCustomer } from '@hooks/customer/useCustomer'
import { useBudgetCoupon } from '@hooks/coupon/useCoupon'
import { useBudgetModals } from '@hooks/budget/useBudgetModals'
import { useCart } from '@hooks/utils/useCart'
import { useBudgetsQueries } from '@hooks/queries/useBudgetsQueries'
import { useBudgetMutations } from '@hooks/mutations/useBudgetMutations'
import useFeedback from '@hooks/ui/useFeedback'
import type { CartItem, Discount } from '@/types'

interface UseBudgetConfig {
  onBudgetCreated?: () => void
  onBudgetUpdated?: () => void
  onBudgetConverted?: () => void
  onError?: (error: Error) => void
}

interface UseBudgetReturn {
  mode: string
  setMode: (mode: string) => void
  viewMode: string
  setViewMode: (mode: string) => void
  searchTerm: string
  setSearchTerm: (term: string) => void
  statusFilter: string
  setStatusFilter: (filter: string) => void
  selectedCategory: string
  setSelectedCategory: (category: string) => void
  categories: string[]
  notes: string
  setNotes: (notes: string) => void
  validUntil: string
  setValidUntil: (date: string) => void
  couponCode: string
  setCouponCode: (code: string) => void
  feedback: any
  modals: any
  cart: CartItem[]
  addToCart: (product: any) => void
  updateQuantity: (id: number, qty: number) => void
  removeItem: (id: number) => void
  clearCart: () => void
  subtotal: number
  customer: any
  customerPhone: string
  setCustomerPhone: (phone: string) => void
  quickCustomerForm: any
  quickCustomerErrors: Record<string, string>
  searchCustomer: any
  createCustomer: any
  clearCustomer: () => void
  coupon: any
  couponCode: string
  couponError: string
  discount: Discount
  applyCoupon: (coupon?: any) => Promise<any>
  removeCoupon: () => void
  isValidating: boolean
  budgets: any[]
  loadingBudgets: boolean
  refetchBudgets: () => Promise<any>
  products: any[]
  loadingProducts: boolean
  availableCoupons: any[]
  isMutating: boolean
  total: number
  handlers: {
    handleCreateBudget: () => void
    handleViewDetails: (budget: any) => Promise<void>
    handleApprove: (budget: any) => void
    handleReject: (budget: any) => void
    handleConvertToSale: () => void
    handleQuickRegisterCustomer: () => void
    handleSearchCustomer: () => void
    handleApplyCoupon: (couponToValidate?: any) => void
    handleClearCart: () => void
    confirmClearCart: () => void
  }
}

export const useBudget = (config?: UseBudgetConfig): UseBudgetReturn => {
  const [mode, setMode] = useState('list')
  const [viewMode, setViewMode] = useState('auto')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [categories, setCategories] = useState([])
  const [notes, setNotes] = useState('')
  const [validUntil, setValidUntil] = useState('')

  const feedback = useFeedback()
  const modals = useBudgetModals()

  const { cart, addToCart, updateQuantity, removeItem, clearCart, getSubtotal: subtotal } = useCart()
  
  const { 
    customer, customerPhone, setCustomerPhone, searchCustomer, createCustomer, clearCustomer, isSearching, isCreating
  } = useBudgetCustomer()

  const couponResult = useBudgetCoupon(customer, cart)
  const { coupon, couponCode, setCouponCode, couponError, discount, applyCoupon, removeCoupon, isValidating, availableCoupons: budgetCoupons } = couponResult

  const {
    budgets,
    loadingBudgets,
    refetchBudgets,
    products,
    loadingProducts,
    availableCoupons
  } = useBudgetsQueries({ searchTerm, statusFilter, mode, customer })

  const { createBudget, updateStatus, convertToSale, isMutating } = useBudgetMutations({
    onBudgetCreated: () => {
      feedback.showSuccess('Orçamento criado com sucesso!')
      clearCart()
      clearCustomer()
      removeCoupon()
      setNotes('')
      setValidUntil('')
      setMode('list')
      config?.onBudgetCreated?.()
    },
    onBudgetUpdated: () => {
      feedback.showSuccess('Status atualizado!')
      modals.closeAll()
      config?.onBudgetUpdated?.()
    },
    onBudgetConverted: () => {
      feedback.showSuccess('Orçamento convertido em venda!')
      modals.closeAll()
      config?.onBudgetConverted?.()
    },
    onError: (error) => {
      feedback.showError(error.message)
      config?.onError?.(error)
    }
  })

  const handleCreateBudget = useCallback(() => {
    if (cart.length === 0) {
      feedback.showError('Adicione itens ao orçamento')
      return
    }
    
    createBudget.mutate(
      { cart, customer, coupon, discount, notes, validUntil },
      {
        onSuccess: () => {
          feedback.showSuccess('Orçamento criado com sucesso!')
        }
      }
    )
  }, [cart, customer, coupon, discount, notes, validUntil, createBudget, feedback])

  const handleViewDetails = useCallback(async (budget: any) => {
    modals.openDetails(budget)
  }, [modals])

  const handleApprove = useCallback((budget: any) => {
    updateStatus.mutate({ id: budget.id, status: 'approved' })
  }, [updateStatus])

  const handleReject = useCallback((budget: any) => {
    updateStatus.mutate({ id: budget.id, status: 'rejected' })
  }, [updateStatus])

  const handleConvertToSale = useCallback(() => {
    if (modals.selectedBudget) {
      convertToSale.mutate({
        budget: modals.selectedBudget,
        budgetItems: modals.budgetItems
      })
    }
  }, [modals, convertToSale])

  const handleQuickRegisterCustomer = useCallback(() => {
    createCustomer.mutate(modals.quickCustomer.form, {
      onSuccess: (data: any) => {
        modals.closeQuickCustomer()
        feedback.showSuccess(`Cliente ${data.name} cadastrado!`)
      },
      onError: (error: Error) => {
        feedback.showError(error.message)
      }
    })
  }, [createCustomer, modals, feedback])

  const handleSearchCustomer = useCallback(() => {
    searchCustomer.mutate(modals.quickCustomer.form.phone, {
      onSuccess: (data: any) => {
        modals.closeCustomer()
        if (data) {
          modals.closeQuickCustomer()
        } else {
          modals.openQuickCustomer({ phone: modals.quickCustomer.form.phone })
        }
      },
      onError: () => {
        modals.closeCustomer()
        modals.openQuickCustomer({ phone: modals.quickCustomer.form.phone })
      }
    })
  }, [searchCustomer, modals, feedback])

  const handleApplyCoupon = useCallback((couponToValidate?: any) => {
    applyCoupon(couponToValidate).then((result) => {
      if (result.success) {
        modals.closeCoupon()
        feedback.showSuccess(`Cupom ${result.data?.coupon.code} aplicado!`)
      } else {
        modals.setCouponError(result.error || 'Erro ao aplicar cupom')
      }
    })
  }, [applyCoupon, modals, feedback])

  const handleClearCart = useCallback(() => {
    if (cart.length === 0) return
    modals.openClearCartConfirm()
  }, [cart.length, modals])

  const confirmClearCart = useCallback(() => {
    clearCart()
    modals.closeClearCartConfirm()
    feedback.showInfo('Carrinho limpo')
  }, [clearCart, modals, feedback])

  const handlers = useMemo(() => ({
    handleCreateBudget,
    handleViewDetails,
    handleApprove,
    handleReject,
    handleConvertToSale,
    handleQuickRegisterCustomer,
    handleSearchCustomer,
    handleApplyCoupon,
    handleClearCart,
    confirmClearCart
  }), [
    handleCreateBudget, handleViewDetails, handleApprove, handleReject,
    handleConvertToSale, handleQuickRegisterCustomer, handleSearchCustomer,
    handleApplyCoupon, handleClearCart, confirmClearCart
  ])

  useEffect(() => { 
    if (mode === 'create' && products.length > 0) {
      setCategories([...new Set(products.map(p => p.category).filter(Boolean))])
    }
  }, [products, mode])

  const total = subtotal - discount.value

  return {
    mode,
    setMode,
    viewMode,
    setViewMode,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    selectedCategory,
    setSelectedCategory,
    categories,
    notes,
    setNotes,
    validUntil,
    setValidUntil,
    couponCode,
    setCouponCode,
    feedback,
    modals,
    cart,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    subtotal,
    customer,
    customerPhone: customer?.phone || '',
    setCustomerPhone,
    quickCustomerForm: modals.quickCustomer.form,
    quickCustomerErrors: modals.quickCustomer.errors,
    searchCustomer,
    createCustomer,
    clearCustomer,
    isSearching,
    isCreating,
    coupon,
    couponCode,
    setCouponCode,
    couponError,
    discount,
    applyCoupon,
    removeCoupon,
    isValidating,
    budgets,
    loadingBudgets,
    refetchBudgets,
    products,
    loadingProducts,
    availableCoupons: budgetCoupons,
    isMutating,
    total,
    handlers
  }
}