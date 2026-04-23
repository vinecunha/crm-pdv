import { useState, useCallback, useMemo } from 'react'
import { useMutation } from '@tanstack/react-query'
import * as budgetService from '@services/budget/budgetService'

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

interface Customer {
  id: number
  name: string
  email: string
  phone: string
  [key: string]: unknown
}

interface ValidateCouponResult {
  coupon: Coupon
  discountValue: number
}

interface UseBudgetCouponReturn {
  coupon: Coupon | null
  couponCode: string
  setCouponCode: React.Dispatch<React.SetStateAction<string>>
  discount: number
  validateCoupon: ReturnType<typeof useMutation>
  removeCoupon: () => void
}

export const useBudgetCoupon = (
  customer: Customer | null,
  cartSubtotal: number
): UseBudgetCouponReturn => {
  const [coupon, setCoupon] = useState<Coupon | null>(null)
  const [couponCode, setCouponCode] = useState<string>('')
  const [discount, setDiscount] = useState<number>(0)
  
  const validateCoupon = useMutation({
    mutationFn: (code: string) => 
      budgetService.validateCoupon(code, customer?.id as number, cartSubtotal),
    onSuccess: (data: ValidateCouponResult) => {
      setCoupon(data.coupon)
      setDiscount(data.discountValue)
    }
  })
  
  const removeCoupon = useCallback(() => {
    setCoupon(null)
    setCouponCode('')
    setDiscount(0)
  }, [])
  
  return {
    coupon,
    couponCode,
    setCouponCode,
    discount,
    validateCoupon,
    removeCoupon
  }
}