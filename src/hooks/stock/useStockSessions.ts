import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { useSystemLogs } from '@hooks/system/useSystemLogs'

const fetchCountSessions = async () => {
  const { data, error } = await supabase
    .from('stock_count_sessions')
    .select(`*, items:stock_count_items(count)`)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

const createStockSession = async ({ sessionData, profile }) => {
  const { data, error } = await supabase
    .from('stock_count_sessions')
    .insert([{ ...sessionData, created_by: profile?.id }])
    .select()
    .single()

  if (error) throw error
  return data
}

const cancelSession = async ({ sessionId, profile }) => {
  const { error } = await supabase
    .from('stock_count_sessions')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancelled_by: profile?.id
    })
    .eq('id', sessionId)

  if (error) throw error
}

const finishSession = async ({ session, sessionItems, stats, profile }) => {
  const divergedItems = sessionItems.filter(item => item.status === 'diverged')

  for (const item of divergedItems) {
    if (!item.product) continue

    const adjustmentQuantity = item.counted_quantity - item.system_quantity

    await supabase.from('stock_movements').insert([{
      product_id: item.product_id,
      movement_type: 'ADJUSTMENT',
      quantity: adjustmentQuantity,
      quantity_before: item.system_quantity,
      quantity_after: item.counted_quantity,
      reason: `Balanço #${session.name} - Ajuste de estoque`,
      reference_type: 'stock_count',
      reference_id: session.id,
      created_by: profile?.id
    }])

    await supabase
      .from('products')
      .update({
        stock_quantity: item.counted_quantity,
        updated_by: profile?.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', item.product_id)
  }

  const { error } = await supabase
    .from('stock_count_sessions')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      completed_by: profile?.id,
      total_items: sessionItems.length,
      counted_items: stats.countedItems,
      diverged_items: stats.differences
    })
    .eq('id', session.id)

  if (error) throw error
  
  return { divergedCount: divergedItems.length }
}

export const useStockSessions = () => {
  const { profile } = useAuth()
  const { logCreate, logAction } = useSystemLogs()
  const queryClient = useQueryClient()

  const sessionsQuery = useQuery({
    queryKey: ['stockSessions'],
    queryFn: fetchCountSessions,
    staleTime: 30000
  })

  const createMutation = useMutation({
    mutationFn: (sessionData) => createStockSession({ sessionData, profile }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stockSessions'] })
    }
  })

  const cancelMutation = useMutation({
    mutationFn: (sessionId) => cancelSession({ sessionId, profile }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stockSessions'] })
    }
  })

  const finishMutation = useMutation({
    mutationFn: ({ session, sessionItems, stats }) => 
      finishSession({ session, sessionItems, stats, profile }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stockSessions'] })
    }
  })

  return {
    sessions: sessionsQuery.data || [],
    isLoading: sessionsQuery.isLoading,
    error: sessionsQuery.error,
    createSession: createMutation.mutate,
    cancelSession: cancelMutation.mutate,
    finishSession: finishMutation.mutateAsync,
    createSessionMutation: createMutation,
    cancelSessionMutation: cancelMutation,
    finishSessionMutation: finishMutation
  }
}