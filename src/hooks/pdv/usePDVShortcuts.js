import React, { useMemo } from 'react'
import { useKeyboardShortcuts } from '@/hooks/utils/useKeyboardShortcuts'

export const usePDVShortcuts = ({
  // Produtos
  onFocusSearch,
  onAddProduct,
  onClearSearch,
  
  // Carrinho
  onClearCart,
  onIncreaseQuantity,
  onDecreaseQuantity,
  onRemoveItem,
  
  // Cliente
  onOpenCustomerModal,
  onClearCustomer,
  
  // Cupom
  onOpenCouponModal,
  onApplyCoupon,
  onRemoveCoupon,
  
  // Pagamento
  onOpenPaymentModal,
  onConfirmPayment,
  onCancelPayment,
  
  // Navegação
  onRefreshProducts,
  onOpenHelp,
  
  // Estado
  enabled = true,
  cartItems = [],
  selectedCartItemIndex = 0,
  setSelectedCartItemIndex,
  
  // Feedback
  onShortcutFeedback
}) => {
  
  const shortcuts = [
    // ===== BUSCA E PRODUTOS =====
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
    
    // ===== CARRINHO =====
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
    
    // ===== CLIENTE =====
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
    
    // ===== CUPOM =====
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
    
    // ===== PAGAMENTO =====
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
      enabled: false // Sobrescreve o Escape padrão
    },
    
    // ===== PAGAMENTO RÁPIDO (Teclas F) =====
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
    
    // ===== AJUDA =====
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
    onShortcutTriggered: (shortcut) => {
      if (shortcut.feedback) {
        onShortcutFeedback?.(shortcut)
      }
    }
  })

  // Retorna lista de atalhos para exibição
  return {
    shortcuts,
    getShortcutsByCategory: () => {
      const categories = {}
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
