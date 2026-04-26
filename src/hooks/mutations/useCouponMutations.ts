import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSystemLogs } from '@hooks/system/useSystemLogs'
import * as couponService from '@services/coupon/couponService'

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
  created_at: string | null
  created_by: string | null
  updated_at: string | null
  updated_by: string | null
  deleted_at: string | null
  deleted_by: string | null
}

// Baseado em: public.customers
interface Customer {
  id: number
  name: string
  email: string
  phone: string
  [key: string]: unknown
}

interface CouponData {
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

interface Profile {
  id: string
  [key: string]: unknown
}

interface UseCouponMutationsReturn {
  createMutation: ReturnType<typeof useMutation>
  updateMutation: ReturnType<typeof useMutation>
  deleteMutation: ReturnType<typeof useMutation>
  toggleStatusMutation: ReturnType<typeof useMutation>
  addCustomerMutation: ReturnType<typeof useMutation>
  removeCustomerMutation: ReturnType<typeof useMutation>
  isMutating: boolean
}

interface CouponMutationsCallbacks {
  onSuccess?: (coupon: Coupon, action: string) => void
  onError?: (error: Error) => void
}

export const useCouponMutations = (profile: Profile | null, callbacks?: CouponMutationsCallbacks): UseCouponMutationsReturn => {
  const queryClient = useQueryClient()
  const { logCreate, logUpdate, logDelete, logError } = useSystemLogs()
  const { onSuccess, onError } = callbacks || {}

  const createMutation = useMutation({
    mutationFn: ({ couponData, allowedCustomers }: { couponData: CouponData; allowedCustomers: number[] }) =>
      couponService.createCoupon(couponData, allowedCustomers, profile),
    onSuccess: async (coupon: Coupon) => {
      await logCreate('coupon', coupon.id.toString(), coupon)
      queryClient.invalidateQueries({ queryKey: ['coupons'] })
      onSuccess?.(coupon, 'create')
    },
    onError: async (error: Error) => {
      await logError('coupon', error, { action: 'create' })
      onError?.(error)
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, couponData, allowedCustomers }: { id: number; couponData: CouponData; allowedCustomers: number[] }) =>
      couponService.updateCoupon(id, couponData, allowedCustomers, profile),
    onSuccess: async (coupon: Coupon) => {
      await logUpdate('coupon', coupon.id.toString(), null, coupon)
      queryClient.invalidateQueries({ queryKey: ['coupons'] })
      onSuccess?.(coupon, 'update')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => couponService.deleteCoupon(id),
    onSuccess: async (_: unknown, id: number) => {
      await logDelete('coupon', id.toString(), {})
      queryClient.invalidateQueries({ queryKey: ['coupons'] })
    },
  })

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, currentStatus }: { id: number; currentStatus: boolean }) =>
      couponService.toggleCouponStatus(id, currentStatus, profile),
    onSuccess: async (coupon: Coupon) => {
      await logUpdate('coupon', coupon.id.toString(), { is_active: !coupon.is_active }, coupon)
      queryClient.invalidateQueries({ queryKey: ['coupons'] })
      onSuccess?.(coupon, 'toggle')
    },
  })

  const addCustomerMutation = useMutation({
    mutationFn: ({ couponId, customer }: { couponId: number; customer: Customer }) =>
      couponService.addAllowedCustomer(couponId, customer),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allowed-customers'] })
    },
  })

  const removeCustomerMutation = useMutation({
    mutationFn: ({ couponId, customerId }: { couponId: number; customerId: number }) =>
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