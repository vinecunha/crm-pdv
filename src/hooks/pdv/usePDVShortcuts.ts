import { useMemo } from 'react'
import { useKeyboardShortcuts } from '@/hooks/utils/useKeyboardShortcuts'
import type { CartItem } from '@/types'

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

type PaymentMethod = 'cash' | 'pix' | 'credit_card' | 'debit_card'

interface ShortcutCategories {
  [category: string]: Shortcut[]
}

interface UsePDVShortcutsProps {
  onFocusSearch?: () => void
  onAddProduct?: () => void
  onClearSearch?: () => void
  onClearCart?: () => void
  onIncreaseQuantity?: (item: CartItem) => void
  onDecreaseQuantity?: (item: CartItem) => void
  onRemoveItem?: (id: number) => void
  onOpenCustomerModal?: () => void
  onClearCustomer?: () => void
  onOpenCouponModal?: () => void
  onApplyCoupon?: () => void
  onRemoveCoupon?: () => void
  onOpenPaymentModal?: () => void
  onConfirmPayment?: (method?: PaymentMethod) => void
  onCancelPayment?: () => void
  onRefreshProducts?: () => void
  onOpenHelp?: () => void
  enabled?: boolean
  cartItems?: CartItem[]
  selectedCartItemIndex?: number
  setSelectedCartItemIndex?: React.Dispatch<React.SetStateAction<number>>
  onShortcutFeedback?: (shortcut: Shortcut) => void
}

interface UsePDVShortcutsReturn {
  shortcuts: Shortcut[]
  getShortcutsByCategory: () => ShortcutCategories
}

export const usePDVShortcuts = ({
  onFocusSearch,
  onAddProduct,
  onClearSearch,
  onClearCart,
  onIncreaseQuantity,
  onDecreaseQuantity,
  onRemoveItem,
  onOpenCustomerModal,
  onClearCustomer,
  onOpenCouponModal,
  onApplyCoupon,
  onRemoveCoupon,
  onOpenPaymentModal,
  onConfirmPayment,
  onCancelPayment,
  onRefreshProducts,
  onOpenHelp,
  enabled = true,
  cartItems = [],
  selectedCartItemIndex = 0,
  setSelectedCartItemIndex,
  onShortcutFeedback
}: UsePDVShortcutsProps): UsePDVShortcutsReturn => {
  
  const shortcuts: Shortcut[] = [
    {
      key: '/',
      description: 'Focar no campo de busca',
      category: 'Produtos',
      handler: () => onFocusSearch?.(),
      feedback: true
    },
    {
      key: 'Escape',
      description: 'Limpar busca / Fechar modais',
      category: 'Produtos',
      handler: () => onClearSearch?.()
    },
    {
      key: 'F5',
      description: 'Atualizar produtos',
      category: 'Produtos',
      handler: () => onRefreshProducts?.(),
      feedback: true
    },
    {
      key: 'Delete',
      description: 'Limpar carrinho',
      category: 'Carrinho',
      handler: () => onClearCart?.(),
      feedback: true
    },
    {
      key: '+',
      shift: true,
      description: 'Aumentar quantidade do item selecionado',
      category: 'Carrinho',
      handler: () => {
        if (cartItems[selectedCartItemIndex]) {
          onIncreaseQuantity?.(cartItems[selectedCartItemIndex])
        }
      }
    },
    {
      key: '-',
      description: 'Diminuir quantidade do item selecionado',
      category: 'Carrinho',
      handler: () => {
        if (cartItems[selectedCartItemIndex]) {
          onDecreaseQuantity?.(cartItems[selectedCartItemIndex])
        }
      }
    },
    {
      key: 'r',
      ctrl: true,
      description: 'Remover item selecionado',
      category: 'Carrinho',
      handler: () => {
        if (cartItems[selectedCartItemIndex]) {
          onRemoveItem?.(cartItems[selectedCartItemIndex].id)
        }
      }
    },
    {
      key: 'ArrowUp',
      description: 'Selecionar item anterior',
      category: 'Carrinho',
      handler: () => {
        if (cartItems.length > 0) {
          setSelectedCartItemIndex?.(Math.max(0, selectedCartItemIndex - 1))
        }
      }
    },
    {
      key: 'ArrowDown',
      description: 'Selecionar próximo item',
      category: 'Carrinho',
      handler: () => {
        if (cartItems.length > 0) {
          setSelectedCartItemIndex?.(Math.min(cartItems.length - 1, selectedCartItemIndex + 1))
        }
      }
    },
    {
      key: 'c',
      alt: true,
      description: 'Buscar/Identificar cliente',
      category: 'Cliente',
      handler: () => onOpenCustomerModal?.(),
      feedback: true
    },
    {
      key: 'c',
      ctrl: true,
      shift: true,
      description: 'Remover cliente',
      category: 'Cliente',
      handler: () => onClearCustomer?.(),
      feedback: true
    },
    {
      key: 'u',
      alt: true,
      description: 'Aplicar cupom',
      category: 'Cupom',
      handler: () => onOpenCouponModal?.(),
      feedback: true
    },
    {
      key: 'u',
      ctrl: true,
      shift: true,
      description: 'Remover cupom',
      category: 'Cupom',
      handler: () => onRemoveCoupon?.(),
      feedback: true
    },
    {
      key: 'Enter',
      ctrl: true,
      description: 'Finalizar venda',
      category: 'Pagamento',
      handler: () => onOpenPaymentModal?.(),
      feedback: true
    },
    {
      key: 'F2',
      description: 'Confirmar pagamento',
      category: 'Pagamento',
      handler: () => onConfirmPayment?.(),
      feedback: true
    },
    {
      key: 'Escape',
      description: 'Cancelar pagamento',
      category: 'Pagamento',
      handler: () => onCancelPayment?.(),
      enabled: false
    },
    {
      key: 'F6',
      description: 'Pagamento em Dinheiro',
      category: 'Pagamento Rápido',
      handler: () => onConfirmPayment?.('cash')
    },
    {
      key: 'F7',
      description: 'Pagamento em PIX',
      category: 'Pagamento Rápido',
      handler: () => onConfirmPayment?.('pix')
    },
    {
      key: 'F8',
      description: 'Pagamento em Cartão de Crédito',
      category: 'Pagamento Rápido',
      handler: () => onConfirmPayment?.('credit_card')
    },
    {
      key: 'F9',
      description: 'Pagamento em Cartão de Débito',
      category: 'Pagamento Rápido',
      handler: () => onConfirmPayment?.('debit_card')
    },
    {
      key: 'F1',
      description: 'Mostrar atalhos de teclado',
      category: 'Ajuda',
      handler: () => onOpenHelp?.(),
      feedback: true
    },
    {
      key: '?',
      shift: true,
      description: 'Mostrar atalhos de teclado',
      category: 'Ajuda',
      handler: () => onOpenHelp?.()
    },
    {
      key: 'k',
      ctrl: true,
      description: 'Mostrar atalhos de teclado',
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

  return {
    shortcuts,
    getShortcutsByCategory: (): ShortcutCategories => {
      const categories: ShortcutCategories = {}
      shortcuts.forEach(s => {
        if (!categories[s.category]) {
          categories[s.category] = []
        }
        categories[s.category].push(s)
      })
      return categories
    }
  }
}