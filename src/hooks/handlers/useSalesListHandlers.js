// src/hooks/handlers/useSalesListHandlers.js
import { useCallback } from 'react'
import { supabase } from '@lib/supabase'

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
  showReceiptModal,
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
}) => {

  const openReceipt = useCallback(async (sale) => {
    console.log('📌 Abrindo recibo para venda:', sale)
    setReceiptSale(sale)
    setShowReceiptModal(true)
    setReceiptItems([])
    
    if (sale?.id) {
      setIsLoadingReceiptItems(true)
      try {
        const numericSaleId = Number(sale.id)
        console.log('🔍 Buscando itens para saleId:', numericSaleId)
        
        const { data, error } = await supabase
          .from('sale_items')
          .select('*')
          .eq('sale_id', numericSaleId)
        
        console.log('📦 Resposta do Supabase:', { data, error })
        
        if (error) throw error
        
        setReceiptItems(data || [])
        console.log('✅ Itens carregados:', data?.length || 0)
      } catch (error) {
        console.error('❌ Erro ao carregar itens:', error)
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

  const viewSaleDetails = useCallback((sale) => {
    setSelectedSale(sale)
    setShowDetailsModal(true)
    logComponentAction('VIEW_SALE_DETAILS', sale.id, { sale_number: sale.sale_number })
  }, [setSelectedSale, setShowDetailsModal, logComponentAction])

  const closeDetailsModal = useCallback(() => {
    setShowDetailsModal(false)
    setSelectedSale(null)
  }, [setShowDetailsModal, setSelectedSale])

  const openCancelModal = useCallback((sale) => {
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

  const handleCancelWithApproval = useCallback((approvalData) => {
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

  const isCancelActionDisabled = useCallback((row) => {
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