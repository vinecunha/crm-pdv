import React, { useState, useRef, useEffect } from 'react'
import { Bell, Check, CheckCheck, X, Info, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react'
import { useNotifications } from '../hooks/useNotifications'
import { useAuth } from '../contexts/AuthContext.jsx'

const NotificationsPanel = () => {
  const { profile } = useAuth()
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)
  const panelRef = useRef(null)

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case 'error': return <AlertCircle className="w-5 h-5 text-red-500" />
      case 'info':
      default: return <Info className="w-5 h-5 text-blue-500" />
    }
  }

  const getTypeColor = (type) => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200'
      case 'warning': return 'bg-yellow-50 border-yellow-200'
      case 'error': return 'bg-red-50 border-red-200'
      case 'info':
      default: return 'bg-blue-50 border-blue-200'
    }
  }

  const formatTime = (date) => {
    const now = new Date()
    const diff = now - new Date(date)
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Agora mesmo'
    if (minutes < 60) return `${minutes} min atrás`
    if (hours < 24) return `${hours} h atrás`
    if (days === 1) return 'Ontem'
    return `${days} dias atrás`
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Botão de notificações */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        )}
      </button>

      {/* Painel de notificações */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
          {/* Cabeçalho */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
            <div>
              <h3 className="font-semibold text-gray-900">Notificações</h3>
              <p className="text-xs text-gray-500">
                {unreadCount} não {unreadCount === 1 ? 'lida' : 'lidas'}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <CheckCheck className="w-3 h-3" />
                Marcar todas como lidas
              </button>
            )}
          </div>

          {/* Lista de notificações */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto" />
                <p className="text-xs text-gray-500 mt-2">Carregando...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Nenhuma notificação</p>
                <p className="text-xs text-gray-400 mt-1">As notificações aparecerão aqui</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`
                    p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer
                    ${!notification.read ? 'bg-blue-50/30' : ''}
                  `}
                  onClick={() => {
                    if (!notification.read) markAsRead(notification.id)
                    if (notification.link) {
                      window.location.href = notification.link
                      setIsOpen(false)
                    }
                  }}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-gray-900">
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-400 flex-shrink-0">
                          {formatTime(notification.created_at)}
                        </p>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      {notification.entity_type && (
                        <p className="text-xs text-gray-400 mt-1">
                          {notification.entity_type}
                        </p>
                      )}
                    </div>
                    {!notification.read && (
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-2 border-t border-gray-200 bg-gray-50 text-center">
              <button
                onClick={() => {
                  // Navegar para página de notificações (opcional)
                  setIsOpen(false)
                }}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Ver todas as notificações
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default NotificationsPanel