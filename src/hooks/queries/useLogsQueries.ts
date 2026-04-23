import { useQuery, QueryKey } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'

// Baseado em: public.system_logs
interface SystemLog {
  id: string
  user_id: string | null
  user_email: string | null
  user_role: string | null
  action: string
  entity_type: string | null
  entity_id: string | null
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  ip_address: string | null
  user_agent: string | null
  details: Record<string, unknown> | null
  created_at: string | null
}

// Baseado em: public.products e public.customers (registros deletados)
interface DeletedRecord {
  id: number
  name?: string
  email?: string
  deleted_at: string | null
  deleted_by: string | null
  deleter?: { email: string; full_name: string } | null
  _type: 'product' | 'customer'
  _typeLabel: string
  [key: string]: unknown
}

interface LogFilters {
  action?: string
  entity_type?: string
  user_role?: string
  date_from?: string
  date_to?: string
}

interface UseLogsQueriesProps {
  filters: LogFilters
  searchTerm: string
  activeTab: string
  canView: boolean
}

interface UseLogsQueriesReturn {
  logs: SystemLog[]
  loadingLogs: boolean
  logsError: Error | null
  refetchLogs: () => Promise<unknown>
  isFetchingLogs: boolean
  deletedRecords: DeletedRecord[]
  loadingDeleted: boolean
  deletedError: Error | null
  refetchDeleted: () => Promise<unknown>
  isFetchingDeleted: boolean
}

const fetchLogs = async ({ queryKey }: { queryKey: QueryKey }): Promise<SystemLog[]> => {
  const [, { filters, searchTerm }] = queryKey as [string, { filters: LogFilters; searchTerm: string }]
  
  let query = supabase.from('system_logs').select('*').order('created_at', { ascending: false }).limit(1000)
  
  if (filters.action) query = query.eq('action', filters.action)
  if (filters.entity_type) query = query.eq('entity_type', filters.entity_type)
  if (filters.user_role) query = query.eq('user_role', filters.user_role)
  if (filters.date_from) query = query.gte('created_at', filters.date_from)
  if (filters.date_to) query = query.lte('created_at', `${filters.date_to} 23:59:59`)

  const { data, error } = await query
  if (error) throw error

  let filteredData: SystemLog[] = data || []
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

const fetchDeletedRecords = async (): Promise<DeletedRecord[]> => {
  const [productsRes, customersRes] = await Promise.all([
    supabase.from('products').select('*, deleter:deleted_by(email, full_name)').not('deleted_at', 'is', null).order('deleted_at', { ascending: false }),
    supabase.from('customers').select('*, deleter:deleted_by(email, full_name)').not('deleted_at', 'is', null).order('deleted_at', { ascending: false })
  ])

  const products: DeletedRecord[] = (productsRes.data || []).map(p => ({ ...p, _type: 'product', _typeLabel: 'Produto' }))
  const customers: DeletedRecord[] = (customersRes.data || []).map(c => ({ ...c, _type: 'customer', _typeLabel: 'Cliente' }))

  return [...products, ...customers].sort((a, b) => new Date(b.deleted_at as string).getTime() - new Date(a.deleted_at as string).getTime())
}

export const useLogsQueries = ({
  filters,
  searchTerm,
  activeTab,
  canView
}: UseLogsQueriesProps): UseLogsQueriesReturn => {
  
  const { 
    data: logs = [], 
    isLoading: loadingLogs,
    error: logsError,
    refetch: refetchLogs,
    isFetching: isFetchingLogs
  } = useQuery<SystemLog[]>({
    queryKey: ['logs', { filters, searchTerm }],
    queryFn: fetchLogs,
    enabled: canView && activeTab === 'logs',
  })

  const { 
    data: deletedRecords = [], 
    isLoading: loadingDeleted,
    error: deletedError,
    refetch: refetchDeleted,
    isFetching: isFetchingDeleted
  } = useQuery<DeletedRecord[]>({
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