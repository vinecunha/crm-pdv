// components/Header.jsx - VERSÃO CORRIGIDA (Hooks no topo)
import React, { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useClock } from '../hooks/useClock'
import { useNotifications } from '../hooks/useNotifications'
import { RefreshCw, LogOut } from 'lucide-react'
import NotificationsPanel from './NotificationsPanel'

const Header = ({ collapsed, onMobileMenuOpen }) => {
  // ============================================
  // TODOS OS HOOKS DEVEM VIR PRIMEIRO (SEM CONDIÇÕES)
  // ============================================
  const { user, profile, logout } = useAuth()
  const location = useLocation()
  const { greeting, formatTime, formatDate, refresh } = useClock()
  const { unreadCount } = useNotifications() // Hook de notificações
  const [isRefreshing, setIsRefreshing] = useState(false)

  // ============================================
  // FUNÇÕES AUXILIARES (DEPOIS DOS HOOKS)
  // ============================================
  const userName = profile?.full_name?.trim() 
    ? profile.full_name 
    : user?.email?.split('@')[0] || 'Usuário'

  const getPageTitle = () => {
    const titles = {
      '/dashboard': 'Dashboard',
      '/sales': 'PDV',
      '/sales-list': 'Gestão de Vendas',
      '/cashier': 'Fechamento de Caixa',
      '/coupons': 'Cupons',
      '/products': 'Produtos',
      '/customers': 'Clientes',
      '/reports': 'Relatórios',
      '/users': 'Usuários',
      '/logs': 'Logs do Sistema',
      '/settings': 'Configurações',
      '/stock-count': 'Produtos | Balanço de Estoque'
    }
    return titles[location.pathname] || 'Sistema'
  }

  // Função de refresh
  const handleRefresh = async () => {
    setIsRefreshing(true)
    refresh() // Atualiza o relógio
    window.location.reload() // Recarrega a página
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  // Função de logout
  const handleLogout = async () => {
    if (window.confirm('Tem certeza que deseja sair do sistema?')) {
      await logout()
    }
  }

  // ============================================
  // RENDER (SEM HOOKS AQUI!)
  // ============================================
  return (
    <div className={`
      transition-all duration-300
      ${collapsed ? 'lg:ml-20' : 'lg:ml-64'}
    `}>
      <div className="pt-4 sm:pt-6 px-4 sm:px-6 mb-6">
        
        {/* Breadcrumb */}
        <div className="mb-4 ms-14">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="text-blue-600">Home</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="font-medium text-gray-700">{getPageTitle()}</span>
          </div>
        </div>

        {/* Card único - Data e Hora */}
        <div className="mx-6 my-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              
              {/* Saudação e Nome do Usuário */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm text-gray-500">
                    Olá, <span className="font-semibold text-gray-900">{userName}</span>
                  </p>
                  <p className="text-xs text-gray-400">{greeting}</p>
                </div>
              </div>

              {/* Data e Hora */}
              <div className="flex items-center gap-6">
                <div className="flex flex-col items-center">
                  <span className="text-xs text-gray-400 uppercase tracking-wider">Data</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">{formatDate()}</span>
                  </div>
                </div>
                
                <div className="w-px h-10 bg-gray-200"></div>
                
                <div className="flex flex-col items-center">
                  <span className="text-xs text-gray-400 uppercase tracking-wider">Horário</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-mono font-medium text-gray-700">{formatTime()}</span>
                  </div>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex items-center gap-2">
                {/* Botão Refresh */}
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all disabled:opacity-50"
                  title="Atualizar página"
                >
                  <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
                
                {/* Componente de Notificações */}
                <NotificationsPanel />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Header 