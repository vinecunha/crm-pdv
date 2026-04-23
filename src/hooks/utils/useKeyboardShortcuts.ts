import React, { useEffect, useRef, useCallback } from 'react'

interface Shortcut {
  key: string
  ctrl?: boolean
  alt?: boolean
  shift?: boolean
  handler: (event: KeyboardEvent) => void
  description?: string
  enabled?: boolean
  feedback?: boolean
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean
  preventDefault?: boolean
  target?: 'window' | 'document' | React.RefObject<HTMLElement>
  onShortcutTriggered?: (shortcut: Shortcut) => void
}

export const useKeyboardShortcuts = (
  shortcuts: Shortcut[] = [],
  options: UseKeyboardShortcutsOptions = {}
): void => {
  const {
    enabled = true,
    preventDefault = true,
    target = 'window',
    onShortcutTriggered
  } = options

  const handlersRef = useRef<Shortcut[]>(shortcuts)
  handlersRef.current = shortcuts

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const target = event.target as HTMLElement
    
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.isContentEditable
    ) {
      return
    }

    for (const shortcut of handlersRef.current) {
      if (shortcut.enabled === false) continue

      const keyMatch = shortcut.key.toLowerCase() === event.key.toLowerCase()
      if (!keyMatch) continue

      const ctrlMatch = !!shortcut.ctrl === (event.ctrlKey || event.metaKey)
      const altMatch = !!shortcut.alt === event.altKey
      const shiftMatch = !!shortcut.shift === event.shiftKey

      if (ctrlMatch && altMatch && shiftMatch) {
        if (preventDefault) {
          event.preventDefault()
          event.stopPropagation()
        }
        
        shortcut.handler(event)
        
        if (shortcut.feedback && onShortcutTriggered) {
          onShortcutTriggered(shortcut)
        }
        
        break
      }
    }
  }, [preventDefault, onShortcutTriggered])

  useEffect(() => {
    if (!enabled) return

    let element: Window | Document | HTMLElement

    if (target === 'window') {
      element = window
    } else if (target === 'document') {
      element = document
    } else if (target.current) {
      element = target.current
    } else {
      element = window
    }

    element.addEventListener('keydown', handleKeyDown as EventListener)
    return () => element.removeEventListener('keydown', handleKeyDown as EventListener)
  }, [enabled, target, handleKeyDown])
}