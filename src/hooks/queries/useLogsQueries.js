// src/hooks/queries/useLogsQueries.js
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'

const fetchLogs = async ({ queryKey }) => {
  const [, { filters, searchTerm }] = queryKey
  
  let query = supabase.from('system_logs').select('*').order('created_at', { ascending: false }).limit(1000)
  
  if (filters.action) query = query.eq('action', filters.action)
  if (filters.entity_type) query = query.eq('entity_type', filters.entity_type)
  if (filters.user_role) query = query.eq('user_role', filters.user_role)
  if (filters.date_from) query = query.gte('created_at', filters.date_from)
  if (filters.date_to) query = query.lte('created_at', `${filters.date_to} 23:59:59`)

  const { data, error } = await query
  if (error) throw error

  let filteredData = data || []
  if (searchTerm) {
    const searchLower = searchTerm.toLowerCase()
    filteredData = filteredData.filter(log =>
      log.user_email?.toLowerCase().includes(searchLower) ||
      log.action?.toLowerCase().includes(searchLower) ||
      log.entity_type?.toLowerCase().includes(searchLower)
    )
  }
  
  return filteredData
}

const fetchDeletedRecords = async () => {
  const [productsRes, customersRes] = await Promise.all([
    supabase.from('products').select('*, deleter:deleted_by(email, full_name)').not('deleted_at', 'is', null).order('deleted_at', { ascending: false }),
    supabase.from('customers').select('*, deleter:deleted_by(email, full_name)').not('deleted_at', 'is', null).order('deleted_at', { ascending: false })
  ])

  const products = (productsRes.data || []).map(p => ({ ...p, _type: 'product', _typeLabel: 'Produto' }))
  const customers = (customersRes.data || []).map(c => ({ ...c, _type: 'customer', _typeLabel: 'Cliente' }))

  return [...products, ...customers].sort((a, b) => new Date(b.deleted_at) - new Date(a.deleted_at))
}

export const useLogsQueries = ({ filters, searchTerm, activeTab, canView }) => {
  // Query de logs do sistema
  const { 
    data: logs = [], 
    isLoading: loadingLogs,
    error: logsError,
    refetch: refetchLogs,
    isFetching: isFetchingLogs
  } = useQuery({
    queryKey: ['logs', { filters, searchTerm }],
    queryFn: fetchLogs,
    enabled: canView && activeTab === 'logs',
  })

  // Query de registros deletados
  const { 
    data: deletedRecords = [], 
    isLoading: loadingDeleted,
    error: deletedError,
    refetch: refetchDeleted,
    isFetching: isFetchingDeleted
  } = useQuery({
    queryKey: ['deleted-records'],
    queryFn: fetchDeletedRecords,
    enabled: canView && activeTab === 'deleted',
  })

  return {
    logs,
    loadingLogs,
    logsError,
    refetchLogs,
    isFetchingLogs,
    deletedRecords,
    loadingDeleted,
    deletedError,
    refetchDeleted,
    isFetchingDeleted
  }
}
