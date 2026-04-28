// src/components/layout/PrivateLayout.tsx
import React, { useMemo, useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '@contexts/AuthContext'
import { Home } from '@lib/icons'
import Sidebar from '@components/layout/Sidebar'
import Header from '@components/layout/Header'
import MobileSidebar from '@components/layout/MobileSidebar'
import Breadcrumb from '@components/layout/Breadcrumb'
import ThemeInitializer from '@components/layout/ThemeInitializer'

interface PrivateLayoutProps {
  children: React.ReactNode
}

const PrivateLayout: React.FC<PrivateLayoutProps> = ({ children }) => {
  const { profile, logout } = useAuth()
  const location = useLocation() 
  
  // Estados
  const [collapsed, setCollapsed] = useState(() => {
    const savedState = localStorage.getItem('sidebar')
    return savedState !== null ? savedState === 'true' : (profile?.sidebar_collapsed || false)
  })
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  // Breadcrumb items
  const breadcrumbItems = useMemo(() => {
    const path = location.pathname

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
      '/tasks': 'Tarefas',
      '/budgets': 'Orçamentos'
    }
    
    const items = [{ label: 'Home', path: '/dashboard', icon: Home }]
    
    if (path !== '/dashboard') {
      const title = titles[path] || 'Página'
      items.push({ label: title, path })
    }
    
    return items
  }, [location.pathname])

  // Sincronizar com o perfil quando carregar
  useEffect(() => {
    if (profile?.sidebar_collapsed !== undefined) {
      setCollapsed(profile.sidebar_collapsed)
    }
  }, [profile?.sidebar_collapsed])

  // Salvar no localStorage como cache
  useEffect(() => {
    localStorage.setItem('sidebar', collapsed)
  }, [collapsed])

  // Bloquear scroll quando menu mobile está aberto
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileMenuOpen])

  // Fechar menu mobile em telas maiores
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) { // lg breakpoint
        setIsMobileMenuOpen(false)
      }
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Handlers
  const handleToggleSidebar = () => {
    setCollapsed(prev => !prev)
  }

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(prev => !prev)
  }

  const handleMobileMenuClose = () => {
    setIsMobileMenuOpen(false)
  }

  const handleLogoutRequest = () => {
    setShowLogoutModal(true)
  }

  const handleLogoutConfirm = async () => {
    setShowLogoutModal(false)
    setIsMobileMenuOpen(false)
    await logout()
  }

  const handleLogoutCancel = () => {
    setShowLogoutModal(false)
  }

  // Efeito de scroll para compactar header
  useEffect(() => {
    let lastScrollY = window.scrollY
    let scrollTimeout: NodeJS.Timeout

    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      if (currentScrollY > 100 && currentScrollY > lastScrollY) {
        setIsScrolled(true)
      } else if (currentScrollY < 50) {
        setIsScrolled(false)
      }
      
      lastScrollY = currentScrollY
      
      clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(() => {
        if (currentScrollY < 100) {
          setIsScrolled(false)
        }
      }, 2000)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      clearTimeout(scrollTimeout)
    }
  }, [])

  const isDashboard = location.pathname === '/dashboard'

  return (
    <>
      <ThemeInitializer />
      
      <div className="min-h-screen bg-gray-50 dark:bg-black">
        {/* Desktop Sidebar */}
        <Sidebar 
          collapsed={collapsed} 
          setCollapsed={setCollapsed} 
          onLogoutRequest={handleLogoutRequest}
        />

        {/* Mobile Sidebar */}
        <MobileSidebar
          isOpen={isMobileMenuOpen}
          onClose={handleMobileMenuClose}
          onLogout={handleLogoutRequest}
        />

        {/* Header - ajustado para scroll */}
        <div className={`
          sticky top-0 z-20 transition-all duration-300
          ${isScrolled ? '-translate-y-full lg:-translate-y-0' : 'translate-y-0'}
        `}>
          <Header 
            collapsed={collapsed} 
            onToggleSidebar={handleToggleSidebar}
            onMobileMenuToggle={handleMobileMenuToggle}
            isScrolled={isScrolled}
          />
        </div>

        {!isDashboard && (
          <Breadcrumb 
            items={breadcrumbItems} 
            collapsed={collapsed}
          />
        )}

        {/* Main Content */}
        <div className={`
          transition-all duration-300 
          ${collapsed ? 'lg:ml-20' : 'lg:ml-64'}
        `}>
          <main className="p-3 sm:p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fadeIn"
            onClick={handleLogoutCancel}
          />
          
          {/* Modal */}
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-sm w-full p-6 animate-slideUp">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Sair do Sistema
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Tem certeza que deseja sair do sistema? Sua sessão será encerrada.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleLogoutCancel}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 
                  bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 
                  dark:hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleLogoutConfirm}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white 
                  bg-red-600 hover:bg-red-700 rounded-xl transition-colors"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Estilos das animações */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .animate-fadeIn { 
          animation: fadeIn 0.2s ease-out; 
        }
        
        .animate-slideUp { 
          animation: slideUp 0.3s ease-out; 
        }
      `}</style>
    </>
  )
}

export default PrivateLayout