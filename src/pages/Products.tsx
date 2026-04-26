// src/pages/Products.jsx
import React, { useState, useMemo } from 'react'
import { Plus, ClipboardList, Package } from '@lib/icons'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@contexts/AuthContext'
import { useUI } from '@contexts/UIContext'
import { useSystemLogs } from '@hooks/system/useSystemLogs'
import useMediaQuery from '@/hooks/utils/useMediaQuery'

import * as productService from '@services/product/productService'

import Button from '@components/ui/Button'
import FeedbackMessage from '@components/ui/FeedbackMessage'
import DataLoadingSkeleton from '@components/ui/DataLoadingSkeleton'
import DataEmptyState from '@components/ui/DataEmptyState'
import DataFilters from '@components/ui/DataFilters'
import PageHeader from '@components/ui/PageHeader'
import DataCards from '@components/ui/DataCards'
import ProductCard from '@components/products/ProductCard'
import ProductTable from '@components/products/ProductTable'
import ProductsModalsContainer from '@components/products/ProductsModalsContainer'

// ✅ Hooks centralizados
import { useProductsHandlers } from '@hooks/handlers'
import { useProductMutations } from '@hooks/mutations'
import { useProductsQueries } from '@hooks/queries/useProductsQueries'
import { useProductForms } from '@hooks/forms/useProductForms'

const Products = () => {
  const { profile } = useAuth()
  const { showFeedback } = useUI()
  const { logAction } = useSystemLogs()
  const navigate = useNavigate()
  const isMobile = useMediaQuery('(max-width: 768px)')
  
  // Estados de UI
  const [viewMode] = useState('auto')
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilters, setActiveFilters] = useState({})
  
  // Estados de modais
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [entryModalError, setEntryModalError] = useState(null)
  
  // Estados de seleção
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [viewingProductId, setViewingProductId] = useState(null)

  // Permissões
  const isAdmin = profile?.role === 'admin'
  const isManager = profile?.role === 'gerente'
  const isOperator = profile?.role === 'operador'
  const canEdit = isAdmin || isManager
  const canManageStock = isAdmin || isManager
  const canViewAll = isAdmin || isManager
  const canViewOnlyActive = isOperator

  const effectiveViewMode = viewMode === 'auto' ? (isMobile ? 'cards' : 'table') : viewMode

  // ✅ Queries centralizadas
  const { 
    products, 
    isLoading, 
    productsError, 
    refetchProducts, 
    isFetching,
    productDetails,
    isLoadingDetails 
  } = useProductsQueries({ 
    canViewOnlyActive, 
    viewingProductId 
  })

  // ✅ Forms centralizados
  const {
    productForm,
    setProductForm,
    entryForm,
    setEntryForm,
    formErrors,
    setFormErrors,
    handleProductChange,
    handleEntryChange,
    validateProductForm,
    validateEntryForm
  } = useProductForms()

  // Filtros
  const filters = [
    { key: 'category', label: 'Categoria', type: 'select', options: productService.categories.map(cat => ({ value: cat, label: cat })) },
    { key: 'unit', label: 'Unidade', type: 'select', options: productService.units },
    { key: 'is_active', label: 'Status', type: 'select', options: [{ value: 'true', label: 'Ativo' }, { value: 'false', label: 'Inativo' }] },
    ...(canManageStock ? [{ key: 'low_stock', label: 'Estoque Baixo', type: 'select', options: [{ value: 'true', label: 'Apenas produtos com estoque baixo' }] }] : [])
  ]

  // Produtos filtrados
const filteredProducts = useMemo(() => {
    if (!searchTerm && Object.keys(activeFilters).length === 0) return products
    
    return products.filter(product => {
      const matchesSearch = !searchTerm || 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesFilters = Object.entries(activeFilters).every(([key, value]) => {
        if (!value) return true
        return product[key]?.toString().toLowerCase() === value.toLowerCase()
      })
      
      return matchesSearch && matchesFilters
    })
  }, [products, searchTerm, activeFilters])

  // ✅ Mutations com callbacks
  const {
    createMutation,
    updateMutation,
    deleteMutation,
    entryMutation,
    isMutating
  } = useProductMutations(profile, {
    onProductCreated: () => {
      showFeedback('success', 'Produto cadastrado com sucesso!')
      setIsProductModalOpen(false)
    },
    onProductUpdated: () => {
      showFeedback('success', 'Produto atualizado com sucesso!')
      setIsProductModalOpen(false)
    },
    onProductDeleted: () => {
      showFeedback('success', 'Produto excluído com sucesso!')
      setIsDeleteModalOpen(false)
      setSelectedProduct(null)
    },
    onEntryCreated: () => {
      showFeedback('success', 'Entrada de estoque registrada com sucesso!')
      setIsEntryModalOpen(false)
      setEntryModalError(null)
    },
    onEntryError: (error) => {
      setEntryModalError(error.message)
    },
    onAnyError: (error) => {
      showFeedback('error', error.message)
    }
  })

  // ✅ Handlers
  const handlers = useProductsHandlers({
    profile,
    selectedProduct,
    setSelectedProduct,
    viewingProductId,
    setViewingProductId,
    productForm,
    setProductForm,
    entryForm,
    setEntryForm,
    formErrors,
    setFormErrors,
    entryModalError,
    setEntryModalError,
    setIsProductModalOpen,
    setIsEntryModalOpen,
    setIsViewModalOpen,
    setIsDeleteModalOpen,
    createMutation,
    updateMutation,
    deleteMutation,
    entryMutation,
    showFeedback,
    canEdit,
    canManageStock,
    validateProductForm,
    validateEntryForm,
    handleProductChange,
    handleEntryChange
  })

  // Renderização de cards
  const renderProductCard = (product) => (
    <ProductCard
      product={product}
      onViewDetails={handlers.handleViewDetails}
      onEdit={canEdit ? handlers.handleOpenProductModal : null}
      onDelete={canEdit ? handlers.handleDeleteClick : null}
      onRegisterEntry={canManageStock ? handlers.handleOpenEntryModal : null}
      canEdit={canEdit}
      canManageStock={canManageStock}
      units={productService.units}
    />
  )

  // Log de acesso
  React.useEffect(() => {
    logAction({ action: 'VIEW', entityType: 'product', details: { user_role: profile?.role } })
  }, [])

  // Ações do header
  const headerActions = [
    ...(canManageStock ? [{
      label: 'Balanço',
      icon: ClipboardList,
      onClick: () => navigate('/stock-count'),
      variant: 'outline',
      disabled: isMutating
    }] : []),
    ...(canEdit ? [{
      label: 'Novo Produto',
      icon: Plus,
      onClick: () => handlers.handleOpenProductModal(),
      variant: 'primary',
      disabled: isMutating
    }] : [])
  ]

  // Estados de erro/carregamento
  if (productsError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Erro ao carregar produtos</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{productsError.message}</p>
          <Button onClick={() => refetchProducts()}>Tentar novamente</Button>
        </div>
      </div>
    )
  }

  if (isLoading) return <DataLoadingSkeleton />

  // Render principal
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <PageHeader
          title="Gestão de Estoque"
          description={
            <>
              Gerencie produtos, entradas e controle de estoque
              {!isLoading && products.length > 0 && (
                <span className="ml-2 text-blue-600 dark:text-blue-400">
                  ({products.length} produtos)
                  {isFetching && <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">atualizando...</span>}
                </span>
              )}
            </>
          }
          icon={Package}
          actions={headerActions}
        />

        <div className="mb-4 sm:mb-6">
          <DataFilters
            searchPlaceholder="Buscar por nome, código, categoria ou marca..."
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            filters={filters}
            onFilterChange={setActiveFilters}
            searchDebounceDelay={300}
          />
        </div>

        {filteredProducts.length === 0 ? (
          <DataEmptyState
            title="Nenhum produto encontrado"
            description={searchTerm ? "Tente buscar por outro termo" : "Comece cadastrando seu primeiro produto"}
            action={canEdit ? { label: "Cadastrar Produto", icon: <Plus size={18} />, onClick: () => handlers.handleOpenProductModal() } : null}
          />
        ) : (
          <>
            {effectiveViewMode === 'cards' ? (
              <DataCards
                data={filteredProducts}
                renderCard={renderProductCard}
                keyExtractor={(product) => product.id}
                columns={isMobile ? 1 : 2}
                gap={4}
                emptyMessage="Nenhum produto encontrado"
              />
            ) : (
              <ProductTable
                products={filteredProducts}
                loading={isLoading}
                onViewDetails={handlers.handleViewDetails}
                onEdit={handlers.handleOpenProductModal}
                onDelete={handlers.handleDeleteClick}
                onRegisterEntry={handlers.handleOpenEntryModal}
                canEdit={canEdit}
                canManageStock={canManageStock}
                canViewAll={canViewAll}
                canViewOnlyActive={canViewOnlyActive}
                units={productService.units}
              />
            )}
          </>
        )}

        <ProductsModalsContainer
          isProductModalOpen={isProductModalOpen}
          onCloseProductModal={handlers.handleCloseProductModal}
          selectedProduct={selectedProduct}
          productForm={productForm}
          formErrors={formErrors}
          onProductChange={handleProductChange}
          onSubmitProduct={handlers.handleSubmitProduct}
          isSubmittingProduct={createMutation.isPending || updateMutation.isPending}
          units={productService.units}
          categories={productService.categories}
          isEntryModalOpen={isEntryModalOpen}
          onCloseEntryModal={handlers.handleCloseEntryModal}
          entryForm={entryForm}
          entryFormErrors={formErrors}
          onEntryChange={handleEntryChange}
          onSubmitEntry={handlers.handleSubmitEntry}
          isSubmittingEntry={entryMutation.isPending}
          entryModalError={entryModalError}
          showFeedback={showFeedback}
          isViewModalOpen={isViewModalOpen}
          onCloseViewModal={handlers.handleCloseViewModal}
          productDetails={productDetails}
          isLoadingDetails={isLoadingDetails}
          isDeleteModalOpen={isDeleteModalOpen}
          onCloseDeleteModal={handlers.handleCloseDeleteModal}
          onConfirmDelete={handlers.handleDeleteProduct}
          isSubmittingDelete={deleteMutation.isPending}
        />
      </div>
    </div>
  )
}

export default Products
