import { useCallback, ChangeEvent } from 'react'
import { useFormWithSchema } from './useFormWithSchema'
import { z } from 'zod'

const productSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(3, 'Nome é obrigatório'),
  description: z.string().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  unit: z.string().default('UN'),
  price: z.union([z.number(), z.string()]).optional(),
  min_stock: z.union([z.number(), z.string()]).optional(),
  max_stock: z.union([z.number(), z.string()]).optional(),
  location: z.string().optional(),
  weight: z.union([z.number(), z.string()]).optional(),
  is_active: z.boolean().default(true)
})

const entrySchema = z.object({
  invoice_number: z.string().min(1, 'Número da NF é obrigatório'),
  invoice_series: z.string().optional(),
  supplier_name: z.string().optional(),
  supplier_cnpj: z.string().optional(),
  batch_number: z.string().optional(),
  manufacture_date: z.string().optional(),
  expiration_date: z.string().optional(),
  quantity: z.union([z.number(), z.string()]).optional(),
  unit_cost: z.union([z.number(), z.string()]).optional(),
  notes: z.string().optional()
})

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
  formErrors: Record<string, string>
  setFormErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>
  resetProductForm: () => void
  resetEntryForm: () => void
  resetAllForms: () => void
  handleProductChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
  handleEntryChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
  validateProductForm: () => boolean
  validateEntryForm: () => boolean
}

export const useProductForms = (): UseProductFormsReturn => {
  const productFormHook = useFormWithSchema(productSchema, initialProductForm) as any
  const entryFormHook = useFormWithSchema(entrySchema, initialEntryForm) as any

  const { watch: watchProduct, setValue: setProductValue, reset: resetProduct, getValues: getProductValues } = productFormHook
  const { watch: watchEntry, setValue: setEntryValue, reset: resetEntry, getValues: getEntryValues } = entryFormHook

  const productForm = watchProduct() as ProductFormData
  const entryForm = watchEntry() as EntryFormData
  const formErrors = { ...productFormHook.formState.errors, ...entryFormHook.formState.errors } as Record<string, string>

  const setFormErrors = (errors: Record<string, string>) => {
    Object.entries(errors).forEach(([key, value]) => {
      if (value) {
        (productFormHook.setError || entryFormHook.setError)(key as any, { message: value })
      }
    })
  }

  const resetProductForm = useCallback(() => {
    resetProduct(initialProductForm)
  }, [resetProduct])

  const resetEntryForm = useCallback(() => {
    resetEntry(initialEntryForm)
  }, [resetEntry])

  const resetAllForms = useCallback(() => {
    resetProductForm()
    resetEntryForm()
  }, [resetProductForm, resetEntryForm])

  const handleProductChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined
    setProductValue(name as any, type === 'checkbox' ? checked : value)
  }, [setProductValue])

  const handleEntryChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined
    setEntryValue(name as any, type === 'checkbox' ? checked : value)
  }, [setEntryValue])

  const validateProductForm = useCallback(async (): Promise<boolean> => {
    const result = await productFormHook.validate()
    return result.success
  }, [productFormHook])

  const validateEntryForm = useCallback(async (): Promise<boolean> => {
    const result = await entryFormHook.validate()
    return result.success
  }, [entryFormHook])

  return {
    productForm: productForm || initialProductForm,
    setProductForm: (data: ProductFormData) => {
      Object.entries(data).forEach(([key, value]) => setProductValue(key as any, value))
    },
    entryForm: entryForm || initialEntryForm,
    setEntryForm: (data: EntryFormData) => {
      Object.entries(data).forEach(([key, value]) => setEntryValue(key as any, value))
    },
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