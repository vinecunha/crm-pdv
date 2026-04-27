import { useCallback, ChangeEvent } from 'react'
import { useFormWithSchema } from '@hooks/forms/useFormWithSchema'
import { z } from 'zod'

const couponSchema = z.object({
  code: z.string().min(3, 'Código deve ter pelo menos 3 caracteres').transform(v => v?.toUpperCase()),
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  discount_type: z.enum(['percent', 'fixed']),
  discount_value: z.number({ invalid_type_error: 'Valor inválido' }).min(0, 'Valor não pode ser negativo'),
  min_purchase: z.number({ invalid_type_error: 'Valor mínimo inválido' }).min(0, 'Valor não pode ser negativo').default(0),
  max_discount: z.number({ invalid_type_error: 'Desconto máximo inválido' }).min(0, 'Valor não pode ser negativo').optional(),
  is_global: z.boolean().default(true),
  is_active: z.boolean().default(true),
  valid_from: z.string().optional(),
  valid_to: z.string().optional(),
  usage_limit: z.number().int('Limite deve ser inteiro').min(1, 'Limite deve ser pelo menos 1').optional()
})

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
  const form = useFormWithSchema(couponSchema, initialFormData) as any
  const { watch, setValue, reset, getValues } = form

  const formData = watch() as CouponFormData

  const resetForm = useCallback(() => {
    reset(initialFormData)
  }, [reset])

  const setFormForEditing = useCallback((coupon: Coupon | null, allowedCustomers: AllowedCustomer[] = []) => {
    if (coupon) {
      reset({
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
  }, [reset, resetForm])

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined
    setValue(name as any, type === 'checkbox' ? checked : value)
  }, [setValue])

  const getCouponPayload = useCallback((): CouponPayload => {
    const data = getValues()
    return {
      code: data.code?.toUpperCase() || '',
      name: data.name || '',
      description: data.description || null,
      discount_type: data.discount_type || 'percent',
      discount_value: parseFloat(String(data.discount_value)) || 0,
      max_discount: data.max_discount ? parseFloat(String(data.max_discount)) : null,
      min_purchase: parseFloat(String(data.min_purchase)) || 0,
      is_global: data.is_global ?? true,
      is_active: data.is_active ?? true,
      valid_from: data.valid_from ? new Date(data.valid_from).toISOString() : null,
      valid_to: data.valid_to ? new Date(data.valid_to).toISOString() : null,
      usage_limit: data.usage_limit ? parseInt(String(data.usage_limit)) : null,
    }
  }, [getValues])

  const validate = useCallback(async (): Promise<ValidationResult> => {
    const result = await form.validate()
    return result
  }, [form])

  return {
    formData: formData || initialFormData,
    setFormData: (data: CouponFormData) => {
      Object.entries(data).forEach(([key, value]) => setValue(key as any, value))
    },
    resetForm,
    setFormForEditing,
    handleChange,
    getCouponPayload,
    validate
  }
}