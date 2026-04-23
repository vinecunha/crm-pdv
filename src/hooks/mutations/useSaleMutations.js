// src/hooks/mutations/useSaleMutations.js
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSystemLogs } from '@hooks/system/useSystemLogs'
import * as saleService from '@services/sale/saleService'

export const useSaleMutations = (profile, callbacks = {}) => {
  const queryClient = useQueryClient()
  const { logCreate, logError } = useSystemLogs()

  const {
    onSaleCreated,
    onSaleError,
    onOfflineSale
  } = callbacks

  const createSaleMutation = useMutation({
    mutationFn: ({ cart, customer, coupon, discount, paymentMethod }) =>
      saleService.createSale(cart, customer, coupon, discount, paymentMethod, profile),
    onSuccess: async (sale) => {
      await logCreate('sale', sale.id, {
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
    onError: async (error) => {
      await logError('sale', error, { action: 'create_sale' })
      onSaleError?.(error)
    }
  })

  const cancelMutation = useMutation({
    mutationFn: ({ saleNumber, cancelledBy, approvedBy, reason, notes }) =>
      saleService.cancelSaleWithApproval(saleNumber, cancelledBy, approvedBy, reason, notes),
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['sales'] })
    },
  })

  return {
    createSaleMutation,
    cancelMutation,
    isPending: createSaleMutation.isPending || cancelMutation.isPending
  }
}
