import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSystemLogs } from '@hooks/system/useSystemLogs'
import * as saleService from '@services/sale/saleService'

// Baseado em: public.sales
interface Sale {
  id: number
  sale_number: string
  customer_id: number | null
  customer_name: string | null
  customer_phone: string | null
  total_amount: number
  discount_amount: number | null
  discount_percent: number | null
  coupon_code: string | null
  final_amount: number
  payment_method: string | null
  payment_status: string | null
  status: string | null
  notes: string | null
  created_at: string | null
  created_by: string | null
  updated_at: string | null
  cancelled_at: string | null
  cancelled_by: string | null
  cancellation_reason: string | null
  cancellation_notes: string | null
  approved_by: string | null
  created_by_name: string | null
}

interface CartItem {
  id: number
  name: string
  code: string | null
  quantity: number
  price: number
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

interface Coupon {
  id: number
  code: string
  discount_type: 'fixed' | 'percent'
  discount_value: number
  [key: string]: unknown
}

interface Profile {
  id: string
  [key: string]: unknown
}

interface SaleCallbacks {
  onSaleCreated?: (sale: Sale) => void
  onSaleError?: (error: Error) => void
  onOfflineSale?: (data: unknown) => void
}

interface CreateSaleParams {
  cart: CartItem[]
  customer: Customer | null
  coupon: Coupon | null
  discount: number
  paymentMethod: string
}

interface CancelSaleParams {
  saleNumber: string
  cancelledBy: string
  approvedBy: string
  reason: string
  notes: string
}

interface UseSaleMutationsReturn {
  createSaleMutation: ReturnType<typeof useMutation>
  cancelMutation: ReturnType<typeof useMutation>
  isPending: boolean
}

export const useSaleMutations = (
  profile: Profile | null,
  callbacks: SaleCallbacks = {}
): UseSaleMutationsReturn => {
  const queryClient = useQueryClient()
  const { logCreate, logError } = useSystemLogs()

  const {
    onSaleCreated,
    onSaleError,
    onOfflineSale
  } = callbacks

  const createSaleMutation = useMutation({
    mutationFn: ({ cart, customer, coupon, discount, paymentMethod }: CreateSaleParams) =>
      saleService.createSale(cart, customer, coupon, discount, paymentMethod, profile),
    onSuccess: async (sale: Sale) => {
      await logCreate('sale', sale.id.toString(), {
        sale_number: sale.sale_number,
        total_amount: sale.total_amount,
        discount: sale.discount_amount,
        final_amount: sale.final_amount,
        mode: 'online'
      })
      queryClient.invalidateQueries({ queryKey: ['products-active'] })
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      onSaleCreated?.(sale)
    },
    onError: async (error: Error) => {
      await logError('sale', error, { action: 'create_sale' })
      onSaleError?.(error)
    }
  })

  const cancelMutation = useMutation({
    mutationFn: ({ saleNumber, cancelledBy, approvedBy, reason, notes }: CancelSaleParams) =>
      saleService.cancelSaleWithApproval(saleNumber, cancelledBy, approvedBy, reason, notes),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] })
    },
  })

  return {
    createSaleMutation,
    cancelMutation,
    isPending: createSaleMutation.isPending || cancelMutation.isPending
  }
}