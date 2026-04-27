import { useCallback, ChangeEvent } from 'react'
import { useFormWithSchema } from '@hooks/forms/useFormWithSchema'
import { customerSchema } from '@/utils/schemas'

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
  formErrors: Record<string, string>
  setFormErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>
  resetForm: () => void
  setFormForEditing: (customer: Customer | null) => void
  handleChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
  validate: () => boolean
  getCustomerPayload: () => CustomerPayload
}

export const useCustomerForm = (): UseCustomerFormReturn => {
  const form = useFormWithSchema(customerSchema, initialFormData) as any
  const { watch, setValue, reset, getValues } = form

  const formData = watch() as CustomerFormData
  const formErrors = (form.formState.errors || {}) as Record<string, string>
  const setFormData = (data: CustomerFormData) => {
    Object.entries(data).forEach(([key, value]) => setValue(key, value))
  }
  const setFormErrors = (errors: Record<string, string>) => {
    Object.entries(errors).forEach(([key, value]) => {
      if (value) {
        form.setError(key as any, { message: value })
      }
    })
  }

  const resetForm = useCallback(() => {
    reset(initialFormData)
  }, [reset])

  const setFormForEditing = useCallback((customer: Customer | null) => {
    if (customer) {
      reset({
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
  }, [reset, resetForm])

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setValue(name as any, value)
  }, [setValue])

  const validate = useCallback(async (): Promise<boolean> => {
    const result = await form.validate()
    return result.success
  }, [form])

  const getCustomerPayload = useCallback((): CustomerPayload => {
    const data = getValues()
    return {
      name: data.name?.trim() || '',
      email: data.email?.trim().toLowerCase() || '',
      phone: data.phone?.replace(/\D/g, '') || '',
      document: data.document?.replace(/\D/g, '') || null,
      address: data.address?.trim() || null,
      city: data.city?.trim() || null,
      state: data.state?.trim() || null,
      zip_code: data.zip_code?.replace(/\D/g, '') || null,
      birth_date: data.birth_date || null,
      status: data.status || 'active'
    }
  }, [getValues])

  return {
    formData: formData || initialFormData,
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