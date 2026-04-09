import React from 'react'
import { Loader } from 'lucide-react'

const SplashScreen = ({ 
  size = 'md', // 'sm', 'md', 'lg'
  fullScreen = false,
  message = 'Carregando...',
  transparent = false
}) => {
  const sizes = {
    sm: 'h-6 w-6',
    md: 'h-10 w-10',
    lg: 'h-16 w-16'
  }

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }

  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="relative">
        <div className={`${sizes[size]} border-4 border-gray-200 rounded-full`}></div>
        <div className={`${sizes[size]} border-4 border-blue-500 rounded-full border-t-transparent animate-spin absolute top-0 left-0`}></div>
      </div>
      {message && (
        <p className={`${textSizes[size]} text-gray-600 font-medium`}>{message}</p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className={`fixed inset-0 flex items-center justify-center z-50 ${transparent ? 'bg-black/50' : 'bg-white'}`}>
        {content}
      </div>
    )
  }

  return content
}

// Componente de Loading Button
export const ButtonLoading = ({ text, loadingText = 'Processando...' }) => {
  return (
    <span className="flex items-center gap-2">
      <Loader size={18} className="animate-spin" />
      {loadingText}
    </span>
  )
}

// Componente de Skeleton Loading para tabelas
export const TableSkeleton = ({ rows = 5, columns = 4 }) => {
  return (
    <div className="animate-pulse">
      <div className="bg-gray-50 rounded-lg overflow-hidden">
        <div className="hidden lg:block">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                {Array(columns).fill().map((_, i) => (
                  <th key={i} className="px-6 py-3">
                    <div className="h-4 bg-gray-300 rounded w-20"></div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array(rows).fill().map((_, i) => (
                <tr key={i} className="border-t border-gray-200">
                  {Array(columns).fill().map((_, j) => (
                    <td key={j} className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Skeleton para mobile */}
        <div className="lg:hidden space-y-3 p-4">
          {Array(rows).fill().map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
              <div className="flex justify-between">
                <div className="h-5 bg-gray-200 rounded w-24"></div>
                <div className="h-5 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default SplashScreen