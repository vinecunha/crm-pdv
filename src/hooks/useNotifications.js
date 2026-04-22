import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@lib/supabase'
import { useAuth } from '@contexts/AuthContext'
import { logger } from '@utils/logger' 

export const useNotifications = () => {
  const { profile } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  
  // Refs para controle
  const isFetchingRef = useRef(false)
  const lastFetchTimeRef = useRef(0)
  const knownIdsRef = useRef(new Set())

  const fetchNotifications = useCallback(async (force = false) => {
    // Evitar requisições simultâneas
    if (isFetchingRef.current) {
      logger.log('Já está buscando notificações, ignorando...')
      return
    }

    // Throttle: mínimo 3 segundos entre requisições (exceto se forçado)
    const now = Date.now()
    if (!force && now - lastFetchTimeRef.current < 3000) {
      return
    }

    if (!profile?.id) return

    try {
      isFetchingRef.current = true
      lastFetchTimeRef.current = now

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      if (data) {
        // Filtrar duplicatas usando Set
        const uniqueNotifications = []
        const seenIds = new Set()
        
        for (const notification of data) {
          if (!seenIds.has(notification.id)) {
            seenIds.add(notification.id)
            uniqueNotifications.push(notification)
          } else {
            console.warn('Notificação duplicada encontrada no banco:', notification.id)
          }
        }

        // Atualizar knownIds
        uniqueNotifications.forEach(n => knownIdsRef.current.add(n.id))

        setNotifications(uniqueNotifications)
        setUnreadCount(uniqueNotifications.filter(n => !n.read).length)
        setLoading(false)
      }
    } catch (error) {
      console.error('Erro ao buscar notificações:', error)
      setLoading(false)
    } finally {
      isFetchingRef.current = false
    }
  }, [profile?.id])

  const markAsRead = useCallback(async (notificationId) => {
    try {
      // Atualização otimista
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, read: true, read_at: new Date().toISOString() } : n
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))

      const { error } = await supabase
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId)

      if (error) {
        // Reverter em caso de erro
        fetchNotifications(true)
        throw error
      }
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error)
    }
  }, [fetchNotifications])

  const markAllAsRead = useCallback(async () => {
    const unreadNotifications = notifications.filter(n => !n.read)
    if (unreadNotifications.length === 0) return

    const unreadIds = unreadNotifications.map(n => n.id)

    try {
      // Atualização otimista
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true, read_at: new Date().toISOString() }))
      )
      setUnreadCount(0)

      const { error } = await supabase
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .in('id', unreadIds)
        .eq('user_id', profile?.id)

      if (error) {
        // Reverter em caso de erro
        fetchNotifications(true)
        throw error
      }
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error)
    }
  }, [notifications, profile?.id, fetchNotifications])

  // Busca inicial e polling
  useEffect(() => {
    if (!profile?.id) {
      setNotifications([])
      setUnreadCount(0)
      setLoading(false)
      return
    }

    // Resetar estado ao mudar de usuário
    setNotifications([])
    setUnreadCount(0)
    setLoading(true)
    knownIdsRef.current.clear()

    // Busca inicial
    fetchNotifications(true)

    // Polling a cada 15 segundos (mais espaçado para evitar sobrecarga)
    const interval = setInterval(() => {
      fetchNotifications()
    }, 15000)

    return () => {
      clearInterval(interval)
      isFetchingRef.current = false
    }
  }, [profile?.id, fetchNotifications])

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      knownIdsRef.current.clear()
    }
  }, [])

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications: () => fetchNotifications(true),
    markAsRead,
    markAllAsRead
  }
}