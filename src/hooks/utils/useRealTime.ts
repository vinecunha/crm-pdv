import { useEffect, useRef } from 'react'
import { supabase } from '@lib/supabase'
import { logger } from '@utils/logger'

interface UseRealtimeConfig {
  table: string
  schema?: string
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
  filter?: string
  invalidateQueries?: string[]
  onChange?: () => void
  enabled?: boolean
}

export const useRealtime = ({
  table,
  event,
  onChange,
  enabled = true
}: UseRealtimeConfig): void => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!enabled) return

    const channel = supabase.channel(`${table}-changes`)
    
    channel.on('postgres_changes', { event, schema: 'public', table }, () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => onChange?.(), 300)
    }).subscribe()

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      supabase.removeChannel(channel)
    }
  }, [table, event, onChange, enabled])
}