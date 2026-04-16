import React, { useState, useRef, useEffect } from 'react'
import { Bell, CheckCheck, X, Info, AlertCircle, CheckCircle, AlertTriangle } from '../lib/icons'
import { useNotifications } from '../hooks/useNotifications'
import { useAuth } from '../contexts/AuthContext'

const NotificationsPanel = () => {
  const { profile } = useAuth()
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)
  const panelRef = useRef(null)
  const buttonRef = useRef(null)

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        panelRef.current && 
        !panelRef.current.contains(event.target) &&
        buttonRef.current && 
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false)
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const getIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500 dark:text-green-400 flex-shrink-0" />
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500 dark:text-yellow-400 flex-shrink-0" />
      case 'error': return <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0" />
      case 'info':
      default: return <Info className="w-5 h-5 text-blue-500 dark:text-blue-400 flex-shrink-0" />
    }
  }

  const formatTime = (date) => {
    if (!date) return ''
    const now = new Date()
    const diff = now - new Date(date)
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Agora mesmo'
    if (minutes < 60) return `${minutes} min atrás`
    if (hours < 24) return `${hours} h atrás`
    if (days === 1) return 'Ontem'
    if (days < 7) return `${days} dias atrás`
    return new Date(date).toLocaleDateString('pt-BR')
  }

  return (
    <div className="relative">
      {/* Botão de notificações */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 dark:bg-red-400 rounded-full animate-pulse" />
        )}
      </button>

      {/* Overlay para mobile - cobre toda a tela mas NÃO afeta o header */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Painel de notificações - Posicionado absolutamente em relação ao container */}
      {isOpen && (
        <div
          ref={panelRef}
          className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden flex flex-col"
          style={{ maxHeight: 'min(70vh, 500px)' }}
        >
          {/* Cabeçalho */}
          <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Notificações</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {unreadCount} não {unreadCount === 1 ? 'lida' : 'lidas'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Limpar
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="lg:hidden p-1 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Lista de notificações */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 dark:border-blue-400 mx-auto" />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Carregando...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Bell className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Nenhuma notificação</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">As notificações aparecerão aqui</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`
                      p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer
                      ${!notification.read ? 'bg-blue-50/30 dark:bg-blue-900/20 border-l-4 border-l-blue-500 dark:border-l-blue-400' : ''}
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
                      {getIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {notification.title}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                            {formatTime(notification.created_at)}
                          </p>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="flex-shrink-0">
                          <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full mt-1.5" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <button
              onClick={() => setIsOpen(false)}
              className="w-full text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-center"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationsPanel