// Budgets.jsx - Versão refatorada com componentização completa
import React, { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  Phone, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  Check, 
  AlertTriangle,
  RefreshCw,
  Plus
} from '../lib/icons'
import { useAuth } from '../contexts/AuthContext'
import FeedbackMessage from '../components/ui/FeedbackMessage'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import DataLoadingSkeleton from '../components/ui/DataLoadingSkeleton'
import PageHeader from '../components/ui/PageHeader'
import ConfirmModal from '../components/ui/ConfirmModal'
import QuickCustomerForm from '../components/sales/pdv/QuickCustomerForm'
import CouponSelector from '../components/sales/pdv/CouponSelector'

// Componentes refatorados
import BudgetListView from '../components/budget/BudgetListView'
import BudgetCreator from '../components/budget/BudgetCreator'
import BudgetDetailsModal from '../components/budget/BudgetDetailsModal'
import IdentifyCustomerModal from '../components/budget/IdentifyCustomerModal'

// Hooks customizados
import useBudgetMutations from '../hooks/useBudgetMutations'
import useBudgetCart from '../hooks/useBudgetCart'
import useBudgetCustomer from '../hooks/useBudgetCustomer'
import useBudgetCoupon from '../hooks/useBudgetCoupon'
import useBudgetModals from '../hooks/useBudgetModals'
import useFeedback from '../hooks/useFeedback'
import useMediaQuery from '../hooks/useMediaQuery'

// Services, utils e constants
import * as budgetService from '../services/budgetService'
import { formatCurrency } from '../utils/formatters'
import { 
  BUDGET_STATUS, 
  getBudgetStatusConfig, 
  calculateSubtotal, 
  calculateTotal 
} from '../utils/budgetUtils'
import { BUDGET_COLUMNS, BUDGET_ACTIONS } from '../constants/budgetConstants'

// ============= Componente Principal =============
const Budgets = () => {
  const { profile } = useAuth()
  const isMobile = useMediaQuery('(max-width: 768px)')
  const searchInputRef = useRef(null)
  
  // Estado local mínimo
  const [mode, setMode] = useState('list')
  const [viewMode, setViewMode] = useState('auto')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [categories, setCategories] = useState([])
  const [notes, setNotes] = useState('')
  const [validUntil, setValidUntil] = useState('')
  
  // Hooks customizados
  const feedback = useFeedback()
  const modals = useBudgetModals()
  
  const { 
    cart, 
    addToCart, 
    updateQuantity, 
    removeItem, 
    clearCart,
    subtotal 
  } = useBudgetCart()
  
  const { 
    customer, 
    customerPhone, 
    setCustomerPhone,
    searchCustomer, 
    createCustomer, 
    clearCustomer 
  } = useBudgetCustomer()
  
  const { 
    coupon, 
    couponCode, 
    setCouponCode,
    discount, 
    validateCoupon, 
    removeCoupon 
  } = useBudgetCoupon(customer, subtotal)
  
  const { 
    createBudget, 
    updateStatus, 
    convertToSale,
    isMutating 
  } = useBudgetMutations()
  
  // Queries
  const { 
    data: budgets = [], 
    isLoading: loadingBudgets,
    refetch: refetchBudgets
  } = useQuery({
    queryKey: ['budgets', { searchTerm, status: statusFilter }],
    queryFn: () => budgetService.fetchBudgets(searchTerm, statusFilter),
    enabled: mode === 'list',
  })

  const { 
    data: products = [], 
    isLoading: loadingProducts 
  } = useQuery({
    queryKey: ['products-active-budget'],
    queryFn: budgetService.fetchProducts,
    staleTime: 2 * 60 * 1000,
    enabled: mode === 'create',
  })

  const { data: availableCoupons = [] } = useQuery({
    queryKey: ['available-coupons-budget', customer?.id],
    queryFn: () => budgetService.fetchAvailableCoupons(customer?.id),
    enabled: mode === 'create' && !!customer,
  })

  // Efeitos
  useEffect(() => { 
    if (mode === 'create' && products.length > 0) {
      setCategories([...new Set(products.map(p => p.category).filter(Boolean))])
    }
  }, [products, mode])

  // Handlers
  const handleCreateBudget = () => {
    if (cart.length === 0) {
      feedback.showError('Adicione itens ao orçamento')
      return
    }
    
    createBudget.mutate(
      { cart, customer, coupon, discount, notes, validUntil },
      {
        onSuccess: () => {
          clearCart()
          clearCustomer()
          removeCoupon()
          setNotes('')
          setValidUntil('')
          setMode('list')
        }
      }
    )
  }

  const handleViewDetails = async (budget) => {
    modals.openDetails(budget)
    try {
      const items = await budgetService.fetchBudgetItems(budget.id)
      modals.setBudgetItems(items)
    } catch (error) {
      modals.setBudgetItems([])
    }
  }

  const handleApprove = (budget) => {
    updateStatus.mutate(
      { id: budget.id, status: BUDGET_STATUS.APPROVED },
      {
        onSuccess: () => {
          modals.closeAll()
        }
      }
    )
  }

  const handleReject = (budget) => {
    updateStatus.mutate(
      { id: budget.id, status: BUDGET_STATUS.REJECTED },
      {
        onSuccess: () => {
          modals.closeAll()
        }
      }
    )
  }

  const handleConvertToSale = () => {
    if (!modals.selectedBudget) return
    
    convertToSale.mutate(
      { budget: modals.selectedBudget, budgetItems: modals.budgetItems },
      {
        onSuccess: () => {
          modals.closeAll()
        }
      }
    )
  }

  const handleQuickRegisterCustomer = () => {
    const { form, errors } = modals.quickCustomer
    
    if (!form.name?.trim()) {
      modals.setQuickCustomerErrors({ name: 'Nome é obrigatório' })
      return
    }
    
    if (!form.phone?.trim() || form.phone.length < 10) {
      modals.setQuickCustomerErrors({ phone: 'Telefone inválido' })
      return
    }
    
    createCustomer.mutate(form, {
      onSuccess: () => {
        modals.closeQuickCustomer()
        modals.resetQuickCustomerForm()
      }
    })
  }

  const handleSearchCustomer = () => {
    if (!customerPhone || customerPhone.length < 10) {
      feedback.showError('Digite um telefone válido')
      return
    }
    
    searchCustomer.mutate(customerPhone, {
      onSuccess: (data) => {
        if (data) {
          modals.closeCustomer()
        } else {
          modals.closeCustomer()
          modals.openQuickCustomer({ phone: customerPhone })
        }
      }
    })
  }

  const handleApplyCoupon = (couponToValidate = null) => {
    const code = couponToValidate?.code || couponCode
    
    if (!code) {
      modals.setCouponError('Digite o código do cupom')
      return
    }
    
    if (!customer) {
      modals.setCouponError('Identifique um cliente para usar cupons')
      return
    }
    
    validateCoupon.mutate(
      { code, customerId: customer.id, cartSubtotal: subtotal },
      {
        onSuccess: () => {
          modals.closeCoupon()
          modals.setCouponError('')
        },
        onError: (error) => {
          modals.setCouponError(error.message)
        }
      }
    )
  }

  const handleClearCart = () => {
    if (cart.length === 0) return
    modals.openClearCartConfirm()
  }

  const confirmClearCart = () => {
    clearCart()
    modals.closeClearCartConfirm()
    feedback.showInfo('Carrinho limpo')
  }

  // Configuração das ações com handlers
  const actions = BUDGET_ACTIONS.map(action => {
    if (action.id === 'details') {
      return { ...action, onClick: handleViewDetails }
    }
    if (action.id === 'approve') {
      return { ...action, onClick: modals.openApproveConfirm }
    }
    if (action.id === 'reject') {
      return { ...action, onClick: modals.openRejectConfirm }
    }
    return action
  })

  // Configuração das colunas
  const columns = BUDGET_COLUMNS.map(col => {
    if (col.key === 'status') {
      return {
        ...col,
        render: (row) => {
          const config = getBudgetStatusConfig(row.status)
          const Icon = config.icon || Clock
          return (
            <Badge variant={config.variant}>
              <Icon size={12} className="mr-1" />
              {config.label}
            </Badge>
          )
        }
      }
    }
    return col
  })

  // Header actions
  const headerActions = mode === 'list' ? [
    {
      label: 'Atualizar',
      icon: RefreshCw,
      onClick: () => refetchBudgets(),
      loading: loadingBudgets,
      variant: 'outline'
    },
    {
      label: 'Novo Orçamento',
      icon: Plus,
      onClick: () => setMode('create'),
      variant: 'primary'
    }
  ] : [
    {
      label: 'Cancelar',
      onClick: () => setMode('list'),
      disabled: isMutating,
      variant: 'outline'
    }
  ]

  const total = calculateTotal(subtotal, discount)
  const effectiveViewMode = viewMode === 'auto' 
    ? (isMobile ? 'cards' : 'table')
    : viewMode

  // Render
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        {feedback.show && (
          <FeedbackMessage 
            type={feedback.type} 
            message={feedback.message} 
            onClose={feedback.hide} 
          />
        )}
        
        <PageHeader
          title="Orçamentos"
          description={mode === 'list' 
            ? 'Gerencie os orçamentos solicitados pelos clientes' 
            : 'Crie um novo orçamento'
          }
          icon={FileText}
          actions={headerActions}
        />

        {mode === 'list' && (
          <BudgetListView
            budgets={budgets}
            loading={loadingBudgets}
            viewMode={effectiveViewMode}
            onViewModeChange={setViewMode}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            onRefresh={refetchBudgets}
            onCreateNew={() => setMode('create')}
            onViewDetails={handleViewDetails}
            columns={columns}
            actions={actions}
          />
        )}

        {mode === 'create' && (
          loadingProducts ? (
            <DataLoadingSkeleton />
          ) : (
            <BudgetCreator
              products={products}
              loading={loadingProducts}
              cart={cart}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              categories={categories}
              onAddToCart={addToCart}
              onUpdateQuantity={updateQuantity}
              onRemoveItem={removeItem}
              onClearCart={handleClearCart}
              customer={customer}
              onClearCustomer={clearCustomer}
              onShowCustomerModal={modals.openCustomer}
              coupon={coupon}
              onRemoveCoupon={removeCoupon}
              onShowCouponModal={modals.openCoupon}
              discount={discount}
              notes={notes}
              setNotes={setNotes}
              validUntil={validUntil}
              setValidUntil={setValidUntil}
              subtotal={subtotal}
              total={total}
              onCreateBudget={handleCreateBudget}
              isMutating={isMutating}
              searchInputRef={searchInputRef}
            />
          )
        )}

        {/* Modais */}
        <IdentifyCustomerModal
          isOpen={modals.showCustomer}
          onClose={modals.closeCustomer}
          phone={customerPhone}
          onPhoneChange={setCustomerPhone}
          onSearch={handleSearchCustomer}
          isLoading={searchCustomer.isPending}
        />

        <QuickCustomerForm
          isOpen={modals.showQuickCustomer}
          onClose={modals.closeQuickCustomer}
          formData={modals.quickCustomer.form}
          setFormData={modals.updateQuickCustomerForm}
          errors={modals.quickCustomer.errors}
          onSubmit={handleQuickRegisterCustomer}
          isSubmitting={createCustomer.isPending}
        />

        <CouponSelector
          isOpen={modals.showCoupon}
          onClose={modals.closeCoupon}
          customer={customer}
          coupon={coupon}
          availableCoupons={availableCoupons}
          couponCode={couponCode}
          setCouponCode={setCouponCode}
          couponError={modals.couponError}
          onApplyCoupon={handleApplyCoupon}
          onRemoveCoupon={removeCoupon}
          isLoading={validateCoupon.isPending}
        />

        <ConfirmModal
          isOpen={modals.showClearCartConfirm}
          onClose={modals.closeClearCartConfirm}
          onConfirm={confirmClearCart}
          title="Limpar Orçamento"
          message={
            <div>
              <p className="mb-2 dark:text-gray-300 text-sm sm:text-base">
                Tem certeza que deseja remover todos os itens do orçamento?
              </p>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                {cart.length} {cart.length === 1 ? 'item será' : 'itens serão'} removidos.
              </p>
            </div>
          }
          confirmText="Limpar"
          cancelText="Cancelar"
          variant="danger"
        />

        <BudgetDetailsModal
          isOpen={modals.showDetails}
          onClose={modals.closeDetails}
          budget={modals.selectedBudget}
          items={modals.budgetItems}
          onApprove={handleApprove}
          onReject={handleReject}
          onConvert={handleConvertToSale}
        />

        <ConfirmModal
          isOpen={modals.showApproveConfirm}
          onClose={modals.closeApproveConfirm}
          onConfirm={() => handleApprove(modals.selectedBudget)}
          title="Aprovar Orçamento"
          message={
            <p className="dark:text-gray-300 text-sm sm:text-base">
              Tem certeza que deseja <strong>aprovar</strong> o orçamento #
              {modals.selectedBudget?.budget_number}?
            </p>
          }
          confirmText="Aprovar"
          cancelText="Cancelar"
          variant="success"
          loading={updateStatus.isPending}
        />

        <ConfirmModal
          isOpen={modals.showRejectConfirm}
          onClose={modals.closeRejectConfirm}
          onConfirm={() => handleReject(modals.selectedBudget)}
          title="Rejeitar Orçamento"
          message={
            <p className="dark:text-gray-300 text-sm sm:text-base">
              Tem certeza que deseja <strong>rejeitar</strong> o orçamento #
              {modals.selectedBudget?.budget_number}?
            </p>
          }
          confirmText="Rejeitar"
          cancelText="Cancelar"
          variant="danger"
          loading={updateStatus.isPending}
        />

        <ConfirmModal
          isOpen={modals.showConvertConfirm}
          onClose={modals.closeConvertConfirm}
          onConfirm={handleConvertToSale}
          title="Converter em Venda"
          message={
            <div>
              <p className="mb-2 dark:text-gray-300 text-sm sm:text-base">
                Deseja converter o orçamento #{modals.selectedBudget?.budget_number} em uma venda?
              </p>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                O estoque será atualizado e o orçamento será marcado como convertido.
              </p>
            </div>
          }
          confirmText="Converter"
          cancelText="Cancelar"
          variant="success"
          loading={convertToSale.isPending}
        />
      </div>
    </div>
  )
}

// Componente Badge auxiliar (se não tiver global)
const Badge = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    danger: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    secondary: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
  }
  
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}

export default Budgets