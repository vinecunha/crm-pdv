import { useState, useCallback, useEffect } from 'react'

interface UseResizableReturn {
  width: number
  handleMouseDown: (e: React.MouseEvent) => void
  isDragging: boolean
  resetWidth: () => void
}

const useResizable = (
  initialWidth: number = 33,
  minWidth: number = 25,
  maxWidth: number = 45
): UseResizableReturn => {
  const [width, setWidth] = useState<number>(initialWidth)
  const [isDragging, setIsDragging] = useState<boolean>(false)
  
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [])
  
  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }, [])
  
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return
    
    const container = document.getElementById('pdv-container')
    if (!container) return
    
    const rect = container.getBoundingClientRect()
    const newWidth = ((rect.right - e.clientX) / rect.width) * 100
    
    const clampedWidth = Math.min(maxWidth, Math.max(minWidth, newWidth))
    setWidth(clampedWidth)
    
    localStorage.setItem('pdv-cart-width', clampedWidth.toString())
  }, [isDragging, minWidth, maxWidth])
  
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, handleMouseMove, handleMouseUp])
  
  useEffect(() => {
    const saved = localStorage.getItem('pdv-cart-width')
    if (saved) {
      setWidth(parseFloat(saved))
    }
  }, [])
  
  return { 
    width, 
    handleMouseDown, 
    isDragging,
    resetWidth: () => setWidth(initialWidth)
  }
}

export default useResizable