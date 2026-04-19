// Budgets.jsx - Versão atualizada com cards para mobile
import React, { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Phone, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Printer, 
  RefreshCw, 
  Plus, 
  Eye, 
  Check, 
  AlertTriangle, 
  Search,
  Grid,
  List
} from '../lib/icons'
import { useAuth } from '../contexts/AuthContext'
import FeedbackMessage from '../components/ui/FeedbackMessage'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import DataLoadingSkeleton from '../components/ui/DataLoadingSkeleton'
import DataEmptyState from '../components/ui/DataEmptyState'
import DataTable from '../components/ui/DataTable'
import DataCards from '../components/ui/DataCards'
import BudgetCard from '../components/budget/BudgetCard'
import Badge from '../components/Badge'
import useSystemLogs from '../hooks/useSystemLogs'
import { formatCurrency, formatDate } from '../utils/formatters'
import { useNetworkStatus } from '../hooks/useNetworkStatus'
import useMediaQuery from '../hooks/useMediaQuery'

import * as budgetService from '../services/budgetService'

import PageHeader from '../components/ui/PageHeader'
import BudgetCreator from '../components/budget/BudgetCreator'
import QuickCustomerForm from '../components/sales/pdv/QuickCustomerForm'
import CouponSelector from '../components/sales/pdv/CouponSelector'
import ConfirmModal from '../components/ui/ConfirmModal'

// ============= Componente Principal =============
const Budgets = () => {
  const { profile } = useAuth()
  const { logCreate, logAction, logError } = useSystemLogs()
  const queryClient = useQueryClient()
  const { isOnline } = useNetworkStatus()
  const isMobile = useMediaQuery('(max-width: 768px)')
  
  const [mode, setMode] = useState('list')
  const [viewMode, setViewMode] = useState('auto') // 'auto', 'cards', 'table'
  
  // Estados para criação
  const [cart, setCart] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [categories, setCategories] = useState([])
  const [customer, setCustomer] = useState(null)
  const [customerPhone, setCustomerPhone] = useState('')
  const [coupon, setCoupon] = useState(null)
  const [couponCode, setCouponCode] = useState('')
  const [couponError, setCouponError] = useState('')
  const [discount, setDiscount] = useState(0)
  const [notes, setNotes] = useState('')
  const [validUntil, setValidUntil] = useState('')
  
  // Estados para lista
  const [searchTermList, setSearchTermList] = useState('')
  const [filters, setFilters] = useState({})
  const [selectedBudget, setSelectedBudget] = useState(null)
  const [budgetItems, setBudgetItems] = useState([])
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showConvertModal, setShowConvertModal] = useState(false)
  
  // Modais de confirmação
  const [showApproveConfirm, setShowApproveConfirm] = useState(false)
  const [showRejectConfirm, setShowRejectConfirm] = useState(false)
  const [budgetToAction, setBudgetToAction] = useState(null)
  
  // Modais
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [showQuickCustomerModal, setShowQuickCustomerModal] = useState(false)
  const [showCouponModal, setShowCouponModal] = useState(false)
  const [showClearCartConfirm, setShowClearCartConfirm] = useState(false)
  const [quickCustomerForm, setQuickCustomerForm] = useState({ name: '', phone: '', email: '' })
  const [quickCustomerErrors, setQuickCustomerErrors] = useState({})
  const [feedback, setFeedback] = useState({ show: false, type: 'success', message: '' })
  
  const searchInputRef = useRef(null)

  // Determinar modo de visualização efetivo
  const effectiveViewMode = viewMode === 'auto' 
    ? (isMobile ? 'cards' : 'table')
    : viewMode

  // ============= Queries =============
  const { 
    data: budgets = [], 
    isLoading: loadingBudgets,
    refetch: refetchBudgets
  } = useQuery({
    queryKey: ['budgets', { searchTerm: searchTermList, filters }],
    queryFn: () => budgetService.fetchBudgets(searchTermList, filters),
    enabled: mode === 'list',
  })

  const { 
    data: products = [], 
    isLoading: loadingProducts,
    refetch: refetchProducts 
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

  // ============= Mutations =============
  const searchCustomerMutation = useMutation({
    mutationFn: budgetService.searchCustomerByPhone,
    onSuccess: (data) => {
      if (data) { 
        setCustomer(data)
        showFeedback('success', `Cliente encontrado: ${data.name}`)
        setShowCustomerModal(false) 
      } else { 
        setQuickCustomerForm({ name: '', phone: customerPhone, email: '' })
        setShowCustomerModal(false)
        setShowQuickCustomerModal(true) 
      }
    },
    onError: (error) => showFeedback('error', 'Erro ao buscar cliente: ' + error.message)
  })

  const createCustomerMutation = useMutation({
    mutationFn: budgetService.createCustomer,
    onSuccess: async (data) => {
      setCustomer(data)
      await logCreate('customer', data.id, { name: data.name, phone: data.phone })
      showFeedback('success', `Cliente ${data.name} cadastrado!`)
      setShowQuickCustomerModal(false)
    },
    onError: (error) => showFeedback('error', 'Erro ao cadastrar cliente: ' + error.message)
  })

  const validateCouponMutation = useMutation({
    mutationFn: ({ code, customerId, cartSubtotal }) => 
      budgetService.validateCoupon(code, customerId, cartSubtotal),
    onSuccess: (data) => {
      setCoupon(data.coupon)
      setCouponCode(data.coupon.code)
      setDiscount(data.discountValue)
      setCouponError('')
      setShowCouponModal(false)
      showFeedback('success', `Cupom ${data.coupon.code} aplicado! Desconto: ${formatCurrency(data.discountValue)}`)
    },
    onError: (error) => setCouponError(error.message)
  })

  const createBudgetMutation = useMutation({
    mutationFn: ({ cart, customer, coupon, discount, notes, validUntil }) => 
      budgetService.createBudget(cart, customer, coupon, discount, profile, notes, validUntil),
    onSuccess: async (budget) => {
      await logCreate('budget', budget.id, { 
        budget_number: budget.budget_number, 
        total_amount: budget.total_amount, 
        discount: budget.discount_amount, 
        final_amount: budget.final_amount 
      })
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      showFeedback('success', `Orçamento #${budget.budget_number} criado com sucesso!`)
      setCart([])
      setCustomer(null)
      setCustomerPhone('')
      setCoupon(null)
      setCouponCode('')
      setDiscount(0)
      setNotes('')
      setValidUntil('')
      setMode('list')
    },
    onError: async (error) => { 
      showFeedback('error', 'Erro ao criar orçamento: ' + error.message)
      await logError('budget', error, { action: 'create' }) 
    }
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => budgetService.updateBudgetStatus(id, status, profile),
    onSuccess: async (data) => {
      await logAction({ 
        action: 'UPDATE_BUDGET_STATUS', 
        entityType: 'budget', 
        entityId: data.id, 
        details: { new_status: data.status } 
      })
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      showFeedback('success', `Orçamento ${data.status === 'approved' ? 'aprovado' : 'rejeitado'}!`)
      setShowApproveConfirm(false)
      setShowRejectConfirm(false)
      setBudgetToAction(null)
    },
    onError: (error) => showFeedback('error', 'Erro ao atualizar status: ' + error.message)
  })

  const convertToSaleMutation = useMutation({
    mutationFn: ({ budget, budgetItems }) => 
      budgetService.convertBudgetToSale(budget, budgetItems, profile),
    onSuccess: async (sale) => {
      await logCreate('sale', sale.id, { 
        sale_number: sale.sale_number, 
        total_amount: sale.total_amount, 
        final_amount: sale.final_amount, 
        converted_from_budget: selectedBudget?.id 
      })
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      queryClient.invalidateQueries({ queryKey: ['products-active'] })
      showFeedback('success', `Orçamento convertido em venda #${sale.sale_number}!`)
      setShowConvertModal(false)
      setShowDetailsModal(false)
      setSelectedBudget(null)
    },
    onError: async (error) => { 
      showFeedback('error', 'Erro ao converter orçamento: ' + error.message)
      await logError('sale', error, { action: 'convert_budget' }) 
    }
  })

  // ============= Efeitos =============
  useEffect(() => { 
    if (mode === 'create' && products.length > 0) {
      setCategories([...new Set(products.map(p => p.category).filter(Boolean))])
    }
  }, [products, mode])

  // ============= Handlers =============
  const showFeedback = (type, message) => { 
    setFeedback({ show: true, type, message })
    setTimeout(() => setFeedback({ show: false, type: 'success', message: '' }), 3000) 
  }

  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id)
    if (existing) {
      updateCartItemQuantity(product.id, existing.quantity + 1)
    } else { 
      setCart([...cart, { 
        id: product.id, 
        name: product.name, 
        code: product.code, 
        price: product.price, 
        quantity: 1, 
        total: product.price, 
        unit: product.unit, 
        stock: product.stock_quantity 
      }])
      logAction({ 
        action: 'ADD_TO_BUDGET', 
        entityType: 'budget', 
        details: { product_name: product.name } 
      })
    }
  }

  const updateCartItemQuantity = (productId, newQuantity) => {
    const product = products.find(p => p.id === productId)
    if (!product) return
    
    if (newQuantity > product.stock_quantity) { 
      showFeedback('error', `Estoque insuficiente! Disponível: ${product.stock_quantity}`)
      return 
    }
    
    if (newQuantity <= 0) { 
      removeFromCart(productId)
      return 
    }
    
    setCart(prev => prev.map(item => 
      item.id === productId 
        ? { ...item, quantity: newQuantity, total: newQuantity * item.price } 
        : item
    ))
  }

  const removeFromCart = (productId) => 
    setCart(prev => prev.filter(item => item.id !== productId))

  const handleClearCart = () => { 
    if (cart.length === 0) return
    setShowClearCartConfirm(true) 
  }

  const confirmClearCart = () => { 
    setCart([])
    setShowClearCartConfirm(false)
    showFeedback('info', 'Carrinho limpo') 
  }

  const searchCustomer = () => { 
    if (!customerPhone || customerPhone.length < 10) { 
      showFeedback('error', 'Digite um telefone válido')
      return 
    }
    searchCustomerMutation.mutate(customerPhone) 
  }

  const quickRegisterCustomer = () => {
    const errors = {}
    if (!quickCustomerForm.name?.trim()) errors.name = 'Nome é obrigatório'
    if (!quickCustomerForm.phone?.trim() || quickCustomerForm.phone.length < 10) {
      errors.phone = 'Telefone inválido'
    }
    if (quickCustomerForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(quickCustomerForm.email)) {
      errors.email = 'E-mail inválido'
    }
    
    if (Object.keys(errors).length > 0) { 
      setQuickCustomerErrors(errors)
      return 
    }
    createCustomerMutation.mutate(quickCustomerForm)
  }

  const clearCustomer = () => { 
    setCustomer(null)
    setCustomerPhone('')
    if (coupon) removeCoupon()
    showFeedback('info', 'Cliente removido') 
  }

  const applyCoupon = (couponToValidate = null) => { 
    const code = couponToValidate?.code || couponCode
    if (!code) { 
      setCouponError('Digite o código do cupom')
      return 
    }
    if (!customer) { 
      setCouponError('Identifique um cliente para usar cupons')
      return 
    }
    const subtotal = cart.reduce((sum, item) => sum + item.total, 0)
    validateCouponMutation.mutate({ code, customerId: customer.id, cartSubtotal: subtotal }) 
  }

  const removeCoupon = () => { 
    setCoupon(null)
    setCouponCode('')
    setDiscount(0)
    showFeedback('info', 'Cupom removido') 
  }

  const handleCreateBudget = () => { 
    if (cart.length === 0) { 
      showFeedback('error', 'Adicione itens ao orçamento')
      return 
    }
    createBudgetMutation.mutate({ cart, customer, coupon, discount, notes, validUntil }) 
  }

  const handleViewDetails = async (budget) => {
    setSelectedBudget(budget)
    try { 
      const items = await budgetService.fetchBudgetItems(budget.id)
      setBudgetItems(items) 
    } catch (error) { 
      setBudgetItems([]) 
    }
    setShowDetailsModal(true)
  }

  const handleApproveClick = (budget) => {
    setBudgetToAction(budget)
    setShowApproveConfirm(true)
  }

  const handleRejectClick = (budget) => {
    setBudgetToAction(budget)
    setShowRejectConfirm(true)
  }

  const handleApprove = () => {
    if (!budgetToAction) return
    updateStatusMutation.mutate({ id: budgetToAction.id, status: 'approved' })
  }

  const handleReject = () => {
    if (!budgetToAction) return
    updateStatusMutation.mutate({ id: budgetToAction.id, status: 'rejected' })
  }

  const handleConvertToSale = () => { 
    if (!selectedBudget) return
    if (!isOnline) { 
      showFeedback('error', 'Não é possível converter orçamento offline')
      return 
    }
    convertToSaleMutation.mutate({ budget: selectedBudget, budgetItems }) 
  }

  // ============= Colunas da Tabela =============
  const getStatusBadge = (status) => {
    const configs = { 
      pending: { label: 'Pendente', variant: 'warning', icon: Clock }, 
      approved: { label: 'Aprovado', variant: 'success', icon: CheckCircle }, 
      rejected: { label: 'Rejeitado', variant: 'danger', icon: XCircle }, 
      expired: { label: 'Expirado', variant: 'secondary', icon: AlertTriangle }, 
      converted: { label: 'Convertido', variant: 'info', icon: Check } 
    }
    const config = configs[status] || configs.pending
    const Icon = config.icon
    return (
      <Badge variant={config.variant}>
        <Icon size={12} className="mr-1" />
        {config.label}
      </Badge>
    )
  }

  const columns = [
    {
      key: 'budget_number',
      header: 'Nº Orçamento',
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-gray-100">
            #{row.budget_number}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {formatDate(row.created_at)}
          </p>
        </div>
      )
    },
    {
      key: 'customer_name',
      header: 'Cliente',
      sortable: true,
      render: (row) => (
        <div>
          <p className="text-sm text-gray-900 dark:text-gray-100">
            {row.customer_name || 'Cliente não identificado'}
          </p>
          {row.customer_phone && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {row.customer_phone}
            </p>
          )}
        </div>
      )
    },
    {
      key: 'final_amount',
      header: 'Total',
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-semibold text-gray-900 dark:text-gray-100">
            {formatCurrency(row.final_amount)}
          </p>
          {row.discount_amount > 0 && (
            <p className="text-xs text-green-600 dark:text-green-400">
              -{formatCurrency(row.discount_amount)}
            </p>
          )}
        </div>
      )
    },
    {
      key: 'valid_until',
      header: 'Válido até',
      sortable: true,
      render: (row) => (
        <span
          className={`text-sm ${
            new Date(row.valid_until) < new Date() && row.status === 'pending'
              ? 'text-red-600 dark:text-red-400'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          {formatDate(row.valid_until)}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row) => getStatusBadge(row.status)
    }
  ]

  const actions = [
    {
      id: 'details',
      label: 'Ver detalhes',
      icon: Eye,
      onClick: handleViewDetails,
      className: 'text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30'
    },
    {
      id: 'approve',
      label: 'Aprovar',
      icon: CheckCircle,
      onClick: handleApproveClick,
      className: 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30',
      disabled: (row) => row.status !== 'pending'
    },
    {
      id: 'reject',
      label: 'Rejeitar',
      icon: XCircle,
      onClick: handleRejectClick,
      className: 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30',
      disabled: (row) => row.status !== 'pending'
    }
  ]

   const isMutating = searchCustomerMutation.isPending || 
                     createCustomerMutation.isPending || 
                     validateCouponMutation.isPending || 
                     createBudgetMutation.isPending

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

  const subtotal = cart.reduce((sum, item) => sum + item.total, 0)
  const total = subtotal - discount
 
  // Renderizar card para DataCards
  const renderBudgetCard = (budget) => (
    <BudgetCard
      budget={budget}
      onClick={handleViewDetails}
      onApprove={handleApproveClick}
      onReject={handleRejectClick}
    />
  )

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        {feedback.show && (
          <FeedbackMessage 
            type={feedback.type} 
            message={feedback.message} 
            onClose={() => setFeedback({ show: false })} 
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
          <>
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4 mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                <div className="flex-1 relative">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    placeholder="Buscar por número, cliente ou telefone..."
                    value={searchTermList}
                    onChange={(e) => setSearchTermList(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 placeholder-gray-400 dark:placeholder-gray-500"
                  />
                </div>
                
                <div className="flex gap-2">
                  <select
                    value={filters.status || 'all'}
                    onChange={(e) => setFilters({ status: e.target.value })}
                    className="flex-1 sm:flex-none px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg"
                  >
                    <option value="all">Todos</option>
                    <option value="pending">Pendentes</option>
                    <option value="approved">Aprovados</option>
                    <option value="rejected">Rejeitados</option>
                    <option value="expired">Expirados</option>
                    <option value="converted">Convertidos</option>
                  </select>

                  {/* Toggle de visualização */}
                  <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
                    <button
                      onClick={() => setViewMode('cards')}
                      className={`p-2 ${
                        effectiveViewMode === 'cards'
                          ? 'bg-blue-500 text-white'
                          : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                      title="Visualizar em cards"
                    >
                      <Grid size={18} />
                    </button>
                    <button
                      onClick={() => setViewMode('table')}
                      className={`p-2 ${
                        effectiveViewMode === 'table'
                          ? 'bg-blue-500 text-white'
                          : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                      title="Visualizar em tabela"
                    >
                      <List size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {loadingBudgets && <DataLoadingSkeleton />}
            
            {!loadingBudgets && budgets.length === 0 && (
              <DataEmptyState
                title="Nenhum orçamento encontrado"
                description="Comece criando um novo orçamento para seus clientes"
                icon="file-text"
                action={{
                  label: "Criar Orçamento",
                  icon: <Plus size={18} />,
                  onClick: () => setMode('create')
                }}
              />
            )}
            
            {!loadingBudgets && budgets.length > 0 && (
              <>
                {effectiveViewMode === 'cards' ? (
                  <DataCards
                    data={budgets}
                    renderCard={renderBudgetCard}
                    keyExtractor={(budget) => budget.id}
                    columns={isMobile ? 1 : 2}
                    gap={4}
                    emptyMessage="Nenhum orçamento encontrado"
                  />
                ) : (
                  <DataTable
                    columns={columns}
                    data={budgets}
                    actions={actions}
                    onRowClick={handleViewDetails}
                    emptyMessage="Nenhum orçamento encontrado"
                    striped
                    hover
                    pagination
                    itemsPerPageOptions={[20, 50, 100]}
                    defaultItemsPerPage={20}
                    showTotalItems
                    
                    id="tabela-orcamentos"           // Persiste preferências do usuário
                    // searchable={true}                // Adiciona barra de busca
                    // searchPlaceholder="Buscar orçamento..."
                    // searchFields={['client_name', 'budget_number', 'status']}
                    exportable={true}                // Adiciona botão de exportar CSV
                    exportFilename="orcamentos.csv"
                    refreshable={true}               // Adiciona botão de atualizar
                    onRefresh={refetchBudgets}       // Função para recarregar dados
                    selectable={true}                // Permite selecionar múltiplas linhas
                    stickyHeader={true}              // Header fixo ao rolar
                    compact={false}                  // Modo compacto para mais densidade
                  />
                )}
              </>
            )}
          </>
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
              onUpdateQuantity={updateCartItemQuantity}
              onRemoveItem={removeFromCart}
              onClearCart={handleClearCart}
              customer={customer}
              onClearCustomer={clearCustomer}
              onShowCustomerModal={() => setShowCustomerModal(true)}
              coupon={coupon}
              onRemoveCoupon={removeCoupon}
              onShowCouponModal={() => setShowCouponModal(true)}
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

        {/* Modais - mantidos iguais ao original */}
        <Modal 
          isOpen={showCustomerModal} 
          onClose={() => setShowCustomerModal(false)} 
          title="Identificar Cliente" 
          size="sm"
        >
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <Phone size={24} className="text-blue-600 dark:text-blue-400 sm:size-28" />
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm sm:text-base">
                Digite o telefone do cliente
              </p>
            </div>
            <input
              type="tel"
              placeholder="(11) 99999-9999"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full px-4 py-2.5 sm:py-3 text-base sm:text-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-center placeholder-gray-400 dark:placeholder-gray-500"
              onKeyPress={(e) => e.key === 'Enter' && searchCustomer()}
              autoFocus
              disabled={searchCustomerMutation.isPending}
            />
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowCustomerModal(false)} 
                className="flex-1 order-2 sm:order-1"
              >
                Cancelar
              </Button>
              <Button 
                onClick={searchCustomer} 
                loading={searchCustomerMutation.isPending} 
                className="flex-1 order-1 sm:order-2"
              >
                Buscar
              </Button>
            </div>
          </div>
        </Modal>

        <QuickCustomerForm
          isOpen={showQuickCustomerModal}
          onClose={() => setShowQuickCustomerModal(false)}
          formData={quickCustomerForm}
          setFormData={setQuickCustomerForm}
          errors={quickCustomerErrors}
          onSubmit={quickRegisterCustomer}
          isSubmitting={createCustomerMutation.isPending}
        />

        <CouponSelector
          isOpen={showCouponModal}
          onClose={() => setShowCouponModal(false)}
          customer={customer}
          coupon={coupon}
          availableCoupons={availableCoupons}
          couponCode={couponCode}
          setCouponCode={setCouponCode}
          couponError={couponError}
          onApplyCoupon={applyCoupon}
          onRemoveCoupon={removeCoupon}
          isLoading={validateCouponMutation.isPending}
        />

        <ConfirmModal
          isOpen={showClearCartConfirm}
          onClose={() => setShowClearCartConfirm(false)}
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

        <Modal 
          isOpen={showDetailsModal} 
          onClose={() => setShowDetailsModal(false)} 
          title={`Orçamento #${selectedBudget?.budget_number || ''}`} 
          size="lg"
        >
          {selectedBudget && (
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 sm:p-4">
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-2">
                  CLIENTE
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-medium">
                    {selectedBudget.customer_name?.charAt(0) || 'C'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">
                      {selectedBudget.customer_name || 'Cliente não identificado'}
                    </p>
                    {selectedBudget.customer_phone && (
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        {selectedBudget.customer_phone}
                      </p>
                    )}
                    {selectedBudget.customer_email && (
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        {selectedBudget.customer_email}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-3 text-xs sm:text-sm">
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Data de Criação</p>
                  <p className="font-medium dark:text-white">
                    {formatDate(selectedBudget.created_at)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Válido até</p>
                  <p className={`font-medium ${
                    new Date(selectedBudget.valid_until) < new Date() && selectedBudget.status === 'pending' 
                      ? 'text-red-600 dark:text-red-400' 
                      : 'dark:text-white'
                  }`}>
                    {formatDate(selectedBudget.valid_until)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Status</p>
                  {getStatusBadge(selectedBudget.status)}
                </div>
              </div>

              {(selectedBudget.status === 'approved' || selectedBudget.status === 'rejected') && (
                <div className={`rounded-lg p-3 sm:p-4 border ${
                  selectedBudget.status === 'approved' 
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                }`}>
                  <p className={`text-xs font-medium mb-2 sm:mb-3 flex items-center gap-1 ${
                    selectedBudget.status === 'approved' 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {selectedBudget.status === 'approved' ? <CheckCircle size={14} /> : <XCircle size={14} />}
                    {selectedBudget.status === 'approved' ? 'INFORMAÇÕES DE APROVAÇÃO' : 'INFORMAÇÕES DE REJEIÇÃO'}
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">
                        {selectedBudget.status === 'approved' ? 'Aprovado por' : 'Rejeitado por'}
                      </p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {selectedBudget.approved_by_user?.full_name || 
                         selectedBudget.approved_by_user?.email || 'Sistema'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">
                        {selectedBudget.status === 'approved' ? 'Data de aprovação' : 'Data de rejeição'}
                      </p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {selectedBudget.approved_at ? formatDate(selectedBudget.approved_at) : '-'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {selectedBudget.status === 'converted' && (
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 sm:p-4 border border-purple-200 dark:border-purple-800">
                  <p className="text-xs text-purple-600 dark:text-purple-400 font-medium mb-2 sm:mb-3 flex items-center gap-1">
                    <Check size={14} />
                    INFORMAÇÕES DE CONVERSÃO
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">
                        Convertido para venda
                      </p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        #{selectedBudget.converted_sale_id || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">
                        Data de conversão
                      </p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {formatDate(selectedBudget.updated_at)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="text-xs text-gray-500 dark:text-gray-400 border-t dark:border-gray-700 pt-2 sm:pt-3">
                <p>
                  Orçamento criado por: {
                    selectedBudget.created_by_user?.full_name || 
                    selectedBudget.created_by_user?.email || 
                    'Sistema'
                  }
                </p>
              </div>

              {selectedBudget.notes && (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-2 sm:p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Observações
                  </p>
                  <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                    {selectedBudget.notes}
                  </p>
                </div>
              )}

              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">
                  ITENS
                </p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {budgetItems.length === 0 ? (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-4 text-sm">
                      Nenhum item encontrado
                    </p>
                  ) : (
                    budgetItems.map((item, i) => (
                      <div key={i} className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                        <div>
                          <span className="text-gray-700 dark:text-gray-300 text-sm">
                            {item.product_name}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                            x{item.quantity} {item.unit}
                          </span>
                        </div>
                        <span className="font-medium dark:text-white text-sm">
                          {formatCurrency(item.total_price)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="border-t dark:border-gray-700 pt-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
                  <span className="dark:text-white">
                    {formatCurrency(selectedBudget.total_amount)}
                  </span>
                </div>
                {selectedBudget.discount_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600 dark:text-green-400">
                      Desconto {selectedBudget.coupon_code && `(${selectedBudget.coupon_code})`}
                    </span>
                    <span className="text-green-600 dark:text-green-400">
                      -{formatCurrency(selectedBudget.discount_amount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-bold pt-2 border-t dark:border-gray-700 text-base">
                  <span className="dark:text-white">Total</span>
                  <span className="text-blue-600 dark:text-blue-400">
                    {formatCurrency(selectedBudget.final_amount)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-4 sm:mt-6 pt-4 border-t dark:border-gray-700">
            <Button 
              variant="outline" 
              onClick={() => setShowDetailsModal(false)} 
              className="order-3 sm:order-1 w-full sm:w-auto"
            >
              Fechar
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.print()} 
              className="order-2 w-full sm:w-auto"
            >
              <Printer size={16} className="mr-1" />
              Imprimir
            </Button>
            {selectedBudget?.status === 'pending' && (
              <>
                <Button 
                  variant="success" 
                  onClick={() => { 
                    setShowDetailsModal(false)
                    handleApproveClick(selectedBudget)
                  }} 
                  className="order-1 sm:order-3 w-full sm:w-auto"
                >
                  <CheckCircle size={16} className="mr-1" />
                  Aprovar
                </Button>
                <Button 
                  variant="danger" 
                  onClick={() => { 
                    setShowDetailsModal(false)
                    handleRejectClick(selectedBudget)
                  }} 
                  className="order-1 sm:order-4 w-full sm:w-auto"
                >
                  <XCircle size={16} className="mr-1" />
                  Rejeitar
                </Button>
              </>
            )}
            {selectedBudget?.status === 'approved' && (
              <Button 
                variant="success" 
                onClick={() => setShowConvertModal(true)} 
                className="order-1 sm:order-3 w-full sm:w-auto"
              >
                <Check size={16} className="mr-1" />
                Converter em Venda
              </Button>
            )}
          </div>
        </Modal>

        <ConfirmModal 
          isOpen={showApproveConfirm} 
          onClose={() => { 
            setShowApproveConfirm(false)
            setBudgetToAction(null) 
          }} 
          onConfirm={handleApprove} 
          title="Aprovar Orçamento" 
          message={
            <p className="dark:text-gray-300 text-sm sm:text-base">
              Tem certeza que deseja <strong>aprovar</strong> o orçamento #
              {budgetToAction?.budget_number}?
            </p>
          }
          confirmText="Aprovar" 
          cancelText="Cancelar" 
          variant="success" 
          loading={updateStatusMutation.isPending}
        />

        <ConfirmModal 
          isOpen={showRejectConfirm} 
          onClose={() => { 
            setShowRejectConfirm(false)
            setBudgetToAction(null) 
          }} 
          onConfirm={handleReject} 
          title="Rejeitar Orçamento" 
          message={
            <p className="dark:text-gray-300 text-sm sm:text-base">
              Tem certeza que deseja <strong>rejeitar</strong> o orçamento #
              {budgetToAction?.budget_number}?
            </p>
          }
          confirmText="Rejeitar" 
          cancelText="Cancelar" 
          variant="danger" 
          loading={updateStatusMutation.isPending}
        />

        <ConfirmModal 
          isOpen={showConvertModal} 
          onClose={() => setShowConvertModal(false)} 
          onConfirm={handleConvertToSale} 
          title="Converter em Venda" 
          message={
            <div>
              <p className="mb-2 dark:text-gray-300 text-sm sm:text-base">
                Deseja converter o orçamento #{selectedBudget?.budget_number} em uma venda?
              </p>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                O estoque será atualizado e o orçamento será marcado como convertido.
              </p>
            </div>
          }
          confirmText="Converter" 
          cancelText="Cancelar" 
          variant="success" 
          loading={convertToSaleMutation.isPending}
        />
      </div>
    </div>
  )
}

export default Budgets