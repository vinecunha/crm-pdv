// src/hooks/pdv/__tests__/usePDVCart.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePDVCart } from '../usePDVCart'
import { TestWrapper } from '../../../test/setup'

const mockProducts = [
  { id: 1, name: 'Produto 1', price: 10, stock_quantity: 5, unit: 'UN' },
  { id: 2, name: 'Produto 2', price: 20, stock_quantity: 3, unit: 'UN' }
]

const mockShowFeedback = vi.fn()

describe('usePDVCart', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve inicializar com carrinho vazio', () => {
    const { result } = renderHook(
      () => usePDVCart(mockProducts, mockShowFeedback), 
      { wrapper: TestWrapper }  // ✅ Adicionar wrapper
    )
    
    expect(result.current.cart).toEqual([])
    expect(result.current.cartCount).toBe(0)
    expect(result.current.getSubtotal()).toBe(0)
  })

  it('deve adicionar item ao carrinho', () => {
    const { result } = renderHook(() => usePDVCart(mockProducts, mockShowFeedback))
    
    act(() => {
      result.current.addToCart(mockProducts[0])
    })
    
    expect(result.current.cart).toHaveLength(1)
    expect(result.current.cart[0].quantity).toBe(1)
    expect(result.current.cart[0].total).toBe(10)
  })

  it('deve incrementar quantidade ao adicionar mesmo produto', () => {
    const { result } = renderHook(() => usePDVCart(mockProducts, mockShowFeedback))
    
    act(() => {
      result.current.addToCart(mockProducts[0])
    })
    
    act(() => {
      result.current.addToCart(mockProducts[0])
    })
    
    expect(result.current.cart).toHaveLength(1)
    expect(result.current.cart[0].quantity).toBe(2)
    expect(result.current.cart[0].total).toBe(20)
  })

  it('deve atualizar quantidade do item', () => {
    const { result } = renderHook(() => usePDVCart(mockProducts, mockShowFeedback))
    
    act(() => {
      result.current.addToCart(mockProducts[0])
      result.current.updateCartItemQuantity(1, 3)
    })
    
    expect(result.current.cart[0].quantity).toBe(3)
    expect(result.current.cart[0].total).toBe(30)
  })

  it('não deve permitir quantidade maior que estoque', () => {
    const { result } = renderHook(() => usePDVCart(mockProducts, mockShowFeedback))
    
    act(() => {
      result.current.addToCart(mockProducts[0])
      result.current.updateCartItemQuantity(1, 10)
    })
    
    expect(mockShowFeedback).toHaveBeenCalledWith('error', 'Estoque insuficiente! Disponível: 5')
    expect(result.current.cart[0].quantity).toBe(1)
  })

  it('deve remover item quando quantidade for 0', () => {
    const { result } = renderHook(() => usePDVCart(mockProducts, mockShowFeedback))
    
    act(() => {
      result.current.addToCart(mockProducts[0])
      result.current.updateCartItemQuantity(1, 0)
    })
    
    expect(result.current.cart).toHaveLength(0)
  })

  it('deve remover item do carrinho', () => {
    const { result } = renderHook(() => usePDVCart(mockProducts, mockShowFeedback))
    
    act(() => {
      result.current.addToCart(mockProducts[0])
      result.current.addToCart(mockProducts[1])
      result.current.removeFromCart(1)
    })
    
    expect(result.current.cart).toHaveLength(1)
    expect(result.current.cart[0].id).toBe(2)
  })

  it('deve limpar carrinho', () => {
    const { result } = renderHook(() => usePDVCart(mockProducts, mockShowFeedback))
    
    act(() => {
      result.current.addToCart(mockProducts[0])
      result.current.addToCart(mockProducts[1])
      result.current.clearCart()
    })
    
    expect(result.current.cart).toHaveLength(0)
    expect(result.current.cartCount).toBe(0)
  })

  it('deve calcular subtotal corretamente', () => {
    const { result } = renderHook(() => usePDVCart(mockProducts, mockShowFeedback))
    
    act(() => {
      result.current.addToCart(mockProducts[0])
      result.current.updateCartItemQuantity(1, 2)
      result.current.addToCart(mockProducts[1])
    })
    
    expect(result.current.getSubtotal()).toBe(40)
  })

  it('deve calcular total com desconto', () => {
    const { result } = renderHook(() => usePDVCart(mockProducts, mockShowFeedback))
    
    act(() => {
      result.current.addToCart(mockProducts[0])
      result.current.updateCartItemQuantity(1, 2)
    })
    
    expect(result.current.getTotal(5)).toBe(15)
  })
})