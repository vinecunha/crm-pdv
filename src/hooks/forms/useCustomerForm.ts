import { useState, useCallback, ChangeEvent } from 'react'

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

interface CustomerFormData {
  name: string
  email: string
  phone: string
  document: string
  address: string
  city: string
  state: string
  zip_code: string
  birth_date: string
  status: string
}

interface CustomerPayload {
  name: string
  email: string
  phone: string
  document: string | null
  address: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  birth_date: string | null
  status: string
}

interface FormErrors {
  name?: string
  email?: string
  phone?: string
  document?: string
  zip_code?: string
  [key: string]: string | undefined
}

const initialFormData: CustomerFormData = {
  name: '', 
  email: '', 
  phone: '', 
  document: '', 
  address: '',
  city: '', 
  state: '', 
  zip_code: '', 
  birth_date: '', 
  status: 'active'
}

interface UseCustomerFormReturn {
  formData: CustomerFormData
  setFormData: React.Dispatch<React.SetStateAction<CustomerFormData>>
  formErrors: FormErrors
  setFormErrors: React.Dispatch<React.SetStateAction<FormErrors>>
  resetForm: () => void
  setFormForEditing: (customer: Customer | null) => void
  handleChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
  validate: () => boolean
  getCustomerPayload: () => CustomerPayload
}

export const useCustomerForm = (): UseCustomerFormReturn => {
  const [formData, setFormData] = useState<CustomerFormData>(initialFormData)
  const [formErrors, setFormErrors] = useState<FormErrors>({})

  const resetForm = useCallback(() => {
    setFormData(initialFormData)
    setFormErrors({})
  }, [])

  const setFormForEditing = useCallback((customer: Customer | null) => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        document: customer.document || '',
        address: customer.address || '',
        city: customer.city || '',
        state: customer.state || '',
        zip_code: customer.zip_code || '',
        birth_date: customer.birth_date || '',
        status: customer.status || 'active'
      })
    } else {
      resetForm()
    }
    setFormErrors({})
  }, [resetForm])

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }))
    }
  }, [formErrors])

  const validate = useCallback((): boolean => {
    const errors: FormErrors = {}
    
    if (!formData.name?.trim()) errors.name = 'Nome é obrigatório'
    else if (formData.name.length < 3) errors.name = 'Nome deve ter pelo menos 3 caracteres'
    
    if (!formData.email?.trim()) errors.email = 'E-mail é obrigatório'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'E-mail inválido'
    
    if (!formData.phone?.trim()) errors.phone = 'Telefone é obrigatório'
    
    if (formData.document && formData.document.replace(/\D/g, '').length < 11) {
      errors.document = 'Documento inválido'
    }
    if (formData.zip_code && formData.zip_code.replace(/\D/g, '').length < 8) {
      errors.zip_code = 'CEP inválido'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }, [formData])

  const getCustomerPayload = useCallback((): CustomerPayload => {
    return {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.replace(/\D/g, ''),
      document: formData.document?.replace(/\D/g, '') || null,
      address: formData.address?.trim() || null,
      city: formData.city?.trim() || null,
      state: formData.state?.trim() || null,
      zip_code: formData.zip_code?.replace(/\D/g, '') || null,
      birth_date: formData.birth_date || null,
      status: formData.status || 'active'
    }
  }, [formData])

  return {
    formData,
    setFormData,
    formErrors,
    setFormErrors,
    resetForm,
    setFormForEditing,
    handleChange,
    validate,
    getCustomerPayload
  }
}