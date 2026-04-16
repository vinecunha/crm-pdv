import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import ThemeToggle from '../components/ui/ThemeToggle'
import { useClock } from '../hooks/useClock'
import { useNotifications } from '../hooks/useNotifications'
import { 
  RefreshCw, 
  Calendar, 
  Clock, 
  ChevronRight,
  Home,
  User,
  Settings,
  LogOut
} from '../lib/icons'
import NotificationsPanel from './NotificationsPanel'

const Header = ({ collapsed }) => {
  const { user, profile, logout } = useAuth()
  const location = useLocation()
  const { greeting, formatTime, formatDate, refresh } = useClock()
  const { unreadCount } = useNotifications()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  // Usar display_name com fallback para full_name
  const displayName = profile?.display_name?.trim() || 
                      profile?.full_name?.trim().split(' ')[0] || 
                      user?.email?.split('@')[0] || 
                      'Usuário'

  const userInitial = displayName.charAt(0).toUpperCase()

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
      '/stock-count': 'Balanço de Estoque',
      '/profile': 'Meu Perfil'
    }
    return titles[location.pathname] || 'Sistema'
  }

  const getBreadcrumbItems = () => {
    const path = location.pathname
    const items = [
      { label: 'Home', path: '/dashboard', icon: Home }
    ]

    if (path === '/stock-count') {
      items.push({ label: 'Produtos', path: '/products' })
      items.push({ label: 'Balanço de Estoque', path: '/stock-count' })
    } else if (path === '/profile') {
      items.push({ label: 'Meu Perfil', path: '/profile' })
    } else if (path !== '/dashboard') {
      items.push({ label: getPageTitle(), path })
    }

    return items
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    refresh()
    window.location.reload()
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const handleLogout = async () => {
    if (window.confirm('Tem certeza que deseja sair do sistema?')) {
      await logout()
    }
  }

  const breadcrumbItems = getBreadcrumbItems()

  return (
    <header className={`
      sticky top-0 z-20 bg-gray-50/95 dark:bg-gray-900/95 backdrop-blur-sm
      transition-all duration-300
      ${collapsed ? 'lg:ml-20' : 'lg:ml-64'}
    `}>
      {/* Barra Superior - Status */}
      <div className="px-4 sm:px-6 py-2 border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 dark:bg-green-400 animate-pulse" />
              <span>Sistema Online</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar size={12} />
              <span>{formatDate()}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={12} />
              <span>{formatTime()}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between gap-1">
            <ThemeToggle />
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
              title="Atualizar página"
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="px-4 sm:px-6 py-4">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 mb-3 text-sm">
          {breadcrumbItems.map((item, index) => (
            <React.Fragment key={item.path}>
              {index > 0 && <ChevronRight size={14} className="text-gray-400 dark:text-gray-500" />}
              {index === breadcrumbItems.length - 1 ? (
                <span className="font-medium text-gray-900 dark:text-white">{item.label}</span>
              ) : (
                <Link
                  to={item.path}
                  className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  {item.icon && <item.icon size={14} />}
                  <span>{item.label}</span>
                </Link>
              )}
            </React.Fragment>
          ))}
        </nav>

        {/* Card Principal - Saudação e Ações */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="px-5 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              
              {/* Saudação */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 flex items-center justify-center text-white font-semibold text-lg shadow-md">
                    {userInitial}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 dark:bg-green-400 rounded-full border-2 border-white dark:border-gray-800" />
                </div>
                
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Olá, {displayName}!
                    </h2>
                    <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full">
                      {profile?.role === 'admin' ? 'Admin' : profile?.role === 'gerente' ? 'Gerente' : 'Operador'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{greeting}</p>
                </div>
              </div>

              {/* Ações Rápidas */}
              <div className="flex items-center gap-2">
                {/* Notificações */}
                <NotificationsPanel />

                {/* Menu do Usuário */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                  >
                    <Settings size={20} />
                  </button>

                  {showUserMenu && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setShowUserMenu(false)} 
                      />
                      <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20">
                        <Link
                          to="/profile"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <User size={16} />
                          Meu Perfil
                        </Link>
                        <Link
                          to="/settings"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Settings size={16} />
                          Configurações
                        </Link>
                        <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
                        <button
                          onClick={() => {
                            setShowUserMenu(false)
                            handleLogout()
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
                        >
                          <LogOut size={16} />
                          Sair
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Rodapé do Card */}
          <div className="px-5 py-3 bg-gray-50/50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 flex items-center gap-6 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400" />
              <span>{profile?.role === 'admin' ? 'Acesso Total' : profile?.role === 'gerente' ? 'Acesso Gerencial' : 'Acesso Operacional'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 dark:bg-green-400" />
              <span>Sessão ativa</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header