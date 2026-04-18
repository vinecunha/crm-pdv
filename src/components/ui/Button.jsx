import React, { forwardRef, useCallback, useEffect, useRef } from 'react'
import { Loader } from '../../lib/icons'

// Hook para detectar atalhos de teclado
const useKeyboardShortcut = (shortcut, callback, enabled = true) => {
  useEffect(() => {
    if (!shortcut || !callback || !enabled) return

    const handleKeyDown = (e) => {
      const matches = 
        (!shortcut.ctrl || (e.metaKey || e.ctrlKey)) &&
        (!shortcut.alt || e.altKey) &&
        (!shortcut.shift || e.shiftKey) &&
        e.key.toLowerCase() === shortcut.key.toLowerCase()

      if (matches) {
        e.preventDefault()
        callback(e)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcut, callback, enabled])
}

// Componente de badge de atalho aprimorado
const ShortcutBadge = ({ shortcut, variant = 'default', position = 'inline' }) => {
  if (!shortcut) return null
  
  const keys = []
  if (shortcut.ctrl) keys.push({ key: '⌘', label: 'Cmd' })
  if (shortcut.alt) keys.push({ key: '⌥', label: 'Opt' })
  if (shortcut.shift) keys.push({ key: '⇧', label: 'Shift' })
  
  let mainKey = { 
    key: shortcut.key, 
    label: shortcut.key 
  }
  
  // Mapeamento de teclas especiais
  const keyMap = {
    ' ': { key: '␣', label: 'Space' },
    'Enter': { key: '↵', label: 'Enter' },
    'Escape': { key: '⎋', label: 'Esc' },
    'Delete': { key: '⌫', label: 'Del' },
    'Backspace': { key: '⌫', label: 'Bksp' },
    'ArrowUp': { key: '↑', label: 'Up' },
    'ArrowDown': { key: '↓', label: 'Down' },
    'ArrowLeft': { key: '←', label: 'Left' },
    'ArrowRight': { key: '→', label: 'Right' },
    'Tab': { key: '⇥', label: 'Tab' },
    'CapsLock': { key: '⇪', label: 'Caps' }
  }
  
  if (keyMap[shortcut.key]) {
    mainKey = keyMap[shortcut.key]
  } else {
    mainKey = { 
      key: shortcut.key.length === 1 ? shortcut.key.toUpperCase() : shortcut.key,
      label: shortcut.key.length === 1 ? shortcut.key.toUpperCase() : shortcut.key
    }
  }
  
  keys.push(mainKey)

  const variants = {
    default: 'opacity-70',
    subtle: 'opacity-50',
    prominent: 'opacity-100 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded'
  }

  const positions = {
    inline: '',
    corner: 'absolute -top-1 -right-1 bg-gray-800 text-white dark:bg-black px-1.5 py-0.5 rounded-full text-[10px]'
  }
  
  return (
    <span 
      className={`
        ml-2 text-xs font-mono tracking-tight
        ${variants[variant]}
        ${positions[position]}
      `}
      aria-hidden="true"
    >
      {position === 'corner' 
        ? keys.slice(0, 3).map(k => k.key).join('') + (keys.length > 3 ? '…' : '')
        : keys.map(k => k.key).join('')
      }
    </span>
  )
}

// Componente de tooltip
const Tooltip = ({ children, content, position = 'top' }) => {
  const [show, setShow] = React.useState(false)
  const timeoutRef = useRef()

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => setShow(true), 300)
  }

  const handleMouseLeave = () => {
    clearTimeout(timeoutRef.current)
    setShow(false)
  }

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  }

  return (
    <div 
      className="relative inline-flex"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {show && content && (
        <div 
          className={`
            absolute z-50 px-2 py-1 text-xs text-white bg-gray-900 dark:bg-black 
            rounded shadow-lg whitespace-nowrap pointer-events-none
            ${positions[position]}
          `}
          role="tooltip"
        >
          {content}
          <div className="absolute w-2 h-2 bg-gray-900 dark:bg-black transform rotate-45 -z-10" />
        </div>
      )}
    </div>
  )
}

// Ripple effect para feedback tátil
const useRipple = () => {
  const createRipple = useCallback((event) => {
    const button = event.currentTarget
    const ripple = document.createElement('span')
    const diameter = Math.max(button.clientWidth, button.clientHeight)
    const radius = diameter / 2

    const rect = button.getBoundingClientRect()
    ripple.style.width = ripple.style.height = `${diameter}px`
    ripple.style.left = `${event.clientX - rect.left - radius}px`
    ripple.style.top = `${event.clientY - rect.top - radius}px`
    ripple.className = 'absolute bg-white opacity-30 rounded-full pointer-events-none animate-ripple'

    const existingRipple = button.querySelector('.ripple')
    if (existingRipple) existingRipple.remove()

    ripple.classList.add('ripple')
    button.appendChild(ripple)

    setTimeout(() => ripple.remove(), 600)
  }, [])

  return createRipple
}

const Button = forwardRef(({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  loading = false, 
  disabled = false,
  onClick,
  type = 'button',
  fullWidth = false,
  icon: Icon,
  iconPosition = 'left',
  className = '',
  shortcut,
  showShortcut = true,
  shortcutPosition = 'right',
  shortcutVariant = 'default',
  tooltip,
  tooltipPosition = 'top',
  enableRipple = true,
  enableShortcut = true,
  ariaLabel,
  pressed,
  ...props
}, ref) => {
  const buttonRef = useRef(null)
  const combinedRef = ref || buttonRef
  const createRipple = useRipple()

  // Atalho de teclado
  useKeyboardShortcut(
    shortcut, 
    (e) => {
      if (!disabled && !loading && onClick) {
        onClick(e)
      }
    },
    enableShortcut && !disabled && !loading
  )

  const handleClick = useCallback((e) => {
    if (disabled || loading) return
    
    if (enableRipple) {
      createRipple(e)
    }
    
    onClick?.(e)
  }, [disabled, loading, onClick, enableRipple, createRipple])

  // Variantes com melhorias de UX
  const variants = {
    primary: `
      bg-blue-600 text-white 
      hover:bg-blue-700 active:bg-blue-800
      focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
      shadow-sm hover:shadow-md active:shadow-sm
      dark:bg-blue-700 dark:hover:bg-blue-600 dark:active:bg-blue-800
      disabled:bg-blue-400 dark:disabled:bg-blue-800
    `,
    secondary: `
      bg-gray-200 text-gray-800 
      hover:bg-gray-300 active:bg-gray-400
      focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2
      dark:bg-gray-800 dark:text-gray-200 
      dark:hover:bg-gray-700 dark:active:bg-gray-600
      disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:text-gray-400
    `,
    danger: `
      bg-red-600 text-white 
      hover:bg-red-700 active:bg-red-800
      focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2
      shadow-sm hover:shadow-md active:shadow-sm
      dark:bg-red-700 dark:hover:bg-red-600 dark:active:bg-red-800
      disabled:bg-red-400 dark:disabled:bg-red-800
    `,
    success: `
      bg-green-600 text-white 
      hover:bg-green-700 active:bg-green-800
      focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2
      shadow-sm hover:shadow-md active:shadow-sm
      dark:bg-green-700 dark:hover:bg-green-600 dark:active:bg-green-800
      disabled:bg-green-400 dark:disabled:bg-green-800
    `,
    warning: `
      bg-yellow-500 text-white 
      hover:bg-yellow-600 active:bg-yellow-700
      focus-visible:ring-2 focus-visible:ring-yellow-500 focus-visible:ring-offset-2
      shadow-sm hover:shadow-md active:shadow-sm
      dark:bg-yellow-600 dark:hover:bg-yellow-500 dark:active:bg-yellow-700
      disabled:bg-yellow-300 dark:disabled:bg-yellow-800
    `,
    outline: `
      border-2 border-gray-300 text-gray-700 
      hover:bg-gray-50 active:bg-gray-100
      focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2
      dark:border-gray-600 dark:text-gray-300 
      dark:hover:bg-gray-800 dark:active:bg-gray-700
      disabled:border-gray-200 disabled:text-gray-400 dark:disabled:border-gray-700
    `,
    ghost: `
      text-gray-600 
      hover:bg-gray-100 active:bg-gray-200
      focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2
      dark:text-gray-400 
      dark:hover:bg-gray-800 dark:active:bg-gray-700
      disabled:text-gray-300 dark:disabled:text-gray-600
    `,
    glass: `
      backdrop-blur-sm bg-white/70 text-gray-800
      hover:bg-white/80 active:bg-white/90
      focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2
      border border-white/20
      dark:bg-gray-900/70 dark:text-gray-200
      dark:hover:bg-gray-900/80 dark:active:bg-gray-900/90
    `
  }

  const sizes = {
    xs: 'px-2 py-1 text-xs gap-1',
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2.5',
    xl: 'px-8 py-4 text-lg gap-3'
  }

  const getIconSize = (size) => {
    const sizes = { xs: 12, sm: 14, md: 16, lg: 18, xl: 20 }
    return sizes[size] || 16
  }

  const formatTooltip = () => {
    if (tooltip) return tooltip
    if (!shortcut || !showShortcut) return null
    
    const parts = []
    if (shortcut.ctrl) parts.push('⌘')
    if (shortcut.alt) parts.push('⌥')
    if (shortcut.shift) parts.push('⇧')
    
    let key = shortcut.key
    if (key === ' ') key = 'Space'
    else if (key.length === 1) key = key.toUpperCase()
    
    parts.push(key)
    
    const shortcutText = parts.join(' + ')
    return shortcut.description 
      ? `${shortcut.description} (${shortcutText})`
      : shortcutText
  }

  const buttonContent = (
    <button
      ref={combinedRef}
      type={type}
      onClick={handleClick}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      aria-pressed={pressed}
      aria-busy={loading}
      className={`
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        inline-flex items-center justify-center font-medium rounded-lg
        focus:outline-none focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900
        transition-all duration-200 ease-out
        disabled:cursor-not-allowed
        relative overflow-hidden
        ${className}
      `}
      {...props}
    >
      {/* Loading spinner */}
      {loading && (
        <Loader 
          size={getIconSize(size)} 
          className="animate-spin shrink-0" 
          aria-hidden="true"
        />
      )}
      
      {/* Atalho na esquerda */}
      {shortcut && showShortcut && shortcutPosition === 'left' && (
        <ShortcutBadge 
          shortcut={shortcut} 
          variant={shortcutVariant}
          position="inline"
        />
      )}
      
      {/* Ícone */}
      {Icon && !loading && iconPosition === 'left' && (
        <Icon size={getIconSize(size)} className="shrink-0" aria-hidden="true" />
      )}
      
      {/* Conteúdo */}
      <span className="truncate">{children}</span>
      
      {/* Ícone na direita */}
      {Icon && !loading && iconPosition === 'right' && (
        <Icon size={getIconSize(size)} className="shrink-0" aria-hidden="true" />
      )}
      
      {/* Atalho na direita */}
      {shortcut && showShortcut && shortcutPosition === 'right' && (
        <ShortcutBadge 
          shortcut={shortcut} 
          variant={shortcutVariant}
          position="inline"
        />
      )}
      
      {/* Atalho no canto */}
      {shortcut && showShortcut && shortcutPosition === 'corner' && (
        <ShortcutBadge 
          shortcut={shortcut} 
          variant="prominent"
          position="corner"
        />
      )}
    </button>
  )

  // Envolve com tooltip se necessário
  const tooltipContent = formatTooltip()
  if (tooltipContent) {
    return (
      <Tooltip content={tooltipContent} position={tooltipPosition}>
        {buttonContent}
      </Tooltip>
    )
  }

  return buttonContent
})

Button.displayName = 'Button'

// Adicione este CSS ao seu arquivo global para o efeito ripple
const rippleStyles = `
  @keyframes ripple {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }
  
  .animate-ripple {
    animation: ripple 0.6s ease-out;
  }
`

// Exemplo de uso com Group
const ButtonGroup = ({ children, vertical = false, className = '' }) => (
  <div 
    className={`
      inline-flex ${vertical ? 'flex-col' : 'flex-row'}
      [&>button]:rounded-none
      [&>button:first-child]:${vertical ? 'rounded-t-lg' : 'rounded-l-lg'}
      [&>button:last-child]:${vertical ? 'rounded-b-lg' : 'rounded-r-lg'}
      [&>button:not(:first-child)]:${vertical ? '-mt-px' : '-ml-px'}
      ${className}
    `}
    role="group"
  >
    {children}
  </div>
)

export { ButtonGroup, useKeyboardShortcut }
export default Button