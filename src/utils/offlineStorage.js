import { logger } from '@utils/logger'

const DB_NAME = 'pdv-offline-db'
const DB_VERSION = 2 
const STORE_NAME = 'pendingSales'

const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      
      if (db.objectStoreNames.contains(STORE_NAME)) {
        db.deleteObjectStore(STORE_NAME)
      }
      
      const store = db.createObjectStore(STORE_NAME, { 
        keyPath: 'id', 
        autoIncrement: true 
      })
      
      if (!store.indexNames.contains('createdAt')) {
        store.createIndex('createdAt', 'createdAt')
      }
      if (!store.indexNames.contains('synced')) {
        store.createIndex('synced', 'synced')
      }
    }
  })
}

// ============= Funções existentes =============
export const getPendingSales = async () => {
  try {
    const db = await openDB()
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    
    const request = store.getAll()
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const pending = request.result.filter(sale => sale.synced === false)
        resolve(pending)
      }
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    logger.error('❌ Erro ao buscar vendas pendentes:', error)
    return []
  }
}

export const getPendingSalesCount = async () => {
  const pending = await getPendingSales()
  return pending.length
}

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
    logger.error('❌ Erro ao salvar offline:', error)
    throw error
  }
}

export const markSaleAsSynced = async (localId) => {
  try {
    const db = await openDB()
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    
    const getRequest = store.get(localId)
    
    return new Promise((resolve, reject) => {
      getRequest.onsuccess = () => {
        const sale = getRequest.result
        if (sale) {
          sale.synced = true
          sale.syncedAt = new Date().toISOString()
          store.put(sale)
          logger.log('✅ Venda marcada como sincronizada:', localId)
          resolve(true)
        } else {
          resolve(false)
        }
      }
      getRequest.onerror = () => reject(getRequest.error)
    })
  } catch (error) {
    logger.error('❌ Erro ao marcar como sincronizada:', error)
    return false
  }
}

// ============= NOVAS FUNÇÕES (adicionar) =============

// Alias para compatibilidade com os novos componentes
export const getOfflineSales = getPendingSales

// Buscar todas as vendas (incluindo já sincronizadas)
export const getAllSales = async () => {
  try {
    const db = await openDB()
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    
    const request = store.getAll()
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    logger.error('❌ Erro ao buscar todas as vendas:', error)
    return []
  }
}

// Remover uma venda offline
export const removeOfflineSale = async (id) => {
  try {
    const db = await openDB()
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    
    const request = store.delete(id)
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        logger.log('✅ Venda removida:', id)
        resolve(true)
      }
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    logger.error('❌ Erro ao remover venda:', error)
    return false
  }
}

// Atualizar status de uma venda offline
export const updateOfflineSaleStatus = async (id, updates) => {
  try {
    const db = await openDB()
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    
    const getRequest = store.get(id)
    
    return new Promise((resolve, reject) => {
      getRequest.onsuccess = () => {
        const sale = getRequest.result
        if (sale) {
          const updatedSale = { ...sale, ...updates }
          const putRequest = store.put(updatedSale)
          
          putRequest.onsuccess = () => {
            logger.log('✅ Venda atualizada:', id)
            resolve(true)
          }
          putRequest.onerror = () => reject(putRequest.error)
        } else {
          resolve(false)
        }
      }
      getRequest.onerror = () => reject(getRequest.error)
    })
  } catch (error) {
    logger.error('❌ Erro ao atualizar venda:', error)
    return false
  }
}

// Limpar todas as vendas sincronizadas
export const clearSyncedSales = async () => {
  try {
    const allSales = await getAllSales()
    const syncedSales = allSales.filter(sale => sale.synced === true)
    
    for (const sale of syncedSales) {
      await removeOfflineSale(sale.id)
    }
    
    logger.log(`✅ ${syncedSales.length} vendas sincronizadas removidas`)
    return syncedSales.length
  } catch (error) {
    logger.error('❌ Erro ao limpar vendas sincronizadas:', error)
    return 0
  }
}