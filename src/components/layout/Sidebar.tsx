// src/components/layout/Sidebar.tsx
import React, { useState, useMemo, useCallback } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { useAuth } from '@contexts/AuthContext'
import { useCompany } from '@hooks/system/useCompany'
import {
  LogOut,
  X,
  ShoppingBag,
  Package,
  Users,
  Settings,
  FileText,
  BarChart3,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Ticket,
  Calculator,
  Tags,
  Archive,
  TrendingUp,
  DollarSign
} from '@lib/icons'

// Types
interface MenuItem {
  path: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  permission: string
  description: string
  prefetch: boolean
  highlight?: boolean
}

interface MenuGroup {
  id: string
  label: string
  items: MenuItem[]
}

interface SidebarProps {
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
}

interface LogoutConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

// Simple Modal Component (inline para não depender de import externo)
const LogoutConfirmModal: React.FC<LogoutConfirmModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm 
}) => {
  if (!isOpen) return null

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 z-50 animate-fadeIn"
        onClick={onClose}
      />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-sm w-full p-6 animate-slideUp">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
              <LogOut className="w-6 h-6 text-red-600 dark:text-red-400" />
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
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 
                bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 
                dark:hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white 
                bg-red-600 hover:bg-red-700 rounded-xl transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
  const { permissions, logout, loading: authLoading } = useAuth()
  const { company, loading: companyLoading, getCompanyColor } = useCompany()
  const location = useLocation()
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState<boolean>(false)

  // Company data
  const companyName = company?.company_name || 'Empresa'
  const logoSrc = company?.company_logo_url || '/logomarca.png'
  const primaryColor = getCompanyColor('primary') || '#2563eb'
  const secondaryColor = getCompanyColor('secondary') || '#7c3aed'

  // Menu Groups Definition
  const menuGroups: MenuGroup[] = useMemo(() => [
    {
      id: 'principal',
      label: 'Principal',
      items: [
        { 
          path: '/dashboard', 
          icon: LayoutDashboard, 
          label: 'Dashboard', 
          permission: 'canViewDashboard', 
          description: 'Visão geral do sistema', 
          prefetch: true 
        },
        { 
          path: '/tasks', 
          icon: ClipboardList, 
          label: 'Tarefas', 
          permission: 'canViewTasks', 
          description: 'Lista de tarefas', 
          prefetch: true 
        },
      ]
    },
    {
      id: 'vendas',
      label: 'Vendas',
      items: [
        { 
          path: '/sales', 
          icon: ShoppingBag, 
          label: 'PDV', 
          permission: 'canViewSales', 
          description: 'Ponto de venda', 
          prefetch: true, 
          highlight: true 
        },
        { 
          path: '/budgets', 
          icon: FileText, 
          label: 'Orçamentos', 
          permission: 'canViewSales', 
          description: 'Gerenciar orçamentos', 
          prefetch: true 
        },
        { 
          path: '/sales-list', 
          icon: ClipboardList, 
          label: 'Histórico', 
          permission: 'canViewSales', 
          description: 'Vendas e cancelamentos', 
          prefetch: true 
        },
      ]
    },
    {
      id: 'financeiro',
      label: 'Financeiro',
      items: [
        { 
          path: '/cashier', 
          icon: Calculator, 
          label: 'Fechar Caixa', 
          permission: 'canViewSales', 
          description: 'Conciliação de vendas', 
          prefetch: false 
        },
        { 
          path: '/coupons', 
          icon: Ticket, 
          label: 'Cupons', 
          permission: 'canViewCoupons', 
          description: 'Gerenciar cupons', 
          prefetch: true 
        },
      ]
    },
    {
      id: 'catalogo',
      label: 'Catálogo',
      items: [
        { 
          path: '/products', 
          icon: Package, 
          label: 'Produtos', 
          permission: 'canViewProducts', 
          description: 'Gerenciar produtos', 
          prefetch: true 
        },
        { 
          path: '/stock-count', 
          icon: Archive, 
          label: 'Balanço', 
          permission: 'canManageStock', 
          description: 'Contagem de estoque', 
          prefetch: true 
        },
      ]
    },
    {
      id: 'clientes',
      label: 'Clientes',
      items: [
        { 
          path: '/customers', 
          icon: Users, 
          label: 'Clientes', 
          permission: 'canViewCustomers', 
          description: 'Gerenciar clientes', 
          prefetch: true 
        },
      ]
    },
    {
      id: 'analises',
      label: 'Análises',
      items: [
        { 
          path: '/reports', 
          icon: BarChart3, 
          label: 'Relatórios', 
          permission: 'canViewReports', 
          description: 'Análises e métricas', 
          prefetch: false 
        },
      ]
    },
    {
      id: 'administracao',
      label: 'Administração',
      items: [
        { 
          path: '/users', 
          icon: Users, 
          label: 'Usuários', 
          permission: 'canViewUsers', 
          description: 'Gerenciar usuários', 
          prefetch: true 
        },
        { 
          path: '/logs', 
          icon: FileText, 
          label: 'Logs', 
          permission: 'canViewLogs', 
          description: 'Histórico do sistema', 
          prefetch: true 
        },
        { 
          path: '/settings', 
          icon: Settings, 
          label: 'Configurações', 
          permission: 'canViewSettings', 
          description: 'Preferências do sistema', 
          prefetch: true 
        },
      ]
    }
  ], [])

  // Filter visible groups based on permissions
  const visibleGroups: MenuGroup[] = useMemo(() => {
    return menuGroups
      .map(group => ({
        ...group,
        items: group.items.filter(item => permissions?.[item.permission])
      }))
      .filter(group => group.items.length > 0)
  }, [menuGroups, permissions])

  // Route checking
  const isActiveRoute = useCallback((path: string): boolean => {
    if (path === '/dashboard') return location.pathname === '/dashboard'
    if (path === '/sales') return location.pathname === '/sales'
    if (path === '/budgets') return location.pathname === '/budgets'
    return location.pathname.startsWith(path)
  }, [location.pathname])

  // Logout handlers
  const handleLogoutClick = (): void => {
    setShowLogoutConfirm(true)
  }

  const handleLogoutConfirm = async (): Promise<void> => {
    setShowLogoutConfirm(false)
    setIsMobileOpen(false)
    await logout()
  }

  // Mobile close handler
  const handleMobileClose = (): void => {
    setIsMobileOpen(false)
  }

  // Menu Item Component
  const MenuItemComponent: React.FC<{ 
    item: MenuItem
    collapsed: boolean
    isMobile?: boolean 
  }> = ({ item, collapsed, isMobile = false }) => {
    const Icon = item.icon
    const isActive = isActiveRoute(item.path)
    
    const gradientStyle: React.CSSProperties = isActive ? {
      background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`
    } : {}
    
    const LinkComponent = Link
    
    return (
      <div className="relative group">
        <LinkComponent
          to={item.path}
          onClick={() => isMobile && handleMobileClose()}
          className={`
            flex items-center rounded-xl transition-all duration-200
            ${collapsed && !isMobile ? 'justify-center p-3' : 'gap-3 px-4 py-3'}
            ${isActive 
              ? 'text-white shadow-lg shadow-blue-500/25' 
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'}
            ${item.highlight && !isActive ? 'border-l-4 border-blue-500 dark:border-blue-400' : ''}
          `}
          style={isActive ? gradientStyle : {}}
          title={collapsed && !isMobile ? item.label : undefined}
        >
          <Icon 
            className={`
              w-5 h-5 flex-shrink-0 transition-transform duration-200
              ${isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400'}
              group-hover:scale-110
            `} 
          />
          
          {(!collapsed || isMobile) && (
            <div className="flex-1 min-w-0 text-left">
              <p className={`font-medium truncate text-sm ${
                isActive ? 'text-white' : 'text-gray-700 dark:text-gray-200'
              }`}>
                {item.label}
              </p>
              <p className={`text-xs truncate ${
                isActive ? 'text-white/80' : 'text-gray-400 dark:text-gray-500'
              }`}>
                {item.description}
              </p>
            </div>
          )}
          
          {(!collapsed || isMobile) && isActive && (
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse flex-shrink-0" />
          )}
        </LinkComponent>
        
        {/* Tooltip for collapsed state */}
        {collapsed && !isMobile && (
          <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 
            bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg 
            opacity-0 group-hover:opacity-100 transition-all duration-200 
            whitespace-nowrap z-50 pointer-events-none shadow-lg">
            <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 
              w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45" />
            {item.label}
          </div>
        )}
      </div>
    )
  }

  // Loading State
  if (authLoading || companyLoading) {
    return (
      <>
        {/* Mobile menu button */}
        <button
          onClick={() => setIsMobileOpen(true)}
          className="fixed top-4 left-4 z-30 lg:hidden p-2 bg-white dark:bg-gray-900 
            rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
          aria-label="Abrir menu"
        >
          <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Desktop skeleton */}
        <div className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-64 
          bg-white dark:bg-gray-900 shadow-2xl z-30 items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400" />
        </div>
      </>
    )
  }

  // Mobile Sidebar
  if (isMobileOpen) {
    return (
      <>
        <LogoutConfirmModal
          isOpen={showLogoutConfirm}
          onClose={() => setShowLogoutConfirm(false)}
          onConfirm={handleLogoutConfirm}
        />

        {/* Overlay */}
        <div
          className="fixed inset-0 bg-black/50 z-50 animate-fadeIn lg:hidden backdrop-blur-sm"
          onClick={handleMobileClose}
        />
        
        {/* Mobile Sidebar */}
        <div className="fixed left-0 top-0 h-full w-72 bg-white dark:bg-gray-900 
          z-50 shadow-2xl animate-slideInRight lg:hidden flex flex-col">
          
          {/* Header */}
          <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
            <div className="flex items-center justify-between">
              <Link to="/dashboard" className="flex items-center gap-3" onClick={handleMobileClose}>
                <img
                  src={logoSrc}
                  alt={companyName}
                  className="h-10 w-auto object-contain"
                  onError={(e) => { 
                    const target = e.target as HTMLImageElement
                    target.src = '/favicon.ico'
                  }}
                />
                <div>
                  <h2 className="font-bold text-gray-900 dark:text-white text-sm">
                    {companyName}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Gestão Integrada
                  </p>
                </div>
              </Link>
              <button
                onClick={handleMobileClose}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Fechar menu"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {visibleGroups.map((group) => (
              <div key={group.id}>
                <p className="px-3 mb-2 text-xs font-semibold text-gray-400 
                  dark:text-gray-500 uppercase tracking-wider">
                  {group.label}
                </p>
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <MenuItemComponent 
                      key={item.path} 
                      item={item} 
                      collapsed={false} 
                      isMobile={true} 
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex-shrink-0">
            <button
              onClick={handleLogoutClick}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 
                bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 
                rounded-xl hover:bg-red-100 dark:hover:bg-red-900/50 
                transition-all duration-200 font-medium"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              <span>Sair do sistema</span>
            </button>
          </div>
        </div>
      </>
    )
  }

  // Desktop Sidebar
  return (
    <>
      <LogoutConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogoutConfirm}
      />

      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="fixed top-4 left-4 z-30 lg:hidden p-2 bg-white dark:bg-gray-900 
          rounded-lg shadow-lg border border-gray-200 dark:border-gray-700
          hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        aria-label="Abrir menu"
      >
        <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Desktop Sidebar */}
      <div className={`
        hidden lg:flex flex-col fixed left-0 top-0 h-full 
        bg-white dark:bg-gray-900 shadow-2xl transition-all duration-300 z-30 
        overflow-hidden border-r border-gray-200/50 dark:border-gray-700/50
        ${collapsed ? 'w-20' : 'w-64'}
      `}>
        {/* Header with Logo */}
        <div className={`
          p-5 border-b border-gray-100 dark:border-gray-700 
          transition-all duration-300 flex-shrink-0
          ${collapsed ? 'px-3' : 'px-6'}
        `}>
          <div className="flex items-center justify-between">
            <Link 
              to="/dashboard" 
              className="flex items-center gap-3 flex-1 overflow-hidden"
            >
              <img
                src={logoSrc}
                alt={companyName}
                className="h-10 w-auto object-contain flex-shrink-0"
                onError={(e) => { 
                  const target = e.target as HTMLImageElement
                  target.src = '/favicon.ico'
                }}
              />
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <h2 className="font-bold text-gray-900 dark:text-white text-lg leading-tight truncate">
                    {companyName}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    Gestão Integrada
                  </p>
                </div>
              )}
            </Link>
            
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 
                transition-colors flex-shrink-0"
              aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
            >
              {collapsed ? 
                <ChevronRight className="w-4 h-4 text-gray-500 dark:text-gray-400" /> : 
                <ChevronLeft className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              }
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-4 
          scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 
          scrollbar-track-transparent">
          {visibleGroups.map((group) => (
            <div key={group.id}>
              {!collapsed && (
                <p className="px-3 mb-2 text-xs font-semibold text-gray-400 
                  dark:text-gray-500 uppercase tracking-wider">
                  {group.label}
                </p>
              )}
              <div className="space-y-1">
                {group.items.map((item) => (
                  <MenuItemComponent 
                    key={item.path} 
                    item={item} 
                    collapsed={collapsed} 
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer with Logout */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex-shrink-0">
          <button
            onClick={handleLogoutClick}
            className={`
              flex items-center rounded-xl transition-all duration-200 group w-full
              ${collapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'}
              text-red-600 dark:text-red-400 
              hover:bg-red-50 dark:hover:bg-red-900/30
            `}
            title={collapsed ? 'Sair do sistema' : undefined}
          >
            <LogOut className="w-5 h-5 transition-transform group-hover:scale-110 flex-shrink-0" />
            {!collapsed && <span className="font-medium truncate">Sair do sistema</span>}
          </button>
          
          {/* Tooltip for collapsed state */}
          {collapsed && (
            <div className="absolute left-full ml-3 bottom-4 px-3 py-1.5 
              bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg 
              opacity-0 group-hover:opacity-100 transition-all duration-200 
              whitespace-nowrap z-50 pointer-events-none shadow-lg">
              Sair do sistema
            </div>
          )}
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideInRight {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn { 
          animation: fadeIn 0.3s ease-out; 
        }
        
        .animate-slideInRight { 
          animation: slideInRight 0.3s ease-out; 
        }
        
        .animate-slideUp { 
          animation: slideUp 0.3s ease-out; 
        }
        
        /* Custom scrollbar */
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background-color: rgba(156, 163, 175, 0.5);
          border-radius: 20px;
        }
        
        .dark .scrollbar-thin::-webkit-scrollbar-thumb {
          background-color: rgba(75, 85, 99, 0.5);
        }
      `}</style>
    </>
  )
}

export default Sidebar