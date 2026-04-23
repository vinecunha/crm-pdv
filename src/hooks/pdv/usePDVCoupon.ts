import { useState, useCallback } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import * as saleService from '@services/sale/saleService'

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

interface CartItem {
  id: number
  name: string
  price: number
  quantity: number
  total: number
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

interface ApplyCouponResult {
  success: boolean
  data?: ValidateCouponResult
  error?: string
  coupon?: null
  discount?: number
}

type FeedbackType = 'success' | 'error' | 'info' | 'warning'
type ShowFeedback = (type: FeedbackType, message: string) => void

interface UsePDVCouponReturn {
  coupon: Coupon | null
  couponCode: string
  couponError: string
  discount: number
  availableCoupons: Coupon[]
  setCouponCode: React.Dispatch<React.SetStateAction<string>>
  setCouponError: React.Dispatch<React.SetStateAction<string>>
  applyCoupon: (couponToValidate?: Coupon | null) => Promise<ApplyCouponResult>
  removeCoupon: () => void
  isValidating: boolean
}

export const usePDVCoupon = (
  customer: Customer | null,
  cart: CartItem[],
  showFeedback: ShowFeedback
): UsePDVCouponReturn => {
  const [couponCode, setCouponCode] = useState<string>('')
  const [coupon, setCoupon] = useState<Coupon | null>(null)
  const [couponError, setCouponError] = useState<string>('')
  const [discount, setDiscount] = useState<number>(0)

  const { data: availableCoupons = [] } = useQuery<Coupon[]>({
    queryKey: ['available-coupons', customer?.id],
    queryFn: () => saleService.fetchAvailableCoupons(customer?.id as number),
    enabled: !!customer,
  })

  const validateCouponMutation = useMutation({
    mutationFn: ({ code, customerId, cartSubtotal }: { code: string; customerId: number; cartSubtotal: number }) => 
      saleService.validateCoupon(code, customerId, cartSubtotal),
    onSuccess: (data: ValidateCouponResult) => {
      setCoupon(data.coupon)
      setCouponCode(data.coupon.code)
      setDiscount(data.discountValue)
      setCouponError('')
      showFeedback('success', `Cupom ${data.coupon.code} aplicado! Desconto: ${data.discountValue.toFixed(2)}`)
    },
    onError: (error: Error) => {
      setCouponError(error.message)
      setCoupon(null)
      setDiscount(0)
    }
  })

  const applyCoupon = useCallback(async (couponToValidate: Coupon | null = null): Promise<ApplyCouponResult> => {
    const code = couponToValidate?.code || couponCode
    
    if (!code) {
      setCouponError('Digite o código do cupom')
      return { success: false, error: 'Digite o código do cupom' }
    }
    
    if (!customer) {
      setCouponError('Identifique um cliente para usar cupons')
      return { success: false, error: 'Identifique um cliente para usar cupons' }
    }
    
    const subtotal = cart.reduce((sum, item) => sum + item.total, 0)
    
    try {
      const result = await validateCouponMutation.mutateAsync({ 
        code, 
        customerId: customer.id, 
        cartSubtotal: subtotal 
      })
      
      return { success: true, data: result }
      
    } catch (error) {
      return { 
        success: false, 
        error: (error as Error).message,
        coupon: null,
        discount: 0
      }
    }
  }, [couponCode, customer, cart, validateCouponMutation])

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
    couponError,
    discount,
    availableCoupons,
    setCouponCode,
    setCouponError,
    applyCoupon,
    removeCoupon,
    isValidating: validateCouponMutation.isPending
  }
}