import { useState } from 'react'
import { secureStorage } from '@utils/secureStorage'
import { logger } from '@utils/logger'

export const useSecureStorage = <T>(key: string, initialValue: T = null as T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = secureStorage.get(key)
      return item !== null ? item : initialValue
    } catch (error) {
      logger.error('Erro ao ler do storage:', error)
      return initialValue
    }
  })

  const setValue = async (value: T | ((prev: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      await secureStorage.set(key, valueToStore)
    } catch (error) {
      logger.error('Erro ao salvar no storage:', error)
    }
  }

  const removeValue = async () => {
    try {
      secureStorage.remove(key)
      setStoredValue(initialValue)
    } catch (error) {
      logger.error('Erro ao remover do storage:', error)
    }
  }

  return [storedValue, setValue, removeValue] as const
}
