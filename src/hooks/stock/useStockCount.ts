import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { useAuth } from '@contexts/AuthContext'

const addAllProductsToSession = async ({ sessionId, products }) => {
  const itemsToAdd = products.map(product => ({
    count_session_id: sessionId,
    product_id: product.id,
    system_quantity: product.stock_quantity || 0,
    system_cost: product.cost_price || 0,
    counted_quantity: null,
    status: 'pending'
  }))

  const { error } = await supabase.from('stock_count_items').insert(itemsToAdd)
  if (error) throw error
}

const addProductToSession = async ({ sessionId, product }) => {
  const { data, error } = await supabase
    .from('stock_count_items')
    .insert([{
      count_session_id: sessionId,
      product_id: product.id,
      system_quantity: product.stock_quantity || 0,
      system_cost: product.cost_price || 0,
      counted_quantity: null,
      status: 'pending'
    }])
    .select(`*, product:products(*)`)
    .single()

  if (error) throw error
  return data
}

const updateCountItem = async ({ itemId, countData, profile }) => {
  const { data, error } = await supabase
    .from('stock_count_items')
    .update({
      ...countData,
      counted_by: profile?.id,
      counted_at: new Date().toISOString()
    })
    .eq('id', itemId)
    .select(`*, product:products(*)`)
    .single()

  if (error) throw error
  return data
}

export const useStockCount = (sessionId) => {
  const { profile } = useAuth()
  const queryClient = useQueryClient()

  const addAllMutation = useMutation({
    mutationFn: (products) => addAllProductsToSession({ sessionId, products }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stockSessionItems', sessionId] })
    }
  })

  const addProductMutation = useMutation({
    mutationFn: (product) => addProductToSession({ sessionId, product }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stockSessionItems', sessionId] })
    }
  })

  const updateItemMutation = useMutation({
    mutationFn: ({ itemId, countData }) => updateCountItem({ itemId, countData, profile }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stockSessionItems', sessionId] })
    }
  })

  return {
    addAllProducts: addAllMutation.mutate,
    addProduct: addProductMutation.mutate,
    updateItem: updateItemMutation.mutate,
    addAllLoading: addAllMutation.isPending,
    addProductLoading: addProductMutation.isPending,
    updateItemLoading: updateItemMutation.isPending
  }
}