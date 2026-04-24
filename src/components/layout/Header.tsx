// src/components/layout/Header.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@contexts/AuthContext'
import { useCompany } from '@hooks/system/useCompany'
import { useClock } from '@hooks/utils/useClock'
import { useNetworkStatus } from '@/hooks/utils/useNetworkStatus'
import GlobalSearch from '@components/GlobalSearch'
import ThemeSelector from '@components/ui/ThemeSelector'
import NotificationsPanel from '@components/NotificationsPanel'
import ConfirmModal from '@components/ui/ConfirmModal'
import {
  RefreshCw,
  Calendar,
  Clock,
  ChevronRight,
  Home,
  User,
  Settings,
  LogOut,
  Search,
  Menu,
  ChevronDown
} from '@lib/icons'

interface HeaderProps {
  collapsed: boolean
  onToggleSidebar: () => void
  onMobileMenuToggle: () => void
}

const Header: React.FC<HeaderProps> = ({ 
  collapsed, 
  onToggleSidebar, 
  onMobileMenuToggle 
}) => {
  const { user, profile, logout } = useAuth()
  const { company, getCompanyColor } = useCompany()
  const location = useLocation()
  const { formatTime, formatDate, refresh } = useClock()
  const { isOnline } = useNetworkStatus()
  
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isCompact, setIsCompact] = useState(false)
  
  const headerRef = useRef<HTMLDivElement>(null)
  const lastScrollY = useRef(0)
  const scrollTimeout = useRef<NodeJS.Timeout>()

  const primaryColor = getCompanyColor('primary') || '#3B82F6'
  const secondaryColor = getCompanyColor('secondary') || '#8B5CF6'

  const displayName = profile?.display_name?.trim() || 
                      profile?.full_name?.trim().split(' ')[0] || 
                      user?.email?.split('@')[0] || 
                      'Usuário'

  const userInitial = displayName.charAt(0).toUpperCase()
  const avatarUrl = profile?.avatar_url

  // Scroll handler
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      setIsScrolled(currentScrollY > 20)
      
      if (currentScrollY > 100 && currentScrollY > lastScrollY.current) {
        setIsCompact(true)
      } else if (currentScrollY < 50) {
        setIsCompact(false)
      }
      
      lastScrollY.current = currentScrollY
      
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current)
      }
      
      scrollTimeout.current = setTimeout(() => {
        if (currentScrollY < 100) {
          setIsCompact(false)
        }
      }, 2000)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current)
      }
    }
  }, [])

  // Fecha menus ao mudar de rota
  useEffect(() => {
    setShowUserMenu(false)
    setShowSearch(false)
  }, [location.pathname])

  const getPageTitle = useCallback((): string => {
    const titles: Record<string, string> = {
      '/dashboard': 'Dashboard',
      '/sales': 'PDV',
      '/sales-list': 'Histórico',
      '/cashier': 'Fechar Caixa',
      '/coupons': 'Cupons',
      '/products': 'Produtos',
      '/customers': 'Clientes',
      '/reports': 'Relatórios',
      '/users': 'Usuários',
      '/logs': 'Logs',
      '/settings': 'Configurações',
      '/stock-count': 'Balanço',
      '/profile': 'Meu Perfil',
      '/tasks': 'Tarefas'
    }
    return titles[location.pathname] || 'Dashboard'
  }, [location.pathname])

  const getBreadcrumbItems = useCallback(() => {
    const path = location.pathname
    const items = [{ label: 'Home', path: '/dashboard', icon: Home }]

    if (path !== '/dashboard') {
      items.push({ label: getPageTitle(), path })
    }

    return items
  }, [location.pathname, getPageTitle])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    refresh()
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const handleLogoutClick = () => {
    setShowUserMenu(false)
    setShowLogoutConfirm(true)
  }

  const handleLogoutConfirm = async () => {
    setShowLogoutConfirm(false)
    await logout()
  }

  const breadcrumbItems = getBreadcrumbItems()

  return (
    <>
      <header 
        ref={headerRef}
        className={`
          sticky top-0 z-20 bg-gray-50/95 dark:bg-gray-900/95 backdrop-blur-sm
          transition-all duration-300
          ${collapsed ? 'lg:ml-20' : 'lg:ml-64'}
          ${isCompact ? '-translate-y-full lg:-translate-y-0' : 'translate-y-0'}
        `}
      >
        {/* Status Bar */}
        <div className={`
          border-b border-gray-200/50 dark:border-gray-700/50 
          transition-all duration-300 overflow-hidden
          ${isScrolled ? 'h-0 opacity-0' : 'h-auto opacity-100'}
        `}>
          <div className="px-3 sm:px-4 lg:px-6 py-1.5 sm:py-2">
            <div className="flex items-center justify-between">
              {/* Left */}
              <div className="flex items-center gap-3 sm:gap-6 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                <button
                  onClick={onMobileMenuToggle}
                  className="lg:hidden p-1.5 -ml-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  aria-label="Abrir menu"
                >
                  <Menu size={16} />
                </button>
                
                <div className="hidden sm:flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    isOnline ? 'bg-green-500' : 'bg-yellow-500'
                  }`} />
                  <span>{isOnline ? 'Online' : 'Offline'}</span>
                </div>
                
                <div className="hidden md:flex items-center gap-1.5">
                  <Calendar size={12} className="sm:w-3.5 sm:h-3.5" />
                  <span className="hidden sm:inline">{formatDate()}</span>
                </div>
                
                <div className="hidden md:flex items-center gap-1.5">
                  <Clock size={12} className="sm:w-3.5 sm:h-3.5" />
                  <span className="hidden sm:inline">{formatTime()}</span>
                </div>
              </div>
              
              {/* Right */}
              <div className="flex items-center gap-1 sm:gap-2">
                <ThemeSelector />
                
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="p-1.5 sm:p-2 rounded-lg text-gray-400 dark:text-gray-500 
                    hover:text-gray-600 dark:hover:text-gray-300 
                    hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                  title="Atualizar"
                >
                  <RefreshCw size={14} className={`sm:w-4 sm:h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className={`
          transition-all duration-300
          ${isScrolled && isCompact ? 'py-2 px-3 sm:px-4 lg:px-6' : 'py-3 sm:py-4 px-3 sm:px-4 lg:px-6'}
        `}>
          {/* Breadcrumb */}
          <nav className={`
            hidden sm:flex items-center gap-1.5 mb-2 sm:mb-3 text-[11px] sm:text-sm
            transition-all duration-300
            ${isScrolled && isCompact ? 'opacity-0 h-0 mb-0' : 'opacity-100'}
          `}>
            {breadcrumbItems.map((item, index) => (
              <React.Fragment key={item.path}>
                {index > 0 && <ChevronRight size={12} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />}
                {index === breadcrumbItems.length - 1 ? (
                  <span className="font-medium text-gray-900 dark:text-white truncate">
                    {item.label}
                  </span>
                ) : (
                  <Link
                    to={item.path}
                    className="flex items-center gap-1 text-gray-500 dark:text-gray-400 
                      hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate"
                  >
                    {item.icon && <item.icon size={12} />}
                    <span className="hidden sm:inline">{item.label}</span>
                  </Link>
                )}
              </React.Fragment>
            ))}
          </nav>

          {/* Card Container */}
          <div className={`
            bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700
            transition-all duration-300
            ${isScrolled && isCompact 
              ? 'rounded-xl p-2.5 sm:p-3' 
              : 'rounded-2xl p-3 sm:p-4 lg:p-6'
            }
          `}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
              
              {/* Left - User Info */}
              <div className="flex items-center gap-2.5 sm:gap-3 lg:gap-4">
                {/* Avatar */}
                <div className={`
                  relative flex-shrink-0 transition-all duration-300
                  ${isScrolled && isCompact 
                    ? 'w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl' 
                    : 'w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl'
                  }
                `}>
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="w-full h-full object-cover shadow-lg rounded-4xl"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                        e.currentTarget.nextElementSibling?.classList.remove('hidden')
                      }}
                    />
                  ) : null}
                  <div 
                    className={`w-full h-full flex items-center justify-center shadow-lg rounded-inherit
                      ${avatarUrl ? 'hidden' : ''}`}
                    style={{
                      background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`
                    }}
                  >
                    <span className={`
                      font-bold text-white
                      ${isScrolled && isCompact 
                        ? 'text-sm sm:text-base' 
                        : 'text-base sm:text-lg lg:text-xl'
                      }
                    `}>
                      {userInitial}
                    </span>
                  </div>
                  <span className={`
                    absolute bg-green-500 rounded-full border-2 border-white dark:border-gray-800
                    ${isScrolled && isCompact 
                      ? '-bottom-0.5 -right-0.5 w-2 h-2 sm:w-2.5 sm:h-2.5' 
                      : '-bottom-1 -right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-4 lg:h-4'
                    }
                  `} />
                </div>

                {/* Welcome Text */}
                <div className="min-w-0">
                  <h1 className={`
                    font-bold text-gray-900 dark:text-white truncate transition-all duration-300
                    ${isScrolled && isCompact 
                      ? 'text-sm sm:text-base' 
                      : 'text-base sm:text-lg lg:text-2xl'
                    }
                  `}>
                    Bem-vindo, {displayName}!
                  </h1>
                  <p className={`
                    text-gray-500 dark:text-gray-400 truncate hidden sm:block transition-all duration-300
                    ${isScrolled && isCompact 
                      ? 'text-[10px] sm:text-xs mt-0.5' 
                      : 'text-xs sm:text-sm mt-1'
                    }
                  `}>
                    {isScrolled && isCompact 
                      ? formatDate()
                      : 'Monitore e controle o que acontece com seu negócio hoje.'
                    }
                  </p>
                </div>
              </div>

              {/* Right - Quick Actions */}
              <div className={`flex items-center gap-1.5 sm:gap-2 lg:gap-3 ${
                isScrolled && isCompact ? 'self-end sm:self-auto' : ''
              }`}>
                {/* Search */}
                <>
                  <button
                    onClick={() => setShowSearch(true)}
                    className={`
                      rounded-lg sm:rounded-xl bg-gray-100 dark:bg-gray-700 
                      text-gray-600 dark:text-gray-300 
                      hover:bg-gray-200 dark:hover:bg-gray-600 transition-all
                      ${isScrolled && isCompact ? 'p-1.5 sm:p-2' : 'p-2 sm:p-2.5'}
                    `}
                    aria-label="Pesquisar"
                  >
                    <Search size={isScrolled && isCompact ? 16 : 18} className="sm:w-5 sm:h-5" />
                  </button>

                  <GlobalSearch 
                    isOpen={showSearch} 
                    onClose={() => setShowSearch(false)} 
                  />
                </>

                {/* Notifications */}
                <NotificationsPanel compact={isScrolled && isCompact} />

                {/* User Menu Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className={`
                      flex items-center gap-1.5 rounded-lg sm:rounded-xl 
                      hover:bg-gray-100 dark:hover:bg-gray-700 transition-all
                      ${isScrolled && isCompact ? 'p-1.5 sm:p-2' : 'p-2'}
                    `}
                    aria-label="Menu do usuário"
                  >
                    <Settings size={isScrolled && isCompact ? 16 : 18} className="sm:w-5 sm:h-5 text-gray-600 dark:text-gray-300" />
                    <ChevronDown size={14} className="hidden sm:block text-gray-400" />
                  </button>

                  {showUserMenu && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setShowUserMenu(false)} 
                      />
                      <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 
                        rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20">
                        
                        {/* User Info Header */}
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {displayName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {user?.email}
                          </p>
                        </div>

                        {/* Menu Items */}
                        <Link
                          to="/profile"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm 
                            text-gray-700 dark:text-gray-200 
                            hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <User size={16} />
                          Meu Perfil
                        </Link>
                        
                        <Link
                          to="/settings"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm 
                            text-gray-700 dark:text-gray-200 
                            hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Settings size={16} />
                          Configurações
                        </Link>
                        
                        <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
                        
                        {/* Logout */}
                        <button
                          onClick={handleLogoutClick}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm 
                            text-red-600 dark:text-red-400 
                            hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
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
        </div>
      </header>

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogoutConfirm}
        title="Sair do Sistema"
        message="Tem certeza que deseja sair do sistema?"
        confirmText="Sair"
        cancelText="Cancelar"
        variant="warning"
      />
    </>
  )
}

export default Header