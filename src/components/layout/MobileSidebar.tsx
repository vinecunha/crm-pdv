// src/components/layout/MobileSidebar.tsx
import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@contexts/AuthContext'
import { useCompany } from '@hooks/system/useCompany'
import { useNetworkStatus } from '@/hooks/utils/useNetworkStatus'
import {
  X,
  Home,
  User,
  Settings,
  LogOut,
  LayoutDashboard,
  ShoppingBag,
  Package,
  Users,
  FileText,
  BarChart3,
  ClipboardList,
  Calculator,
  Ticket,
  Archive,
  ChevronRight
} from '@lib/icons'

interface MobileSidebarProps {
  isOpen: boolean
  onClose: () => void
  onLogout: () => void
}

interface QuickLink {
  path: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
}

const MobileSidebar: React.FC<MobileSidebarProps> = ({ isOpen, onClose, onLogout }) => {
  const { user, profile, logout } = useAuth()
  const { company, getCompanyColor } = useCompany()
  const location = useLocation()
  const { isOnline } = useNetworkStatus()

  const primaryColor = getCompanyColor('primary') || '#3B82F6'
  const secondaryColor = getCompanyColor('secondary') || '#8B5CF6'

  const displayName = profile?.display_name?.trim() || 
                      profile?.full_name?.trim().split(' ')[0] || 
                      user?.email?.split('@')[0] || 
                      'Usuário'

  const userInitial = displayName.charAt(0).toUpperCase()
  const avatarUrl = profile?.avatar_url

  // Links rápidos para mobile
  const quickLinks: QuickLink[] = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/sales', icon: ShoppingBag, label: 'PDV' },
    { path: '/products', icon: Package, label: 'Produtos' },
    { path: '/customers', icon: Users, label: 'Clientes' },
    { path: '/reports', icon: BarChart3, label: 'Relatórios' },
    { path: '/tasks', icon: ClipboardList, label: 'Tarefas' },
    { path: '/settings', icon: Settings, label: 'Configurações' },
  ]

  const isActiveRoute = (path: string): boolean => {
    if (path === '/dashboard') return location.pathname === '/dashboard'
    return location.pathname.startsWith(path)
  }

  const handleLogoutClick = () => {
    onClose()
    onLogout()
  }

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Sidebar Panel */}
      <aside 
        className={`fixed left-0 top-0 h-full w-72 max-w-[85vw] bg-white dark:bg-gray-900 
          z-50 shadow-2xl lg:hidden flex flex-col transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navegação"
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <Link 
              to="/dashboard" 
              className="flex items-center gap-3 min-w-0" 
              onClick={onClose}
            >
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
              >
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt={displayName} 
                    className="w-full h-full rounded-xl object-cover"
                  />
                ) : (
                  <span className="text-lg font-bold text-white">{userInitial}</span>
                )}
              </div>
              <div className="min-w-0">
                <h2 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                  {displayName}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user?.email}
                </p>
              </div>
            </Link>
            <button
              onClick={onClose}
              className="p-2 -mr-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
              aria-label="Fechar menu"
            >
              <X size={20} className="text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Quick Links */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {quickLinks.map((link) => {
            const Icon = link.icon
            const isActive = isActiveRoute(link.path)
            
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={onClose}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'text-white shadow-lg'
                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                }`}
                style={isActive ? { 
                  background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                  boxShadow: `0 4px 12px ${primaryColor}40`
                } : {}}
              >
                <Icon size={20} className={isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400'} />
                <span className="text-sm font-medium">{link.label}</span>
                {isActive && <ChevronRight size={16} className="ml-auto" />}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex-shrink-0 space-y-3">
          {/* Status */}
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-yellow-500'}`} />
            <span>{isOnline ? 'Online' : 'Offline'}</span>
            <span className="mx-1">•</span>
            <span>
              {profile?.role === 'admin' ? 'Admin' : 
               profile?.role === 'gerente' ? 'Gerente' : 
               'Operador'}
            </span>
          </div>
          
          {/* Logout Button */}
          <button
            onClick={handleLogoutClick}
            className="flex items-center justify-center gap-2 w-full px-4 py-3 
              bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 
              rounded-xl hover:bg-red-100 dark:hover:bg-red-900/50 
              transition-all duration-200 font-medium text-sm"
          >
            <LogOut size={18} />
            <span>Sair do sistema</span>
          </button>
        </div>
      </aside>
    </>
  )
}

export default MobileSidebar