// src/hooks/pdv/__tests__/usePDVCustomer.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { usePDVCustomer } from '@hooks/pdv/usePDVCustomer'
import { TestWrapper } from '../../../test/setup'

const mockShowFeedback = vi.fn()

// Mock do saleService
vi.mock('@services/saleService', () => ({
  searchCustomerByPhone: vi.fn(),
  createCustomer: vi.fn()
}))

import * as saleService from '@services/saleService'

describe('usePDVCustomer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('estado inicial', () => {
    it('inicializa com cliente null', () => {
      const { result } = renderHook(() => usePDVCustomer(mockShowFeedback), {
        wrapper: TestWrapper
      })
      
      expect(result.current.customer).toBeNull()
      expect(result.current.customerPhone).toBe('')
      expect(result.current.quickCustomerForm).toEqual({
        name: '',
        phone: '',
        email: ''
      })
    })

    it('inicializa sem erros de validação', () => {
      const { result } = renderHook(() => usePDVCustomer(mockShowFeedback), {
        wrapper: TestWrapper
      })
      
      expect(result.current.quickCustomerErrors).toEqual({})
    })
  })

  describe('searchCustomer', () => {
    it('não busca com telefone inválido', async () => {
      const { result } = renderHook(() => usePDVCustomer(mockShowFeedback), {
        wrapper: TestWrapper
      })
      
      act(() => {
        result.current.setCustomerPhone('123')
      })
      
      let response
      await act(async () => {
        response = await result.current.searchCustomer()
      })
      
      expect(response).toBeUndefined()
      expect(mockShowFeedback).toHaveBeenCalledWith('error', 'Digite um telefone válido')
      expect(result.current.customer).toBeNull()
    })

    it('busca cliente com telefone válido', async () => {
      const mockCustomer = { id: 1, name: 'João', phone: '11999998888' }
      saleService.searchCustomerByPhone.mockResolvedValue(mockCustomer)
      
      const { result } = renderHook(() => usePDVCustomer(mockShowFeedback), {
        wrapper: TestWrapper
      })
      
      act(() => {
        result.current.setCustomerPhone('11999998888')
      })
      
      await act(async () => {
        await result.current.searchCustomer()
      })
      
      await waitFor(() => {
        expect(result.current.customer).toEqual(mockCustomer)
      })
      
      expect(mockShowFeedback).toHaveBeenCalledWith('success', 'Cliente encontrado: João')
    })

    it('abre formulário rápido quando cliente não encontrado', async () => {
      saleService.searchCustomerByPhone.mockResolvedValue(null)
      
      const { result } = renderHook(() => usePDVCustomer(mockShowFeedback), {
        wrapper: TestWrapper
      })
      
      act(() => {
        result.current.setCustomerPhone('11999998888')
      })
      
      await act(async () => {
        const response = await result.current.searchCustomer()
        expect(response).toBeNull()
      })
      
      expect(result.current.quickCustomerForm.phone).toBe('11999998888')
    })
  })

  describe('quickRegisterCustomer', () => {
    it('valida campos obrigatórios', async () => {
      const { result } = renderHook(() => usePDVCustomer(mockShowFeedback), {
        wrapper: TestWrapper
      })
      
      act(() => {
        result.current.setQuickCustomerForm({
          name: '',
          phone: '',
          email: ''
        })
      })
      
      let response
      await act(async () => {
        response = await result.current.quickRegisterCustomer()
      })
      
      expect(response).toBe(false)
      expect(result.current.quickCustomerErrors.name).toBe('Nome é obrigatório')
      expect(result.current.quickCustomerErrors.phone).toBe('Telefone inválido')
    })

    it('valida formato de email', async () => {
      const { result } = renderHook(() => usePDVCustomer(mockShowFeedback), {
        wrapper: TestWrapper
      })
      
      act(() => {
        result.current.setQuickCustomerForm({
          name: 'João',
          phone: '11999998888',
          email: 'email-invalido'
        })
      })
      
      let response
      await act(async () => {
        response = await result.current.quickRegisterCustomer()
      })
      
      expect(response).toBe(false)
      expect(result.current.quickCustomerErrors.email).toBe('E-mail inválido')
    })

    it('cria cliente com dados válidos', async () => {
      const mockNewCustomer = { id: 2, name: 'Maria', phone: '11988887777', email: 'maria@email.com' }
      saleService.createCustomer.mockResolvedValue(mockNewCustomer)
      
      const { result } = renderHook(() => usePDVCustomer(mockShowFeedback), {
        wrapper: TestWrapper
      })
      
      act(() => {
        result.current.setQuickCustomerForm({
          name: 'Maria',
          phone: '11988887777',
          email: 'maria@email.com'
        })
      })
      
      await act(async () => {
        await result.current.quickRegisterCustomer()
      })
      
      await waitFor(() => {
        expect(result.current.customer).toEqual(mockNewCustomer)
      })
      
      expect(mockShowFeedback).toHaveBeenCalledWith('success', 'Cliente Maria cadastrado!')
      expect(result.current.quickCustomerErrors).toEqual({})
    })
  })

  describe('clearCustomer', () => {
    it('limpa todos os dados do cliente', () => {
      const { result } = renderHook(() => usePDVCustomer(mockShowFeedback), {
        wrapper: TestWrapper
      })
      
      act(() => {
        result.current.setCustomer({ id: 1, name: 'João' })
        result.current.setCustomerPhone('11999998888')
        result.current.setQuickCustomerForm({ name: 'João', phone: '11999998888', email: '' })
      })
      
      act(() => {
        result.current.clearCustomer()
      })
      
      expect(result.current.customer).toBeNull()
      expect(result.current.customerPhone).toBe('')
      expect(result.current.quickCustomerForm).toEqual({
        name: '',
        phone: '',
        email: ''
      })
    })
  })
})