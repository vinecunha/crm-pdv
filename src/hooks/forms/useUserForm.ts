import { useCallback, ChangeEvent } from 'react'
import { useFormWithSchema } from './useFormWithSchema'
import { z } from 'zod'

const userSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos'),
  role: z.enum(['admin', 'gerente', 'vendedor']).default('vendedor'),
  password: z.string().optional(),
  registration_number: z.string().optional(),
  status: z.string().default('active')
})

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
  role: 'vendedor',
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
  const form = useFormWithSchema(userSchema, initialFormData) as any
  const { watch, setValue, reset, getValues } = form

  const formData = watch() as UserFormData

  const resetForm = useCallback(() => {
    reset(initialFormData)
  }, [reset])

  const setFormForEditing = useCallback((user: User | null) => {
    if (user) {
      reset({
        email: user.email,
        full_name: user.full_name || '',
        role: user.role || 'vendedor',
        password: '',
        registration_number: user.registration_number || ''
      })
    } else {
      resetForm()
    }
  }, [reset, resetForm])

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setValue(name as any, value)
  }, [setValue])

  const validate = useCallback(async (): Promise<ValidationResult> => {
    const result = await form.validate()
    return result
  }, [form])

  const getCreatePayload = useCallback((): CreateUserPayload => {
    const data = getValues()
    return {
      email: data.email,
      password: data.password,
      full_name: data.full_name,
      role: data.role,
      registration_number: data.registration_number
    }
  }, [getValues])

  const getUpdatePayload = useCallback((): UpdateUserPayload => {
    const data = getValues()
    return {
      full_name: data.full_name,
      role: data.role
    }
  }, [getValues])

  return {
    formData: formData || initialFormData,
    setFormData: (data: UserFormData) => {
      Object.entries(data).forEach(([key, value]) => setValue(key as any, value))
    },
    resetForm,
    setFormForEditing,
    handleChange,
    validate,
    getCreatePayload,
    getUpdatePayload
  }
}