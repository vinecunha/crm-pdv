import React from 'react'
import { Keyboard, X } from '../../lib/icons'
import Modal from '../ui/Modal'

const ShortcutsHelpModal = ({ isOpen, onClose, shortcuts }) => {
  const categories = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = []
    }
    acc[shortcut.category].push(shortcut)
    return acc
  }, {})

  const formatShortcut = (shortcut) => {
    const parts = []
    if (shortcut.ctrl) parts.push('Ctrl')
    if (shortcut.alt) parts.push('Alt')
    if (shortcut.shift) parts.push('Shift')
    
    let key = shortcut.key
    if (key === ' ') key = 'Espaço'
    else if (key === 'Enter') key = 'Enter'
    else if (key === 'Escape') key = 'Esc'
    else if (key === 'Delete') key = 'Del'
    else if (key === 'ArrowUp') key = '↑'
    else if (key === 'ArrowDown') key = '↓'
    else if (key === 'F1') key = 'F1'
    else if (key === 'F2') key = 'F2'
    else if (key === 'F5') key = 'F5'
    else if (key === 'F6') key = 'F6'
    else if (key === 'F7') key = 'F7'
    else if (key === 'F8') key = 'F8'
    else if (key === 'F9') key = 'F9'
    else key = key.toUpperCase()
    
    parts.push(key)
    
    return parts.join(' + ')
  }

  const categoryIcons = {
    'Produtos': '📦',
    'Carrinho': '🛒',
    'Cliente': '👤',
    'Cupom': '🎫',
    'Pagamento': '💰',
    'Pagamento Rápido': '⚡',
    'Ajuda': '❓'
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Keyboard size={20} />
          Atalhos de Teclado
        </div>
      }
      size="lg"
    >
      <div className="space-y-4 max-h-[60vh] overflow-y-auto">
        {Object.entries(categories).map(([category, categoryShortcuts]) => (
          <div key={category} className="border dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="bg-gray-50 dark:bg-gray-900/50 px-4 py-2 border-b dark:border-gray-700">
              <h3 className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <span>{categoryIcons[category] || '•'}</span>
                {category}
              </h3>
            </div>
            <div className="divide-y dark:divide-gray-700">
              {categoryShortcuts.map((shortcut, index) => (
                <div key={index} className="px-4 py-3 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{shortcut.description}</span>
                  <kbd className="px-2 py-1 text-xs font-mono bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded shadow-sm">
                    {formatShortcut(shortcut)}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 text-center">
        Pressione <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 border dark:border-gray-600 rounded">F1</kbd> ou <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 border dark:border-gray-600 rounded">?</kbd> a qualquer momento para ver os atalhos
      </div>
    </Modal>
  )
}

export default ShortcutsHelpModal