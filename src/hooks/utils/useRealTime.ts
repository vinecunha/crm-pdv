// src/hooks/utils/useRealTime.ts (CORRIGIDO)
import { useEffect, useRef } from 'react'
import { supabase } from '@lib/supabase'

interface UseRealtimeConfig {
  table: string
  schema?: string
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
  filter?: string
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
    if (!enabled || !onChange) return

    // ✅ Nome de canal ÚNICO por tabela + evento
    const channelName = `${table}-${event}-${Math.random().toString(36).substring(7)}`
    
    const channel = supabase.channel(channelName)
    
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