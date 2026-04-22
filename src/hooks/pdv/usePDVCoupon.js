// src/hooks/pdv/usePDVCoupon.js
import { useState, useCallback } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import * as saleService from '@services/saleService'
import { formatCurrency } from '@utils/formatters'

export const usePDVCoupon = (customer, cart, showFeedback) => {
  const [couponCode, setCouponCode] = useState('')
  const [coupon, setCoupon] = useState(null)
  const [couponError, setCouponError] = useState('')
  const [discount, setDiscount] = useState(0)

  const { data: availableCoupons = [] } = useQuery({
    queryKey: ['available-coupons', customer?.id],
    queryFn: () => saleService.fetchAvailableCoupons(customer?.id),
    enabled: !!customer,
  })

  const validateCouponMutation = useMutation({
    mutationFn: ({ code, customerId, cartSubtotal }) => 
      saleService.validateCoupon(code, customerId, cartSubtotal),
    onSuccess: (data) => {
      setCoupon(data.coupon)
      setCouponCode(data.coupon.code)
      setDiscount(data.discountValue)
      setCouponError('')
      showFeedback('success', `Cupom ${data.coupon.code} aplicado! Desconto: ${formatCurrency(data.discountValue)}`)
    },
    onError: (error) => setCouponError(error.message)
  })

  const applyCoupon = useCallback((couponToValidate = null) => {
    const code = couponToValidate?.code || couponCode
    if (!code) {
      setCouponError('Digite o código do cupom')
      return false
    }
    
    if (!customer) {
      setCouponError('Identifique um cliente para usar cupons')
      return false
    }
    
    const subtotal = cart.reduce((sum, item) => sum + item.total, 0)
    return validateCouponMutation.mutateAsync({ 
      code, 
      customerId: customer.id, 
      cartSubtotal: subtotal 
    })
  }, [couponCode, customer, cart, validateCouponMutation])

  const removeCoupon = useCallback(() => {
    setCoupon(null)
    setCouponCode('')
    setDiscount(0)
    setCouponError('')
    showFeedback('info', 'Cupom removido')
  }, [showFeedback])

  return {
    // Estado
    coupon,
    couponCode,
    couponError,
    discount,
    availableCoupons,
    
    // Setters
    setCouponCode,
    setCouponError,
    
    // Ações
    applyCoupon,
    removeCoupon,
    
    // Status
    isValidating: validateCouponMutation.isPending
  }
}