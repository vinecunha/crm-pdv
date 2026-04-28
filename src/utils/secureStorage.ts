import { logger } from '@utils/logger' 

const SIGNATURE_KEY = 'app_signature'
const STORAGE_VERSION = '1.0'

/**
 * Gera uma assinatura HMAC-SHA256 para os dados usando Web Crypto API
 */
const generateSignature = async (data) => {
  try {
    const secret = import.meta.env.VITE_STORAGE_SECRET
    if (!secret) throw new Error('[secureStorage] VITE_STORAGE_SECRET não definida no .env')
    
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    
const signature = await crypto.subtle.sign(
      'HMAC',
      key,
      new TextEncoder().encode(JSON.stringify(data) + STORAGE_VERSION)
    )
    
    const sigArray = new Uint8Array(signature)
    let binary = ''
    for (let i = 0; i < sigArray.length; i++) {
      binary += String.fromCharCode(sigArray[i])
    }
    return btoa(binary).slice(0, 32)
  } catch (error) {
    logger.error('Erro ao gerar assinatura:', error)
    return null
  }
}

/**
 * Verifica se os dados são válidos (não expiraram e assinatura confere)
 */
const isValid = async (data, maxAge = 7 * 24 * 60 * 60 * 1000) => { // 7 dias default
  if (!data || !data.signature || !data.timestamp) {
    return false
  }
  
  // Verificar idade
  if (Date.now() - data.timestamp > maxAge) {
    logger.warn('Dados expirados no storage')
    return false
  }
  
  // Verificar assinatura
  const expectedSignature = await generateSignature(data.value)
  if (data.signature !== expectedSignature) {
    logger.warn('Assinatura inválida - dados podem ter sido adulterados')
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
  async set(key, value, options = {}) {
    try {
      const signature = await generateSignature(value)
      const data = {
        value,
        signature,
        timestamp: Date.now(),
        version: STORAGE_VERSION,
        ...options.metadata
      }
      
      localStorage.setItem(key, JSON.stringify(data))
      return true
    } catch (error) {
      logger.error('Erro ao salvar no secureStorage:', error)
      
      // Se o localStorage estiver cheio, tenta limpar itens antigos
      if (error.name === 'QuotaExceededError') {
        this.cleanup()
        try {
          const signature = await generateSignature(value)
          const data = {
            value,
            signature,
            timestamp: Date.now(),
            version: STORAGE_VERSION
          }
          localStorage.setItem(key, JSON.stringify(data))
          return true
        } catch (retryError) {
          logger.error('Falha ao salvar mesmo após cleanup:', retryError)
          return false
        }
      }
      
      return false
    }
  },
  
  /**
   * Recupera dados do storage se forem válidos
   */
  async get(key, maxAge = 7 * 24 * 60 * 60 * 1000) {
    try {
      const stored = localStorage.getItem(key)
      if (!stored) return null
      
      const data = JSON.parse(stored)
      
      if (!(await isValid(data, maxAge))) {
        localStorage.removeItem(key)
        return null
      }
      
      return data.value
    } catch (error) {
      logger.error('Erro ao ler do secureStorage:', error)
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
      logger.error('Erro ao remover do secureStorage:', error)
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
      logger.error('Erro ao limpar secureStorage:', error)
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
      logger.error('Erro durante cleanup:', error)
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
      logger.error('Erro ao obter informações do storage:', error)
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

export default secureStorage
