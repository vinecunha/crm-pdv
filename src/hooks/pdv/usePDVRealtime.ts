import { useRealtime } from '@/hooks/utils/useRealTime'
import { logger } from '@utils/logger'

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
      logger.log(`🔄 Estoque atualizado`)
    },
    enabled
  })
}