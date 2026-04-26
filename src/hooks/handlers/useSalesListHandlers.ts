import { useCallback } from 'react'
import { supabase } from '@lib/supabase'
import { logger } from '@utils/logger'

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

// Baseado em: public.sale_items
interface SaleItem {
  id: number
  sale_id: number
  product_id: number
  product_name: string
  product_code: string | null
  quantity: number
  unit_price: number
  total_price: number
  created_at: string | null
}

interface Profile {
  id: string
  [key: string]: unknown
}

interface CancelApprovalData {
  approvedBy: string
  [key: string]: unknown
}

interface MutationResult<T> {
  mutate: (data: T, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => void
  isPending: boolean
}

interface UseSalesListHandlersProps {
  profile: Profile | null
  canCancelDirectly: boolean
  canRequestCancellation: boolean
  selectedSale: Sale | null
  setSelectedSale: (sale: Sale | null) => void
  cancelReason: string
  setCancelReason: (reason: string) => void
  cancelNotes: string
  setCancelNotes: (notes: string) => void
  receiptSale: Sale | null
  setReceiptSale: (sale: Sale | null) => void
  receiptItems: SaleItem[]
  setReceiptItems: (items: SaleItem[]) => void
  setIsLoadingReceiptItems: (loading: boolean) => void
  showReceiptModal: boolean
  setShowReceiptModal: (show: boolean) => void
  showDetailsModal: boolean
  setShowDetailsModal: (show: boolean) => void
  showCancelModal: boolean
  setShowCancelModal: (show: boolean) => void
  cancelMutation: MutationResult<{
    saleNumber: string
    cancelledBy: string | undefined
    approvedBy: string
    reason: string
    notes: string
  }>
  refetch: () => void
  showFeedback: (type: 'success' | 'error' | 'info', message: string) => void
  logComponentAction: (action: string, entityId: number, details?: Record<string, unknown>) => void
  logAction: (params: { action: string; entityType: string; entityId: number; details?: Record<string, unknown> }) => Promise<boolean>
}

interface UseSalesListHandlersReturn {
  openReceipt: (sale: Sale) => Promise<void>
  closeReceiptModal: () => void
  viewSaleDetails: (sale: Sale) => void
  closeDetailsModal: () => void
  openCancelModal: (sale: Sale) => void
  closeCancelModal: () => void
  handleCancelWithApproval: (approvalData: CancelApprovalData) => void
  handleExport: () => void
  handleRefresh: () => void
  isCancelActionDisabled: (row: Sale) => boolean
}

export const useSalesListHandlers = ({
  profile,
  canCancelDirectly,
  canRequestCancellation,
  selectedSale,
  setSelectedSale,
  cancelReason,
  setCancelReason,
  cancelNotes,
  setCancelNotes,
  receiptSale,
  setReceiptSale,
  receiptItems,
  setReceiptItems,
  setIsLoadingReceiptItems,
  setShowReceiptModal,
  showDetailsModal,
  setShowDetailsModal,
  showCancelModal,
  setShowCancelModal,
  cancelMutation,
  refetch,
  showFeedback,
  logComponentAction,
  logAction
}: UseSalesListHandlersProps): UseSalesListHandlersReturn => {

  const openReceipt = useCallback(async (sale: Sale): Promise<void> => {
    logger.log('📌 Abrindo recibo para venda:', sale)
    setReceiptSale(sale)
    setShowReceiptModal(true)
    setReceiptItems([])
    
    if (sale?.id) {
      setIsLoadingReceiptItems(true)
      try {
        const numericSaleId = Number(sale.id)
        logger.log('🔍 Buscando itens para saleId:', numericSaleId)
        
        const { data, error } = await supabase
          .from('sale_items')
          .select('*')
          .eq('sale_id', numericSaleId)
        
        logger.log('📦 Resposta do Supabase:', { data, error })
        
        if (error) throw error
        
        setReceiptItems(data as SaleItem[] || [])
        logger.log('✅ Itens carregados:', data?.length || 0)
      } catch (error) {
        logger.error('❌ Erro ao carregar itens:', error)
        setReceiptItems([])
      } finally {
        setIsLoadingReceiptItems(false)
      }
    }
    
    logComponentAction('VIEW_RECEIPT', sale.id, { sale_number: sale.sale_number })
  }, [setReceiptSale, setShowReceiptModal, setReceiptItems, setIsLoadingReceiptItems, logComponentAction])

  const closeReceiptModal = useCallback(() => {
    setShowReceiptModal(false)
    setReceiptSale(null)
    setReceiptItems([])
  }, [setShowReceiptModal, setReceiptSale, setReceiptItems])

  const viewSaleDetails = useCallback((sale: Sale) => {
    setSelectedSale(sale)
    setShowDetailsModal(true)
    logComponentAction('VIEW_SALE_DETAILS', sale.id, { sale_number: sale.sale_number })
  }, [setSelectedSale, setShowDetailsModal, logComponentAction])

  const closeDetailsModal = useCallback(() => {
    setShowDetailsModal(false)
    setSelectedSale(null)
  }, [setShowDetailsModal, setSelectedSale])

  const openCancelModal = useCallback((sale: Sale) => {
    setSelectedSale(sale)
    setCancelReason('')
    setCancelNotes('')
    setShowCancelModal(true)
  }, [setSelectedSale, setCancelReason, setCancelNotes, setShowCancelModal])

  const closeCancelModal = useCallback(() => {
    if (!cancelMutation.isPending) {
      setShowCancelModal(false)
    }
  }, [cancelMutation.isPending, setShowCancelModal])

  const handleCancelWithApproval = useCallback((approvalData: CancelApprovalData) => {
    if (!selectedSale) return
    
    cancelMutation.mutate({
      saleNumber: selectedSale.sale_number,
      cancelledBy: profile?.id,
      approvedBy: approvalData.approvedBy,
      reason: cancelReason,
      notes: cancelNotes
    })
  }, [selectedSale, profile?.id, cancelReason, cancelNotes, cancelMutation])

  const handleExport = useCallback(() => {
    showFeedback('info', 'Exportação em desenvolvimento')
  }, [showFeedback])

  const handleRefresh = useCallback(() => {
    refetch()
  }, [refetch])

  const isCancelActionDisabled = useCallback((row: Sale): boolean => {
    return row.status !== 'completed'
  }, [])

  return {
    openReceipt,
    closeReceiptModal,
    viewSaleDetails,
    closeDetailsModal,
    openCancelModal,
    closeCancelModal,
    handleCancelWithApproval,
    handleExport,
    handleRefresh,
    isCancelActionDisabled
  }
}