import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@lib/supabase'
import { useAuth } from '@contexts/AuthContext'
import { logger } from '@utils/logger'

// Baseado em: public.notifications
interface Notification {
  id: string // uuid
  user_id: string | null // uuid, FK auth.users
  title: string // character varying(255)
  message: string // text
  type: string | null // character varying(50), default 'info'
  read: boolean | null // boolean, default false
  read_at: string | null // timestamp with time zone
  link: string | null // text
  entity_id: string | null // text
  entity_type: string | null // character varying(100)
  created_at: string | null // timestamp with time zone
  updated_at: string | null // timestamp with time zone
}

interface UseNotificationsReturn {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  fetchNotifications: () => Promise<void>
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
}

export const useNotifications = (): UseNotificationsReturn => {
  const { profile } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)
  
  const isFetchingRef = useRef<boolean>(false)
  const lastFetchTimeRef = useRef<number>(0)
  const knownIdsRef = useRef<Set<string>>(new Set())

  const fetchNotifications = useCallback(async (force: boolean = false): Promise<void> => {
    if (isFetchingRef.current) {
      logger.log('Já está buscando notificações, ignorando...')
      return
    }

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
        const uniqueNotifications: Notification[] = []
        const seenIds = new Set<string>()
        
        for (const notification of data as Notification[]) {
          if (!seenIds.has(notification.id)) {
            seenIds.add(notification.id)
            uniqueNotifications.push(notification)
          } else {
            console.warn('Notificação duplicada encontrada no banco:', notification.id)
          }
        }

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

  const markAsRead = useCallback(async (notificationId: string): Promise<void> => {
    try {
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
        fetchNotifications(true)
        throw error
      }
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error)
    }
  }, [fetchNotifications])

  const markAllAsRead = useCallback(async (): Promise<void> => {
    const unreadNotifications = notifications.filter(n => !n.read)
    if (unreadNotifications.length === 0) return

    const unreadIds = unreadNotifications.map(n => n.id)

    try {
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
        fetchNotifications(true)
        throw error
      }
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error)
    }
  }, [notifications, profile?.id, fetchNotifications])

  useEffect(() => {
    if (!profile?.id) {
      setNotifications([])
      setUnreadCount(0)
      setLoading(false)
      return
    }

    setNotifications([])
    setUnreadCount(0)
    setLoading(true)
    knownIdsRef.current.clear()

    fetchNotifications(true)

    const interval = setInterval(() => {
      fetchNotifications()
    }, 15000)

    return () => {
      clearInterval(interval)
      isFetchingRef.current = false
    }
  }, [profile?.id, fetchNotifications])

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