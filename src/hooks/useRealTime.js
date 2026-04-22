// src/hooks/useRealtime.js
import { useEffect, useRef } from 'react'
import { supabase } from '@lib/supabase'
import { useQueryClient } from '@tanstack/react-query'
import { logger } from '@utils/logger'

/**
 * Hook genérico para assinar mudanças em tabelas via Supabase Realtime
 * 
 * @param {Object} config - Configuração da subscription
 * @param {string} config.table - Nome da tabela
 * @param {string} config.schema - Schema (default: 'public')
 * @param {string} config.event - Evento: 'INSERT', 'UPDATE', 'DELETE', '*' (todos)
 * @param {string|Function} config.filter - Filtro opcional (ex: "status=eq.pending")
 * @param {Array<string>} config.invalidateQueries - Queries para invalidar
 * @param {Function} config.onChange - Callback opcional quando houver mudança
 * @param {boolean} config.enabled - Se deve ativar a subscription (default: true)
 */
export const useRealtime = ({ table, event, onChange, enabled }) => {
  const timeoutRef = useRef(null)

  useEffect(() => {
    if (!enabled) return

    const channel = supabase.channel(`${table}-changes`)
    
    channel.on('postgres_changes', { event, schema: 'public', table }, () => {
      // Debounce para evitar múltiplas chamadas
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => onChange?.(), 300)
    }).subscribe()

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      supabase.removeChannel(channel)
    }
  }, [table, event, onChange, enabled])
}