import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSystemLogs } from '@hooks/system/useSystemLogs'
import * as saleService from '@services/sale/saleService'
import type { Sale, CartItem, Customer, Coupon, Profile, SaleItem } from '@/types'

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

interface SaleCallbacks {
  onSaleCreated?: (sale: Sale) => void
  onSaleError?: (error: Error) => void
  onOfflineSale?: (data: unknown) => void
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