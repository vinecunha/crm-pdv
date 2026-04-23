// src/hooks/pdv/usePDVCustomer.js
import { useState, useCallback } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useSystemLogs } from '@hooks/system/useSystemLogs'
import * as saleService from '@services/sale/saleService'

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

  // ✅ Mutation de busca - retorna o cliente ou null
  const searchCustomerMutation = useMutation({
    mutationFn: (phone) => saleService.searchCustomerByPhone(phone),
    onSuccess: (data) => {
      if (data) {
        setCustomer(data)
        showFeedback('success', `Cliente encontrado: ${data.name}`)
      } else {
        setQuickCustomerForm({ name: '', phone: customerPhone, email: '' })
      }
    },
    onError: (error) => showFeedback('error', 'Erro ao buscar cliente: ' + error.message)
  })

  // ✅ Mutation de criação - retorna o cliente criado
  const createCustomerMutation = useMutation({
    mutationFn: (formData) => saleService.createCustomer(formData),
    onSuccess: async (data) => {
      setCustomer(data)
      await logCreate('customer', data.id, { name: data.name, phone: data.phone })
      showFeedback('success', `Cliente ${data.name} cadastrado!`)
    },
    onError: (error) => showFeedback('error', 'Erro ao cadastrar cliente: ' + error.message)
  })

  // ✅ Buscar cliente - retorna { found, customer }
  const searchCustomer = useCallback(async () => {
    if (!customerPhone || customerPhone.length < 10) {
      showFeedback('error', 'Digite um telefone válido')
      return { found: false, error: 'Telefone inválido' }
    }
    
    try {
      const data = await searchCustomerMutation.mutateAsync(customerPhone)
      return { found: !!data, customer: data }
    } catch (error) {
      return { found: false, error: error.message }
    }
  }, [customerPhone, searchCustomerMutation, showFeedback])

  // ✅ Cadastro rápido - valida e cria
  const quickRegisterCustomer = useCallback(async () => {
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
    
    try {
      const data = await createCustomerMutation.mutateAsync(quickCustomerForm)
      return { success: true, customer: data }
    } catch (error) {
      return { success: false, error: error.message }
    }
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
