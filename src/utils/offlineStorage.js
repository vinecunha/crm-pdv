import { logger } from '../utils/logger'

const DB_NAME = 'pdv-offline-db'
const DB_VERSION = 1
const STORE_NAME = 'pendingSales'

// Abrir IndexedDB
const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { 
          keyPath: 'id', 
          autoIncrement: true 
        })
        store.createIndex('createdAt', 'createdAt')
        store.createIndex('synced', 'synced')
      }
    }
  })
}

// Salvar venda para sincronizar depois
export const saveSaleOffline = async (saleData) => {
  try {
    const db = await openDB()
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    
    const offlineSale = {
      ...saleData,
      createdAt: new Date().toISOString(),
      synced: false,
      retryCount: 0
    }
    
    const request = store.add(offlineSale)
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        logger.log('✅ Venda salva offline:', request.result)
        resolve(request.result)
      }
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error('❌ Erro ao salvar offline:', error)
    throw error
  }
}

// Buscar vendas pendentes
export const getPendingSales = async () => {
  try {
    const db = await openDB()
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const index = store.index('synced')
    
    const request = index.getAll(IDBKeyRange.only(false))
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error('❌ Erro ao buscar vendas pendentes:', error)
    return []
  }
}

// Marcar venda como sincronizada
export const markSaleAsSynced = async (localId) => {
  try {
    const db = await openDB()
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    
    const getRequest = store.get(localId)
    
    getRequest.onsuccess = () => {
      const sale = getRequest.result
      if (sale) {
        sale.synced = true
        sale.syncedAt = new Date().toISOString()
        store.put(sale)
        logger.log('✅ Venda marcada como sincronizada:', localId)
      }
    }
  } catch (error) {
    console.error('❌ Erro ao marcar como sincronizada:', error)
  }
}

// Obter contagem de vendas pendentes
export const getPendingSalesCount = async () => {
  const pending = await getPendingSales()
  return pending.length
}