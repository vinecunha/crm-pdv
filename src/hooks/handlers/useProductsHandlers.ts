import { useCallback } from 'react'
import * as productService from '@services/product/productService'

// Baseado em: public.products
interface Product {
  id: number
  code: string | null
  name: string
  description: string | null
  category: string | null
  unit: string | null
  price: number | null
  cost_price: number | null
  stock_quantity: number | null
  reserved_quantity: number | null
  min_stock: number | null
  max_stock: number | null
  location: string | null
  brand: string | null
  weight: number | null
  is_active: boolean | null
  created_at: string | null
  updated_at: string | null
  created_by: string | null
  updated_by: string | null
  deleted_at: string | null
  deleted_by: string | null
}

// Baseado em: public.product_entries
interface ProductEntry {
  id: number
  product_id: number
  invoice_number: string
  invoice_series: string | null
  supplier_name: string | null
  supplier_cnpj: string | null
  batch_number: string | null
  manufacture_date: string | null
  expiration_date: string | null
  quantity: number
  unit_cost: number
  total_cost: number
  entry_date: string | null
  notes: string | null
  created_at: string | null
  created_by: string | null
}

interface ProductFormData {
  code: string
  name: string
  description: string
  category: string
  unit: string
  price: string | number
  min_stock: string | number
  max_stock: string | number
  location: string
  brand: string
  weight: string | number
  is_active: boolean
}

interface EntryFormData {
  invoice_number: string
  invoice_series: string
  supplier_name: string
  supplier_cnpj: string
  batch_number: string
  manufacture_date: string
  expiration_date: string
  quantity: string | number
  unit_cost: string | number
  notes: string
}

interface ProductSubmitData {
  code: string
  name: string
  description: string | null
  category: string | null
  unit: string
  price: number
  min_stock: number
  max_stock: number
  location: string | null
  brand: string | null
  weight: number | null
  is_active: boolean
}

interface EntrySubmitData {
  product_id: number
  invoice_number: string
  quantity: number
  unit_cost: number
  total_cost: number
  invoice_series: string | null
  supplier_name: string | null
  supplier_cnpj: string | null
  batch_number: string | null
  manufacture_date: string | null
  expiration_date: string | null
  entry_date: string
  notes: string | null
  created_by: string
}

interface FormErrors {
  [key: string]: string
}

interface Profile {
  id: string
  [key: string]: unknown
}

interface MutationResult<T> {
  mutate: (data: T, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => void
  isPending: boolean
}

interface UseProductsHandlersProps {
  profile: Profile | null
  selectedProduct: Product | null
  setSelectedProduct: (product: Product | null) => void
  viewingProductId: number | null
  setViewingProductId: (id: number | null) => void
  productForm: ProductFormData
  setProductForm: (form: ProductFormData) => void
  entryForm: EntryFormData
  setEntryForm: (form: EntryFormData) => void
  formErrors: FormErrors
  setFormErrors: (errors: FormErrors) => void
  entryModalError: string | null
  setEntryModalError: (error: string | null) => void
  setIsProductModalOpen: (open: boolean) => void
  setIsEntryModalOpen: (open: boolean) => void
  setIsViewModalOpen: (open: boolean) => void
  setIsDeleteModalOpen: (open: boolean) => void
  createMutation: MutationResult<ProductSubmitData>
  updateMutation: MutationResult<{ id: number; data: ProductSubmitData }>
  deleteMutation: MutationResult<number>
  entryMutation: MutationResult<EntrySubmitData>
  showFeedback: (type: 'success' | 'error' | 'info', message: string) => void
  canEdit: boolean
  canManageStock: boolean
}

interface UseProductsHandlersReturn {
  handleOpenProductModal: (product?: Product | null) => Promise<void>
  handleCloseProductModal: () => void
  handleOpenEntryModal: (product: Product) => void
  handleCloseEntryModal: () => void
  handleViewDetails: (product: Product) => void
  handleCloseViewModal: () => void
  handleDeleteClick: (product: Product) => void
  handleCloseDeleteModal: () => void
  handleProductChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
  handleEntryChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
  handleSubmitProduct: () => void
  handleSubmitEntry: () => void
  handleDeleteProduct: () => void
  validateProductForm: () => boolean
  validateEntryForm: () => boolean
}

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
}: UseProductsHandlersProps): UseProductsHandlersReturn => {

  const handleOpenProductModal = useCallback(async (product: Product | null = null) => {
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

  const handleOpenEntryModal = useCallback((product: Product) => {
    setSelectedProduct(product)
    setEntryForm({
      invoice_number: '', invoice_series: '', supplier_name: '', supplier_cnpj: '',
      batch_number: '', manufacture_date: '', expiration_date: '',
      quantity: '', unit_cost: String(product.cost_price || ''), notes: ''
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

  const handleViewDetails = useCallback((product: Product) => {
    setSelectedProduct(product)
    setViewingProductId(product.id)
    setIsViewModalOpen(true)
  }, [setSelectedProduct, setViewingProductId, setIsViewModalOpen])

  const handleCloseViewModal = useCallback(() => {
    setIsViewModalOpen(false)
    setViewingProductId(null)
  }, [setIsViewModalOpen, setViewingProductId])

  const handleDeleteClick = useCallback((product: Product) => {
    setSelectedProduct(product)
    setIsDeleteModalOpen(true)
  }, [setSelectedProduct, setIsDeleteModalOpen])

  const handleCloseDeleteModal = useCallback(() => {
    setIsDeleteModalOpen(false)
    setSelectedProduct(null)
  }, [setIsDeleteModalOpen, setSelectedProduct])

  const validateProductForm = useCallback((): boolean => {
    const errors: FormErrors = {}
    if (!productForm.name?.trim()) errors.name = 'Nome é obrigatório'
    if (productForm.price && parseFloat(String(productForm.price)) < 0) errors.price = 'Preço inválido'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }, [productForm, setFormErrors])

  const validateEntryForm = useCallback((): boolean => {
    const errors: FormErrors = {}
    if (!entryForm.invoice_number?.trim()) errors.invoice_number = 'Número da NF é obrigatório'
    if (!entryForm.quantity || parseFloat(String(entryForm.quantity)) <= 0) errors.quantity = 'Quantidade deve ser maior que zero'
    if (!entryForm.unit_cost || parseFloat(String(entryForm.unit_cost)) <= 0) errors.unit_cost = 'Valor unitário deve ser maior que zero'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }, [entryForm, setFormErrors])

  const handleProductChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined
    setProductForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }))
  }, [formErrors, setProductForm, setFormErrors])

  const handleEntryChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setEntryForm(prev => ({ ...prev, [name]: value }))
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }))
  }, [formErrors, setEntryForm, setFormErrors])

  const handleSubmitProduct = useCallback(() => {
    if (!validateProductForm()) return
    
    const productData: ProductSubmitData = {
      code: productForm.code,
      name: productForm.name,
      description: productForm.description || null,
      category: productForm.category || null,
      unit: productForm.unit,
      price: parseFloat(String(productForm.price)) || 0,
      min_stock: parseFloat(String(productForm.min_stock)) || 0,
      max_stock: parseFloat(String(productForm.max_stock)) || 0,
      location: productForm.location || null,
      brand: productForm.brand || null,
      weight: productForm.weight ? parseFloat(String(productForm.weight)) : null,
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
    
    const quantity = parseFloat(String(entryForm.quantity))
    const unitCost = parseFloat(String(entryForm.unit_cost))
    const totalCost = quantity * unitCost
    
    const entryData: EntrySubmitData = {
      product_id: selectedProduct!.id,
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
      created_by: profile!.id
    }

    entryMutation.mutate(entryData)
  }, [entryForm, selectedProduct, profile, validateEntryForm, entryMutation])

  const handleDeleteProduct = useCallback(() => {
    if (selectedProduct) {
      deleteMutation.mutate(selectedProduct.id)
    }
  }, [selectedProduct, deleteMutation])

  return {
    handleOpenProductModal,
    handleCloseProductModal,
    handleOpenEntryModal,
    handleCloseEntryModal,
    handleViewDetails,
    handleCloseViewModal,
    handleDeleteClick,
    handleCloseDeleteModal,
    handleProductChange,
    handleEntryChange,
    handleSubmitProduct,
    handleSubmitEntry,
    handleDeleteProduct,
    validateProductForm,
    validateEntryForm
  }
}