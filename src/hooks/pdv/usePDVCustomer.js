// src/hooks/pdv/usePDVCustomer.js
import { useState, useCallback } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useSystemLogs } from '@hooks/useSystemLogs'
import * as saleService from '@services/saleService'

export const usePDVCustomer = (showFeedback) => {
  const { logCreate } = useSystemLogs()
  const [customerPhone, setCustomerPhone] = useState('')
  const [customer, setCustomer] = useState(null)
  const [quickCustomerForm, setQuickCustomerForm] = useState({ 
    name: '', 
    phone: '', 
    email: '' 
  })
  const [quickCustomerErrors, setQuickCustomerErrors] = useState({})

  const searchCustomerMutation = useMutation({
    mutationFn: saleService.searchCustomerByPhone,
    onSuccess: (data) => {
      if (data) {
        setCustomer(data)
        showFeedback('success', `Cliente encontrado: ${data.name}`)
        return { found: true, customer: data }
      } else {
        setQuickCustomerForm({ name: '', phone: customerPhone, email: '' })
        return { found: false }
      }
    },
    onError: (error) => showFeedback('error', 'Erro ao buscar cliente: ' + error.message)
  })

  const createCustomerMutation = useMutation({
    mutationFn: saleService.createCustomer,
    onSuccess: async (data) => {
      setCustomer(data)
      await logCreate('customer', data.id, { name: data.name, phone: data.phone })
      showFeedback('success', `Cliente ${data.name} cadastrado!`)
    },
    onError: (error) => showFeedback('error', 'Erro ao cadastrar cliente: ' + error.message)
  })

  const searchCustomer = useCallback(() => {
    if (!customerPhone || customerPhone.length < 10) {
      showFeedback('error', 'Digite um telefone válido')
      return
    }
    return searchCustomerMutation.mutateAsync(customerPhone)
  }, [customerPhone, searchCustomerMutation])

  const quickRegisterCustomer = useCallback(() => {
    const errors = {}
    if (!quickCustomerForm.name?.trim()) errors.name = 'Nome é obrigatório'
    if (!quickCustomerForm.phone?.trim() || quickCustomerForm.phone.length < 10) {
      errors.phone = 'Telefone inválido'
    }
    if (quickCustomerForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(quickCustomerForm.email)) {
      errors.email = 'E-mail inválido'
    }
    
    if (Object.keys(errors).length > 0) {
      setQuickCustomerErrors(errors)
      return false
    }
    
    return createCustomerMutation.mutateAsync(quickCustomerForm)
  }, [quickCustomerForm, createCustomerMutation])

  const clearCustomer = useCallback(() => {
    setCustomer(null)
    setCustomerPhone('')
    setQuickCustomerForm({ name: '', phone: '', email: '' })
    setQuickCustomerErrors({})
  }, [])

  return {
    // Estado
    customer,
    customerPhone,
    quickCustomerForm,
    quickCustomerErrors,
    
    // Setters
    setCustomer,
    setCustomerPhone,
    setQuickCustomerForm,
    setQuickCustomerErrors,
    
    // Ações
    searchCustomer,
    quickRegisterCustomer,
    clearCustomer,
    
    // Status
    isSearching: searchCustomerMutation.isPending,
    isCreating: createCustomerMutation.isPending
  }
}