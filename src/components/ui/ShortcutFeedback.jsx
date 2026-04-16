import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

const ShortcutFeedback = ({ shortcut, onHide }) => {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      onHide?.()
    }, 1500)
    
    return () => clearTimeout(timer)
  }, [onHide])

  if (!visible || !shortcut) return null

  const formatKeys = () => {
    const parts = []
    if (shortcut.ctrl) parts.push('⌘')
    if (shortcut.alt) parts.push('⌥')
    if (shortcut.shift) parts.push('⇧')
    
    let key = shortcut.key
    if (key === ' ') key = '␣'
    else if (key === 'Enter') key = '↵'
    else if (key === 'Escape') key = 'Esc'
    else if (key === 'F1') key = 'F1'
    else if (key === 'F2') key = 'F2'
    else if (key === 'F5') key = 'F5'
    else if (key === 'F6') key = 'F6'
    else if (key === 'F7') key = 'F7'
    else if (key === 'F8') key = 'F8'
    else if (key === 'F9') key = 'F9'
    else key = key.toUpperCase()
    
    parts.push(key)
    
    return parts.join('')
  }

  return createPortal(
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-200">
      <div className="bg-gray-900 dark:bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-3">
        <kbd className="px-2 py-1 bg-gray-700 dark:bg-gray-950 rounded text-sm font-mono">
          {formatKeys()}
        </kbd>
        <span className="text-sm">{shortcut.description}</span>
      </div>
    </div>,
    document.body
  )
}

export default ShortcutFeedback