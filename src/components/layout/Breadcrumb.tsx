// src/components/layout/Breadcrumb.tsx
import React from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Home } from '@lib/icons'

export interface BreadcrumbItem {
  label: string
  path: string
  icon?: React.ComponentType<{ size?: number; className?: string }>
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  collapsed: boolean
  isCompact?: boolean
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ 
  items, 
  collapsed, 
  isCompact = false 
}) => {
  // Não mostrar breadcrumb se for Dashboard (apenas Home)
  if (items.length <= 1 && items[0]?.label === 'Home') {
    return null
  }

  return (
    <div className={`
      sticky top-[72px] lg:top-[88px] z-10
      transition-all duration-300
      ${collapsed ? 'lg:ml-20' : 'lg:ml-64'}
    `}>
      <nav className={`
        flex items-center gap-1.5 px-3 sm:px-4 lg:px-6 py-2
        text-xs sm:text-sm
        bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-sm
        border-b border-gray-200/50 dark:border-gray-700/50
        transition-all duration-300
        ${isCompact ? 'opacity-100 h-0 py-0 overflow-hidden border-b-0' : 'opacity-100'}
      `}>
        {items.map((item, index) => (
          <React.Fragment key={item.path}>
            {index > 0 && (
              <ChevronRight size={14} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
            )}
            
            {index === items.length - 1 ? (
              <span className="font-medium text-gray-900 dark:text-white truncate">
                {item.label}
              </span>
            ) : (
              <Link
                to={item.path}
                className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 
                  hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate"
              >
                {item.icon && <item.icon size={14} />}
                <span>{item.label}</span>
              </Link>
            )}
          </React.Fragment>
        ))}
      </nav>
    </div>
  )
}

export default Breadcrumb