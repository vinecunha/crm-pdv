// hooks/useStockCountShortcuts.js
import { useCallback } from 'react'
import { useKeyboardShortcuts } from '@/hooks/utils/useKeyboardShortcuts'

const useStockCountShortcuts = ({
  // Navegação
  onFocusSearch,
  onClearSearch,
  onBack,
  
  // Sessões
  onNewSession,
  onStartCounting,
  onRefreshSessions,
  
  // Contagem
  onNextItem,
  onPreviousItem,
  onCountItem,
  onSkipItem,
  onAddProduct,
  
  // Finalização
  onFinishSession,
  onCancelSession,
  
  // Ajuda
  onOpenHelp,
  
  // Estado
  enabled = true,
  viewMode = 'sessions', // 'sessions' ou 'counting'
  hasSelectedItem = false,
  
  // Feedback
  onShortcutFeedback
}) => {
  
  const shortcuts = [
    // ===== BUSCA =====
    {
      key: '/',
      description: 'Focar no campo de busca',
      category: 'Busca',
      handler: () => onFocusSearch?.(),
      feedback: true,
      enabled: viewMode === 'counting'
    },
    {
      key: 'Escape',
      description: 'Limpar busca',
      category: 'Busca',
      handler: () => onClearSearch?.(),
      enabled: viewMode === 'counting'
    },
    
    // ===== NAVEGAÇÃO =====
    {
      key: 'Escape',
      description: 'Voltar para sessões',
      category: 'Navegação',
      handler: () => onBack?.(),
      enabled: viewMode === 'counting'
    },
    {
      key: 'b',
      alt: true,
      description: 'Voltar para lista de balanços',
      category: 'Navegação',
      handler: () => onBack?.(),
      enabled: viewMode === 'counting'
    },
    
    // ===== SESSÕES =====
    {
      key: 'n',
      ctrl: true,
      description: 'Novo balanço',
      category: 'Sessões',
      handler: () => onNewSession?.(),
      feedback: true,
      enabled: viewMode === 'sessions'
    },
    {
      key: 'F5',
      description: 'Atualizar lista',
      category: 'Sessões',
      handler: () => onRefreshSessions?.(),
      feedback: true,
      enabled: viewMode === 'sessions'
    },
    
    // ===== CONTAGEM =====
    {
      key: 'ArrowUp',
      description: 'Item anterior',
      category: 'Contagem',
      handler: () => onPreviousItem?.(),
      enabled: viewMode === 'counting'
    },
    {
      key: 'ArrowDown',
      description: 'Próximo item',
      category: 'Contagem',
      handler: () => onNextItem?.(),
      enabled: viewMode === 'counting'
    },
    {
      key: 'Enter',
      description: 'Contar item selecionado',
      category: 'Contagem',
      handler: () => onCountItem?.(),
      enabled: viewMode === 'counting' && hasSelectedItem
    },
    {
      key: 's',
      ctrl: true,
      description: 'Pular item (manter pendente)',
      category: 'Contagem',
      handler: () => onSkipItem?.(),
      enabled: viewMode === 'counting'
    },
    {
      key: 'a',
      ctrl: true,
      description: 'Adicionar produto',
      category: 'Contagem',
      handler: () => onAddProduct?.(),
      feedback: true,
      enabled: viewMode === 'counting'
    },
    
    // ===== FINALIZAÇÃO =====
    {
      key: 'Enter',
      ctrl: true,
      description: 'Finalizar balanço',
      category: 'Finalização',
      handler: () => onFinishSession?.(),
      feedback: true,
      enabled: viewMode === 'counting'
    },
    {
      key: 'Delete',
      ctrl: true,
      shift: true,
      description: 'Cancelar balanço',
      category: 'Finalização',
      handler: () => onCancelSession?.(),
      enabled: viewMode === 'counting'
    },
    
    // ===== AJUDA =====
    {
      key: 'F1',
      description: 'Mostrar atalhos',
      category: 'Ajuda',
      handler: () => onOpenHelp?.(),
      feedback: true
    },
    {
      key: '?',
      shift: true,
      description: 'Mostrar atalhos',
      category: 'Ajuda',
      handler: () => onOpenHelp?.()
    }
  ]

  useKeyboardShortcuts(shortcuts, {
    enabled,
    preventDefault: true,
    onShortcutTriggered: (shortcut) => {
      if (shortcut.feedback) {
        onShortcutFeedback?.(shortcut)
      }
    }
  })

  return { shortcuts }
}

export default useStockCountShortcuts
