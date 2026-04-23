// src/hooks/pdv/usePDVModals.js
import { useState, useCallback } from 'react'

export const usePDVModals = () => {
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [showQuickCustomerModal, setShowQuickCustomerModal] = useState(false)
  const [showCouponModal, setShowCouponModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false)
  const [showClearCartConfirm, setShowClearCartConfirm] = useState(false)
  const [showReceiptModal, setShowReceiptModal] = useState(false)

  const openCustomerModal = useCallback(() => setShowCustomerModal(true), [])
  const closeCustomerModal = useCallback(() => setShowCustomerModal(false), [])
  
  const openQuickCustomerModal = useCallback(() => setShowQuickCustomerModal(true), [])
  const closeQuickCustomerModal = useCallback(() => setShowQuickCustomerModal(false), [])
  
  const openCouponModal = useCallback(() => setShowCouponModal(true), [])
  const closeCouponModal = useCallback(() => setShowCouponModal(false), [])
  
  const openPaymentModal = useCallback(() => setShowPaymentModal(true), [])
  const closePaymentModal = useCallback(() => setShowPaymentModal(false), [])
  
  const openShortcutsHelp = useCallback(() => setShowShortcutsHelp(true), [])
  const closeShortcutsHelp = useCallback(() => setShowShortcutsHelp(false), [])
  
  const openClearCartConfirm = useCallback(() => setShowClearCartConfirm(true), [])
  const closeClearCartConfirm = useCallback(() => setShowClearCartConfirm(false), [])

  const openReceiptModal = useCallback(() => setShowReceiptModal(true), [])
  const closeReceiptModal = useCallback(() => setShowReceiptModal(false), [])

  const closeAllModals = useCallback(() => {
    setShowCustomerModal(false)
    setShowQuickCustomerModal(false)
    setShowCouponModal(false)
    setShowPaymentModal(false)
    setShowShortcutsHelp(false)
    setShowClearCartConfirm(false)
    setShowReceiptModal(false) 
  }, [])

  const isAnyModalOpen = 
    showCustomerModal || 
    showQuickCustomerModal || 
    showCouponModal || 
    showPaymentModal || 
    showShortcutsHelp || 
    showClearCartConfirm

  return {
    // Estados
    showCustomerModal,
    showQuickCustomerModal,
    showCouponModal,
    showPaymentModal,
    showShortcutsHelp,
    showClearCartConfirm,
    isAnyModalOpen,
    showReceiptModal,
    setShowReceiptModal,
    
    // Setters (ADICIONADOS)
    setShowCustomerModal,
    setShowQuickCustomerModal,
    setShowCouponModal,        
    setShowPaymentModal,
    setShowShortcutsHelp,
    setShowClearCartConfirm,
    setShowReceiptModal,
    
    // Ações
    openCustomerModal,
    closeCustomerModal,
    openQuickCustomerModal,
    closeQuickCustomerModal,
    openCouponModal,
    closeCouponModal,
    openPaymentModal,
    closePaymentModal,
    openShortcutsHelp,
    closeShortcutsHelp,
    openClearCartConfirm,
    closeClearCartConfirm,
    closeAllModals,
    openReceiptModal,
    closeReceiptModal,
  }
}
