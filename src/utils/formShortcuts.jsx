export const formShortcuts = {
  // Busca
  SEARCH: { key: '/', description: 'Focar busca' },
  SEARCH_ALT: { key: 'f', ctrl: true, description: 'Buscar' },
  
  // Cliente
  CUSTOMER_SEARCH: { key: 'c', ctrl: true, description: 'Buscar cliente' },
  CUSTOMER_NEW: { key: 'n', ctrl: true, description: 'Novo cliente' },
  
  // Cupom
  COUPON_APPLY: { key: 'u', ctrl: true, description: 'Aplicar cupom' },
  
  // Login
  EMAIL_FOCUS: { key: 'e', ctrl: true, description: 'Focar email' },
  PASSWORD_FOCUS: { key: 'p', ctrl: true, description: 'Focar senha' },
  
  // Quantidade (StockCount)
  QUANTITY_FOCUS: { key: 'q', ctrl: true, description: 'Focar quantidade' },
  NOTES_FOCUS: { key: 'o', ctrl: true, description: 'Adicionar observação' },
  
  // Pagamento
  PAYMENT_CASH: { key: '1', ctrl: true, description: 'Pagamento em dinheiro' },
  PAYMENT_PIX: { key: '2', ctrl: true, description: 'Pagamento PIX' },
  PAYMENT_CREDIT: { key: '3', ctrl: true, description: 'Cartão de crédito' },
  PAYMENT_DEBIT: { key: '4', ctrl: true, description: 'Cartão de débito' },
  
  // Formulário
  SAVE: { key: 's', ctrl: true, description: 'Salvar' },
  CANCEL: { key: 'Escape', description: 'Cancelar' },
  CLEAR: { key: 'Delete', ctrl: true, description: 'Limpar campo' },
  
  // Confirmação
  CONFIRM: { key: 'Enter', description: 'Confirmar' },
  NEXT: { key: 'ArrowDown', description: 'Próximo' },
  PREVIOUS: { key: 'ArrowUp', description: 'Anterior' }
}