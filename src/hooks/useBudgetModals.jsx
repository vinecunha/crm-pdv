import { useState, useCallback } from 'react'
import { useMutation } from '@tanstack/react-query'


const useBudgetModals = () => {
  // Modal de detalhes
  const [showDetails, setShowDetails] = useState(false)
  const [selectedBudget, setSelectedBudget] = useState(null)
  const [budgetItems, setBudgetItems] = useState([])
  
  // Modal de cliente
  const [showCustomer, setShowCustomer] = useState(false)
  
  // Modal de cliente rápido
  const [showQuickCustomer, setShowQuickCustomer] = useState(false)
  const [quickCustomer, setQuickCustomer] = useState({
    form: { name: '', phone: '', email: '' },
    errors: {}
  })
  
  // Modal de cupom
  const [showCoupon, setShowCoupon] = useState(false)
  const [couponError, setCouponError] = useState('')
  
  // Modal de confirmação - limpar carrinho
  const [showClearCartConfirm, setShowClearCartConfirm] = useState(false)
  
  // Modal de confirmação - aprovar
  const [showApproveConfirm, setShowApproveConfirm] = useState(false)
  
  // Modal de confirmação - rejeitar
  const [showRejectConfirm, setShowRejectConfirm] = useState(false)
  
  // Modal de confirmação - converter
  const [showConvertConfirm, setShowConvertConfirm] = useState(false)
  
  // Abrir/fechar detalhes
  const openDetails = useCallback((budget) => {
    setSelectedBudget(budget)
    setShowDetails(true)
  }, [])
  
  const closeDetails = useCallback(() => {
    setShowDetails(false)
    setSelectedBudget(null)
    setBudgetItems([])
  }, [])
  
  // Cliente
  const openCustomer = useCallback(() => setShowCustomer(true), [])
  const closeCustomer = useCallback(() => setShowCustomer(false), [])
  
  // Cliente rápido
  const openQuickCustomer = useCallback((initialData = {}) => {
    setQuickCustomer({
      form: { name: '', phone: initialData.phone || '', email: '' },
      errors: {}
    })
    setShowQuickCustomer(true)
  }, [])
  
  const closeQuickCustomer = useCallback(() => {
    setShowQuickCustomer(false)
  }, [])
  
  const updateQuickCustomerForm = useCallback((formData) => {
    setQuickCustomer(prev => ({
      ...prev,
      form: typeof formData === 'function' 
        ? formData(prev.form) 
        : formData
    }))
  }, [])
  
  const setQuickCustomerErrors = useCallback((errors) => {
    setQuickCustomer(prev => ({ ...prev, errors }))
  }, [])
  
  const resetQuickCustomerForm = useCallback(() => {
    setQuickCustomer({
      form: { name: '', phone: '', email: '' },
      errors: {}
    })
  }, [])
  
  // Cupom
  const openCoupon = useCallback(() => setShowCoupon(true), [])
  const closeCoupon = useCallback(() => {
    setShowCoupon(false)
    setCouponError('')
  }, [])
  
  // Limpar carrinho
  const openClearCartConfirm = useCallback(() => setShowClearCartConfirm(true), [])
  const closeClearCartConfirm = useCallback(() => setShowClearCartConfirm(false), [])
  
  // Aprovar
  const openApproveConfirm = useCallback((budget) => {
    setSelectedBudget(budget)
    setShowApproveConfirm(true)
  }, [])
  
  const closeApproveConfirm = useCallback(() => {
    setShowApproveConfirm(false)
    setSelectedBudget(null)
  }, [])
  
  // Rejeitar
  const openRejectConfirm = useCallback((budget) => {
    setSelectedBudget(budget)
    setShowRejectConfirm(true)
  }, [])
  
  const closeRejectConfirm = useCallback(() => {
    setShowRejectConfirm(false)
    setSelectedBudget(null)
  }, [])
  
  // Converter
  const openConvertConfirm = useCallback((budget) => {
    setSelectedBudget(budget)
    setShowConvertConfirm(true)
  }, [])
  
  const closeConvertConfirm = useCallback(() => {
    setShowConvertConfirm(false)
  }, [])
  
  // Fechar todos
  const closeAll = useCallback(() => {
    setShowDetails(false)
    setShowCustomer(false)
    setShowQuickCustomer(false)
    setShowCoupon(false)
    setShowClearCartConfirm(false)
    setShowApproveConfirm(false)
    setShowRejectConfirm(false)
    setShowConvertConfirm(false)
  }, [])
  
  return {
    // Estados
    showDetails,
    showCustomer,
    showQuickCustomer,
    showCoupon,
    showClearCartConfirm,
    showApproveConfirm,
    showRejectConfirm,
    showConvertConfirm,
    selectedBudget,
    budgetItems,
    quickCustomer,
    couponError,
    
    // Setters
    setBudgetItems,
    setCouponError,
    setQuickCustomerErrors,
    
    // Openers
    openDetails,
    openCustomer,
    openQuickCustomer,
    openCoupon,
    openClearCartConfirm,
    openApproveConfirm,
    openRejectConfirm,
    openConvertConfirm,
    
    // Closers
    closeDetails,
    closeCustomer,
    closeQuickCustomer,
    closeCoupon,
    closeClearCartConfirm,
    closeApproveConfirm,
    closeRejectConfirm,
    closeConvertConfirm,
    closeAll,
    
    // Utils
    updateQuickCustomerForm,
    resetQuickCustomerForm,
  }
}

export default useBudgetModals