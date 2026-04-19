import { useState, useCallback, useEffect } from 'react'

const useResizable = (initialWidth = 33, minWidth = 25, maxWidth = 45) => {
  const [width, setWidth] = useState(initialWidth)
  const [isDragging, setIsDragging] = useState(false)
  
  const handleMouseDown = useCallback((e) => {
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
  
  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return
    
    const container = document.getElementById('pdv-container')
    if (!container) return
    
    const rect = container.getBoundingClientRect()
    const newWidth = ((rect.right - e.clientX) / rect.width) * 100
    
    // Limitar entre min e max
    const clampedWidth = Math.min(maxWidth, Math.max(minWidth, newWidth))
    setWidth(clampedWidth)
    
    // Salvar preferência
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
  
  // Carregar largura salva
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