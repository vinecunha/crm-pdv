// src/hooks/useBudgetHandlers.js
import { useCallback } from 'react'
import * as budgetService from '@services/budgetService'

export const useBudgetHandlers = ({
  cart,
  customer,
  coupon,
  discount,
  notes,
  validUntil,
  subtotal,
  couponCode,
  createBudget,
  updateStatus,
  convertToSale,
  validateCoupon,
  searchCustomer,
  createCustomer,
  clearCart,
  clearCustomer,
  removeCoupon,
  setMode,
  modals,
  feedback
}) => {
  
  const handleCreateBudget = useCallback(() => {
    if (cart.length === 0) {
      feedback.showError('Adicione itens ao orçamento')
      return
    }
    
    createBudget.mutate(
      { cart, customer, coupon, discount, notes, validUntil },
      {
        onSuccess: () => {
          clearCart()
          clearCustomer()
          removeCoupon()
          setMode('list')
        }
      }
    )
  }, [cart, customer, coupon, discount, notes, validUntil, createBudget, clearCart, clearCustomer, removeCoupon, setMode, feedback])

  const handleViewDetails = useCallback(async (budget) => {
    modals.openDetails(budget)
    try {
      const items = await budgetService.fetchBudgetItems(budget.id)
      modals.setBudgetItems(items)
    } catch (error) {
      modals.setBudgetItems([])
    }
  }, [modals])

  const handleApprove = useCallback((budget) => {
    updateStatus.mutate(
      { id: budget.id, status: 'approved' },
      { onSuccess: () => modals.closeAll() }
    )
  }, [updateStatus, modals])

  const handleReject = useCallback((budget) => {
    updateStatus.mutate(
      { id: budget.id, status: 'rejected' },
      { onSuccess: () => modals.closeAll() }
    )
  }, [updateStatus, modals])

  const handleConvertToSale = useCallback(() => {
    if (!modals.selectedBudget) return
    
    convertToSale.mutate(
      { budget: modals.selectedBudget, budgetItems: modals.budgetItems },
      { onSuccess: () => modals.closeAll() }
    )
  }, [modals.selectedBudget, modals.budgetItems, convertToSale, modals])

  const handleQuickRegisterCustomer = useCallback(() => {
    const { form, errors } = modals.quickCustomer
    
    if (!form.name?.trim()) {
      modals.setQuickCustomerErrors({ name: 'Nome é obrigatório' })
      return
    }
    
    if (!form.phone?.trim() || form.phone.length < 10) {
      modals.setQuickCustomerErrors({ phone: 'Telefone inválido' })
      return
    }
    
    createCustomer.mutate(form, {
      onSuccess: () => {
        modals.closeQuickCustomer()
        modals.resetQuickCustomerForm()
      }
    })
  }, [modals, createCustomer])

  const handleSearchCustomer = useCallback(() => {
    const phone = modals.customerPhone
    
    if (!phone || phone.length < 10) {
      feedback.showError('Digite um telefone válido')
      return
    }
    
    searchCustomer.mutate(phone, {
      onSuccess: (data) => {
        modals.closeCustomer()
        if (!data) {
          modals.openQuickCustomer({ phone })
        }
      }
    })
  }, [modals, searchCustomer, feedback])

  const handleApplyCoupon = useCallback((couponToValidate = null) => {
    const code = couponToValidate?.code || couponCode
    
    if (!code) {
      modals.setCouponError('Digite o código do cupom')
      return
    }
    
    if (!customer) {
      modals.setCouponError('Identifique um cliente para usar cupons')
      return
    }
    
    validateCoupon.mutate(
      { code, customerId: customer.id, cartSubtotal: subtotal },
      {
        onSuccess: () => {
          modals.closeCoupon()
          modals.setCouponError('')
        },
        onError: (error) => {
          modals.setCouponError(error.message)
        }
      }
    )
  }, [couponCode, customer, subtotal, validateCoupon, modals])

  const handleClearCart = useCallback(() => {
    if (cart.length === 0) return
    modals.openClearCartConfirm()
  }, [cart.length, modals])

  const confirmClearCart = useCallback(() => {
    clearCart()
    modals.closeClearCartConfirm()
    feedback.showInfo('Carrinho limpo')
  }, [clearCart, modals, feedback])

  return {
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
  }
}