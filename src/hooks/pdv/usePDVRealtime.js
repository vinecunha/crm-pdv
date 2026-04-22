// src/hooks/usePDVRealtime.js
import { useRealtime } from '../useRealtime'

export const usePDVRealtime = (enabled = true) => {
  // Assinar atualizações de estoque
  useRealtime({
    table: 'products',
    event: 'UPDATE',
    invalidateQueries: [['products-active']],
    onChange: (payload) => {
      // Atualizar UI com novo estoque
      console.log(`🔄 Estoque de ${payload.new.name}: ${payload.new.stock_quantity}`)
    },
    enabled
  })
}