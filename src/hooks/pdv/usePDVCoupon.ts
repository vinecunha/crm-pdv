import { useState, useCallback } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import * as saleService from '@services/sale/saleService'

interface Coupon {
  id: number
  code: string
  discount_type: string
  discount_value: number
  max_discount?: number
  min_purchase?: number
}

interface UsePDVCouponReturn {
  coupon: Coupon | null
  couponCode: string
  discount: number
  couponError: string
  isValidating: boolean
  availableCoupons: Coupon[]
  setCouponCode: React.Dispatch<React.SetStateAction<string>>
  applyCoupon: () => Promise<void>
  removeCoupon: () => void
}

export const usePDVCoupon = (
  customer: { id: number | string } | null,
  cart: Array<{ id: number; quantity: number; price: number; total: number }>,
  showFeedback: (type: string, message: string) => void
): UsePDVCouponReturn => {
  const [coupon, setCoupon] = useState<Coupon | null>(null)
  const [couponCode, setCouponCode] = useState('')
  const [discount, setDiscount] = useState(0)
  const [couponError, setCouponError] = useState('')

  const cartSubtotal = cart.reduce((sum, item) => sum + item.total, 0)

  const { data: availableCoupons = [] } = useQuery({
    queryKey: ['availableCoupons', customer?.id],
    queryFn: () => saleService.fetchAvailableCoupons(customer?.id),
    enabled: !!customer?.id
  })

  const validateMutation = useMutation({
    mutationFn: (code: string) => saleService.validateCoupon(code, customer?.id, cartSubtotal),
    onSuccess: (data) => {
      setCoupon(data.coupon)
      setDiscount(data.discountValue)
      setCouponError('')
      showFeedback('success', `Cupom ${data.coupon.code} aplicado!`)
    },
    onError: (error: Error) => {
      setCouponError(error.message)
      showFeedback('error', error.message)
    }
  })

  const applyCoupon = useCallback(async () => {
    if (!couponCode.trim()) {
      setCouponError('Digite um código de cupom')
      return
    }
    try {
      await validateMutation.mutateAsync(couponCode)
    } catch (error) {
      // Error handled by onError
    }
  }, [couponCode, validateMutation])

  const removeCoupon = useCallback(() => {
    setCoupon(null)
    setCouponCode('')
    setDiscount(0)
    setCouponError('')
    showFeedback('info', 'Cupom removido')
  }, [showFeedback])

  return {
    coupon,
    couponCode,
    discount,
    couponError,
    isValidating: validateMutation.isPending,
    availableCoupons,
    setCouponCode,
    applyCoupon,
    removeCoupon
  }
}
