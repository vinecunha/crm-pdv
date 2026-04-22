import { useState, useCallback } from 'react'
import { useMutation } from '@tanstack/react-query'
import * as budgetService from '@services/budgetService'  // ← Faltou este import!

const useBudgetCustomer = () => {
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

export default useBudgetCustomer