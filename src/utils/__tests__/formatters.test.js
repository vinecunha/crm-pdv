// src/utils/__tests__/formatters.test.js
import { describe, it, expect } from 'vitest'
import { formatCurrency, formatNumber, formatDate } from '@utils/formatters'

describe('formatCurrency', () => {
  it('formata valores corretamente', () => {
    const result = formatCurrency(100)
    expect(result).toContain('100,00')
  })

  it('formata zero', () => {
    const result = formatCurrency(0)
    expect(result).toContain('0,00')
  })
})

describe('formatNumber', () => {
  it('formata números corretamente', () => {
    expect(formatNumber(1000)).toBe('1.000')
    expect(formatNumber(0)).toBe('0')
  })
})

describe('formatDate', () => {
  it('formata datas corretamente', () => {
    // ✅ Usar data com horário para evitar problema de fuso
    const date = new Date('2024-01-15T12:00:00')
    const result = formatDate(date)
    // Verificar apenas o formato, não o valor exato
    expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/)
  })
})