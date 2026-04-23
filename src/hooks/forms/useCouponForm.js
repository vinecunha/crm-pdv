// src/hooks/forms/useCouponForm.js
import { useState, useCallback } from 'react'

const initialFormData = {
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

export const useCouponForm = () => {
  const [formData, setFormData] = useState(initialFormData)

  const resetForm = useCallback(() => {
    setFormData(initialFormData)
  }, [])

  const setFormForEditing = useCallback((coupon, allowedCustomers = []) => {
    if (coupon) {
      setFormData({
        code: coupon.code,
        name: coupon.name,
        description: coupon.description || '',
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        max_discount: coupon.max_discount || '',
        min_purchase: coupon.min_purchase || '0',
        is_global: coupon.is_global,
        is_active: coupon.is_active,
        valid_from: coupon.valid_from?.split('T')[0] || '',
        valid_to: coupon.valid_to?.split('T')[0] || '',
        usage_limit: coupon.usage_limit || ''
      })
    } else {
      resetForm()
    }
  }, [resetForm])

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }))
  }, [])

  const getCouponPayload = useCallback(() => {
    return {
      code: formData.code.toUpperCase(),
      name: formData.name,
      description: formData.description || null,
      discount_type: formData.discount_type,
      discount_value: parseFloat(formData.discount_value),
      max_discount: formData.max_discount ? parseFloat(formData.max_discount) : null,
      min_purchase: parseFloat(formData.min_purchase) || 0,
      is_global: formData.is_global,
      is_active: formData.is_active,
      valid_from: formData.valid_from ? new Date(formData.valid_from).toISOString() : null,
      valid_to: formData.valid_to ? new Date(formData.valid_to).toISOString() : null,
      usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
    }
  }, [formData])

  const validate = useCallback(() => {
    if (!formData.code || !formData.name || !formData.discount_value || formData.discount_value <= 0) {
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
