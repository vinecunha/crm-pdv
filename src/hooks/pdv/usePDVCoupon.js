// src/hooks/pdv/usePDVCoupon.js
import { useState, useCallback } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import * as saleService from '@services/sale/saleService'
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
    onError: (error) => {
      setCouponError(error.message)
      setCoupon(null)
      setDiscount(0)
    }
  })

  const applyCoupon = useCallback(async (couponToValidate = null) => {
    const code = couponToValidate?.code || couponCode
    
    // Validações síncronas
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
      // Erro já foi tratado no onError da mutation
      // Apenas retornamos um objeto de erro para o consumidor
      return { 
        success: false, 
        error: error.message,
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
