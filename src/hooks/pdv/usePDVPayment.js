// src/hooks/pdv/usePDVPayment.js
import { useState, useCallback } from 'react'

export const usePDVPayment = () => {
  const [paymentMethod, setPaymentMethod] = useState('cash')

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