// src/hooks/forms/useProductForms.js
import { useState, useCallback } from 'react'

const initialProductForm = {
  code: '', name: '', description: '', category: '', unit: 'UN',
  price: '', min_stock: '', max_stock: '', location: '', brand: '', weight: '',
  is_active: true
}

const initialEntryForm = {
  invoice_number: '', invoice_series: '', supplier_name: '', supplier_cnpj: '',
  batch_number: '', manufacture_date: '', expiration_date: '',
  quantity: '', unit_cost: '', notes: ''
}

export const useProductForms = () => {
  const [productForm, setProductForm] = useState(initialProductForm)
  const [entryForm, setEntryForm] = useState(initialEntryForm)
  const [formErrors, setFormErrors] = useState({})

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

  const handleProductChange = useCallback((e) => {
    const { name, value, type, checked } = e.target
    setProductForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }))
    }
  }, [formErrors])

  const handleEntryChange = useCallback((e) => {
    const { name, value } = e.target
    setEntryForm(prev => ({ ...prev, [name]: value }))
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }))
    }
  }, [formErrors])

  const validateProductForm = useCallback(() => {
    const errors = {}
    if (!productForm.name?.trim()) errors.name = 'Nome é obrigatório'
    if (productForm.price && parseFloat(productForm.price) < 0) errors.price = 'Preço inválido'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }, [productForm])

  const validateEntryForm = useCallback(() => {
    const errors = {}
    if (!entryForm.invoice_number?.trim()) errors.invoice_number = 'Número da NF é obrigatório'
    if (!entryForm.quantity || parseFloat(entryForm.quantity) <= 0) errors.quantity = 'Quantidade deve ser maior que zero'
    if (!entryForm.unit_cost || parseFloat(entryForm.unit_cost) <= 0) errors.unit_cost = 'Valor unitário deve ser maior que zero'
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
