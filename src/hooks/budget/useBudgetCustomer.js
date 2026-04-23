import { useState, useCallback } from 'react'
import { useMutation } from '@tanstack/react-query'
import * as budgetService from '@services/budget/budgetService'  // ← Faltou este import!

export const useBudgetCustomer = () => {
  const [customer, setCustomer] = useState(null)
  const [customerPhone, setCustomerPhone] = useState('')
  
  const searchCustomer = useMutation({
    mutationFn: budgetService.searchCustomerByPhone
  })
  
  const createCustomer = useMutation({
    mutationFn: budgetService.createCustomer
  })
  
  const clearCustomer = useCallback(() => {
    setCustomer(null)
    setCustomerPhone('')
  }, [])
  
  return {
    customer,
    setCustomer,
    customerPhone,
    setCustomerPhone,
    searchCustomer,
    createCustomer,
    clearCustomer
  }
}
