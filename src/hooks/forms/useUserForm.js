// src/hooks/forms/useUserForm.js
import { useState, useCallback } from 'react'

const initialFormData = { 
  email: '', 
  full_name: '', 
  role: 'operador', 
  password: '', 
  registration_number: '' 
}

export const useUserForm = () => {
  const [formData, setFormData] = useState(initialFormData)

  const resetForm = useCallback(() => {
    setFormData(initialFormData)
  }, [])

  const setFormForEditing = useCallback((user) => {
    if (user) {
      setFormData({ 
        email: user.email, 
        full_name: user.full_name || '', 
        role: user.role || 'operador', 
        password: '',
        registration_number: user.registration_number || ''
      })
    } else {
      resetForm()
    }
  }, [resetForm])

  const handleChange = useCallback((e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }, [])

  const validate = useCallback(() => {
    if (!formData.email || !formData.password || !formData.full_name) {
      return { valid: false, error: 'Preencha todos os campos obrigatórios' }
    }
    return { valid: true }
  }, [formData])

  const getCreatePayload = useCallback(() => {
    return {
      email: formData.email,
      password: formData.password,
      full_name: formData.full_name,
      role: formData.role,
      registration_number: formData.registration_number
    }
  }, [formData])

  const getUpdatePayload = useCallback(() => {
    return {
      full_name: formData.full_name,
      role: formData.role
    }
  }, [formData])

  return {
    formData,
    setFormData,
    resetForm,
    setFormForEditing,
    handleChange,
    validate,
    getCreatePayload,
    getUpdatePayload
  }
}
