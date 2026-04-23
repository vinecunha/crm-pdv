import { useState, useCallback } from 'react'

// Baseado em: public.budgets
interface Budget {
  id: number
  budget_number: number
  customer_id: number | null
  customer_name: string | null
  customer_phone: string | null
  customer_email: string | null
  total_amount: number
  discount_amount: number | null
  discount_percent: number | null
  coupon_code: string | null
  final_amount: number
  status: string | null
  valid_until: string | null
  notes: string | null
  created_by: string | null
  created_at: string | null
  updated_at: string | null
  approved_by: string | null
  approved_at: string | null
  converted_sale_id: number | null
}

// Baseado em: public.budget_items
interface BudgetItem {
  id: number
  budget_id: number | null
  product_id: number | null
  product_name: string
  product_code: string | null
  quantity: number
  unit_price: number
  total_price: number
  unit: string | null
  created_at: string | null
}

interface QuickCustomerForm {
  name: string
  phone: string
  email: string
}

interface QuickCustomerState {
  form: QuickCustomerForm
  errors: Record<string, string>
}

interface UseBudgetModalsReturn {
  showDetails: boolean
  showCustomer: boolean
  showQuickCustomer: boolean
  showCoupon: boolean
  showClearCartConfirm: boolean
  showApproveConfirm: boolean
  showRejectConfirm: boolean
  showConvertConfirm: boolean
  selectedBudget: Budget | null
  budgetItems: BudgetItem[]
  quickCustomer: QuickCustomerState
  couponError: string
  setBudgetItems: React.Dispatch<React.SetStateAction<BudgetItem[]>>
  setCouponError: React.Dispatch<React.SetStateAction<string>>
  setQuickCustomerErrors: (errors: Record<string, string>) => void
  openDetails: (budget: Budget) => void
  openCustomer: () => void
  openQuickCustomer: (initialData?: { phone?: string }) => void
  openCoupon: () => void
  openClearCartConfirm: () => void
  openApproveConfirm: (budget: Budget) => void
  openRejectConfirm: (budget: Budget) => void
  openConvertConfirm: (budget: Budget) => void
  closeDetails: () => void
  closeCustomer: () => void
  closeQuickCustomer: () => void
  closeCoupon: () => void
  closeClearCartConfirm: () => void
  closeApproveConfirm: () => void
  closeRejectConfirm: () => void
  closeConvertConfirm: () => void
  closeAll: () => void
  updateQuickCustomerForm: (formData: QuickCustomerForm | ((prev: QuickCustomerForm) => QuickCustomerForm)) => void
  resetQuickCustomerForm: () => void
}

export const useBudgetModals = (): UseBudgetModalsReturn => {
  const [showDetails, setShowDetails] = useState<boolean>(false)
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null)
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([])
  
  const [showCustomer, setShowCustomer] = useState<boolean>(false)
  
  const [showQuickCustomer, setShowQuickCustomer] = useState<boolean>(false)
  const [quickCustomer, setQuickCustomer] = useState<QuickCustomerState>({
    form: { name: '', phone: '', email: '' },
    errors: {}
  })
  
  const [showCoupon, setShowCoupon] = useState<boolean>(false)
  const [couponError, setCouponError] = useState<string>('')
  
  const [showClearCartConfirm, setShowClearCartConfirm] = useState<boolean>(false)
  const [showApproveConfirm, setShowApproveConfirm] = useState<boolean>(false)
  const [showRejectConfirm, setShowRejectConfirm] = useState<boolean>(false)
  const [showConvertConfirm, setShowConvertConfirm] = useState<boolean>(false)
  
  const openDetails = useCallback((budget: Budget) => {
    setSelectedBudget(budget)
    setShowDetails(true)
  }, [])
  
  const closeDetails = useCallback(() => {
    setShowDetails(false)
    setSelectedBudget(null)
    setBudgetItems([])
  }, [])
  
  const openCustomer = useCallback(() => setShowCustomer(true), [])
  const closeCustomer = useCallback(() => setShowCustomer(false), [])
  
  const openQuickCustomer = useCallback((initialData: { phone?: string } = {}) => {
    setQuickCustomer({
      form: { name: '', phone: initialData.phone || '', email: '' },
      errors: {}
    })
    setShowQuickCustomer(true)
  }, [])
  
  const closeQuickCustomer = useCallback(() => {
    setShowQuickCustomer(false)
  }, [])
  
  const updateQuickCustomerForm = useCallback((formData: QuickCustomerForm | ((prev: QuickCustomerForm) => QuickCustomerForm)) => {
    setQuickCustomer(prev => ({
      ...prev,
      form: typeof formData === 'function' 
        ? formData(prev.form) 
        : formData
    }))
  }, [])
  
  const setQuickCustomerErrors = useCallback((errors: Record<string, string>) => {
    setQuickCustomer(prev => ({ ...prev, errors }))
  }, [])
  
  const resetQuickCustomerForm = useCallback(() => {
    setQuickCustomer({
      form: { name: '', phone: '', email: '' },
      errors: {}
    })
  }, [])
  
  const openCoupon = useCallback(() => setShowCoupon(true), [])
  const closeCoupon = useCallback(() => {
    setShowCoupon(false)
    setCouponError('')
  }, [])
  
  const openClearCartConfirm = useCallback(() => setShowClearCartConfirm(true), [])
  const closeClearCartConfirm = useCallback(() => setShowClearCartConfirm(false), [])
  
  const openApproveConfirm = useCallback((budget: Budget) => {
    setSelectedBudget(budget)
    setShowApproveConfirm(true)
  }, [])
  
  const closeApproveConfirm = useCallback(() => {
    setShowApproveConfirm(false)
    setSelectedBudget(null)
  }, [])
  
  const openRejectConfirm = useCallback((budget: Budget) => {
    setSelectedBudget(budget)
    setShowRejectConfirm(true)
  }, [])
  
  const closeRejectConfirm = useCallback(() => {
    setShowRejectConfirm(false)
    setSelectedBudget(null)
  }, [])
  
  const openConvertConfirm = useCallback((budget: Budget) => {
    setSelectedBudget(budget)
    setShowConvertConfirm(true)
  }, [])
  
  const closeConvertConfirm = useCallback(() => {
    setShowConvertConfirm(false)
  }, [])
  
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
    setBudgetItems,
    setCouponError,
    setQuickCustomerErrors,
    openDetails,
    openCustomer,
    openQuickCustomer,
    openCoupon,
    openClearCartConfirm,
    openApproveConfirm,
    openRejectConfirm,
    openConvertConfirm,
    closeDetails,
    closeCustomer,
    closeQuickCustomer,
    closeCoupon,
    closeClearCartConfirm,
    closeApproveConfirm,
    closeRejectConfirm,
    closeConvertConfirm,
    closeAll,
    updateQuickCustomerForm,
    resetQuickCustomerForm,
  }
}