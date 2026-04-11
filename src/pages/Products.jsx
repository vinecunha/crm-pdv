import React, { useState, useEffect } from 'react'
import { Plus, ClipboardList } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import useSystemLogs from '../hooks/useSystemLogs'

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

const Products = () => {
  const { profile } = useAuth()
  const { logCreate, logUpdate, logDelete, logError, logAction } = useSystemLogs()
  const navigate = useNavigate()
  
  // Estados
  const [products, setProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilters, setActiveFilters] = useState({})
  
  // Modais
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [selectedEntries, setSelectedEntries] = useState([])
  const [selectedMovements, setSelectedMovements] = useState([])
  
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
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Permissões
  const isAdmin = profile?.role === 'admin'
  const isManager = profile?.role === 'gerente'
  const isOperator = profile?.role === 'operador'
  const canEdit = isAdmin || isManager
  const canManageStock = isAdmin || isManager
  const canViewAll = isAdmin || isManager
  const canViewOnlyActive = isOperator

  // Constantes
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

  const filters = [
    { key: 'category', label: 'Categoria', type: 'select', options: categories.map(cat => ({ value: cat, label: cat })) },
    { key: 'unit', label: 'Unidade', type: 'select', options: units },
    { key: 'is_active', label: 'Status', type: 'select', options: [{ value: 'true', label: 'Ativo' }, { value: 'false', label: 'Inativo' }] },
    ...(canManageStock ? [{ key: 'low_stock', label: 'Estoque Baixo', type: 'select', options: [{ value: 'true', label: 'Apenas produtos com estoque baixo' }] }] : [])
  ]

  // Effects
  useEffect(() => {
    logAction({ action: 'VIEW', entityType: 'product', details: { user_role: profile?.role } })
    fetchProducts()
  }, [])

  useEffect(() => {
    filterProducts()
  }, [searchTerm, products, activeFilters])

  // Funções de API
  const fetchProducts = async () => {
    setLoading(true)
    try {
      let query = supabase.from('products').select('*').order('name', { ascending: true })
      if (canViewOnlyActive) query = query.eq('is_active', true)
      
      const { data, error } = await query
      if (error) throw error
      
      setProducts(data || [])
      setFilteredProducts(data || [])
    } catch (error) {
      showFeedback('error', 'Erro ao carregar produtos: ' + error.message)
      await logError('product', error, { action: 'fetch_products' })
    } finally {
      setLoading(false)
    }
  }

  const filterProducts = () => {
    let filtered = [...products]
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(p => p.name?.toLowerCase().includes(search) || p.code?.toLowerCase().includes(search))
    }
    if (activeFilters.category) filtered = filtered.filter(p => p.category === activeFilters.category)
    if (activeFilters.unit) filtered = filtered.filter(p => p.unit === activeFilters.unit)
    if (activeFilters.is_active !== undefined && activeFilters.is_active !== '') {
      filtered = filtered.filter(p => p.is_active === (activeFilters.is_active === 'true'))
    }
    if (activeFilters.low_stock === 'true') filtered = filtered.filter(p => p.stock_quantity <= p.min_stock)
    setFilteredProducts(filtered)
  }

  // Handlers
  const showFeedback = (type, message) => {
    setFeedback({ show: true, type, message })
    setTimeout(() => setFeedback({ show: false, type: 'success', message: '' }), 3000)
  }

  const handleOpenProductModal = (product = null) => {
    setSelectedProduct(product)
    setProductForm(product ? {
      code: product.code || '', name: product.name || '', description: product.description || '',
      category: product.category || '', unit: product.unit || 'UN', price: product.price || '',
      min_stock: product.min_stock || '', max_stock: product.max_stock || '',
      location: product.location || '', brand: product.brand || '', weight: product.weight || '',
      is_active: product.is_active !== false
    } : {
      code: '', name: '', description: '', category: '', unit: 'UN',
      price: '', min_stock: '', max_stock: '', location: '', brand: '', weight: '', is_active: true
    })
    setFormErrors({})
    setIsProductModalOpen(true)
  }

  const handleOpenEntryModal = (product) => {
    setSelectedProduct(product)
    setEntryForm({
      invoice_number: '', invoice_series: '', supplier_name: '', supplier_cnpj: '',
      batch_number: '', manufacture_date: '', expiration_date: '',
      quantity: '', unit_cost: product.cost_price || '', notes: ''
    })
    setFormErrors({})
    setIsEntryModalOpen(true)
  }

  const handleViewDetails = async (product) => {
    setSelectedProduct(product)
    const [{ data: entries }, { data: movements }] = await Promise.all([
      supabase.from('product_entries').select('*').eq('product_id', product.id).order('entry_date', { ascending: false }),
      supabase.from('stock_movements').select('*').eq('product_id', product.id).order('created_at', { ascending: false }).limit(20)
    ])
    setSelectedEntries(entries || [])
    setSelectedMovements(movements || [])
    setIsViewModalOpen(true)
  }

  const handleSubmitProduct = async () => {
    if (!productForm.name?.trim()) {
      setFormErrors({ name: 'Nome é obrigatório' })
      return
    }
    
    setIsSubmitting(true)
    try {
      const productData = {
        code: productForm.code || null, name: productForm.name, description: productForm.description || null,
        category: productForm.category || null, unit: productForm.unit, price: parseFloat(productForm.price) || 0,
        min_stock: parseFloat(productForm.min_stock) || 0, max_stock: parseFloat(productForm.max_stock) || 0,
        location: productForm.location || null, brand: productForm.brand || null,
        weight: productForm.weight ? parseFloat(productForm.weight) : null, is_active: productForm.is_active,
        updated_by: profile?.id
      }

      if (selectedProduct) {
        const { data, error } = await supabase.from('products').update(productData).eq('id', selectedProduct.id).select().single()
        if (error) throw error
        await logUpdate('product', selectedProduct.id, selectedProduct, data)
        showFeedback('success', 'Produto atualizado com sucesso!')
      } else {
        productData.created_by = profile?.id
        const { data, error } = await supabase.from('products').insert([productData]).select().single()
        if (error) throw error
        await logCreate('product', data.id, data)
        showFeedback('success', 'Produto cadastrado com sucesso!')
      }
      
      setIsProductModalOpen(false)
      await fetchProducts()
    } catch (error) {
      showFeedback('error', error.message)
      await logError('product', error, { action: selectedProduct ? 'update' : 'create' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitEntry = async () => {
    if (!entryForm.quantity || entryForm.quantity <= 0) {
      setFormErrors({ quantity: 'Quantidade deve ser maior que zero' })
      return
    }
    
    setIsSubmitting(true)
    try {
      const entryData = {
        product_id: selectedProduct.id, invoice_number: entryForm.invoice_number,
        invoice_series: entryForm.invoice_series || null, supplier_name: entryForm.supplier_name || null,
        supplier_cnpj: entryForm.supplier_cnpj || null, batch_number: entryForm.batch_number || null,
        manufacture_date: entryForm.manufacture_date || null, expiration_date: entryForm.expiration_date || null,
        quantity: parseFloat(entryForm.quantity), unit_cost: parseFloat(entryForm.unit_cost),
        total_cost: parseFloat(entryForm.quantity) * parseFloat(entryForm.unit_cost),
        notes: entryForm.notes || null, created_by: profile?.id
      }

      const { error } = await supabase.from('product_entries').insert([entryData])
      if (error) throw error
      
      showFeedback('success', 'Entrada de estoque registrada com sucesso!')
      setIsEntryModalOpen(false)
      await fetchProducts()
    } catch (error) {
      showFeedback('error', error.message)
      await logError('product_entry', error, { action: 'create_entry' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteProduct = async () => {
    setIsSubmitting(true)
    try {
      const { error } = await supabase.from('products').delete().eq('id', selectedProduct.id)
      if (error) throw error
      
      await logDelete('product', selectedProduct.id, selectedProduct)
      showFeedback('success', 'Produto excluído com sucesso!')
      setIsDeleteModalOpen(false)
      setSelectedProduct(null)
      await fetchProducts()
    } catch (error) {
      showFeedback('error', error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Loading
  if (loading) return <DataLoadingSkeleton />

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestão de Estoque</h1>
            <p className="text-gray-600 mt-1">
              Gerencie produtos, entradas e controle de estoque
              {!loading && products.length > 0 && <span className="ml-2 text-blue-600">({products.length} produtos)</span>}
            </p>
          </div>
          
          <div className="flex gap-2">
            {canManageStock && (
              <Button onClick={() => navigate('/stock-count')} variant="outline" icon={ClipboardList}>
                Balanço
              </Button>
            )}
            {canEdit && (
              <Button onClick={() => handleOpenProductModal()} icon={Plus}>
                Novo Produto
              </Button>
            )}
          </div>
        </div>

        {/* Feedback */}
        {feedback.show && <FeedbackMessage type={feedback.type} message={feedback.message} onClose={() => setFeedback({ show: false })} />}

        {/* Filtros */}
        <div className="mb-6">
          <DataFilters
            searchPlaceholder="Buscar por nome, código, categoria ou marca..."
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            filters={filters}
            onFilterChange={setActiveFilters}
          />
        </div>

        {/* Tabela ou Empty State */}
        {filteredProducts.length === 0 && !loading ? (
          <DataEmptyState
            title="Nenhum produto encontrado"
            description={searchTerm ? "Tente buscar por outro termo" : "Comece cadastrando seu primeiro produto"}
            action={canEdit ? { label: "Cadastrar Produto", icon: <Plus size={18} />, onClick: () => handleOpenProductModal() } : null}
          />
        ) : (
          <ProductTable
            products={filteredProducts}
            loading={loading}
            onViewDetails={handleViewDetails}
            onEdit={handleOpenProductModal}
            onDelete={(product) => { setSelectedProduct(product); setIsDeleteModalOpen(true) }}
            onRegisterEntry={handleOpenEntryModal}
            canEdit={canEdit}
            canManageStock={canManageStock}
            canViewAll={canViewAll}
            canViewOnlyActive={canViewOnlyActive}
            units={units}
          />
        )}

        {/* Modais */}
        <Modal isOpen={isProductModalOpen} onClose={() => !isSubmitting && setIsProductModalOpen(false)} title={selectedProduct ? 'Editar Produto' : 'Novo Produto'} size="lg">
          <ProductForm
            formData={productForm}
            formErrors={formErrors}
            onChange={(e) => {
              const { name, value, type, checked } = e.target
              setProductForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
            }}
            onSubmit={handleSubmitProduct}
            onCancel={() => setIsProductModalOpen(false)}
            isSubmitting={isSubmitting}
            isEditing={!!selectedProduct}
            units={units}
            categories={categories}
          />
        </Modal>

        <Modal isOpen={isEntryModalOpen} onClose={() => !isSubmitting && setIsEntryModalOpen(false)} title={`Registrar Entrada - ${selectedProduct?.name}`} size="lg">
          <ProductEntryForm
            formData={entryForm}
            formErrors={formErrors}
            onChange={(e) => {
              const { name, value } = e.target
              setEntryForm(prev => ({ ...prev, [name]: value }))
            }}
            onSubmit={handleSubmitEntry}
            onCancel={() => setIsEntryModalOpen(false)}
            isSubmitting={isSubmitting}
            productName={selectedProduct?.name}
          />
        </Modal>

        <ProductDetailsModal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          product={selectedProduct}
          entries={selectedEntries}
          movements={selectedMovements}
          units={units}
        />

        <ProductDeleteModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          product={selectedProduct}
          onConfirm={handleDeleteProduct}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  )
}

export default Products