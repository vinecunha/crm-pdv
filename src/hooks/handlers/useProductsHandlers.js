// src/hooks/useProductsHandlers.js
import { useCallback } from 'react'
import * as productService from '@services/productService'

export const useProductsHandlers = ({
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
  canManageStock
}) => {

  const handleOpenProductModal = useCallback(async (product = null) => {
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
      const nextCode = await productService.generateNextCode()
      setProductForm({
        code: nextCode, name: '', description: '', category: '', unit: 'UN',
        price: '', min_stock: '', max_stock: '', location: '', brand: '', weight: '',
        is_active: true
      })
    }
    setFormErrors({})
    setIsProductModalOpen(true)
  }, [setSelectedProduct, setProductForm, setFormErrors, setIsProductModalOpen])

  const handleCloseProductModal = useCallback(() => {
    if (!createMutation.isPending && !updateMutation.isPending) {
      setIsProductModalOpen(false)
      setSelectedProduct(null)
      setFormErrors({})
    }
  }, [createMutation.isPending, updateMutation.isPending, setIsProductModalOpen, setSelectedProduct, setFormErrors])

  const handleOpenEntryModal = useCallback((product) => {
    setSelectedProduct(product)
    setEntryForm({
      invoice_number: '', invoice_series: '', supplier_name: '', supplier_cnpj: '',
      batch_number: '', manufacture_date: '', expiration_date: '',
      quantity: '', unit_cost: product.cost_price || '', notes: ''
    })
    setFormErrors({})
    setEntryModalError(null)
    setIsEntryModalOpen(true)
  }, [setSelectedProduct, setEntryForm, setFormErrors, setEntryModalError, setIsEntryModalOpen])

  const handleCloseEntryModal = useCallback(() => {
    if (!entryMutation.isPending) {
      setIsEntryModalOpen(false)
      setFormErrors({})
      setEntryModalError(null)
    }
  }, [entryMutation.isPending, setIsEntryModalOpen, setFormErrors, setEntryModalError])

  const handleViewDetails = useCallback((product) => {
    setSelectedProduct(product)
    setViewingProductId(product.id)
    setIsViewModalOpen(true)
  }, [setSelectedProduct, setViewingProductId, setIsViewModalOpen])

  const handleCloseViewModal = useCallback(() => {
    setIsViewModalOpen(false)
    setViewingProductId(null)
  }, [setIsViewModalOpen, setViewingProductId])

  const handleDeleteClick = useCallback((product) => {
    setSelectedProduct(product)
    setIsDeleteModalOpen(true)
  }, [setSelectedProduct, setIsDeleteModalOpen])

  const handleCloseDeleteModal = useCallback(() => {
    setIsDeleteModalOpen(false)
    setSelectedProduct(null)
  }, [setIsDeleteModalOpen, setSelectedProduct])

  const validateProductForm = useCallback(() => {
    const errors = {}
    if (!productForm.name?.trim()) errors.name = 'Nome é obrigatório'
    if (productForm.price && parseFloat(productForm.price) < 0) errors.price = 'Preço inválido'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }, [productForm, setFormErrors])

  const validateEntryForm = useCallback(() => {
    const errors = {}
    if (!entryForm.invoice_number?.trim()) errors.invoice_number = 'Número da NF é obrigatório'
    if (!entryForm.quantity || parseFloat(entryForm.quantity) <= 0) errors.quantity = 'Quantidade deve ser maior que zero'
    if (!entryForm.unit_cost || parseFloat(entryForm.unit_cost) <= 0) errors.unit_cost = 'Valor unitário deve ser maior que zero'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }, [entryForm, setFormErrors])

  const handleProductChange = useCallback((e) => {
    const { name, value, type, checked } = e.target
    setProductForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }))
  }, [formErrors, setProductForm, setFormErrors])

  const handleEntryChange = useCallback((e) => {
    const { name, value } = e.target
    setEntryForm(prev => ({ ...prev, [name]: value }))
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }))
  }, [formErrors, setEntryForm, setFormErrors])

  const handleSubmitProduct = useCallback(() => {
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
      updateMutation.mutate({ id: selectedProduct.id, data: productData })
    } else {
      createMutation.mutate(productData)
    }
  }, [productForm, selectedProduct, validateProductForm, createMutation, updateMutation])

  const handleSubmitEntry = useCallback(() => {
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
      created_by: profile?.id
    }

    entryMutation.mutate(entryData)
  }, [entryForm, selectedProduct, profile, validateEntryForm, entryMutation])

  const handleDeleteProduct = useCallback(() => {
    if (selectedProduct) {
      deleteMutation.mutate(selectedProduct.id)
    }
  }, [selectedProduct, deleteMutation])

  return {
    // Modal open/close
    handleOpenProductModal,
    handleCloseProductModal,
    handleOpenEntryModal,
    handleCloseEntryModal,
    handleViewDetails,
    handleCloseViewModal,
    handleDeleteClick,
    handleCloseDeleteModal,
    
    // Form handlers
    handleProductChange,
    handleEntryChange,
    handleSubmitProduct,
    handleSubmitEntry,
    handleDeleteProduct,
    
    // Validation
    validateProductForm,
    validateEntryForm
  }
}