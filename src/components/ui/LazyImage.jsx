import React, { useState, useEffect, useRef } from 'react'
import { Image as ImageIcon } from '../../lib/icons'

const LazyImage = ({ 
  src, 
  alt, 
  className = '', 
  placeholder,
  fallback,
  onLoad,
  onError,
  ...props 
}) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const [hasError, setHasError] = useState(false)
  const imgRef = useRef()

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { 
        rootMargin: '100px',
        threshold: 0.01 
      }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const handleLoad = () => {
    setIsLoaded(true)
    onLoad?.()
  }

  const handleError = () => {
    setHasError(true)
    onError?.()
  }

  const defaultPlaceholder = (
    <div className="w-full h-full bg-gray-200 dark:bg-gray-800 animate-pulse flex items-center justify-center">
      <ImageIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
    </div>
  )

  const errorFallback = (
    <div className="w-full h-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
      <ImageIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
    </div>
  )

  if (hasError) {
    return fallback || errorFallback
  }

  return (
    <div ref={imgRef} className={`relative ${className}`}>
      {isInView ? (
        <>
          <img
            src={src}
            alt={alt}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={handleLoad}
            onError={handleError}
            loading="lazy"
            {...props}
          />
          {!isLoaded && (placeholder || defaultPlaceholder)}
        </>
      ) : (
        placeholder || defaultPlaceholder
      )}
    </div>
  )
}

export default LazyImage