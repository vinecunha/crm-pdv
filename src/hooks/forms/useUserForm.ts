import { useState, useCallback, ChangeEvent } from 'react'

// Baseado em: public.profiles
interface User {
  id: string
  email: string
  role: string
  full_name: string | null
  registration_number: string | null
  status: string | null
  [key: string]: unknown
}

interface UserFormData {
  email: string
  full_name: string
  role: string
  password: string
  registration_number: string
}

interface CreateUserPayload {
  email: string
  password: string
  full_name: string
  role: string
  registration_number: string
}

interface UpdateUserPayload {
  full_name: string
  role: string
}

interface ValidationResult {
  valid: boolean
  error?: string
}

const initialFormData: UserFormData = { 
  email: '', 
  full_name: '', 
  role: 'operador', 
  password: '', 
  registration_number: '' 
}

interface UseUserFormReturn {
  formData: UserFormData
  setFormData: React.Dispatch<React.SetStateAction<UserFormData>>
  resetForm: () => void
  setFormForEditing: (user: User | null) => void
  handleChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
  validate: () => ValidationResult
  getCreatePayload: () => CreateUserPayload
  getUpdatePayload: () => UpdateUserPayload
}

export const useUserForm = (): UseUserFormReturn => {
  const [formData, setFormData] = useState<UserFormData>(initialFormData)

  const resetForm = useCallback(() => {
    setFormData(initialFormData)
  }, [])

  const setFormForEditing = useCallback((user: User | null) => {
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

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }, [])

  const validate = useCallback((): ValidationResult => {
    if (!formData.email || !formData.password || !formData.full_name) {
      return { valid: false, error: 'Preencha todos os campos obrigatórios' }
    }
    return { valid: true }
  }, [formData])

  const getCreatePayload = useCallback((): CreateUserPayload => {
    return {
      email: formData.email,
      password: formData.password,
      full_name: formData.full_name,
      role: formData.role,
      registration_number: formData.registration_number
    }
  }, [formData])

  const getUpdatePayload = useCallback((): UpdateUserPayload => {
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