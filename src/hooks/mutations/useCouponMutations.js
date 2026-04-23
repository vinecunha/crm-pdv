// src/hooks/mutations/useCouponMutations.js
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSystemLogs } from '@hooks/system/useSystemLogs'
import * as couponService from '@services/coupon/couponService'

export const useCouponMutations = (profile) => {
  const queryClient = useQueryClient()
  const { logCreate, logUpdate, logDelete, logError } = useSystemLogs()

  const createMutation = useMutation({
    mutationFn: ({ couponData, allowedCustomers }) =>
      couponService.createCoupon(couponData, allowedCustomers, profile),
    onSuccess: async (coupon) => {
      await logCreate('coupon', coupon.id, coupon)
      queryClient.invalidateQueries({ queryKey: ['coupons'] })
    },
    onError: async (error) => {
      await logError('coupon', error, { action: 'create' })
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, couponData, allowedCustomers }) =>
      couponService.updateCoupon(id, couponData, allowedCustomers, profile),
    onSuccess: async (coupon, variables) => {
      await logUpdate('coupon', coupon.id, variables, coupon)
      queryClient.invalidateQueries({ queryKey: ['coupons'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => couponService.deleteCoupon(id),
    onSuccess: async (_, id) => {
      await logDelete('coupon', id)
      queryClient.invalidateQueries({ queryKey: ['coupons'] })
    },
  })

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, currentStatus }) =>
      couponService.toggleCouponStatus(id, currentStatus, profile),
    onSuccess: async (coupon) => {
      await logUpdate('coupon', coupon.id, { is_active: !coupon.is_active }, coupon)
      queryClient.invalidateQueries({ queryKey: ['coupons'] })
    },
  })

  const addCustomerMutation = useMutation({
    mutationFn: ({ couponId, customer }) =>
      couponService.addAllowedCustomer(couponId, customer),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allowed-customers'] })
    },
  })

  const removeCustomerMutation = useMutation({
    mutationFn: ({ couponId, customerId }) =>
      couponService.removeAllowedCustomer(couponId, customerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allowed-customers'] })
    },
  })

  const isMutating = createMutation.isPending || updateMutation.isPending || 
                     deleteMutation.isPending || toggleStatusMutation.isPending

  return {
    createMutation,
    updateMutation,
    deleteMutation,
    toggleStatusMutation,
    addCustomerMutation,
    removeCustomerMutation,
    isMutating
  }
}
