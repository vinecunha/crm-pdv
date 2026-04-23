import { useState, useCallback } from 'react'

interface UsePDVModalsReturn {
  showCustomerModal: boolean
  showQuickCustomerModal: boolean
  showCouponModal: boolean
  showPaymentModal: boolean
  showShortcutsHelp: boolean
  showClearCartConfirm: boolean
  isAnyModalOpen: boolean
  showReceiptModal: boolean
  setShowReceiptModal: React.Dispatch<React.SetStateAction<boolean>>
  setShowCustomerModal: React.Dispatch<React.SetStateAction<boolean>>
  setShowQuickCustomerModal: React.Dispatch<React.SetStateAction<boolean>>
  setShowCouponModal: React.Dispatch<React.SetStateAction<boolean>>
  setShowPaymentModal: React.Dispatch<React.SetStateAction<boolean>>
  setShowShortcutsHelp: React.Dispatch<React.SetStateAction<boolean>>
  setShowClearCartConfirm: React.Dispatch<React.SetStateAction<boolean>>
  openCustomerModal: () => void
  closeCustomerModal: () => void
  openQuickCustomerModal: () => void
  closeQuickCustomerModal: () => void
  openCouponModal: () => void
  closeCouponModal: () => void
  openPaymentModal: () => void
  closePaymentModal: () => void
  openShortcutsHelp: () => void
  closeShortcutsHelp: () => void
  openClearCartConfirm: () => void
  closeClearCartConfirm: () => void
  closeAllModals: () => void
  openReceiptModal: () => void
  closeReceiptModal: () => void
}

export const usePDVModals = (): UsePDVModalsReturn => {
  const [showCustomerModal, setShowCustomerModal] = useState<boolean>(false)
  const [showQuickCustomerModal, setShowQuickCustomerModal] = useState<boolean>(false)
  const [showCouponModal, setShowCouponModal] = useState<boolean>(false)
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false)
  const [showShortcutsHelp, setShowShortcutsHelp] = useState<boolean>(false)
  const [showClearCartConfirm, setShowClearCartConfirm] = useState<boolean>(false)
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false)

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
    showCustomerModal,
    showQuickCustomerModal,
    showCouponModal,
    showPaymentModal,
    showShortcutsHelp,
    showClearCartConfirm,
    isAnyModalOpen,
    showReceiptModal,
    setShowReceiptModal,
    setShowCustomerModal,
    setShowQuickCustomerModal,
    setShowCouponModal,
    setShowPaymentModal,
    setShowShortcutsHelp,
    setShowClearCartConfirm,
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