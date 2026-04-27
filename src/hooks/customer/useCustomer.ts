import { useState, useCallback } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useSystemLogs } from '@hooks/system/useSystemLogs'
import { useFormWithSchema } from '@/hooks/forms/useFormWithSchema'
import { quickCustomerSchema } from '@/utils/schemas'
import * as saleService from '@services/sale/saleService'
import type { Customer } from '@/types'

interface QuickCustomerForm {
  name: string
  phone: string
  email: string
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

interface UseCustomerOptions {
  searchFn?: (phone: string) => Promise<Customer | null>
  createFn?: (formData: QuickCustomerForm) => Promise<Customer>
  onCustomerFound?: (customer: Customer) => void
  onCustomerCreated?: (customer: Customer) => void
  showFeedback?: ShowFeedback
  logCustomer?: boolean
}

interface UseCustomerReturn {
  customer: Customer | null
  customerPhone: string
  quickCustomerForm: QuickCustomerForm
  quickCustomerErrors: Record<string, string>
  setCustomer: React.Dispatch<React.SetStateAction<Customer | null>>
  setCustomerPhone: React.Dispatch<React.SetStateAction<string>>
  setQuickCustomerForm: React.Dispatch<React.SetStateAction<QuickCustomerForm>>
  setQuickCustomerErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>
  searchCustomer: () => Promise<SearchCustomerResult>
  quickRegisterCustomer: () => Promise<QuickRegisterResult>
  clearCustomer: () => void
  isSearching: boolean
  isCreating: boolean
}

export const useCustomer = (options: UseCustomerOptions = {}): UseCustomerReturn => {
  const {
    searchFn,
    createFn,
    onCustomerFound,
    onCustomerCreated,
    showFeedback,
    logCustomer = false
  } = options

  const { logCreate } = useSystemLogs()
  const [customerPhone, setCustomerPhone] = useState<string>('')
  const [customer, setCustomer] = useState<Customer | null>(null)

  const quickCustomerFormHook = useFormWithSchema(quickCustomerSchema, {
    name: '',
    phone: '',
    email: ''
  }) as any

  const { watch: watchQuick, setValue: setQuickValue, reset: resetQuick, getValues: getQuickValues } = quickCustomerFormHook

  const quickCustomerForm = watchQuick() as QuickCustomerForm
  const quickCustomerErrors = (quickCustomerFormHook.formState.errors || {}) as Record<string, string>

  const searchCustomerMutation = useMutation({
    mutationFn: searchFn || ((phone: string) => saleService.searchCustomerByPhone(phone)),
    onSuccess: (data: Customer | null) => {
      if (data) {
        setCustomer(data)
        onCustomerFound?.(data)
        showFeedback?.('success', `Cliente encontrado: ${data.name}`)
      } else {
        resetQuick({ name: '', phone: customerPhone, email: '' })
      }
    },
    onError: (error: Error) => showFeedback?.('error', 'Erro ao buscar cliente: ' + error.message)
  })

  const createCustomerMutation = useMutation({
    mutationFn: createFn || ((formData: QuickCustomerForm) => saleService.createCustomer(formData)),
    onSuccess: async (data: Customer) => {
      setCustomer(data)
      if (logCustomer) {
        await logCreate('customer', data.id.toString(), { name: data.name, phone: data.phone })
      }
      onCustomerCreated?.(data)
      showFeedback?.('success', `Cliente ${data.name} cadastrado!`)
    },
    onError: (error: Error) => showFeedback?.('error', 'Erro ao cadastrar cliente: ' + error.message)
  })

  const searchCustomer = useCallback(async (): Promise<SearchCustomerResult> => {
    if (!customerPhone || customerPhone.length < 10) {
      showFeedback?.('error', 'Digite um telefone válido')
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
    const result = await quickCustomerFormHook.validate()
    if (!result.success) {
      return { success: false, error: result.error }
    }
    
    try {
      const formData = getQuickValues()
      const data = await createCustomerMutation.mutateAsync(formData)
      return { success: true, customer: data }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  }, [quickCustomerFormHook, createCustomerMutation])

  const clearCustomer = useCallback(() => {
    setCustomer(null)
    setCustomerPhone('')
    resetQuick({ name: '', phone: '', email: '' })
  }, [resetQuick])

  return {
    customer,
    customerPhone,
    quickCustomerForm: quickCustomerForm || { name: '', phone: '', email: '' },
    quickCustomerErrors,
    setCustomer,
    setCustomerPhone,
    setQuickCustomerForm: (data: QuickCustomerForm) => {
      Object.entries(data).forEach(([key, value]) => setQuickValue(key as any, value))
    },
    setQuickCustomerErrors: (errors: Record<string, string>) => {
      Object.entries(errors).forEach(([key, value]) => {
        if (value) {
          quickCustomerFormHook.setError(key as any, { message: value })
        }
      })
    },
    searchCustomer,
    quickRegisterCustomer,
    clearCustomer,
    isSearching: searchCustomerMutation.isPending,
    isCreating: createCustomerMutation.isPending
  }
}

export const usePDVCustomer = (showFeedback: ShowFeedback) => 
  useCustomer({ showFeedback, logCustomer: true })

export const useBudgetCustomer = () => 
  useCustomer({})