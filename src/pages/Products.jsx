// pages/Products.jsx
import React, { useState, useEffect } from 'react'
import { 
  Package, Plus, Edit2, Trash2, Search, Truck, 
  Eye, DollarSign, Box, AlertTriangle, CheckCircle, 
  XCircle, Calendar, Hash, FileText, Building, 
  TrendingUp, TrendingDown, RefreshCw, ChevronRight,
  Archive, ArchiveX, PackageOpen, ClipboardList 
} from 'lucide-react'
import DataTable from '../components/ui/DataTable'
import DataFilters from '../components/ui/DataFilters'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import FormInput from '../components/forms/FormInput'
import FeedbackMessage from '../components/ui/FeedbackMessage'
import DataLoadingSkeleton from '../components/ui/DataLoadingSkeleton'
import DataEmptyState from '../components/ui/DataEmptyState'
import Badge from '../components/Badge'
import { supabase } from '../lib/supabase'
import useSystemLogs from '../hooks/useSystemLogs'
import { useAuth } from '../contexts/AuthContext.jsx'

import { useNavigate } from 'react-router-dom'

const Products = () => {
  const { profile } = useAuth()
  const { logCreate, logUpdate, logDelete, logError, logAction } = useSystemLogs()
  
  // Estados principais
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
    code: '',
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
  
  const [entryForm, setEntryForm] = useState({
    invoice_number: '',
    invoice_series: '',
    supplier_name: '',
    supplier_cnpj: '',
    batch_number: '',
    manufacture_date: '',
    expiration_date: '',
    quantity: '',
    unit_cost: '',
    notes: ''
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

  // Unidades disponíveis
  const units = [
    { value: 'UN', label: 'Unidade' },
    { value: 'KG', label: 'Quilograma' },
    { value: 'G', label: 'Grama' },
    { value: 'L', label: 'Litro' },
    { value: 'ML', label: 'Mililitro' },
    { value: 'CX', label: 'Caixa' },
    { value: 'PC', label: 'Pacote' },
    { value: 'M', label: 'Metro' },
    { value: 'MT', label: 'Metro Quadrado' }
  ]

  // Categorias
  const categories = [
    'Alimentos', 'Bebidas', 'Limpeza', 'Higiene', 'Eletrônicos',
    'Ferramentas', 'Vestuário', 'Papelaria', 'Moveis', 'Outros'
  ]

  const navigate = useNavigate()

  // Log de acesso à página
  useEffect(() => {
    logAction({
      action: 'VIEW',
      entityType: 'product',
      details: {
        component: 'Products',
        action: 'access_page',
        user_role: profile?.role,
        user_email: profile?.email
      }
    })
  }, [])

  // Carregar produtos
  useEffect(() => {
    fetchProducts()
  }, [])

  // Filtrar produtos
  useEffect(() => {
    filterProducts()
  }, [searchTerm, products, activeFilters])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('products')
        .select('*')
        .order('name', { ascending: true })

      // Operador só vê produtos ativos
      if (canViewOnlyActive) {
        query = query.eq('is_active', true)
      }

      const { data, error } = await query

      if (error) throw error
      
      setProducts(data || [])
      setFilteredProducts(data || [])
      
      await logAction({
        action: 'SEARCH',
        entityType: 'product',
        details: {
          result_count: data?.length || 0,
          user_email: profile?.email
        }
      })
      
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
      await logError('product', error, { action: 'fetch_products' })
      showFeedback('error', 'Erro ao carregar produtos: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const filterProducts = () => {
    let filtered = [...products]

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(product =>
        product.name?.toLowerCase().includes(search) ||
        product.code?.toLowerCase().includes(search) ||
        product.category?.toLowerCase().includes(search) ||
        product.brand?.toLowerCase().includes(search)
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

    setFilteredProducts(filtered)
  }

  const showFeedback = (type, message) => {
    setFeedback({ show: true, type, message })
    setTimeout(() => {
      setFeedback({ show: false, type: 'success', message: '' })
    }, 3000)
  }

  const validateProductForm = () => {
    const errors = {}
    
    if (!productForm.name?.trim()) {
      errors.name = 'Nome é obrigatório'
    } else if (productForm.name.length < 3) {
      errors.name = 'Nome deve ter pelo menos 3 caracteres'
    }
    
    if (productForm.price && isNaN(parseFloat(productForm.price))) {
      errors.price = 'Preço inválido'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const validateEntryForm = () => {
    const errors = {}
    
    if (!entryForm.invoice_number?.trim()) {
      errors.invoice_number = 'Número da NF é obrigatório'
    }
    if (!entryForm.quantity || entryForm.quantity <= 0) {
      errors.quantity = 'Quantidade deve ser maior que zero'
    }
    if (!entryForm.unit_cost || entryForm.unit_cost <= 0) {
      errors.unit_cost = 'Valor unitário deve ser maior que zero'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleProductChange = (e) => {
    const { name, value, type, checked } = e.target
    setProductForm(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }))
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleEntryChange = (e) => {
    const { name, value } = e.target
    setEntryForm(prev => ({ ...prev, [name]: value }))
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleOpenProductModal = (product = null) => {
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
      
      logAction({
        action: 'VIEW',
        entityType: 'product',
        entityId: product.id,
        details: { action: 'open_edit_modal', product_name: product.name }
      })
    } else {
      setSelectedProduct(null)
      setProductForm({
        code: '',
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
      
      logAction({
        action: 'VIEW',
        entityType: 'product',
        details: { action: 'open_create_modal' }
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
    setIsEntryModalOpen(true)
    
    logAction({
      action: 'VIEW',
      entityType: 'product_entry',
      entityId: product.id,
      details: { action: 'open_entry_modal', product_name: product.name }
    })
  }

  const handleViewDetails = async (product) => {
    setSelectedProduct(product)
    
    // Buscar entradas do produto
    const { data: entries } = await supabase
      .from('product_entries')
      .select('*')
      .eq('product_id', product.id)
      .order('entry_date', { ascending: false })
    
    // Buscar movimentações
    const { data: movements } = await supabase
      .from('stock_movements')
      .select('*')
      .eq('product_id', product.id)
      .order('created_at', { ascending: false })
      .limit(20)
    
    setSelectedEntries(entries || [])
    setSelectedMovements(movements || [])
    setIsViewModalOpen(true)
    
    logAction({
      action: 'VIEW',
      entityType: 'product',
      entityId: product.id,
      details: { action: 'view_details', product_name: product.name }
    })
  }

  const handleSubmitProduct = async () => {
    if (!validateProductForm()) return
    
    setIsSubmitting(true)
    try {
      const productData = {
        code: productForm.code || null,
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
        updated_by: profile?.id
      }

      if (selectedProduct) {
        // Atualizar produto
        const oldData = { ...selectedProduct }
        const { data, error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', selectedProduct.id)
          .select()
          .single()

        if (error) throw error
        
        await logUpdate('product', selectedProduct.id, oldData, data, {
          updated_by: profile?.email,
          changes: {
            name: oldData.name !== data.name,
            price: oldData.price !== data.price,
            is_active: oldData.is_active !== data.is_active
          }
        })
        
        showFeedback('success', 'Produto atualizado com sucesso!')
      } else {
        // Criar produto
        productData.created_by = profile?.id
        
        const { data, error } = await supabase
          .from('products')
          .insert([productData])
          .select()
          .single()

        if (error) throw error
        
        await logCreate('product', data.id, {
          name: data.name,
          code: data.code,
          category: data.category,
          created_by: profile?.email
        })
        
        showFeedback('success', 'Produto cadastrado com sucesso!')
      }
      
      setIsProductModalOpen(false)
      await fetchProducts()
      
    } catch (error) {
      console.error('Erro ao salvar produto:', error)
      await logError('product', error, { 
        action: selectedProduct ? 'update_product' : 'create_product',
        product_name: productForm.name
      })
      showFeedback('error', error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitEntry = async () => {
    if (!validateEntryForm()) return
    
    setIsSubmitting(true)
    try {
      const totalCost = parseFloat(entryForm.quantity) * parseFloat(entryForm.unit_cost)
      
      const entryData = {
        product_id: selectedProduct.id,
        invoice_number: entryForm.invoice_number,
        invoice_series: entryForm.invoice_series || null,
        supplier_name: entryForm.supplier_name || null,
        supplier_cnpj: entryForm.supplier_cnpj || null,
        batch_number: entryForm.batch_number || null,
        manufacture_date: entryForm.manufacture_date || null,
        expiration_date: entryForm.expiration_date || null,
        quantity: parseFloat(entryForm.quantity),
        unit_cost: parseFloat(entryForm.unit_cost),
        total_cost: totalCost,
        notes: entryForm.notes || null,
        created_by: profile?.id
      }

      const { data, error } = await supabase
        .from('product_entries')
        .insert([entryData])
        .select()
        .single()

      if (error) throw error
      
      await logCreate('product_entry', data.id, {
        product_name: selectedProduct.name,
        invoice_number: entryForm.invoice_number,
        quantity: entryForm.quantity,
        unit_cost: entryForm.unit_cost,
        total_cost: totalCost,
        created_by: profile?.email
      })
      
      showFeedback('success', 'Entrada de estoque registrada com sucesso!')
      setIsEntryModalOpen(false)
      await fetchProducts()
      
    } catch (error) {
      console.error('Erro ao registrar entrada:', error)
      await logError('product_entry', error, {
        action: 'create_entry',
        product_name: selectedProduct?.name,
        invoice_number: entryForm.invoice_number
      })
      showFeedback('error', error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const confirmDelete = (product) => {
    setSelectedProduct(product)
    setIsDeleteModalOpen(true)
    
    logAction({
      action: 'VIEW',
      entityType: 'product',
      entityId: product.id,
      details: { action: 'open_delete_modal', product_name: product.name }
    })
  }

  const handleDelete = async () => {
    setIsSubmitting(true)
    const productData = { ...selectedProduct }
    
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', selectedProduct.id)

      if (error) throw error
      
      await logDelete('product', selectedProduct.id, productData, {
        deleted_by: profile?.email,
        product_name: productData.name,
        product_code: productData.code
      })
      
      showFeedback('success', 'Produto excluído com sucesso!')
      setIsDeleteModalOpen(false)
      await fetchProducts()
      
    } catch (error) {
      console.error('Erro ao excluir produto:', error)
      await logError('product', error, {
        action: 'delete_product',
        product_name: selectedProduct?.name
      })
      showFeedback('error', error.message)
    } finally {
      setIsSubmitting(false)
      setSelectedProduct(null)
    }
  }

  const getStockStatus = (product) => {
    if (product.stock_quantity <= 0) return { label: 'Sem Estoque', color: 'danger', icon: ArchiveX }
    if (product.stock_quantity <= product.min_stock) return { label: 'Estoque Baixo', color: 'warning', icon: AlertTriangle }
    if (product.max_stock && product.stock_quantity >= product.max_stock) return { label: 'Estoque Alto', color: 'info', icon: TrendingUp }
    return { label: 'Normal', color: 'success', icon: CheckCircle }
  }

  const getStatusBadge = (is_active) => {
    if (is_active) {
      return <Badge variant="success">Ativo</Badge>
    }
    return <Badge variant="danger">Inativo</Badge>
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0)
  }

  const formatNumber = (value, decimals = 2) => {
    if (value === undefined || value === null) return '0'
    return value.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
  }

  const getUnitLabel = (unit) => {
    const found = units.find(u => u.value === unit)
    return found ? found.label : unit
  }

  // Ações da tabela (baseado em permissão)
  const getActions = () => {
    const actionsList = []
    
    if (canViewAll || canViewOnlyActive) {
      actionsList.push({
        label: 'Ver detalhes',
        icon: <Eye size={16} />,
        onClick: (row) => handleViewDetails(row),
        className: 'text-gray-600 hover:text-gray-700 hover:bg-gray-50'
      })
    }
    
    if (canManageStock) {
      actionsList.push({
        label: 'Registrar entrada',
        icon: <Truck size={16} />,
        onClick: (row) => handleOpenEntryModal(row),
        className: 'text-green-600 hover:text-green-700 hover:bg-green-50'
      })
    }
    
    if (canEdit) {
      actionsList.push({
        label: 'Editar',
        icon: <Edit2 size={16} />,
        onClick: (row) => handleOpenProductModal(row),
        className: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
      })
      
      actionsList.push({
        label: 'Excluir',
        icon: <Trash2 size={16} />,
        onClick: (row) => confirmDelete(row),
        className: 'text-red-600 hover:text-red-700 hover:bg-red-50'
      })
    }
    
    return actionsList
  }

  // Colunas da tabela
  const columns = [
    {
      key: 'code',
      header: 'Código',
      render: (row) => (
        <div className="text-sm font-mono text-gray-600">{row.code || '-'}</div>
      )
    },
    {
      key: 'name',
      header: 'Produto',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <Package size={16} className="text-blue-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{row.name}</div>
            <div className="text-xs text-gray-500">{row.category || 'Sem categoria'}</div>
          </div>
        </div>
      )
    },
    {
      key: 'stock_quantity',
      header: 'Estoque',
      sortable: true,
      render: (row) => {
        const status = getStockStatus(row)
        const StatusIcon = status.icon
        return (
          <div>
            <div className="font-medium text-gray-900">
              {formatNumber(row.stock_quantity)} {getUnitLabel(row.unit)}
            </div>
            <div className="flex items-center gap-1 mt-1">
              <StatusIcon size={12} className={`text-${status.color}-500`} />
              <span className={`text-xs text-${status.color}-600`}>{status.label}</span>
            </div>
          </div>
        )
      }
    },
    {
      key: 'price',
      header: 'Preço Venda',
      sortable: true,
      render: (row) => (
        <div className="font-semibold text-green-600">
          {formatCurrency(row.price)}
        </div>
      )
    },
    {
      key: 'cost_price',
      header: 'Último Custo',
      render: (row) => (
        <div className="text-sm text-gray-600">
          {formatCurrency(row.cost_price)}
        </div>
      )
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (row) => getStatusBadge(row.is_active)
    }
  ]

  // Filtros
  const filters = [
    {
      key: 'category',
      label: 'Categoria',
      type: 'select',
      options: categories.map(cat => ({ value: cat, label: cat }))
    },
    {
      key: 'unit',
      label: 'Unidade',
      type: 'select',
      options: units
    },
    {
      key: 'is_active',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'true', label: 'Ativo' },
        { value: 'false', label: 'Inativo' }
      ]
    }
  ]

  // Adicionar filtro de estoque baixo para admin/gerente
  if (canManageStock) {
    filters.push({
      key: 'low_stock',
      label: 'Estoque Baixo',
      type: 'select',
      options: [
        { value: 'true', label: 'Apenas produtos com estoque baixo' }
      ]
    })
  }

  const handleFilterChange = (filters) => {
    setActiveFilters(filters)
  }

  if (loading) {
    return <DataLoadingSkeleton />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestão de Estoque</h1>
            <p className="text-gray-600 mt-1">
              Gerencie produtos, entradas e controle de estoque
              {!loading && products.length > 0 && (
                <span className="ml-2 text-blue-600">({products.length} produtos)</span>
              )}
            </p>
          </div>
          
          {canManageStock && (
            <Button 
              onClick={() => navigate('/stock-count')} 
              variant="outline"
              icon={ClipboardList}
            >
              Balanço
            </Button>
          )}
          {canEdit && (
            <Button onClick={() => handleOpenProductModal()} icon={Plus}>
              Novo Produto
            </Button>
          )}
        </div>

        {/* Feedback */}
        {feedback.show && (
          <div className="mb-4">
            <FeedbackMessage
              type={feedback.type}
              message={feedback.message}
              onClose={() => setFeedback({ show: false, type: 'success', message: '' })}
            />
          </div>
        )}

        {/* Filtros */}
        <div className="mb-6">
          <DataFilters
            searchPlaceholder="Buscar por nome, código, categoria ou marca..."
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            filters={filters}
            onFilterChange={handleFilterChange}
          />
        </div>

        {/* Tabela */}
        {filteredProducts.length === 0 && !loading ? (
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
          <DataTable
            columns={columns}
            data={filteredProducts}
            actions={getActions()}
            onRowClick={(row) => handleViewDetails(row)}
            striped
            hover
            pagination={true}
            itemsPerPageOptions={[20, 50, 100]}
            defaultItemsPerPage={20}
          />
        )}

        {/* Modal de Produto */}
        <Modal
          isOpen={isProductModalOpen}
          onClose={() => !isSubmitting && setIsProductModalOpen(false)}
          title={selectedProduct ? 'Editar Produto' : 'Novo Produto'}
          size="lg"
          isLoading={isSubmitting}
        >
          <form onSubmit={(e) => { e.preventDefault(); handleSubmitProduct(); }}>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label="Código"
                  name="code"
                  value={productForm.code}
                  onChange={handleProductChange}
                  placeholder="Código do produto"
                />
                
                <FormInput
                  label="Nome do Produto"
                  name="name"
                  value={productForm.name}
                  onChange={handleProductChange}
                  required
                  error={formErrors.name}
                  placeholder="Nome do produto"
                  icon={Package}
                />
                
                <div className="md:col-span-2">
                  <FormInput
                    label="Descrição"
                    name="description"
                    value={productForm.description}
                    onChange={handleProductChange}
                    placeholder="Descrição detalhada do produto"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoria
                  </label>
                  <select
                    name="category"
                    value={productForm.category}
                    onChange={handleProductChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione uma categoria</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unidade
                  </label>
                  <select
                    name="unit"
                    value={productForm.unit}
                    onChange={handleProductChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {units.map(unit => (
                      <option key={unit.value} value={unit.value}>{unit.label}</option>
                    ))}
                  </select>
                </div>
                
                <FormInput
                  label="Preço de Venda"
                  name="price"
                  type="number"
                  step="0.01"
                  value={productForm.price}
                  onChange={handleProductChange}
                  placeholder="0,00"
                  icon={DollarSign}
                />
                
                <FormInput
                  label="Estoque Mínimo"
                  name="min_stock"
                  type="number"
                  step="0.01"
                  value={productForm.min_stock}
                  onChange={handleProductChange}
                  placeholder="0"
                />
                
                <FormInput
                  label="Estoque Máximo"
                  name="max_stock"
                  type="number"
                  step="0.01"
                  value={productForm.max_stock}
                  onChange={handleProductChange}
                  placeholder="0"
                />
                
                <FormInput
                  label="Localização"
                  name="location"
                  value={productForm.location}
                  onChange={handleProductChange}
                  placeholder="Prateleira, corredor..."
                />
                
                <FormInput
                  label="Marca"
                  name="brand"
                  value={productForm.brand}
                  onChange={handleProductChange}
                  placeholder="Marca do produto"
                />
                
                <FormInput
                  label="Peso (kg)"
                  name="weight"
                  type="number"
                  step="0.001"
                  value={productForm.weight}
                  onChange={handleProductChange}
                  placeholder="0,000"
                />
              </div>
              
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={productForm.is_active}
                  onChange={handleProductChange}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label className="text-sm text-gray-700">
                  Produto ativo para venda no PDV
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsProductModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={isSubmitting}
              >
                {selectedProduct ? 'Atualizar' : 'Cadastrar'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal de Entrada de Estoque */}
        <Modal
          isOpen={isEntryModalOpen}
          onClose={() => !isSubmitting && setIsEntryModalOpen(false)}
          title={`Registrar Entrada - ${selectedProduct?.name}`}
          size="lg"
          isLoading={isSubmitting}
        >
          <form onSubmit={(e) => { e.preventDefault(); handleSubmitEntry(); }}>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label="Número da NF"
                  name="invoice_number"
                  value={entryForm.invoice_number}
                  onChange={handleEntryChange}
                  required
                  error={formErrors.invoice_number}
                  placeholder="000000"
                  icon={FileText}
                />
                
                <FormInput
                  label="Série da NF"
                  name="invoice_series"
                  value={entryForm.invoice_series}
                  onChange={handleEntryChange}
                  placeholder="1"
                />
                
                <FormInput
                  label="Fornecedor"
                  name="supplier_name"
                  value={entryForm.supplier_name}
                  onChange={handleEntryChange}
                  placeholder="Nome do fornecedor"
                  icon={Building}
                />
                
                <FormInput
                  label="CNPJ do Fornecedor"
                  name="supplier_cnpj"
                  value={entryForm.supplier_cnpj}
                  onChange={handleEntryChange}
                  placeholder="00.000.000/0001-00"
                />
                
                <FormInput
                  label="Número do Lote"
                  name="batch_number"
                  value={entryForm.batch_number}
                  onChange={handleEntryChange}
                  placeholder="Lote"
                />
                
                <FormInput
                  label="Data de Fabricação"
                  name="manufacture_date"
                  type="date"
                  value={entryForm.manufacture_date}
                  onChange={handleEntryChange}
                  icon={Calendar}
                />
                
                <FormInput
                  label="Data de Validade"
                  name="expiration_date"
                  type="date"
                  value={entryForm.expiration_date}
                  onChange={handleEntryChange}
                  icon={Calendar}
                />
                
                <FormInput
                  label="Quantidade"
                  name="quantity"
                  type="number"
                  step="0.01"
                  value={entryForm.quantity}
                  onChange={handleEntryChange}
                  required
                  error={formErrors.quantity}
                  placeholder="0,00"
                  icon={Box}
                />
                
                <FormInput
                  label="Valor Unitário (R$)"
                  name="unit_cost"
                  type="number"
                  step="0.01"
                  value={entryForm.unit_cost}
                  onChange={handleEntryChange}
                  required
                  error={formErrors.unit_cost}
                  placeholder="0,00"
                  icon={DollarSign}
                />
              </div>
              
              <FormInput
                label="Observações"
                name="notes"
                value={entryForm.notes}
                onChange={handleEntryChange}
                placeholder="Observações sobre esta entrada"
              />
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEntryModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={isSubmitting}
              >
                Registrar Entrada
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal de Visualização de Detalhes */}
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          title={`Detalhes do Produto - ${selectedProduct?.name}`}
          size="xl"
        >
          {selectedProduct && (
            <div className="space-y-6">
              {/* Informações do Produto */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Informações do Produto</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Código</p>
                    <p className="text-sm font-mono">{selectedProduct.code || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Categoria</p>
                    <p className="text-sm">{selectedProduct.category || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Unidade</p>
                    <p className="text-sm">{getUnitLabel(selectedProduct.unit)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Status</p>
                    <p className="text-sm">{getStatusBadge(selectedProduct.is_active)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Estoque Atual</p>
                    <p className="text-sm font-semibold">
                      {formatNumber(selectedProduct.stock_quantity)} {getUnitLabel(selectedProduct.unit)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Estoque Mínimo</p>
                    <p className="text-sm">{formatNumber(selectedProduct.min_stock)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Preço de Venda</p>
                    <p className="text-sm font-semibold text-green-600">{formatCurrency(selectedProduct.price)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Último Custo</p>
                    <p className="text-sm">{formatCurrency(selectedProduct.cost_price)}</p>
                  </div>
                </div>
              </div>

              {/* Últimas Entradas */}
              {selectedEntries.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Últimas Entradas</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {selectedEntries.slice(0, 5).map(entry => (
                      <div key={entry.id} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium">NF {entry.invoice_number}</p>
                            <p className="text-xs text-gray-500">{entry.supplier_name || 'Fornecedor não informado'}</p>
                            {entry.batch_number && (
                              <p className="text-xs text-gray-500">Lote: {entry.batch_number}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-green-600">{formatCurrency(entry.unit_cost)}/un</p>
                            <p className="text-xs text-gray-500">{formatNumber(entry.quantity)} unidades</p>
                            <p className="text-xs text-gray-400">{new Date(entry.entry_date).toLocaleDateString('pt-BR')}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Últimas Movimentações */}
              {selectedMovements.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Últimas Movimentações</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {selectedMovements.map(movement => (
                      <div key={movement.id} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            {movement.movement_type === 'ENTRY' ? (
                              <TrendingUp size={16} className="text-green-500" />
                            ) : movement.movement_type === 'SALE' ? (
                              <TrendingDown size={16} className="text-red-500" />
                            ) : (
                              <RefreshCw size={16} className="text-blue-500" />
                            )}
                            <span className="text-sm">
                              {movement.movement_type === 'ENTRY' ? 'Entrada' : 
                               movement.movement_type === 'SALE' ? 'Venda' : 
                               movement.movement_type === 'ADJUSTMENT' ? 'Ajuste' : movement.movement_type}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {movement.quantity > 0 ? `+${formatNumber(movement.quantity)}` : formatNumber(movement.quantity)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(movement.created_at).toLocaleString('pt-BR')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal>

        {/* Modal de Confirmação de Exclusão */}
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => !isSubmitting && setIsDeleteModalOpen(false)}
          title="Excluir Produto"
          size="sm"
        >
          <div className="space-y-4 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Tem certeza?
              </h3>
              <p className="text-sm text-gray-500">
                Você está prestes a excluir o produto:
              </p>
              <p className="font-medium text-gray-900 mt-2">
                {selectedProduct?.name}
              </p>
              {selectedProduct?.stock_quantity > 0 && (
                <p className="text-xs text-red-600 mt-2">
                  ⚠️ Este produto possui {formatNumber(selectedProduct.stock_quantity)} unidades em estoque!
                </p>
              )}
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={handleDelete}
                loading={isSubmitting}
                className="flex-1"
              >
                Excluir
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  )
}

export default Products