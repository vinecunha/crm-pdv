import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSystemLogs } from '@hooks/system/useSystemLogs'
import * as productService from '@services/product/productService'
import type { Product } from '@/types'

interface ProductFormData {
  updated_by: string | null
  deleted_at: string | null
  deleted_by: string | null
}

// Baseado em: public.product_entries
interface ProductEntry {
  product_id: number
  invoice_number: string
  quantity: number
  unit_cost: number
  total_cost: number
  invoice_series?: string | null
  supplier_name?: string | null
  supplier_cnpj?: string | null
  batch_number?: string | null
  manufacture_date?: string | null
  expiration_date?: string | null
  entry_date?: string
  notes?: string | null
  created_by: string
}

interface Profile {
  id: string
  [key: string]: unknown
}

interface ProductCallbacks {
  onSuccess?: (action: string, data: unknown) => void
  onError?: (error: Error) => void
  onProductCreated?: (data: Product) => void
  onProductUpdated?: (data: Product) => void
  onProductDeleted?: (id: number) => void
  onEntryCreated?: () => void
  onEntryError?: (error: Error) => void
}

interface UseProductMutationsReturn {
  createMutation: ReturnType<typeof useMutation>
  updateMutation: ReturnType<typeof useMutation>
  deleteMutation: ReturnType<typeof useMutation>
  entryMutation: ReturnType<typeof useMutation>
  isMutating: boolean
}

export const useProductMutations = (
  profile: Profile | null,
  callbacks: ProductCallbacks = {}
): UseProductMutationsReturn => {
  const queryClient = useQueryClient()
  const { logCreate, logUpdate, logDelete, logError } = useSystemLogs()

  const {
    onSuccess: onAnySuccess,
    onError: onAnyError,
    onProductCreated,
    onProductUpdated,
    onProductDeleted,
    onEntryCreated,
    onEntryError
  } = callbacks

  const createMutation = useMutation({
    mutationFn: (data: Partial<Product>) => productService.createProduct(data, profile),
    onSuccess: async (data: Product) => {
      await logCreate('product', data.id.toString(), data)
      queryClient.invalidateQueries({ queryKey: ['products'] })
      onProductCreated?.(data)
      onAnySuccess?.('create', data)
    },
    onError: async (error: Error) => {
      await logError('product', error, { action: 'create' })
      onAnyError?.(error)
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Product> }) => 
      productService.updateProduct(id, data, profile),
    onSuccess: async (data: Product) => {
      await logUpdate('product', data.id.toString(), null, data)
      queryClient.invalidateQueries({ queryKey: ['products'] })
      onProductUpdated?.(data)
      onAnySuccess?.('update', data)
    },
    onError: (error: Error) => onAnyError?.(error)
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => productService.deleteProduct(id),
    onSuccess: async (id: number) => {
      await logDelete('product', id.toString(), {})
      queryClient.invalidateQueries({ queryKey: ['products'] })
      onProductDeleted?.(id)
      onAnySuccess?.('delete', id)
    },
    onError: (error: Error) => onAnyError?.(error)
  })

  const entryMutation = useMutation({
    mutationFn: (data: ProductEntry) => productService.createProductEntry(data, profile),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['product-details'] })
      onEntryCreated?.()
      onAnySuccess?.('entry')
    },
    onError: async (error: Error) => {
      await logError('product_entry', error, { action: 'create_entry' })
      onEntryError?.(error)
      onAnyError?.(error)
    }
  })

  const isMutating = createMutation.isPending || updateMutation.isPending || 
                     deleteMutation.isPending || entryMutation.isPending

  return {
    createMutation,
    updateMutation,
    deleteMutation,
    entryMutation,
    isMutating
  }
}