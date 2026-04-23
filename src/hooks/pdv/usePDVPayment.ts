import { useState, useCallback } from 'react'

type PaymentMethod = 'cash' | 'credit_card' | 'debit_card' | 'pix'

interface UsePDVPaymentReturn {
  paymentMethod: PaymentMethod
  setPaymentMethod: React.Dispatch<React.SetStateAction<PaymentMethod>>
  isPix: boolean
  isCard: boolean
  isCash: boolean
}

export const usePDVPayment = (): UsePDVPaymentReturn => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')

  const isPix = paymentMethod === 'pix'
  const isCard = paymentMethod === 'credit_card' || paymentMethod === 'debit_card'
  const isCash = paymentMethod === 'cash'

  return {
    paymentMethod,
    setPaymentMethod,
    isPix,
    isCard,
    isCash
  }
}