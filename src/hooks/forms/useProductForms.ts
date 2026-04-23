import { useState, useCallback, ChangeEvent } from 'react'

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

interface FormErrors {
  [key: string]: string
}

const initialProductForm: ProductFormData = {
  code: '', name: '', description: '', category: '', unit: 'UN',
  price: '', min_stock: '', max_stock: '', location: '', brand: '', weight: '',
  is_active: true
}

const initialEntryForm: EntryFormData = {
  invoice_number: '', invoice_series: '', supplier_name: '', supplier_cnpj: '',
  batch_number: '', manufacture_date: '', expiration_date: '',
  quantity: '', unit_cost: '', notes: ''
}

interface UseProductFormsReturn {
  productForm: ProductFormData
  setProductForm: React.Dispatch<React.SetStateAction<ProductFormData>>
  entryForm: EntryFormData
  setEntryForm: React.Dispatch<React.SetStateAction<EntryFormData>>
  formErrors: FormErrors
  setFormErrors: React.Dispatch<React.SetStateAction<FormErrors>>
  resetProductForm: () => void
  resetEntryForm: () => void
  resetAllForms: () => void
  handleProductChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
  handleEntryChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
  validateProductForm: () => boolean
  validateEntryForm: () => boolean
}

export const useProductForms = (): UseProductFormsReturn => {
  const [productForm, setProductForm] = useState<ProductFormData>(initialProductForm)
  const [entryForm, setEntryForm] = useState<EntryFormData>(initialEntryForm)
  const [formErrors, setFormErrors] = useState<FormErrors>({})

  const resetProductForm = useCallback(() => {
    setProductForm(initialProductForm)
    setFormErrors({})
  }, [])

  const resetEntryForm = useCallback(() => {
    setEntryForm(initialEntryForm)
    setFormErrors({})
  }, [])

  const resetAllForms = useCallback(() => {
    resetProductForm()
    resetEntryForm()
  }, [resetProductForm, resetEntryForm])

  const handleProductChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined
    setProductForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }))
    }
  }, [formErrors])

  const handleEntryChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setEntryForm(prev => ({ ...prev, [name]: value }))
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }))
    }
  }, [formErrors])

  const validateProductForm = useCallback((): boolean => {
    const errors: FormErrors = {}
    if (!productForm.name?.trim()) errors.name = 'Nome é obrigatório'
    if (productForm.price && parseFloat(String(productForm.price)) < 0) errors.price = 'Preço inválido'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }, [productForm])

  const validateEntryForm = useCallback((): boolean => {
    const errors: FormErrors = {}
    if (!entryForm.invoice_number?.trim()) errors.invoice_number = 'Número da NF é obrigatório'
    if (!entryForm.quantity || parseFloat(String(entryForm.quantity)) <= 0) errors.quantity = 'Quantidade deve ser maior que zero'
    if (!entryForm.unit_cost || parseFloat(String(entryForm.unit_cost)) <= 0) errors.unit_cost = 'Valor unitário deve ser maior que zero'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }, [entryForm])

  return {
    productForm,
    setProductForm,
    entryForm,
    setEntryForm,
    formErrors,
    setFormErrors,
    resetProductForm,
    resetEntryForm,
    resetAllForms,
    handleProductChange,
    handleEntryChange,
    validateProductForm,
    validateEntryForm
  }
}