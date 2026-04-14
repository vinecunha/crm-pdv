import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, ClipboardList } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import useSystemLogs from '../hooks/useSystemLogs'
import { sanitizeObject } from '../utils/sanitize'

import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import FeedbackMessage from '../components/ui/FeedbackMessage'
import DataLoadingSkeleton from '../components/ui/DataLoadingSkeleton'
import DataEmptyState from '../components/ui/DataEmptyState'
import DataFilters from '../components/ui/DataFilters'

import ProductForm from '../components/products/ProductForm'
import ProductEntryForm from '../components/products/ProductEntryForm'
import ProductDetailsModal from '../components/products/ProductDetailsModal'
import ProductDeleteModal from '../components/products/ProductDeleteModal'
import ProductTable from '../components/products/ProductTable'

// ============= Constantes =============
const units = [
  { value: 'UN', label: 'Unidade' }, { value: 'KG', label: 'Quilograma' },
  { value: 'G', label: 'Grama' }, { value: 'L', label: 'Litro' },
  { value: 'ML', label: 'Mililitro' }, { value: 'CX', label: 'Caixa' },
  { value: 'PC', label: 'Pacote' }, { value: 'M', label: 'Metro' }
]

const categories = [
  'Alimentos', 'Bebidas', 'Limpeza', 'Higiene', 'Eletrônicos',
  'Ferramentas', 'Vestuário', 'Papelaria', 'Moveis', 'Outros'
]

// ============= API Functions =============
const fetchProducts = async ({ queryKey }) => {
  const [, { canViewOnlyActive }] = queryKey
  
  let query = supabase.from('products').select('*').order('name', { ascending: true })
  if (canViewOnlyActive) query = query.eq('is_active', true)
  
  const { data, error } = await query
  if (error) throw error
  return data || []
}

const generateNextCode = async () => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('code, id')
      .not('code', 'is', null)
      .order('id', { ascending: false })
      .limit(1)

    if (error) throw error

    if (data && data.length > 0 && data[0].code) {
      const numericPart = data[0].code.replace(/\D/g, '')
      if (numericPart) {
        const nextNumber = parseInt(numericPart) + 1
        return nextNumber.toString().padStart(3, '0')
      }
    }
    
    return '001'
  } catch (error) {
    console.error('Erro ao gerar código:', error)
    return Date.now().toString().slice(-6)
  }
}

const createProduct = async ({ productData, profile }) => {
  const safeData = sanitizeObject(productData) // ✅ Sanitizar
  
  const { error } = await supabase.from('products').insert([{ ...safeData, created_by: profile?.id }])
  
  if (error) {
    if (error.message?.includes('duplicate key') || error.message?.includes('code')) {
      const newCode = await generateNextCode()
      const { error: retryError } = await supabase
        .from('products')
        .insert([{ ...safeData, code: newCode, created_by: profile?.id }])
      if (retryError) throw retryError
      return { ...safeData, code: newCode }
    }
    throw error
  }
  
  return safeData
}

const updateProduct = async ({ id, productData, profile }) => {
  const safeData = sanitizeObject(productData) // ✅ Sanitizar
  
  const { error } = await supabase
    .from('products')
    .update({ ...safeData, updated_by: profile?.id })
    .eq('id', id)
  
  if (error) throw error
  return { id, ...safeData }
}

const deleteProduct = async (id) => {
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw error
  return id
}

const createProductEntry = async ({ entryData, profile }) => {
  const safeData = sanitizeObject(entryData) // ✅ Sanitizar
  
  const { error } = await supabase
    .from('product_entries')
    .insert([{ ...safeData, created_by: profile?.id }])

  if (error) {
    let errorMessage = 'Erro ao registrar entrada'
    if (error.message?.includes('foreign key')) errorMessage = 'Produto não encontrado'
    else if (error.message?.includes('not-null')) errorMessage = 'Preencha todos os campos obrigatórios'
    else errorMessage = error.message
    throw new Error(errorMessage)
  }
  
  return safeData
}

const fetchProductDetails = async (productId) => {
  const [{ data: entries }, { data: movements }] = await Promise.all([
    supabase.from('product_entries').select('*').eq('product_id', productId).order('entry_date', { ascending: false }),
    supabase.from('stock_movements').select('*').eq('product_id', productId).order('created_at', { ascending: false }).limit(20)
  ])
  
  return { entries: entries || [], movements: movements || [] }
}

// ============= Componente Principal =============
const Products = () => {
  const { profile } = useAuth()
  const { logCreate, logUpdate, logDelete, logError, logAction } = useSystemLogs()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  // Estado local
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilters, setActiveFilters] = useState({})
  
  // Modais
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [viewingProductId, setViewingProductId] = useState(null)
  const [entryModalError, setEntryModalError] = useState(null)
  
  // Formulários
  const [productForm, setProductForm] = useState({
    code: '', name: '', description: '', category: '', unit: 'UN',
    price: '', min_stock: '', max_stock: '', location: '', brand: '', weight: '',
    is_active: true
  })
  
  const [entryForm, setEntryForm] = useState({
    invoice_number: '', invoice_series: '', supplier_name: '', supplier_cnpj: '',
    batch_number: '', manufacture_date: '', expiration_date: '',
    quantity: '', unit_cost: '', notes: ''
  })
  
  const [formErrors, setFormErrors] = useState({})
  const [feedback, setFeedback] = useState({ show: false, type: 'success', message: '' })
  
  // Permissões
  const isAdmin = profile?.role === 'admin'
  const isManager = profile?.role === 'gerente'
  const isOperator = profile?.role === 'operador'
  const canEdit = isAdmin || isManager
  const canManageStock = isAdmin || isManager
  const canViewAll = isAdmin || isManager
  const canViewOnlyActive = isOperator

  // Configuração dos filtros
  const filters = [
    { key: 'category', label: 'Categoria', type: 'select', options: categories.map(cat => ({ value: cat, label: cat })) },
    { key: 'unit', label: 'Unidade', type: 'select', options: units },
    { key: 'is_active', label: 'Status', type: 'select', options: [{ value: 'true', label: 'Ativo' }, { value: 'false', label: 'Inativo' }] },
    ...(canManageStock ? [{ key: 'low_stock', label: 'Estoque Baixo', type: 'select', options: [{ value: 'true', label: 'Apenas produtos com estoque baixo' }] }] : [])
  ]

  // ============= Queries =============
  const { 
    data: products = [], 
    isLoading,
    error: productsError,
    refetch: refetchProducts,
    isFetching
  } = useQuery({
    queryKey: ['products', { canViewOnlyActive }],
    queryFn: fetchProducts,
    staleTime: 2 * 60 * 1000, // 2 minutos
  })

  const { 
    data: productDetails,
    isLoading: isLoadingDetails
  } = useQuery({
    queryKey: ['product-details', viewingProductId],
    queryFn: () => fetchProductDetails(viewingProductId),
    enabled: !!viewingProductId,
  })

  // ============= Filtragem em Memória =============
  const filteredProducts = React.useMemo(() => {
    const productsArray = Array.isArray(products) ? products : []
    let filtered = [...productsArray]
    
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(p => 
        p.name?.toLowerCase().includes(search) || 
        p.code?.toLowerCase().includes(search)
      )
    }
    
    if (activeFilters.category) {
      filtered = filtered.filter(p => p.category === activeFilters.category)
    }
    
    if (activeFilters.unit) {
      filtered = filtered.filter(p => p.unit === activeFilters.unit)
    }
    
    if (activeFilters.is_active !== undefined && activeFilters.is_active !== '') {
      filtered = filtered.filter(p => p.is_active === (activeFilters.is_active === 'true'))
    }
    
    if (activeFilters.low_stock === 'true') {
      filtered = filtered.filter(p => p.stock_quantity <= p.min_stock)
    }
    
    return filtered
  }, [products, searchTerm, activeFilters])

  // ============= Mutations =============
  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: async (data) => {
      await logCreate('product', null, data)
      queryClient.invalidateQueries({ queryKey: ['products'] })
      showFeedback('success', 'Produto cadastrado com sucesso!')
      setIsProductModalOpen(false)
    },
    onError: async (error) => {
      showFeedback('error', error.message)
      await logError('product', error, { action: 'create' })
    }
  })

  const updateMutation = useMutation({
    mutationFn: updateProduct,
    onSuccess: async (data) => {
      await logUpdate('product', data.id, selectedProduct, data)
      queryClient.invalidateQueries({ queryKey: ['products'] })
      showFeedback('success', 'Produto atualizado com sucesso!')
      setIsProductModalOpen(false)
    },
    onError: async (error) => {
      showFeedback('error', error.message)
      await logError('product', error, { action: 'update' })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: async (id) => {
      await logDelete('product', id, selectedProduct)
      queryClient.invalidateQueries({ queryKey: ['products'] })
      showFeedback('success', 'Produto excluído com sucesso!')
      setIsDeleteModalOpen(false)
      setSelectedProduct(null)
    },
    onError: async (error) => {
      showFeedback('error', error.message)
      await logError('product', error, { action: 'delete' })
    }
  })

  const entryMutation = useMutation({
    mutationFn: createProductEntry,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      if (viewingProductId) {
        queryClient.invalidateQueries({ queryKey: ['product-details', viewingProductId] })
      }
      showFeedback('success', 'Entrada de estoque registrada com sucesso!')
      setIsEntryModalOpen(false)
      setEntryModalError(null)
    },
    onError: async (error) => {
      setEntryModalError(error.message)
      await logError('product_entry', error, { action: 'create_entry' })
    }
  })

  // ============= Efeitos =============
  useEffect(() => {
    logAction({ action: 'VIEW', entityType: 'product', details: { user_role: profile?.role } })
  }, [])

  // ============= Handlers =============
  const showFeedback = (type, message) => {
    setFeedback({ show: true, type, message })
    setTimeout(() => setFeedback({ show: false, type: 'success', message: '' }), 3000)
  }

  const handleOpenProductModal = async (product = null) => {
    if (product) {
      setSelectedProduct(product)
      setProductForm({
        code: product.code || '',
        name: product.name || '',
        description: product.description || '',
        category: product.category || '',
        unit: product.unit || 'UN',
        price: product.price || '',
        min_stock: product.min_stock || '',
        max_stock: product.max_stock || '',
        location: product.location || '',
        brand: product.brand || '',
        weight: product.weight || '',
        is_active: product.is_active !== false
      })
    } else {
      setSelectedProduct(null)
      const nextCode = await generateNextCode()
      setProductForm({
        code: nextCode,
        name: '',
        description: '',
        category: '',
        unit: 'UN',
        price: '',
        min_stock: '',
        max_stock: '',
        location: '',
        brand: '',
        weight: '',
        is_active: true
      })
    }
    setFormErrors({})
    setIsProductModalOpen(true)
  }

  const handleOpenEntryModal = (product) => {
    setSelectedProduct(product)
    setEntryForm({
      invoice_number: '',
      invoice_series: '',
      supplier_name: '',
      supplier_cnpj: '',
      batch_number: '',
      manufacture_date: '',
      expiration_date: '',
      quantity: '',
      unit_cost: product.cost_price || '',
      notes: ''
    })
    setFormErrors({})
    setEntryModalError(null)
    setIsEntryModalOpen(true)
  }

  const handleViewDetails = (product) => {
    setSelectedProduct(product)
    setViewingProductId(product.id)
    setIsViewModalOpen(true)
  }

  const validateProductForm = () => {
    const errors = {}
    if (!productForm.name?.trim()) errors.name = 'Nome é obrigatório'
    if (productForm.price && parseFloat(productForm.price) < 0) errors.price = 'Preço inválido'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const validateEntryForm = () => {
    const errors = {}
    if (!entryForm.invoice_number?.trim()) errors.invoice_number = 'Número da NF é obrigatório'
    if (!entryForm.quantity || parseFloat(entryForm.quantity) <= 0) errors.quantity = 'Quantidade deve ser maior que zero'
    if (!entryForm.unit_cost || parseFloat(entryForm.unit_cost) <= 0) errors.unit_cost = 'Valor unitário deve ser maior que zero'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleProductChange = (e) => {
    const { name, value, type, checked } = e.target
    setProductForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }))
  }

  const handleEntryChange = (e) => {
    const { name, value } = e.target
    setEntryForm(prev => ({ ...prev, [name]: value }))
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }))
  }

  const handleSubmitProduct = () => {
    if (!validateProductForm()) return
    
    const productData = {
      code: productForm.code,
      name: productForm.name,
      description: productForm.description || null,
      category: productForm.category || null,
      unit: productForm.unit,
      price: parseFloat(productForm.price) || 0,
      min_stock: parseFloat(productForm.min_stock) || 0,
      max_stock: parseFloat(productForm.max_stock) || 0,
      location: productForm.location || null,
      brand: productForm.brand || null,
      weight: productForm.weight ? parseFloat(productForm.weight) : null,
      is_active: productForm.is_active,
    }

    if (selectedProduct) {
      updateMutation.mutate({ 
        id: selectedProduct.id, 
        productData, 
        profile 
      })
    } else {
      createMutation.mutate({ 
        productData, 
        profile 
      })
    }
  }

  const handleSubmitEntry = () => {
    if (!validateEntryForm()) return
    
    const quantity = parseFloat(entryForm.quantity)
    const unitCost = parseFloat(entryForm.unit_cost)
    const totalCost = quantity * unitCost
    
    const entryData = {
      product_id: selectedProduct.id,
      invoice_number: entryForm.invoice_number,
      quantity: quantity,
      unit_cost: unitCost,
      total_cost: totalCost,
      invoice_series: entryForm.invoice_series || null,
      supplier_name: entryForm.supplier_name || null,
      supplier_cnpj: entryForm.supplier_cnpj?.replace(/\D/g, '') || null,
      batch_number: entryForm.batch_number || null,
      manufacture_date: entryForm.manufacture_date || null,
      expiration_date: entryForm.expiration_date || null,
      entry_date: new Date().toISOString().split('T')[0],
      notes: entryForm.notes || null,
    }

    entryMutation.mutate({ entryData, profile })
  }

  const handleDeleteProduct = () => {
    deleteMutation.mutate(selectedProduct.id)
  }

  const isMutating = createMutation.isPending || updateMutation.isPending || 
                     deleteMutation.isPending || entryMutation.isPending

  // ============= Render =============
  if (productsError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erro ao carregar produtos</h2>
          <p className="text-gray-600 mb-4">{productsError.message}</p>
          <Button onClick={() => refetchProducts()}>Tentar novamente</Button>
        </div>
      </div>
    )
  }

  if (isLoading) return <DataLoadingSkeleton />

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestão de Estoque</h1>
            <p className="text-gray-600 mt-1">
              Gerencie produtos, entradas e controle de estoque
              {!isLoading && products.length > 0 && (
                <span className="ml-2 text-blue-600">
                  ({products.length} produtos)
                  {isFetching && (
                    <span className="ml-2 text-xs text-gray-400">atualizando...</span>
                  )}
                </span>
              )}
            </p>
          </div>
          
          <div className="flex gap-2">
            {canManageStock && (
              <Button 
                onClick={() => navigate('/stock-count')} 
                variant="outline" 
                icon={ClipboardList}
                disabled={isMutating}
              >
                Balanço
              </Button>
            )}
            {canEdit && (
              <Button 
                onClick={() => handleOpenProductModal()} 
                icon={Plus}
                disabled={isMutating}
              >
                Novo Produto
              </Button>
            )}
          </div>
        </div>

        {/* Feedback */}
        {feedback.show && (
          <FeedbackMessage 
            type={feedback.type} 
            message={feedback.message} 
            onClose={() => setFeedback({ show: false })} 
          />
        )}

        {/* Filtros */}
        <div className="mb-6">
          <DataFilters
            searchPlaceholder="Buscar por nome, código, categoria ou marca..."
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            filters={filters}
            onFilterChange={setActiveFilters}
            searchDebounceDelay={300}
          />
        </div>

        {/* Tabela ou Empty State */}
        {filteredProducts.length === 0 ? (
          <DataEmptyState
            title="Nenhum produto encontrado"
            description={searchTerm ? "Tente buscar por outro termo" : "Comece cadastrando seu primeiro produto"}
            action={canEdit ? { 
              label: "Cadastrar Produto", 
              icon: <Plus size={18} />, 
              onClick: () => handleOpenProductModal() 
            } : null}
          />
        ) : (
          <ProductTable
            products={filteredProducts}
            loading={isLoading}
            onViewDetails={handleViewDetails}
            onEdit={handleOpenProductModal}
            onDelete={(product) => { 
              setSelectedProduct(product)
              setIsDeleteModalOpen(true) 
            }}
            onRegisterEntry={handleOpenEntryModal}
            canEdit={canEdit}
            canManageStock={canManageStock}
            canViewAll={canViewAll}
            canViewOnlyActive={canViewOnlyActive}
            units={units}
          />
        )}

        {/* Modal de Produto */}
        <Modal 
          isOpen={isProductModalOpen} 
          onClose={() => !isMutating && setIsProductModalOpen(false)} 
          title={selectedProduct ? 'Editar Produto' : 'Novo Produto'} 
          size="lg"
        >
          <ProductForm
            formData={productForm}
            formErrors={formErrors}
            onChange={handleProductChange}
            onSubmit={handleSubmitProduct}
            onCancel={() => setIsProductModalOpen(false)}
            isSubmitting={createMutation.isPending || updateMutation.isPending}
            isEditing={!!selectedProduct}
            units={units}
            categories={categories}
          />
        </Modal>

        {/* Modal de Entrada */}
        <Modal 
          isOpen={isEntryModalOpen} 
          onClose={() => !isMutating && setIsEntryModalOpen(false)} 
          title={`Registrar Entrada - ${selectedProduct?.name}`} 
          size="lg"
          error={entryModalError}
        >
          <ProductEntryForm
            formData={entryForm}
            formErrors={formErrors}
            onChange={handleEntryChange}
            onSubmit={handleSubmitEntry}
            onCancel={() => setIsEntryModalOpen(false)}
            isSubmitting={entryMutation.isPending}
            productName={selectedProduct?.name}
            showFeedback={showFeedback} 
          />
        </Modal>

        {/* Modal de Detalhes */}
        <ProductDetailsModal
          isOpen={isViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false)
            setViewingProductId(null)
          }}
          product={selectedProduct}
          entries={productDetails?.entries || []}
          movements={productDetails?.movements || []}
          units={units}
          isLoading={isLoadingDetails}
        />

        {/* Modal de Exclusão */}
        <ProductDeleteModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          product={selectedProduct}
          onConfirm={handleDeleteProduct}
          isSubmitting={deleteMutation.isPending}
        />
      </div>
    </div>
  )
}

export default Products