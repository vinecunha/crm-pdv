import { useState, useCallback } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useFormWithSchema } from '@/hooks/forms/useFormWithSchema'
import { quickCustomerSchema } from '@/utils/schemas'
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
  quickCustomerForm: QuickCustomerForm
  quickCustomerErrors: Record<string, string>
  searchCustomer: ReturnType<typeof useMutation>
  createCustomer: ReturnType<typeof useMutation>
  clearCustomer: () => void
}

export const useBudgetCustomer = (): UseBudgetCustomerReturn => {
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [customerPhone, setCustomerPhone] = useState<string>('')

  const quickCustomerFormHook = useFormWithSchema(quickCustomerSchema, {
    name: '',
    phone: '',
    email: ''
  }) as any

  const { watch: watchQuick, reset: resetQuick } = quickCustomerFormHook

  const quickCustomerForm = watchQuick() as QuickCustomerForm
  const quickCustomerErrors = (quickCustomerFormHook.formState.errors || {}) as Record<string, string>

  const searchCustomer = useMutation({
    mutationFn: (phone: string) => budgetService.searchCustomerByPhone(phone)
  })

  const createCustomer = useMutation({
    mutationFn: (formData: QuickCustomerForm) => budgetService.createCustomer(formData)
  })

  const clearCustomer = useCallback(() => {
    setCustomer(null)
    setCustomerPhone('')
    resetQuick({ name: '', phone: '', email: '' })
  }, [resetQuick])

  return {
    customer,
    setCustomer,
    customerPhone,
    setCustomerPhone,
    quickCustomerForm: quickCustomerForm || { name: '', phone: '', email: '' },
    quickCustomerErrors,
    searchCustomer,
    createCustomer,
    clearCustomer
  }
}