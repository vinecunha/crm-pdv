import React, { useEffect, useRef, useCallback } from 'react'

/**
 * Hook para gerenciar atalhos de teclado
 * @param {Array} shortcuts - Lista de atalhos [{ key, ctrl, alt, shift, handler, description, enabled }]
 * @param {Object} options - Opções de configuração
 */
const useKeyboardShortcuts = (shortcuts = [], options = {}) => {
  const {
    enabled = true,
    preventDefault = true,
    target = 'window' // 'window', 'document', ou ref
  } = options

  const handlersRef = useRef(shortcuts)
  handlersRef.current = shortcuts

  const handleKeyDown = useCallback((event) => {
    // Ignorar se estiver digitando em input/textarea/select
    const target = event.target
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.isContentEditable
    ) {
      return
    }

    // Verificar cada atalho
    for (const shortcut of handlersRef.current) {
      // Pular se desabilitado individualmente
      if (shortcut.enabled === false) continue

      // Verificar tecla principal
      const keyMatch = shortcut.key.toLowerCase() === event.key.toLowerCase()
      if (!keyMatch) continue

      // Verificar modificadores
      const ctrlMatch = !!shortcut.ctrl === (event.ctrlKey || event.metaKey) // metaKey para Command no Mac
      const altMatch = !!shortcut.alt === event.altKey
      const shiftMatch = !!shortcut.shift === event.shiftKey

      if (ctrlMatch && altMatch && shiftMatch) {
        if (preventDefault) {
          event.preventDefault()
          event.stopPropagation()
        }
        
        // Executar handler
        shortcut.handler(event)
        
        // Feedback opcional (se existir função de feedback)
        if (shortcut.feedback && options.onShortcutTriggered) {
          options.onShortcutTriggered(shortcut)
        }
        
        break
      }
    }
  }, [preventDefault, options])

  useEffect(() => {
    if (!enabled) return

    let element
    if (target === 'window') {
      element = window
    } else if (target === 'document') {
      element = document
    } else if (target.current) {
      element = target.current
    } else {
      element = window
    }

    element.addEventListener('keydown', handleKeyDown)
    return () => element.removeEventListener('keydown', handleKeyDown)
  }, [enabled, target, handleKeyDown])
}

export default useKeyboardShortcuts