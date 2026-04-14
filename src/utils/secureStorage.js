import { logger } from '../utils/logger' 
import { useState } from 'react'
const SIGNATURE_KEY = 'app_signature'
const STORAGE_VERSION = '1.0'

/**
 * Gera uma assinatura para os dados usando uma chave secreta
 * Em produção, use uma chave do ambiente
 */
const generateSignature = (data) => {
  try {
    const secret = import.meta.env.VITE_STORAGE_SECRET
    if (!secret) throw new Error('[secureStorage] VITE_STORAGE_SECRET não definida no .env')
    const dataString = JSON.stringify(data) + secret + STORAGE_VERSION
    return btoa(dataString).slice(0, 32)
  } catch (error) {
    console.error('Erro ao gerar assinatura:', error)
    return null
  }
}

/**
 * Verifica se os dados são válidos (não expiraram e assinatura confere)
 */
const isValid = (data, maxAge = 7 * 24 * 60 * 60 * 1000) => { // 7 dias default
  if (!data || !data.signature || !data.timestamp) {
    return false
  }
  
  // Verificar idade
  if (Date.now() - data.timestamp > maxAge) {
    console.warn('Dados expirados no storage')
    return false
  }
  
  // Verificar assinatura
  const expectedSignature = generateSignature(data.value)
  if (data.signature !== expectedSignature) {
    console.warn('Assinatura inválida - dados podem ter sido adulterados')
    return false
  }
  
  return true
}

/**
 * Storage seguro com assinatura e expiração
 */
export const secureStorage = {
  /**
   * Salva dados no storage com assinatura
   */
  set(key, value, options = {}) {
    try {
      const data = {
        value,
        signature: generateSignature(value),
        timestamp: Date.now(),
        version: STORAGE_VERSION,
        ...options.metadata
      }
      
      localStorage.setItem(key, JSON.stringify(data))
      return true
    } catch (error) {
      console.error('Erro ao salvar no secureStorage:', error)
      
      // Se o localStorage estiver cheio, tenta limpar itens antigos
      if (error.name === 'QuotaExceededError') {
        this.cleanup()
        try {
          const data = {
            value,
            signature: generateSignature(value),
            timestamp: Date.now(),
            version: STORAGE_VERSION
          }
          localStorage.setItem(key, JSON.stringify(data))
          return true
        } catch (retryError) {
          console.error('Falha ao salvar mesmo após cleanup:', retryError)
          return false
        }
      }
      
      return false
    }
  },
  
  /**
   * Recupera dados do storage se forem válidos
   */
  get(key, maxAge = 7 * 24 * 60 * 60 * 1000) {
    try {
      const stored = localStorage.getItem(key)
      if (!stored) return null
      
      const data = JSON.parse(stored)
      
      if (!isValid(data, maxAge)) {
        localStorage.removeItem(key)
        return null
      }
      
      return data.value
    } catch (error) {
      console.error('Erro ao ler do secureStorage:', error)
      localStorage.removeItem(key)
      return null
    }
  },
  
  /**
   * Remove um item do storage
   */
  remove(key) {
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.error('Erro ao remover do secureStorage:', error)
      return false
    }
  },
  
  /**
   * Verifica se um item existe e é válido
   */
  has(key) {
    return this.get(key) !== null
  },
  
  /**
   * Limpa todos os itens da aplicação (não limpa todo localStorage)
   */
  clear(appPrefix = '') {
    try {
      const keysToRemove = []
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (!appPrefix || key.startsWith(appPrefix)) {
          keysToRemove.push(key)
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key))
      
      logger.log(`🧹 ${keysToRemove.length} itens removidos do storage`)
      return true
    } catch (error) {
      console.error('Erro ao limpar secureStorage:', error)
      return false
    }
  },
  
  /**
   * Remove itens expirados ou inválidos
   */
  cleanup() {
    try {
      let cleaned = 0
      
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i)
        const stored = localStorage.getItem(key)
        
        if (!stored) continue
        
        try {
          const data = JSON.parse(stored)
          
          // Se tem timestamp e assinatura, verifica validade
          if (data.timestamp && data.signature) {
            if (!isValid(data)) {
              localStorage.removeItem(key)
              cleaned++
            }
          }
          
          // Remove itens muito antigos (mais de 30 dias)
          if (data.timestamp && Date.now() - data.timestamp > 30 * 24 * 60 * 60 * 1000) {
            localStorage.removeItem(key)
            cleaned++
          }
        } catch (parseError) {
          // Se não é JSON válido, remove
          localStorage.removeItem(key)
          cleaned++
        }
      }
      
      if (cleaned > 0) {
        logger.log(`🧹 ${cleaned} itens expirados removidos`)
      }
      
      return cleaned
    } catch (error) {
      console.error('Erro durante cleanup:', error)
      return 0
    }
  },
  
  /**
   * Retorna informações sobre o uso do storage
   */
  getStorageInfo() {
    try {
      let totalSize = 0
      let itemCount = 0
      const items = []
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        const value = localStorage.getItem(key)
        const size = (key.length + value.length) * 2 // Aproximação em bytes
        
        totalSize += size
        itemCount++
        
        try {
          const data = JSON.parse(value)
          items.push({
            key,
            size: (size / 1024).toFixed(2) + ' KB',
            hasSignature: !!data.signature,
            age: data.timestamp ? Math.round((Date.now() - data.timestamp) / 1000 / 60 / 60) + ' horas' : 'desconhecido'
          })
        } catch {
          items.push({
            key,
            size: (size / 1024).toFixed(2) + ' KB',
            hasSignature: false,
            age: 'desconhecido'
          })
        }
      }
      
      return {
        itemCount,
        totalSize: (totalSize / 1024).toFixed(2) + ' KB',
        items,
        quota: navigator.storage?.estimate ? 'Disponível' : 'Indisponível'
      }
    } catch (error) {
      console.error('Erro ao obter informações do storage:', error)
      return null
    }
  },
  
  /**
   * Salva dados temporários (sessão)
   */
  setTemp(key, value, maxAge = 60 * 60 * 1000) { // 1 hora default
    return this.set(`temp_${key}`, value, { maxAge })
  },
  
  /**
   * Recupera dados temporários
   */
  getTemp(key) {
    return this.get(`temp_${key}`, 60 * 60 * 1000)
  },
  
  /**
   * Remove dados temporários
   */
  removeTemp(key) {
    return this.remove(`temp_${key}`)
  }
}

// Hook para usar secureStorage em componentes React
export const useSecureStorage = (key, initialValue = null) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = secureStorage.get(key)
      return item !== null ? item : initialValue
    } catch (error) {
      console.error('Erro ao ler do storage:', error)
      return initialValue
    }
  })
  
  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      secureStorage.set(key, valueToStore)
    } catch (error) {
      console.error('Erro ao salvar no storage:', error)
    }
  }
  
  const removeValue = () => {
    try {
      secureStorage.remove(key)
      setStoredValue(initialValue)
    } catch (error) {
      console.error('Erro ao remover do storage:', error)
    }
  }
  
  return [storedValue, setValue, removeValue]
}

// Exporta também a função de validação para uso externo
export const validateStorageIntegrity = () => {
  return secureStorage.cleanup()
}

export default secureStorage