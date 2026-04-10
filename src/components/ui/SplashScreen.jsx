import React from 'react'

const SplashScreen = ({ 
  size = 'md',
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

  const spinnerSizes = {
    sm: 'border-2',
    md: 'border-3',
    lg: 'border-4'
  }

  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <div className={`${sizes[size]} ${spinnerSizes[size]} border-gray-200 rounded-full`}></div>
        <div className={`${sizes[size]} ${spinnerSizes[size]} border-blue-500 rounded-full border-t-transparent animate-spin absolute top-0 left-0`}></div>
      </div>
      {message && (
        <p className={`${textSizes[size]} text-gray-600 font-medium animate-pulse`}>
          {message}
        </p>
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

export default SplashScreen