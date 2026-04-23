// src/hooks/mutations/useProductMutations.js
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSystemLogs } from '@hooks/system/useSystemLogs'
import * as productService from '@services/product/productService'

export const useProductMutations = (profile, callbacks = {}) => {
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
    mutationFn: (data) => productService.createProduct(data, profile),
    onSuccess: async (data) => {
      await logCreate('product', data.id, data)
      queryClient.invalidateQueries({ queryKey: ['products'] })
      onProductCreated?.(data)
      onAnySuccess?.('create', data)
    },
    onError: async (error) => {
      await logError('product', error, { action: 'create' })
      onAnyError?.(error)
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => productService.updateProduct(id, data, profile),
    onSuccess: async (data) => {
      await logUpdate('product', data.id, null, data)
      queryClient.invalidateQueries({ queryKey: ['products'] })
      onProductUpdated?.(data)
      onAnySuccess?.('update', data)
    },
    onError: (error) => onAnyError?.(error)
  })

  const deleteMutation = useMutation({
    mutationFn: productService.deleteProduct,
    onSuccess: async (id) => {
      await logDelete('product', id)
      queryClient.invalidateQueries({ queryKey: ['products'] })
      onProductDeleted?.(id)
      onAnySuccess?.('delete', id)
    },
    onError: (error) => onAnyError?.(error)
  })

  const entryMutation = useMutation({
    mutationFn: (data) => productService.createProductEntry(data, profile),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['product-details'] })
      onEntryCreated?.()
      onAnySuccess?.('entry')
    },
    onError: async (error) => {
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
