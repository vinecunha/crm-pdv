import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCompany } from '../hooks/useCompany'
import PrefetchLink from './PrefetchLink' // ✅ Adicionado
import {
  LogOut,
  X,
  ShoppingBag,
  Package,
  Users,
  Settings,
  FileText,
  BarChart3,
  UserCircle,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Ticket,
  Calculator,
  User
} from '../utils/icons'

const Sidebar = ({ collapsed, setCollapsed }) => {
  const { 
    profile, 
    permissions, 
    logout, 
    loading: authLoading,
    roleName,
    roleColor
  } = useAuth()
  
  const { company, loading: companyLoading, getCompanyColor } = useCompany()
  const location = useLocation()
  const navigate = useNavigate()
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  // Usar dados do banco ou fallback
  const companyName = company?.company_name || 'Empresa'
  const logoSrc = company?.company_logo_url || '/logomarca.png'
  const primaryColor = getCompanyColor('primary') || '#2563eb'
  const secondaryColor = getCompanyColor('secondary') || '#7c3aed'

  // Avatar do usuário
  const avatarUrl = profile?.avatar_url
  
  // Usar display_name com fallback para full_name
  const displayName = profile?.display_name?.trim() || 
                      profile?.full_name?.trim().split(' ')[0] || 
                      profile?.email?.split('@')[0] || 
                      'Usuário'
  
  const userInitial = displayName.charAt(0).toUpperCase()

  // Menus baseados nas permissões
  const allMenuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', permission: 'canViewDashboard', description: 'Visão geral', prefetch: true },
    { path: '/sales', icon: ShoppingBag, label: 'PDV', permission: 'canViewSales', description: 'Ponto de venda', prefetch: true },
    { path: '/cashier', icon: Calculator, label: 'Fechar Caixa', permission: 'canViewSales', description: 'Conciliação de vendas', prefetch: false },
    { path: '/sales-list', icon: ClipboardList, label: 'Gestão de Vendas', permission: 'canViewSales', description: 'Histórico e cancelamentos', prefetch: true },
    { path: '/coupons', icon: Ticket, label: 'Cupons', permission: 'canViewCoupons', description: 'Gerenciar cupons', prefetch: true },
    { path: '/products', icon: Package, label: 'Produtos', permission: 'canViewProducts', description: 'Gerenciar produtos', prefetch: true },
    { path: '/customers', icon: Users, label: 'Clientes', permission: 'canViewCustomers', description: 'Gerenciar clientes', prefetch: true },
    { path: '/reports', icon: BarChart3, label: 'Relatórios', permission: 'canViewReports', description: 'Análises e métricas', prefetch: false },
    { path: '/users', icon: UserCircle, label: 'Usuários', permission: 'canViewUsers', description: 'Gerenciar usuários', prefetch: true },
    { path: '/logs', icon: FileText, label: 'Logs', permission: 'canViewLogs', description: 'Histórico do sistema', prefetch: true },
    { path: '/settings', icon: Settings, label: 'Configurações', permission: 'canViewSettings', description: 'Preferências do sistema', prefetch: true },
  ]

  const menuItems = allMenuItems.filter(item => permissions[item.permission])

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

  // Componente do Avatar (reutilizável)
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
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
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
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
        )}
      </div>
    )
  }

  // Loading combinado
  if (authLoading || companyLoading) {
    return (
      <>
        <button
          onClick={() => setIsMobileOpen(true)}
          className="fixed top-4 left-4 z-30 lg:hidden p-2 bg-white rounded-lg shadow-lg border border-gray-200"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-64 bg-white shadow-2xl z-30 items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </>
    )
  }

  // Mobile sidebar
  if (isMobileOpen) {
    return (
      <>
        <div
          className="fixed inset-0 bg-black/50 z-50 animate-fadeIn lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
        
        <div className="fixed left-0 top-0 h-full w-72 bg-white z-50 shadow-2xl animate-slideInRight lg:hidden">
          <div className="flex flex-col h-full">
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={logoSrc}
                    alt={companyName}
                    className="h-10 w-auto object-contain"
                    onError={(e) => {
                      e.target.onerror = null
                      e.target.src = '/favicon.ico'
                    }}
                  />
                  <div>
                    <h2 className="font-bold text-gray-900">{companyName}</h2>
                    <p className="text-xs text-gray-500">Gestão Integrada</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path
                const gradientStyle = isActive ? {
                  background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`
                } : {}

                // ✅ Usar PrefetchLink em vez de Link
                const LinkComponent = item.prefetch ? PrefetchLink : Link

                return (
                  <LinkComponent
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileOpen(false)}
                    prefetch={item.prefetch}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                      ${isActive ? 'text-white shadow-lg' : 'text-gray-600 hover:bg-gray-50'}
                    `}
                    style={isActive ? gradientStyle : {}}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                    <div className="flex-1">
                      <p className={`font-medium ${isActive ? 'text-white' : 'text-gray-700'}`}>
                        {item.label}
                      </p>
                      <p className={`text-xs ${isActive ? 'text-white/80' : 'text-gray-400'}`}>
                        {item.description}
                      </p>
                    </div>
                    {isActive && (
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                    )}
                  </LinkComponent>
                )
              })}
            </div>

            <div className="p-4 border-t border-gray-100">
              {/* ÁREA DO USUÁRIO CLICÁVEL - MOBILE */}
              <div 
                onClick={handleProfileClick}
                className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl mb-3 cursor-pointer hover:shadow-md transition-all group"
              >
                <div className="group-hover:scale-105 transition-transform">
                  <AvatarDisplay size="md" showStatus={true} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {displayName}
                  </p>
                  <p className="text-xs text-gray-500">{getRoleName()}</p>
                </div>
                <User className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
              </div>
              
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all duration-200"
              >
                <LogOut className="w-4 h-4" />
                <span className="font-medium">Sair do sistema</span>
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }

  // Desktop Sidebar
  return (
    <>
      <button
        onClick={() => setIsMobileOpen(true)}
        className="fixed top-4 left-4 z-30 lg:hidden p-2 bg-white rounded-lg shadow-lg border border-gray-200"
      >
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div className={`
        hidden lg:flex flex-col fixed left-0 top-0 h-full bg-white shadow-2xl transition-all duration-300 z-30
        ${collapsed ? 'w-20' : 'w-64'}
      `}>
        <div className={`
          p-5 border-b border-gray-100 transition-all duration-300
          ${collapsed ? 'px-3' : 'px-6'}
        `}>
          <div className="flex items-center justify-between">
            <Link to="/dashboard" className="flex items-center gap-3 flex-1">
              <img
                src={logoSrc}
                alt={companyName}
                className="h-10 w-auto object-contain"
                onError={(e) => {
                  e.target.onerror = null
                  e.target.src = '/favicon.ico'
                }}
              />
              {!collapsed && (
                <div className="flex-1">
                  <h2 className="font-bold text-gray-900 text-lg leading-tight">
                    {companyName}
                  </h2>
                  <p className="text-xs text-gray-500">Gestão Integrada</p>
                </div>
              )}
            </Link>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {!collapsed && !authLoading && (
          <div 
            onClick={handleProfileClick}
            className="p-4 mx-3 mt-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl cursor-pointer hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="group-hover:scale-105 transition-transform">
                <AvatarDisplay size="md" showStatus={true} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {displayName}
                </p>
                <div className="flex items-center gap-1">
                  <p className="text-xs text-gray-500">{getRoleName()}</p>
                </div>
              </div>
              <User className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
            </div>
          </div>
        )}

        {collapsed && !authLoading && (
          <div className="flex justify-center mt-4">
            <button
              onClick={handleProfileClick}
              className="relative group"
              title="Meu Perfil"
            >
              <div className="hover:scale-105 transition-transform">
                <AvatarDisplay size="md" showStatus={true} />
              </div>
              
              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {displayName}
              </div>
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            const gradientStyle = isActive ? {
              background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`
            } : {}

            // ✅ Usar PrefetchLink em vez de Link
            const LinkComponent = item.prefetch ? PrefetchLink : Link

            return (
              <div key={item.path} className="relative group">
                <LinkComponent
                  to={item.path}
                  prefetch={item.prefetch}
                  className={`
                    flex items-center rounded-xl transition-all duration-200
                    ${collapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'}
                    ${isActive ? 'text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}
                  `}
                  style={isActive ? gradientStyle : {}}
                  title={collapsed ? item.label : ''}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500'} transition-transform group-hover:scale-110`} />
                  {!collapsed && (
                    <div className="flex-1 text-left">
                      <p className={`font-medium ${isActive ? 'text-white' : 'text-gray-700'}`}>
                        {item.label}
                      </p>
                      <p className={`text-xs ${isActive ? 'text-white/80' : 'text-gray-400'}`}>
                        {item.description}
                      </p>
                    </div>
                  )}
                  {!collapsed && isActive && (
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                  )}
                </LinkComponent>
                
                {collapsed && (
                  <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                    {item.label}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className={`
              flex items-center rounded-xl transition-all duration-200 group w-full
              ${collapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'}
              text-red-600 hover:bg-red-50
            `}
            title={collapsed ? 'Sair' : ''}
          >
            <LogOut className="w-5 h-5 transition-transform group-hover:scale-110" />
            {!collapsed && (
              <span className="font-medium">Sair do sistema</span>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideInRight {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        .animate-slideInRight {
          animation: slideInRight 0.3s ease-out;
        }
      `}</style>
    </>
  )
}

// ✅ Importar Link do react-router-dom para o logo
import { Link } from 'react-router-dom'

export default Sidebar