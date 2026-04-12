import React from 'react'
import { Loader } from 'lucide-react'

// Componente para exibir o atalho do teclado
const ShortcutBadge = ({ shortcut }) => {
  if (!shortcut) return null
  
  const keys = []
  if (shortcut.ctrl) keys.push('⌘')
  if (shortcut.alt) keys.push('⌥')
  if (shortcut.shift) keys.push('⇧')
  
  // Formatar tecla principal
  let mainKey = shortcut.key
  if (mainKey === ' ') mainKey = '␣'
  else if (mainKey === 'Enter') mainKey = '↵'
  else if (mainKey === 'Escape') mainKey = 'Esc'
  else if (mainKey === 'Delete') mainKey = 'Del'
  else if (mainKey === 'ArrowUp') mainKey = '↑'
  else if (mainKey === 'ArrowDown') mainKey = '↓'
  else if (mainKey === 'ArrowLeft') mainKey = '←'
  else if (mainKey === 'ArrowRight') mainKey = '→'
  else mainKey = mainKey.toUpperCase()
  
  keys.push(mainKey)
  
  return (
    <span className="ml-2 text-xs opacity-70 font-mono">
      {keys.join('')}
    </span>
  )
}

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  loading = false, 
  disabled = false,
  onClick,
  type = 'button',
  fullWidth = false,
  icon: Icon,
  className = '',
  // Props para atalhos
  shortcut,
  showShortcut = true,
  shortcutPosition = 'right' // 'right', 'left', 'bottom'
}) => {
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-sm',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
    warning: 'bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-500',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500',
    ghost: 'text-gray-600 hover:bg-gray-100 focus:ring-gray-500'
  }

  const sizes = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg'
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      title={shortcut && showShortcut ? formatShortcutTitle(shortcut) : undefined}
      className={`
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        inline-flex items-center justify-center gap-2 font-medium rounded-lg
        focus:outline-none focus:ring-2 focus:ring-offset-2
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        relative
        ${className}
      `}
    >
      {loading && <Loader size={getIconSize(size)} className="animate-spin" />}
      
      {/* Atalho à esquerda */}
      {shortcut && showShortcut && shortcutPosition === 'left' && (
        <ShortcutBadge shortcut={shortcut} />
      )}
      
      {Icon && !loading && <Icon size={getIconSize(size)} />}
      {children}
      
      {/* Atalho à direita */}
      {shortcut && showShortcut && shortcutPosition === 'right' && (
        <ShortcutBadge shortcut={shortcut} />
      )}
      
      {/* Indicador visual de atalho no canto */}
      {shortcut && showShortcut && shortcutPosition === 'corner' && (
        <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[10px] font-mono bg-gray-800 text-white rounded-full">
          {formatShortcutCompact(shortcut)}
        </span>
      )}
    </button>
  )
}

// Funções auxiliares
const getIconSize = (size) => {
  const sizes = { xs: 12, sm: 14, md: 16, lg: 18, xl: 20 }
  return sizes[size] || 16
}

const formatShortcutTitle = (shortcut) => {
  if (!shortcut) return ''
  
  const parts = []
  if (shortcut.ctrl) parts.push('Ctrl')
  if (shortcut.alt) parts.push('Alt')
  if (shortcut.shift) parts.push('Shift')
  
  let key = shortcut.key
  if (key === ' ') key = 'Space'
  else if (key === 'Enter') key = 'Enter'
  else if (key === 'Escape') key = 'Esc'
  else key = key.toUpperCase()
  
  parts.push(key)
  
  return `${shortcut.description || ''} (${parts.join(' + ')})`.trim()
}

const formatShortcutCompact = (shortcut) => {
  if (!shortcut) return ''
  
  const parts = []
  if (shortcut.ctrl) parts.push('⌘')
  if (shortcut.alt) parts.push('⌥')
  if (shortcut.shift) parts.push('⇧')
  
  let key = shortcut.key
  if (key === ' ') key = '␣'
  else if (key === 'Enter') key = '↵'
  else key = key.slice(0, 2).toUpperCase()
  
  parts.push(key)
  
  return parts.join('')
}

export default Button