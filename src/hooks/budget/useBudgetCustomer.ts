import { useState, useCallback } from 'react'
import { useMutation } from '@tanstack/react-query'
import * as budgetService from '@services/budget/budgetService'

// Baseado em: public.customers
interface Customer {
  id: number
  name: string
  email: string
  phone: string
  document: string | null
  address: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  birth_date: string | null
  status: string | null
  [key: string]: unknown
}

interface QuickCustomerForm {
  name: string
  phone: string
  email: string
  [key: string]: unknown
}

interface UseBudgetCustomerReturn {
  customer: Customer | null
  setCustomer: React.Dispatch<React.SetStateAction<Customer | null>>
  customerPhone: string
  setCustomerPhone: React.Dispatch<React.SetStateAction<string>>
  searchCustomer: ReturnType<typeof useMutation>
  createCustomer: ReturnType<typeof useMutation>
  clearCustomer: () => void
}

export const useBudgetCustomer = (): UseBudgetCustomerReturn => {
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [customerPhone, setCustomerPhone] = useState<string>('')
  
  const searchCustomer = useMutation({
    mutationFn: (phone: string) => budgetService.searchCustomerByPhone(phone)
  })
  
  const createCustomer = useMutation({
    mutationFn: (formData: QuickCustomerForm) => budgetService.createCustomer(formData)
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