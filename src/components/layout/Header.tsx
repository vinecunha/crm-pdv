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
        <div className={`
          transition-all duration-300
          ${isScrolled && isCompact ? 'py-1.5 sm:py-2 px-3 sm:px-4 lg:px-6' : 'py-3 sm:py-4 px-3 sm:px-4 lg:px-6'}
        `}>
          <div className={`
            bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700
            transition-all duration-300
            ${isScrolled && isCompact 
              ? 'rounded-xl p-2 sm:p-3' 
              : 'rounded-2xl p-3 sm:p-4 lg:p-5'
            }
          `}>
            
            {/* Status Bar */}
            <div className={`
              flex items-center justify-between pb-2 sm:pb-3 mb-2 sm:mb-3
              border-b border-gray-100 dark:border-gray-700
              text-[10px] sm:text-xs text-gray-500 dark:text-gray-400
              transition-all duration-300
              ${isScrolled && isCompact ? 'hidden' : ''}
            `}>
              <div className="flex items-center gap-2 sm:gap-4">
                <button
                  onClick={onMobileMenuToggle}
                  className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  aria-label="Abrir menu"
                >
                  <Menu size={20} />
                </button>
                
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                    isOnline ? 'bg-green-500' : 'bg-yellow-500'
                  }`} />
                  <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline'}</span>
                </div>
                
                <div className="hidden md:flex items-center gap-1.5">
                  <Calendar size={11} className="sm:w-3 sm:h-3" />
                  <span className="hidden sm:inline">{formatDate()}</span>
                </div>
                
                <div className="hidden md:flex items-center gap-1.5">
                  <Clock size={11} className="sm:w-3 sm:h-3" />
                  <span className="hidden sm:inline">{formatTime()}</span>
                </div>
              </div>
              
              <div className="hidden sm:flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span>
                  {profile?.role === 'admin' ? 'Admin' : 
                   profile?.role === 'gerente' ? 'Gerente' : 
                   'Operador'}
                </span>
              </div>
            </div>

            {/* Main Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
              
              {/* User Info */}
              <div className="flex items-center gap-2.5 sm:gap-3 lg:gap-4">
                <div className={`
                  relative flex-shrink-0 transition-all duration-300
                  ${isScrolled && isCompact 
                    ? 'w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl' 
                    : 'w-10 h-10 sm:w-11 sm:h-11 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl'
                  }
                `}>
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="w-full h-full object-cover shadow-lg rounded-inherit"
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
                      : '-bottom-1 -right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-3.5 lg:h-3.5'
                    }
                  `} />
                </div>

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

              {/* Quick Actions */}
              <div className={`flex items-center justify-between sm:justify-end gap-1 sm:gap-1.5 lg:gap-2 ${
                isScrolled && isCompact ? 'self-end sm:self-auto' : ''
              }`}>
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

                <button
                  onClick={() => setShowSearch(true)}
                  className="rounded-lg sm:rounded-xl bg-gray-100 dark:bg-gray-700 
                    text-gray-600 dark:text-gray-300 
                    hover:bg-gray-200 dark:hover:bg-gray-600 transition-all
                    p-1.5 sm:p-2"
                  aria-label="Pesquisar"
                >
                  <Search size={14} className="sm:w-[18px] sm:h-[18px]" />
                </button>

                <GlobalSearch 
                  isOpen={showSearch} 
                  onClose={() => setShowSearch(false)} 
                />

                <NotificationsPanel compact={isScrolled && isCompact} />

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-1 rounded-lg sm:rounded-xl 
                      hover:bg-gray-100 dark:hover:bg-gray-700 transition-all
                      p-1.5 sm:p-2"
                    aria-label="Menu do usuário"
                  >
                    <Settings size={14} className="sm:w-[18px] sm:h-[18px] text-gray-600 dark:text-gray-300" />
                    <ChevronDown size={12} className="hidden sm:block text-gray-400" />
                  </button>

                  {showUserMenu && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setShowUserMenu(false)} 
                      />
                      <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 
                        rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20">
                        
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {displayName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {user?.email}
                          </p>
                        </div>

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

            {/* Mobile Status Info */}
            {isScrolled && isCompact && (
              <div className="flex items-center gap-3 mt-2 pt-2 border-t border-gray-100 dark:border-gray-700 
                text-[10px] text-gray-500 dark:text-gray-400 sm:hidden">
                <div className={`w-1.5 h-1.5 rounded-full ${
                  isOnline ? 'bg-green-500' : 'bg-yellow-500'
                }`} />
                <span>{isOnline ? 'Online' : 'Offline'}</span>
                <span className="text-gray-300 dark:text-gray-600">•</span>
                <span>{formatDate()}</span>
              </div>
            )}
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