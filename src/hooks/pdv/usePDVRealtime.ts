import { useRealtime } from '@/hooks/utils/useRealTime'

interface ProductPayload {
  new: {
    name: string
    stock_quantity: number
    [key: string]: unknown
  }
  old: Record<string, unknown>
  eventType: string
  [key: string]: unknown
}

export const usePDVRealtime = (enabled: boolean = true): void => {
  useRealtime({
    table: 'products',
    event: 'UPDATE',
    onChange: () => {
      console.log(`🔄 Estoque atualizado`)
    },
    enabled
  })
}