import React, { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Phone, FileText, CheckCircle, XCircle, Clock, Printer, RefreshCw, Plus, Eye, Check, AlertTriangle, Search } from '../lib/icons'
import { useAuth } from '../contexts/AuthContext'
import FeedbackMessage from '../components/ui/FeedbackMessage'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import DataLoadingSkeleton from '../components/ui/DataLoadingSkeleton'
import DataEmptyState from '../components/ui/DataEmptyState'
import DataTable from '../components/ui/DataTable'
import Badge from '../components/Badge'
import useSystemLogs from '../hooks/useSystemLogs'
import { formatCurrency, formatDate } from '../utils/formatters'
import { useNetworkStatus } from '../hooks/useNetworkStatus'

import * as budgetService from '../services/budgetService'

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
  
  const [mode, setMode] = useState('list')
  
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
      if (data) { setCustomer(data); showFeedback('success', `Cliente encontrado: ${data.name}`); setShowCustomerModal(false) }
      else { setQuickCustomerForm({ name: '', phone: customerPhone, email: '' }); setShowCustomerModal(false); setShowQuickCustomerModal(true) }
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
    mutationFn: ({ code, customerId, cartSubtotal }) => budgetService.validateCoupon(code, customerId, cartSubtotal),
    onSuccess: (data) => {
      setCoupon(data.coupon); setCouponCode(data.coupon.code); setDiscount(data.discountValue)
      setCouponError(''); setShowCouponModal(false)
      showFeedback('success', `Cupom ${data.coupon.code} aplicado! Desconto: ${formatCurrency(data.discountValue)}`)
    },
    onError: (error) => setCouponError(error.message)
  })

  const createBudgetMutation = useMutation({
    mutationFn: ({ cart, customer, coupon, discount, notes, validUntil }) => 
      budgetService.createBudget(cart, customer, coupon, discount, profile, notes, validUntil),
    onSuccess: async (budget) => {
      await logCreate('budget', budget.id, { budget_number: budget.budget_number, total_amount: budget.total_amount, discount: budget.discount_amount, final_amount: budget.final_amount })
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      showFeedback('success', `Orçamento #${budget.budget_number} criado com sucesso!`)
      setCart([]); setCustomer(null); setCustomerPhone(''); setCoupon(null); setCouponCode('')
      setDiscount(0); setNotes(''); setValidUntil(''); setMode('list')
    },
    onError: async (error) => { showFeedback('error', 'Erro ao criar orçamento: ' + error.message); await logError('budget', error, { action: 'create' }) }
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => budgetService.updateBudgetStatus(id, status, profile),
    onSuccess: async (data) => {
      await logAction({ action: 'UPDATE_BUDGET_STATUS', entityType: 'budget', entityId: data.id, details: { new_status: data.status } })
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      showFeedback('success', `Orçamento ${data.status === 'approved' ? 'aprovado' : 'rejeitado'}!`)
      setShowApproveConfirm(false)
      setShowRejectConfirm(false)
      setBudgetToAction(null)
    },
    onError: (error) => showFeedback('error', 'Erro ao atualizar status: ' + error.message)
  })

  const convertToSaleMutation = useMutation({
    mutationFn: ({ budget, budgetItems }) => budgetService.convertBudgetToSale(budget, budgetItems, profile),
    onSuccess: async (sale) => {
      await logCreate('sale', sale.id, { sale_number: sale.sale_number, total_amount: sale.total_amount, final_amount: sale.final_amount, converted_from_budget: selectedBudget?.id })
      queryClient.invalidateQueries({ queryKey: ['budgets'] }); queryClient.invalidateQueries({ queryKey: ['products-active'] })
      showFeedback('success', `Orçamento convertido em venda #${sale.sale_number}!`)
      setShowConvertModal(false); setShowDetailsModal(false); setSelectedBudget(null)
    },
    onError: async (error) => { showFeedback('error', 'Erro ao converter orçamento: ' + error.message); await logError('sale', error, { action: 'convert_budget' }) }
  })

  // ============= Efeitos =============
  useEffect(() => { if (mode === 'create' && products.length > 0) setCategories([...new Set(products.map(p => p.category).filter(Boolean))]) }, [products, mode])

  // ============= Handlers =============
  const showFeedback = (type, message) => { setFeedback({ show: true, type, message }); setTimeout(() => setFeedback({ show: false, type: 'success', message: '' }), 3000) }

  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id)
    if (existing) updateCartItemQuantity(product.id, existing.quantity + 1)
    else { setCart([...cart, { id: product.id, name: product.name, code: product.code, price: product.price, quantity: 1, total: product.price, unit: product.unit, stock: product.stock_quantity }]); logAction({ action: 'ADD_TO_BUDGET', entityType: 'budget', details: { product_name: product.name } }) }
  }

  const updateCartItemQuantity = (productId, newQuantity) => {
    const product = products.find(p => p.id === productId)
    if (!product) return
    if (newQuantity > product.stock_quantity) { showFeedback('error', `Estoque insuficiente! Disponível: ${product.stock_quantity}`); return }
    if (newQuantity <= 0) { removeFromCart(productId); return }
    setCart(prev => prev.map(item => item.id === productId ? { ...item, quantity: newQuantity, total: newQuantity * item.price } : item))
  }

  const removeFromCart = (productId) => setCart(prev => prev.filter(item => item.id !== productId))
  const handleClearCart = () => { if (cart.length === 0) return; setShowClearCartConfirm(true) }
  const confirmClearCart = () => { setCart([]); setShowClearCartConfirm(false); showFeedback('info', 'Carrinho limpo') }
  const searchCustomer = () => { if (!customerPhone || customerPhone.length < 10) { showFeedback('error', 'Digite um telefone válido'); return }; searchCustomerMutation.mutate(customerPhone) }

  const quickRegisterCustomer = () => {
    const errors = {}
    if (!quickCustomerForm.name?.trim()) errors.name = 'Nome é obrigatório'
    if (!quickCustomerForm.phone?.trim() || quickCustomerForm.phone.length < 10) errors.phone = 'Telefone inválido'
    if (quickCustomerForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(quickCustomerForm.email)) errors.email = 'E-mail inválido'
    if (Object.keys(errors).length > 0) { setQuickCustomerErrors(errors); return }
    createCustomerMutation.mutate(quickCustomerForm)
  }

  const clearCustomer = () => { setCustomer(null); setCustomerPhone(''); if (coupon) removeCoupon(); showFeedback('info', 'Cliente removido') }
  const applyCoupon = (couponToValidate = null) => { const code = couponToValidate?.code || couponCode; if (!code) { setCouponError('Digite o código do cupom'); return }; if (!customer) { setCouponError('Identifique um cliente para usar cupons'); return }; const subtotal = cart.reduce((sum, item) => sum + item.total, 0); validateCouponMutation.mutate({ code, customerId: customer.id, cartSubtotal: subtotal }) }
  const removeCoupon = () => { setCoupon(null); setCouponCode(''); setDiscount(0); showFeedback('info', 'Cupom removido') }
  const handleCreateBudget = () => { if (cart.length === 0) { showFeedback('error', 'Adicione itens ao orçamento'); return }; createBudgetMutation.mutate({ cart, customer, coupon, discount, notes, validUntil }) }

  const handleViewDetails = async (budget) => {
    setSelectedBudget(budget)
    try { const items = await budgetService.fetchBudgetItems(budget.id); setBudgetItems(items) } catch (error) { setBudgetItems([]) }
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
    if (!isOnline) { showFeedback('error', 'Não é possível converter orçamento offline'); return }
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
    return <Badge variant={config.variant}><Icon size={12} className="mr-1" />{config.label}</Badge>
  }

  const columns = [
    { key: 'budget_number', header: 'Nº Orçamento', sortable: true, render: (row) => <div><p className="font-medium text-gray-900">#{row.budget_number}</p><p className="text-xs text-gray-500">{formatDate(row.created_at)}</p></div> },
    { key: 'customer_name', header: 'Cliente', sortable: true, render: (row) => <div><p className="text-sm text-gray-900">{row.customer_name || 'Cliente não identificado'}</p>{row.customer_phone && <p className="text-xs text-gray-500">{row.customer_phone}</p>}</div> },
    { key: 'final_amount', header: 'Total', sortable: true, render: (row) => <div><p className="font-semibold text-gray-900">{formatCurrency(row.final_amount)}</p>{row.discount_amount > 0 && <p className="text-xs text-green-600">-{formatCurrency(row.discount_amount)}</p>}</div> },
    { key: 'valid_until', header: 'Válido até', sortable: true, render: (row) => <span className={`text-sm ${new Date(row.valid_until) < new Date() && row.status === 'pending' ? 'text-red-600' : 'text-gray-600'}`}>{formatDate(row.valid_until)}</span> },
    { key: 'status', header: 'Status', sortable: true, render: (row) => getStatusBadge(row.status) }
  ]

  const actions = [
    { label: 'Ver detalhes', icon: <Eye size={16} />, onClick: handleViewDetails, className: 'text-gray-500 hover:text-blue-600 hover:bg-blue-50' },
    { label: 'Aprovar', icon: <CheckCircle size={16} />, onClick: handleApproveClick, className: 'text-green-600 hover:bg-green-50', disabled: (row) => row.status !== 'pending' },
    { label: 'Rejeitar', icon: <XCircle size={16} />, onClick: handleRejectClick, className: 'text-red-600 hover:bg-red-50', disabled: (row) => row.status !== 'pending' }
  ]

  const subtotal = cart.reduce((sum, item) => sum + item.total, 0)
  const total = subtotal - discount
  const isMutating = searchCustomerMutation.isPending || createCustomerMutation.isPending || validateCouponMutation.isPending || createBudgetMutation.isPending

  // ============= Render =============
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {feedback.show && <FeedbackMessage type={feedback.type} message={feedback.message} onClose={() => setFeedback({ show: false })} />}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div><h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><FileText className="text-blue-600" />Orçamentos</h1><p className="text-gray-600 mt-1">{mode === 'list' ? 'Gerencie os orçamentos solicitados pelos clientes' : 'Crie um novo orçamento'}</p></div>
            <div className="flex gap-2">{mode === 'list' ? <><Button variant="outline" onClick={() => refetchBudgets()} loading={loadingBudgets} icon={RefreshCw}>Atualizar</Button><Button onClick={() => setMode('create')} icon={Plus}>Novo Orçamento</Button></> : <Button variant="outline" onClick={() => setMode('list')} disabled={isMutating}>Cancelar</Button>}</div>
          </div>
        </div>

        {mode === 'list' && (
          <>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="flex-1 relative"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Buscar por número, cliente ou telefone..." value={searchTermList} onChange={(e) => setSearchTermList(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
                <select value={filters.status || 'all'} onChange={(e) => setFilters({ status: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg text-sm"><option value="all">Todos</option><option value="pending">Pendentes</option><option value="approved">Aprovados</option><option value="rejected">Rejeitados</option><option value="expired">Expirados</option><option value="converted">Convertidos</option></select>
              </div>
            </div>
            {loadingBudgets && <DataLoadingSkeleton />}
            {!loadingBudgets && budgets.length === 0 && <DataEmptyState title="Nenhum orçamento encontrado" description="Comece criando um novo orçamento para seus clientes" icon="file-text" action={{ label: "Criar Orçamento", icon: <Plus size={18} />, onClick: () => setMode('create') }} />}
            {!loadingBudgets && budgets.length > 0 && <DataTable columns={columns} data={budgets} actions={actions} onRowClick={handleViewDetails} emptyMessage="Nenhum orçamento encontrado" striped hover pagination itemsPerPageOptions={[20, 50, 100]} defaultItemsPerPage={20} showTotalItems />}
          </>
        )}

        {mode === 'create' && (loadingProducts ? <DataLoadingSkeleton /> : <BudgetCreator products={products} loading={loadingProducts} cart={cart} searchTerm={searchTerm} setSearchTerm={setSearchTerm} selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} categories={categories} onAddToCart={addToCart} onUpdateQuantity={updateCartItemQuantity} onRemoveItem={removeFromCart} onClearCart={handleClearCart} customer={customer} onClearCustomer={clearCustomer} onShowCustomerModal={() => setShowCustomerModal(true)} coupon={coupon} onRemoveCoupon={removeCoupon} onShowCouponModal={() => setShowCouponModal(true)} discount={discount} notes={notes} setNotes={setNotes} validUntil={validUntil} setValidUntil={setValidUntil} subtotal={subtotal} total={total} onCreateBudget={handleCreateBudget} isMutating={isMutating} searchInputRef={searchInputRef} />)}

        <Modal isOpen={showCustomerModal} onClose={() => setShowCustomerModal(false)} title="Identificar Cliente" size="sm"><div className="space-y-4"><div className="text-center"><div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3"><Phone size={28} className="text-blue-600" /></div><p className="text-gray-600 mb-4">Digite o telefone do cliente</p></div><input type="tel" placeholder="(11) 99999-9999" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-lg text-center" onKeyPress={(e) => e.key === 'Enter' && searchCustomer()} autoFocus disabled={searchCustomerMutation.isPending} /><div className="flex gap-3"><Button variant="outline" onClick={() => setShowCustomerModal(false)} className="flex-1">Cancelar</Button><Button onClick={searchCustomer} loading={searchCustomerMutation.isPending} className="flex-1">Buscar</Button></div></div></Modal>
        <QuickCustomerForm isOpen={showQuickCustomerModal} onClose={() => setShowQuickCustomerModal(false)} formData={quickCustomerForm} setFormData={setQuickCustomerForm} errors={quickCustomerErrors} onSubmit={quickRegisterCustomer} isSubmitting={createCustomerMutation.isPending} />
        <CouponSelector isOpen={showCouponModal} onClose={() => setShowCouponModal(false)} customer={customer} coupon={coupon} availableCoupons={availableCoupons} couponCode={couponCode} setCouponCode={setCouponCode} couponError={couponError} onApplyCoupon={applyCoupon} onRemoveCoupon={removeCoupon} isLoading={validateCouponMutation.isPending} />
        <ConfirmModal isOpen={showClearCartConfirm} onClose={() => setShowClearCartConfirm(false)} onConfirm={confirmClearCart} title="Limpar Orçamento" message={<div><p className="mb-2">Tem certeza que deseja remover todos os itens do orçamento?</p><p className="text-sm text-gray-500">{cart.length} {cart.length === 1 ? 'item será' : 'itens serão'} removidos.</p></div>} confirmText="Limpar" cancelText="Cancelar" variant="danger" />
        
        {/* Modal de Detalhes */}
        <Modal isOpen={showDetailsModal} onClose={() => setShowDetailsModal(false)} title={`Orçamento #${selectedBudget?.budget_number || ''}`} size="lg">
          {selectedBudget && (
            <div className="space-y-4">
              {/* Informações do Cliente */}
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-xs text-blue-600 font-medium mb-2">CLIENTE</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium">
                    {selectedBudget.customer_name?.charAt(0) || 'C'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{selectedBudget.customer_name || 'Cliente não identificado'}</p>
                    {selectedBudget.customer_phone && <p className="text-sm text-gray-500">{selectedBudget.customer_phone}</p>}
                    {selectedBudget.customer_email && <p className="text-sm text-gray-500">{selectedBudget.customer_email}</p>}
                  </div>
                </div>
              </div>

              {/* Informações do Orçamento */}
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-gray-500">Data de Criação</p>
                  <p className="font-medium">{formatDate(selectedBudget.created_at)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Válido até</p>
                  <p className={`font-medium ${new Date(selectedBudget.valid_until) < new Date() && selectedBudget.status === 'pending' ? 'text-red-600' : ''}`}>
                    {formatDate(selectedBudget.valid_until)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Status</p>
                  {getStatusBadge(selectedBudget.status)}
                </div>
              </div>

              {/* ✅ INFORMAÇÕES DE APROVAÇÃO/REJEIÇÃO */}
              {(selectedBudget.status === 'approved' || selectedBudget.status === 'rejected') && (
                <div className={`rounded-lg p-4 border ${selectedBudget.status === 'approved' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <p className={`text-xs font-medium mb-3 flex items-center gap-1 ${selectedBudget.status === 'approved' ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedBudget.status === 'approved' ? <CheckCircle size={14} /> : <XCircle size={14} />}
                    {selectedBudget.status === 'approved' ? 'INFORMAÇÕES DE APROVAÇÃO' : 'INFORMAÇÕES DE REJEIÇÃO'}
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500 text-xs">
                        {selectedBudget.status === 'approved' ? 'Aprovado por' : 'Rejeitado por'}
                      </p>
                      <p className="font-medium text-gray-900">
                        {selectedBudget.approved_by_user?.full_name || selectedBudget.approved_by_user?.email || 'Sistema'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">
                        {selectedBudget.status === 'approved' ? 'Data de aprovação' : 'Data de rejeição'}
                      </p>
                      <p className="font-medium text-gray-900">
                        {selectedBudget.approved_at ? formatDate(selectedBudget.approved_at) : '-'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Informações de Conversão (se convertido) */}
              {selectedBudget.status === 'converted' && (
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <p className="text-xs text-purple-600 font-medium mb-3 flex items-center gap-1">
                    <Check size={14} />
                    INFORMAÇÕES DE CONVERSÃO
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500 text-xs">Convertido para venda</p>
                      <p className="font-medium text-gray-900">#{selectedBudget.converted_sale_id || '-'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Data de conversão</p>
                      <p className="font-medium text-gray-900">{formatDate(selectedBudget.updated_at)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Criado por */}
              <div className="text-xs text-gray-500 border-t pt-3">
                <p>Orçamento criado por: {selectedBudget.created_by_user?.full_name || selectedBudget.created_by_user?.email || 'Sistema'}</p>
              </div>

              {/* Observações */}
              {selectedBudget.notes && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Observações</p>
                  <p className="text-sm text-gray-700">{selectedBudget.notes}</p>
                </div>
              )}

              {/* Itens */}
              <div>
                <p className="text-xs text-gray-500 font-medium mb-2">ITENS</p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {budgetItems.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">Nenhum item encontrado</p>
                  ) : (
                    budgetItems.map((item, i) => (
                      <div key={i} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                        <div>
                          <span className="text-gray-700">{item.product_name}</span>
                          <span className="text-xs text-gray-500 ml-2">x{item.quantity} {item.unit}</span>
                        </div>
                        <span className="font-medium">{formatCurrency(item.total_price)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Totais */}
              <div className="border-t pt-3 space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span>{formatCurrency(selectedBudget.total_amount)}</span>
                </div>
                {selectedBudget.discount_amount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-green-600">
                      Desconto {selectedBudget.coupon_code && `(${selectedBudget.coupon_code})`}
                    </span>
                    <span className="text-green-600">-{formatCurrency(selectedBudget.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold pt-2 border-t">
                  <span>Total</span>
                  <span className="text-blue-600">{formatCurrency(selectedBudget.final_amount)}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowDetailsModal(false)}>Fechar</Button>
            <Button variant="outline" onClick={() => window.print()}><Printer size={16} className="mr-1" />Imprimir</Button>
            {selectedBudget?.status === 'pending' && (
              <>
                <Button variant="success" onClick={() => { setShowDetailsModal(false); handleApproveClick(selectedBudget); }}>
                  <CheckCircle size={16} className="mr-1" />Aprovar
                </Button>
                <Button variant="danger" onClick={() => { setShowDetailsModal(false); handleRejectClick(selectedBudget); }}>
                  <XCircle size={16} className="mr-1" />Rejeitar
                </Button>
              </>
            )}
            {selectedBudget?.status === 'approved' && (
              <Button variant="success" onClick={() => setShowConvertModal(true)}>
                <Check size={16} className="mr-1" />Converter em Venda
              </Button>
            )}
          </div>
        </Modal>
        
        {/* Modal de Confirmação - Aprovar */}
        <ConfirmModal 
          isOpen={showApproveConfirm} 
          onClose={() => { setShowApproveConfirm(false); setBudgetToAction(null) }} 
          onConfirm={handleApprove} 
          title="Aprovar Orçamento" 
          message={<p>Tem certeza que deseja <strong>aprovar</strong> o orçamento #{budgetToAction?.budget_number}?</p>}
          confirmText="Aprovar" 
          cancelText="Cancelar" 
          variant="success" 
          loading={updateStatusMutation.isPending}
        />

        {/* Modal de Confirmação - Rejeitar */}
        <ConfirmModal 
          isOpen={showRejectConfirm} 
          onClose={() => { setShowRejectConfirm(false); setBudgetToAction(null) }} 
          onConfirm={handleReject} 
          title="Rejeitar Orçamento" 
          message={<p>Tem certeza que deseja <strong>rejeitar</strong> o orçamento #{budgetToAction?.budget_number}?</p>}
          confirmText="Rejeitar" 
          cancelText="Cancelar" 
          variant="danger" 
          loading={updateStatusMutation.isPending}
        />

        {/* Modal de Confirmação - Converter em Venda */}
        <ConfirmModal 
          isOpen={showConvertModal} 
          onClose={() => setShowConvertModal(false)} 
          onConfirm={handleConvertToSale} 
          title="Converter em Venda" 
          message={<div><p className="mb-2">Deseja converter o orçamento #{selectedBudget?.budget_number} em uma venda?</p><p className="text-sm text-gray-500">O estoque será atualizado e o orçamento será marcado como convertido.</p></div>}
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