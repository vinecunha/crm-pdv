import { useState, useCallback, useMemo } from 'react'
import { useMutation } from '@tanstack/react-query'

export const useBudgetCoupon = (customer, cartSubtotal) => {
  const [coupon, setCoupon] = useState(null)
  const [couponCode, setCouponCode] = useState('')
  const [discount, setDiscount] = useState(0)
  
  const validateCoupon = useMutation({
    mutationFn: (code) => budgetService.validateCoupon(code, customer?.id, cartSubtotal),
    onSuccess: (data) => {
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