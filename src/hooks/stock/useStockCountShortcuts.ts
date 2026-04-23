import { useCallback } from 'react'
import { useKeyboardShortcuts } from '@/hooks/utils/useKeyboardShortcuts'

type ViewMode = 'sessions' | 'counting'

interface Shortcut {
  key: string
  description: string
  category: string
  handler: () => void
  feedback?: boolean
  enabled?: boolean
  ctrl?: boolean
  alt?: boolean
  shift?: boolean
}

interface UseStockCountShortcutsProps {
  onFocusSearch?: () => void
  onClearSearch?: () => void
  onBack?: () => void
  onNewSession?: () => void
  onStartCounting?: () => void
  onRefreshSessions?: () => void
  onNextItem?: () => void
  onPreviousItem?: () => void
  onCountItem?: () => void
  onSkipItem?: () => void
  onAddProduct?: () => void
  onFinishSession?: () => void
  onCancelSession?: () => void
  onOpenHelp?: () => void
  enabled?: boolean
  viewMode?: ViewMode
  hasSelectedItem?: boolean
  onShortcutFeedback?: (shortcut: Shortcut) => void
}

interface UseStockCountShortcutsReturn {
  shortcuts: Shortcut[]
}

const useStockCountShortcuts = ({
  onFocusSearch,
  onClearSearch,
  onBack,
  onNewSession,
  onStartCounting,
  onRefreshSessions,
  onNextItem,
  onPreviousItem,
  onCountItem,
  onSkipItem,
  onAddProduct,
  onFinishSession,
  onCancelSession,
  onOpenHelp,
  enabled = true,
  viewMode = 'sessions',
  hasSelectedItem = false,
  onShortcutFeedback
}: UseStockCountShortcutsProps): UseStockCountShortcutsReturn => {
  
  const shortcuts: Shortcut[] = [
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
    onShortcutTriggered: (shortcut: Shortcut) => {
      if (shortcut.feedback) {
        onShortcutFeedback?.(shortcut)
      }
    }
  })

  return { shortcuts }
}

export default useStockCountShortcuts