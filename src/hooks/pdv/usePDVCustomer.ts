import { useState, useCallback } from 'react'
import { useMutation } from '@tanstack/react-query'
import * as saleService from '@services/sale/saleService'

interface Customer {
  id: number
  name: string
  phone: string
  email?: string
}

interface QuickCustomerForm {
  name: string
  phone: string
  email: string
}

interface QuickCustomerErrors {
  name?: string
  phone?: string
  email?: string
}

interface UsePDVCustomerReturn {
  customer: Customer | null
  customerPhone: string
  quickCustomerForm: QuickCustomerForm
  quickCustomerErrors: QuickCustomerErrors
  setCustomer: React.Dispatch<React.SetStateAction<Customer | null>>
  setCustomerPhone: React.Dispatch<React.SetStateAction<string>>
  setQuickCustomerForm: React.Dispatch<React.SetStateAction<QuickCustomerForm>>
  searchCustomer: () => Promise<{ found: boolean; customer?: Customer | null; error?: string }>
  quickRegisterCustomer: () => Promise<{ success: boolean; error?: string }>
  clearCustomer: () => void
}

export const usePDVCustomer = (
  showFeedback: (type: string, message: string) => void
): UsePDVCustomerReturn => {
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [customerPhone, setCustomerPhone] = useState('')
  const [quickCustomerForm, setQuickCustomerForm] = useState<QuickCustomerForm>({
    name: '',
    phone: '',
    email: ''
  })
  const [quickCustomerErrors, setQuickCustomerErrors] = useState<QuickCustomerErrors>({})

  const searchMutation = useMutation({
    mutationFn: (phone: string) => saleService.searchCustomerByPhone(phone),
    onSuccess: (data, phone) => {
      if (data) {
        setCustomer(data)
        setQuickCustomerForm(prev => ({ ...prev, phone }))
        showFeedback('success', `Cliente encontrado: ${data.name}`)
      } else {
        setQuickCustomerForm(prev => ({ ...prev, phone }))
      }
    },
    onError: (error: Error) => {
      showFeedback('error', error.message)
    }
  })

  const createMutation = useMutation({
    mutationFn: (customerData: QuickCustomerForm) => saleService.createCustomer(customerData),
    onSuccess: (data) => {
      setCustomer(data)
      setQuickCustomerForm({ name: '', phone: '', email: '' })
      setQuickCustomerErrors({})
      showFeedback('success', `Cliente ${data.name} cadastrado!`)
    },
    onError: (error: Error) => {
      showFeedback('error', error.message)
    }
  })

  const searchCustomer = useCallback(async () => {
    const phone = customerPhone.replace(/\D/g, '')
    if (phone.length < 10) {
      showFeedback('error', 'Digite um telefone válido')
      return { found: false, error: 'Telefone inválido' }
    }
    try {
      const result = await searchMutation.mutateAsync(phone)
      if (result) {
        return { found: true, customer: result }
      } else {
        return { found: false, customer: null }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro de rede'
      return { found: false, error: message }
    }
  }, [customerPhone, searchMutation])

  const quickRegisterCustomer = useCallback(async () => {
    const errors: QuickCustomerErrors = {}
    if (quickCustomerForm.name.length < 3) {
      errors.name = 'Nome deve ter pelo menos 3 caracteres'
    }
    if (quickCustomerForm.phone.replace(/\D/g, '').length < 10) {
      errors.phone = 'Telefone inválido'
    }
    if (Object.keys(errors).length > 0) {
      setQuickCustomerErrors(errors)
      return { success: false }
    }
    try {
      await createMutation.mutateAsync(quickCustomerForm)
      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao criar cliente'
      return { success: false, error: message }
    }
  }, [quickCustomerForm, createMutation])

  const clearCustomer = useCallback(() => {
    setCustomer(null)
    setCustomerPhone('')
    setQuickCustomerForm({ name: '', phone: '', email: '' })
  }, [])

  return {
    customer,
    customerPhone,
    quickCustomerForm,
    quickCustomerErrors,
    setCustomer,
    setCustomerPhone,
    setQuickCustomerForm,
    searchCustomer,
    quickRegisterCustomer,
    clearCustomer
  }
}
