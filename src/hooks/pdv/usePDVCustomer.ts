import { useState, useCallback } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useSystemLogs } from '@hooks/system/useSystemLogs'
import * as saleService from '@services/sale/saleService'

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
}

interface QuickCustomerErrors {
  name?: string
  phone?: string
  email?: string
}

interface SearchCustomerResult {
  found: boolean
  customer?: Customer | null
  error?: string
}

interface QuickRegisterResult {
  success: boolean
  customer?: Customer
  error?: string
}

type FeedbackType = 'success' | 'error' | 'info' | 'warning'
type ShowFeedback = (type: FeedbackType, message: string) => void

interface UsePDVCustomerReturn {
  customer: Customer | null
  customerPhone: string
  quickCustomerForm: QuickCustomerForm
  quickCustomerErrors: QuickCustomerErrors
  setCustomer: React.Dispatch<React.SetStateAction<Customer | null>>
  setCustomerPhone: React.Dispatch<React.SetStateAction<string>>
  setQuickCustomerForm: React.Dispatch<React.SetStateAction<QuickCustomerForm>>
  setQuickCustomerErrors: React.Dispatch<React.SetStateAction<QuickCustomerErrors>>
  searchCustomer: () => Promise<SearchCustomerResult>
  quickRegisterCustomer: () => Promise<QuickRegisterResult>
  clearCustomer: () => void
  isSearching: boolean
  isCreating: boolean
}

export const usePDVCustomer = (showFeedback: ShowFeedback): UsePDVCustomerReturn => {
  const { logCreate } = useSystemLogs()
  const [customerPhone, setCustomerPhone] = useState<string>('')
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [quickCustomerForm, setQuickCustomerForm] = useState<QuickCustomerForm>({ 
    name: '', 
    phone: '', 
    email: '' 
  })
  const [quickCustomerErrors, setQuickCustomerErrors] = useState<QuickCustomerErrors>({})

  const searchCustomerMutation = useMutation({
    mutationFn: (phone: string) => saleService.searchCustomerByPhone(phone),
    onSuccess: (data: Customer | null) => {
      if (data) {
        setCustomer(data)
        showFeedback('success', `Cliente encontrado: ${data.name}`)
      } else {
        setQuickCustomerForm({ name: '', phone: customerPhone, email: '' })
      }
    },
    onError: (error: Error) => showFeedback('error', 'Erro ao buscar cliente: ' + error.message)
  })

  const createCustomerMutation = useMutation({
    mutationFn: (formData: QuickCustomerForm) => saleService.createCustomer(formData),
    onSuccess: async (data: Customer) => {
      setCustomer(data)
      await logCreate('customer', data.id.toString(), { name: data.name, phone: data.phone })
      showFeedback('success', `Cliente ${data.name} cadastrado!`)
    },
    onError: (error: Error) => showFeedback('error', 'Erro ao cadastrar cliente: ' + error.message)
  })

  const searchCustomer = useCallback(async (): Promise<SearchCustomerResult> => {
    if (!customerPhone || customerPhone.length < 10) {
      showFeedback('error', 'Digite um telefone válido')
      return { found: false, error: 'Telefone inválido' }
    }
    
    try {
      const data = await searchCustomerMutation.mutateAsync(customerPhone)
      return { found: !!data, customer: data }
    } catch (error) {
      return { found: false, error: (error as Error).message }
    }
  }, [customerPhone, searchCustomerMutation, showFeedback])

  const quickRegisterCustomer = useCallback(async (): Promise<QuickRegisterResult> => {
    const errors: QuickCustomerErrors = {}
    if (!quickCustomerForm.name?.trim()) errors.name = 'Nome é obrigatório'
    if (!quickCustomerForm.phone?.trim() || quickCustomerForm.phone.length < 10) {
      errors.phone = 'Telefone inválido'
    }
    if (quickCustomerForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(quickCustomerForm.email)) {
      errors.email = 'E-mail inválido'
    }
    
    if (Object.keys(errors).length > 0) {
      setQuickCustomerErrors(errors)
      return { success: false }
    }
    
    try {
      const data = await createCustomerMutation.mutateAsync(quickCustomerForm)
      return { success: true, customer: data }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  }, [quickCustomerForm, createCustomerMutation])

  const clearCustomer = useCallback(() => {
    setCustomer(null)
    setCustomerPhone('')
    setQuickCustomerForm({ name: '', phone: '', email: '' })
    setQuickCustomerErrors({})
  }, [])

  return {
    customer,
    customerPhone,
    quickCustomerForm,
    quickCustomerErrors,
    setCustomer,
    setCustomerPhone,
    setQuickCustomerForm,
    setQuickCustomerErrors,
    searchCustomer,
    quickRegisterCustomer,
    clearCustomer,
    isSearching: searchCustomerMutation.isPending,
    isCreating: createCustomerMutation.isPending
  }
}