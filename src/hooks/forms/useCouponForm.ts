import { useState, useCallback, ChangeEvent } from 'react'

// Baseado em: public.coupons
interface Coupon {
  id: number
  code: string
  name: string
  description: string | null
  discount_type: 'fixed' | 'percent'
  discount_value: number
  max_discount: number | null
  min_purchase: number | null
  is_global: boolean | null
  is_active: boolean | null
  valid_from: string | null
  valid_to: string | null
  usage_limit: number | null
  used_count: number | null
  [key: string]: unknown
}

// Baseado em: public.coupon_allowed_customers
interface AllowedCustomer {
  id: number
  coupon_id: number | null
  customer_id: number | null
  created_at: string | null
}

interface CouponFormData {
  code: string
  name: string
  description: string
  discount_type: 'fixed' | 'percent'
  discount_value: string | number
  max_discount: string | number
  min_purchase: string | number
  is_global: boolean
  is_active: boolean
  valid_from: string
  valid_to: string
  usage_limit: string | number
}

interface CouponPayload {
  code: string
  name: string
  description: string | null
  discount_type: string
  discount_value: number
  max_discount: number | null
  min_purchase: number
  is_global: boolean
  is_active: boolean
  valid_from: string | null
  valid_to: string | null
  usage_limit: number | null
}

interface ValidationResult {
  valid: boolean
  error?: string
}

const initialFormData: CouponFormData = {
  code: '', 
  name: '', 
  description: '', 
  discount_type: 'percent',
  discount_value: '', 
  max_discount: '', 
  min_purchase: '0',
  is_global: true, 
  is_active: true, 
  valid_from: '', 
  valid_to: '', 
  usage_limit: ''
}

interface UseCouponFormReturn {
  formData: CouponFormData
  setFormData: React.Dispatch<React.SetStateAction<CouponFormData>>
  resetForm: () => void
  setFormForEditing: (coupon: Coupon | null, allowedCustomers?: AllowedCustomer[]) => void
  handleChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
  getCouponPayload: () => CouponPayload
  validate: () => ValidationResult
}

export const useCouponForm = (): UseCouponFormReturn => {
  const [formData, setFormData] = useState<CouponFormData>(initialFormData)

  const resetForm = useCallback(() => {
    setFormData(initialFormData)
  }, [])

  const setFormForEditing = useCallback((coupon: Coupon | null, allowedCustomers: AllowedCustomer[] = []) => {
    if (coupon) {
      setFormData({
        code: coupon.code,
        name: coupon.name,
        description: coupon.description || '',
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        max_discount: coupon.max_discount || '',
        min_purchase: coupon.min_purchase || '0',
        is_global: coupon.is_global ?? true,
        is_active: coupon.is_active ?? true,
        valid_from: coupon.valid_from?.split('T')[0] || '',
        valid_to: coupon.valid_to?.split('T')[0] || '',
        usage_limit: coupon.usage_limit || ''
      })
    } else {
      resetForm()
    }
  }, [resetForm])

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }))
  }, [])

  const getCouponPayload = useCallback((): CouponPayload => {
    return {
      code: formData.code.toUpperCase(),
      name: formData.name,
      description: formData.description || null,
      discount_type: formData.discount_type,
      discount_value: parseFloat(formData.discount_value as string),
      max_discount: formData.max_discount ? parseFloat(formData.max_discount as string) : null,
      min_purchase: parseFloat(formData.min_purchase as string) || 0,
      is_global: formData.is_global,
      is_active: formData.is_active,
      valid_from: formData.valid_from ? new Date(formData.valid_from).toISOString() : null,
      valid_to: formData.valid_to ? new Date(formData.valid_to).toISOString() : null,
      usage_limit: formData.usage_limit ? parseInt(formData.usage_limit as string) : null,
    }
  }, [formData])

  const validate = useCallback((): ValidationResult => {
    if (!formData.code || !formData.name || !formData.discount_value || Number(formData.discount_value) <= 0) {
      return { valid: false, error: 'Preencha todos os campos obrigatórios' }
    }
    return { valid: true }
  }, [formData])

  return {
    formData,
    setFormData,
    resetForm,
    setFormForEditing,
    handleChange,
    getCouponPayload,
    validate
  }
}