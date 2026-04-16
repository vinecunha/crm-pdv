import React from 'react'
import LazyImage from './LazyImage'

const SplashScreen = ({ 
  size = 'md',
  fullScreen = false,
  message = 'Carregando...',
  transparent = false,
  logoSrc = '/brasalino-pollo.png'
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

  const spinnerSizes = {
    sm: 'border-2',
    md: 'border-3',
    lg: 'border-4'
  }

  const logoSizes = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-20 w-20'
  }

  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <LazyImage
        src={logoSrc}
        alt="Logo"
        className={`${logoSizes[size]} object-contain`}
        fallback={
          <div className={`${logoSizes[size]} bg-gray-200 dark:bg-gray-700 animate-pulse rounded-full`} />
        }
      />
      
      <div className="relative">
        <div className={`${sizes[size]} ${spinnerSizes[size]} border-gray-200 dark:border-gray-700 rounded-full`}></div>
        <div className={`${sizes[size]} ${spinnerSizes[size]} border-blue-500 dark:border-blue-400 rounded-full border-t-transparent animate-spin absolute top-0 left-0`}></div>
      </div>
      
      {message && (
        <p className={`${textSizes[size]} text-gray-600 dark:text-gray-400 font-medium animate-pulse`}>
          {message}
        </p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className={`fixed inset-0 flex items-center justify-center z-50 ${transparent ? 'bg-black/50 dark:bg-black/70' : 'bg-white dark:bg-gray-900'}`}>
        {content}
      </div>
    )
  }

  return content
}

export default SplashScreen