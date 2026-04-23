import React, { useState, useMemo } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@contexts/AuthContext'
import { useCompany } from '@hooks/system/useCompany'
import PrefetchLink from '@components/PrefetchLink'
import {
  LogOut, X, ShoppingBag, Package, Users, Settings, FileText,
  BarChart3, UserCircle, LayoutDashboard, ChevronLeft, ChevronRight,
  ClipboardList, Ticket, Calculator, User, Tags, Archive
} from '@lib/icons'

const Sidebar = ({ collapsed, setCollapsed }) => {
  const { 
    profile, permissions, logout, loading: authLoading, roleName 
  } = useAuth()
  
  const { company, loading: companyLoading, getCompanyColor } = useCompany()
  const location = useLocation()
  const navigate = useNavigate()
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const companyName = company?.company_name || 'Empresa'
  const logoSrc = company?.company_logo_url || '/logomarca.png'
  const primaryColor = getCompanyColor('primary') || '#2563eb'
  const secondaryColor = getCompanyColor('secondary') || '#7c3aed'

  const avatarUrl = profile?.avatar_url
  const displayName = profile?.display_name?.trim() || 
                      profile?.full_name?.trim().split(' ')[0] || 
                      profile?.email?.split('@')[0] || 'Usuário'
  const userInitial = displayName.charAt(0).toUpperCase()

  const menuGroups = useMemo(() => [
     {
      id: 'principal',
      label: 'Principal',
      items: [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', permission: 'canViewDashboard', description: 'Visão geral', prefetch: true },
        { path: '/tasks', icon: ClipboardList, label: 'Tarefas', permission: 'canViewTasks', description: 'Lista de tarefas', prefetch: true },
      ]
    },
    {
      id: 'vendas',
      label: 'Vendas',
      items: [
        { path: '/sales', icon: ShoppingBag, label: 'PDV', permission: 'canViewSales', description: 'Ponto de venda', prefetch: true, highlight: true },
        { path: '/budgets', icon: FileText, label: 'Orçamentos', permission: 'canViewSales', description: 'Gerenciar orçamentos', prefetch: true },
        { path: '/sales-list', icon: ClipboardList, label: 'Histórico', permission: 'canViewSales', description: 'Vendas e cancelamentos', prefetch: true },
      ]
    },
    {
      id: 'financeiro',
      label: 'Financeiro',
      items: [
        { path: '/cashier', icon: Calculator, label: 'Fechar Caixa', permission: 'canViewSales', description: 'Conciliação de vendas', prefetch: false },
        { path: '/coupons', icon: Ticket, label: 'Cupons', permission: 'canViewCoupons', description: 'Gerenciar cupons', prefetch: true },
      ]
    },
    {
      id: 'catalogo',
      label: 'Catálogo',
      items: [
        { path: '/products', icon: Package, label: 'Produtos', permission: 'canViewProducts', description: 'Gerenciar produtos', prefetch: true },
        { path: '/stock-count', icon: Archive, label: 'Balanço', permission: 'canManageStock', description: 'Contagem de estoque', prefetch: true },
      ]
    },
    {
      id: 'clientes',
      label: 'Clientes',
      items: [
        { path: '/customers', icon: Users, label: 'Clientes', permission: 'canViewCustomers', description: 'Gerenciar clientes', prefetch: true },
      ]
    },
    {
      id: 'analises',
      label: 'Análises',
      items: [
        { path: '/reports', icon: BarChart3, label: 'Relatórios', permission: 'canViewReports', description: 'Análises e métricas', prefetch: false },
      ]
    },
    {
      id: 'administracao',
      label: 'Administração',
      items: [
        { path: '/users', icon: UserCircle, label: 'Usuários', permission: 'canViewUsers', description: 'Gerenciar usuários', prefetch: true },
        { path: '/logs', icon: FileText, label: 'Logs', permission: 'canViewLogs', description: 'Histórico do sistema', prefetch: true },
        { path: '/settings', icon: Settings, label: 'Configurações', permission: 'canViewSettings', description: 'Preferências do sistema', prefetch: true },
      ]
    }
  ], [])

  const visibleGroups = useMemo(() => {
    return menuGroups.map(group => ({
      ...group,
      items: group.items.filter(item => permissions[item.permission])
    })).filter(group => group.items.length > 0)
  }, [menuGroups, permissions])

  const allMenuItems = visibleGroups.flatMap(g => g.items)

  const isActiveRoute = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard'
    if (path === '/sales') return location.pathname === '/sales'
    if (path === '/budgets') return location.pathname === '/budgets'
    return location.pathname.startsWith(path)
  }

  const getRoleName = () => {
    if (roleName) return roleName
    switch (profile?.role) {
      case 'admin': return 'Administrador'
      case 'gerente': return 'Gerente'
      default: return 'Operador'
    }
  }

  const handleLogout = async () => {
    await logout()
  }

  const handleProfileClick = () => {
    navigate('/profile')
    setIsMobileOpen(false)
  }

  const AvatarDisplay = ({ size = 'md', showStatus = true }) => {
    const sizeClasses = {
      sm: 'w-8 h-8',
      md: 'w-10 h-10',
      lg: 'w-12 h-12'
    }
    
    const iconSizes = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6'
    }
    
    if (avatarUrl) {
      return (
        <div className="relative">
          <img 
            src={avatarUrl} 
            alt={displayName} 
            className={`${sizeClasses[size]} rounded-xl object-cover shadow-lg`}
            onError={(e) => {
              e.target.onerror = null
              e.target.style.display = 'none'
              e.target.nextSibling?.style.display === 'flex' 
                ? e.target.nextSibling.style.display = 'flex' 
                : null
            }}
          />
          <div 
            className={`${sizeClasses[size]} rounded-xl flex items-center justify-center shadow-lg`}
            style={{ 
              background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
              display: avatarUrl ? 'none' : 'flex'
            }}
          >
            <span className={`${iconSizes[size]} text-white font-bold`}>
              {userInitial}
            </span>
          </div>
          {showStatus && (
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
          )}
        </div>
      )
    }
    
    return (
      <div className="relative">
        <div 
          className={`${sizeClasses[size]} rounded-xl flex items-center justify-center shadow-lg`}
          style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
        >
          <span className={`${iconSizes[size]} text-white font-bold`}>
            {userInitial}
          </span>
        </div>
        {showStatus && (
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
        )}
      </div>
    )
  }

  const MenuItemComponent = ({ item, collapsed, isMobile = false }) => {
    const Icon = item.icon
    const isActive = isActiveRoute(item.path)
    const gradientStyle = isActive ? {
      background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`
    } : {}
    
    const LinkComponent = item.prefetch ? PrefetchLink : Link
    
    return (
      <div key={item.path} className="relative group">
        <LinkComponent
          to={item.path}
          prefetch={item.prefetch}
          onClick={() => isMobile && setIsMobileOpen(false)}
          className={`
            flex items-center rounded-xl transition-all duration-200
            ${collapsed && !isMobile ? 'justify-center p-3' : 'gap-3 px-4 py-3'}
            ${isActive 
              ? 'text-white shadow-md' 
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}
            ${item.highlight && !isActive ? 'border-l-4 border-blue-500 dark:border-blue-400' : ''}
          `}
          style={isActive ? gradientStyle : {}}
          title={collapsed && !isMobile ? item.label : ''}
        >
          <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400'} transition-transform group-hover:scale-110`} />
          {(!collapsed || isMobile) && (
            <div className="flex-1 min-w-0 text-left">
              <p className={`font-medium truncate ${isActive ? 'text-white' : 'text-gray-700 dark:text-gray-200'}`}>{item.label}</p>
              <p className={`text-xs truncate ${isActive ? 'text-white/80' : 'text-gray-400 dark:text-gray-500'}`}>{item.description}</p>
            </div>
          )}
          {(!collapsed || isMobile) && isActive && (
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse flex-shrink-0" />
          )}
        </LinkComponent>
        
        {collapsed && !isMobile && (
          <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
            {item.label}
          </div>
        )}
      </div>
    )
  }

  if (authLoading || companyLoading) {
    return (
      <>
        <button
          onClick={() => setIsMobileOpen(true)}
          className="fixed top-4 left-4 z-30 lg:hidden p-2 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-900 shadow-2xl z-30 items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400" />
        </div>
      </>
    )
  }

  if (isMobileOpen) {
    return (
      <>
        <div
          className="fixed inset-0 bg-black/50 z-50 animate-fadeIn lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
        
        <div className="fixed left-0 top-0 h-full w-72 bg-white dark:bg-gray-900 z-50 shadow-2xl animate-slideInRight lg:hidden">
          <div className="flex flex-col h-full overflow-hidden">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={logoSrc}
                    alt={companyName}
                    className="h-10 w-auto object-contain"
                    onError={(e) => { e.target.src = '/favicon.ico' }}
                  />
                  <div>
                    <h2 className="font-bold text-gray-900 dark:text-white">{companyName}</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Gestão Integrada</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {visibleGroups.map((group) => (
                <div key={group.id}>
                  <p className="px-3 mb-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    {group.label}
                  </p>
                  <div className="space-y-1">
                    {group.items.map((item) => (
                      <MenuItemComponent key={item.path} item={item} collapsed={false} isMobile={true} />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex-shrink-0">
              <div 
                onClick={handleProfileClick}
                className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-xl mb-3 cursor-pointer hover:shadow-md transition-all group"
              >
                <div className="group-hover:scale-105 transition-transform flex-shrink-0">
                  <AvatarDisplay size="md" showStatus={true} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{displayName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{getRoleName()}</p>
                </div>
                <User className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex-shrink-0" />
              </div>
              
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/50 transition-all duration-200"
              >
                <LogOut className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium truncate">Sair do sistema</span>
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <button
        onClick={() => setIsMobileOpen(true)}
        className="fixed top-4 left-4 z-30 lg:hidden p-2 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
      >
        <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div className={`
        hidden lg:flex flex-col fixed left-0 top-0 h-full bg-white dark:bg-gray-900 shadow-2xl transition-all duration-300 z-30 overflow-hidden
        ${collapsed ? 'w-20' : 'w-64'}
      `}>
        <div className={`
          p-5 border-b border-gray-100 dark:border-gray-700 transition-all duration-300 flex-shrink-0
          ${collapsed ? 'px-3' : 'px-6'}
        `}>
          <div className="flex items-center justify-between">
            <Link to="/dashboard" className="flex items-center gap-3 flex-1 overflow-hidden">
              <img
                src={logoSrc}
                alt={companyName}
                className="h-10 w-auto object-contain flex-shrink-0"
                onError={(e) => { e.target.src = '/favicon.ico' }}
              />
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <h2 className="font-bold text-gray-900 dark:text-white text-lg leading-tight truncate">{companyName}</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Gestão Integrada</p>
                </div>
              )}
            </Link>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
            >
              {collapsed ? <ChevronRight className="w-4 h-4 text-gray-500 dark:text-gray-400" /> : <ChevronLeft className="w-4 h-4 text-gray-500 dark:text-gray-400" />}
            </button>
          </div>
        </div>

        {!collapsed && !authLoading && (
          <div 
            onClick={handleProfileClick}
            className="mx-3 mt-4 p-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-xl cursor-pointer hover:shadow-md transition-all group flex-shrink-0"
          >
            <div className="flex items-center gap-3">
              <div className="group-hover:scale-105 transition-transform flex-shrink-0">
                <AvatarDisplay size="md" showStatus={true} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{displayName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{getRoleName()}</p>
              </div>
              <User className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex-shrink-0" />
            </div>
          </div>
        )}

        {collapsed && !authLoading && (
          <div className="flex justify-center mt-4 me-2 flex-shrink-0">
            <button onClick={handleProfileClick} className="relative group" title="Meu Perfil">
              <div className="hover:scale-105 transition-transform">
                <AvatarDisplay size="md" showStatus={true} />
              </div>
              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                {displayName}
              </div>
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-4">
          {visibleGroups.map((group) => (
            <div key={group.id}>
              {!collapsed && (
                <p className="px-3 mb-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  {group.label}
                </p>
              )}
              <div className="space-y-1">
                {group.items.map((item) => (
                  <MenuItemComponent key={item.path} item={item} collapsed={collapsed} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex-shrink-0">
          <button
            onClick={handleLogout}
            className={`
              flex items-center rounded-xl transition-all duration-200 group w-full
              ${collapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'}
              text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30
            `}
            title={collapsed ? 'Sair' : ''}
          >
            <LogOut className="w-5 h-5 transition-transform group-hover:scale-110 flex-shrink-0" />
            {!collapsed && <span className="font-medium truncate">Sair do sistema</span>}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideInRight {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-slideInRight { animation: slideInRight 0.3s ease-out; }
      `}</style>
    </>
  )
}

export default Sidebar
