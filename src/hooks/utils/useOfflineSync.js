// src/hooks/useOfflineSync.js
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@contexts/AuthContext'
import { supabase } from '@lib/supabase'
import { 
  getOfflineSales,
  removeOfflineSale, 
  updateOfflineSaleStatus,
  clearSyncedSales
} from '@utils/offlineStorage'
import { logger } from '@utils/logger'

const useOfflineSync = () => {
  const { profile } = useAuth()
  const [pendingCount, setPendingCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSync, setLastSync] = useState(null)
  const [syncProgress, setSyncProgress] = useState(null)
  
  const updatePendingCount = useCallback(async () => {
    try {
      const sales = await getOfflineSales()
      const pending = sales.filter(s => !s.synced || s.status === 'pending')
      setPendingCount(pending.length)
      return pending.length
    } catch (error) {
      logger.error('Erro ao contar vendas offline:', error)
      return 0
    }
  }, [])
  
  /**
   * Sincroniza uma venda individual com o Supabase
   */
  const syncSingleSale = async (sale) => {
    try {
      logger.log(`🔄 Sincronizando venda offline: ${sale.id}`, { 
        customer: sale.customer_name, 
        total: sale.final_amount 
      })
      
      // ✅ Usar a RPC create_sale_complete diretamente
      const itemsJson = sale.items.map(item => ({
        product_id: item.product_id,
        product_name: item.product_name,
        product_code: item.product_code,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price
      }))
      
      const { data, error } = await supabase.rpc('create_sale_complete', {
        p_customer_id: sale.customer_id || null,
        p_customer_name: sale.customer_name || 'Cliente offline',
        p_customer_phone: sale.customer_phone || null,
        p_total_amount: sale.total_amount,
        p_discount_amount: sale.discount_amount || 0,
        p_discount_percent: sale.discount_percent || 0,
        p_coupon_code: sale.coupon_code || null,
        p_final_amount: sale.final_amount,
        p_payment_method: sale.payment_method,
        p_payment_status: sale.payment_status || 'paid',
        p_status: sale.status === 'pending' ? 'completed' : sale.status,
        p_created_by: sale.created_by || profile?.id,
        p_items: itemsJson
      })
      
      if (error) {
        logger.error(`❌ Erro ao sincronizar venda ${sale.id}:`, error)
        throw error
      }
      
      if (!data?.success) {
        throw new Error(data?.error || 'Erro desconhecido na RPC')
      }
      
      logger.log(`✅ Venda ${sale.id} sincronizada com sucesso!`, { 
        sale_number: data.sale_number,
        duplicate_prevented: data.duplicate_prevented 
      })
      
      return { success: true, data }
      
    } catch (error) {
      logger.error(`❌ Falha ao sincronizar venda ${sale.id}:`, error)
      return { success: false, error: error.message }
    }
  }
  
  /**
   * Sincroniza todas as vendas pendentes
   */
  const syncNow = useCallback(async () => {
    // Evitar sincronizações simultâneas
    if (isSyncing) {
      logger.log('⏳ Sincronização já em andamento...')
      return
    }
    
    // Verificar se está online
    if (!navigator.onLine) {
      logger.log('📴 Offline - sincronização adiada')
      return
    }
    
    setIsSyncing(true)
    setSyncProgress({ current: 0, total: 0 })
    
    try {
      const sales = await getOfflineSales()
      const pending = sales.filter(s => !s.synced || s.status === 'pending')
      
      if (pending.length === 0) {
        logger.log('✅ Nenhuma venda pendente para sincronizar')
        setLastSync({ timestamp: new Date(), synced: 0, failed: 0 })
        return
      }
      
      logger.log(`🔄 Iniciando sincronização de ${pending.length} vendas offline`)
      setSyncProgress({ current: 0, total: pending.length })
      
      let synced = 0
      let failed = 0
      
      for (let i = 0; i < pending.length; i++) {
        const sale = pending[i]
        setSyncProgress({ current: i + 1, total: pending.length })
        
        // Verificar novamente se está online antes de cada venda
        if (!navigator.onLine) {
          logger.log('📴 Conexão perdida durante sincronização')
          break
        }
        
        const result = await syncSingleSale(sale)
        
        if (result.success) {
          // ✅ Usar removeOfflineSale do IndexedDB
          await removeOfflineSale(sale.id)
          synced++
          logger.log(`✅ Venda ${sale.id} removida do armazenamento offline`)
        } else {
          // Incrementar contador de tentativas
          const retryCount = (sale.retryCount || 0) + 1
          await updateOfflineSaleStatus(sale.id, { 
            retryCount,
            lastSyncError: result.error,
            lastSyncAttempt: new Date().toISOString()
          })
          
          // Se falhou 3 vezes, marcar como erro permanente
          if (retryCount >= 3) {
            await updateOfflineSaleStatus(sale.id, { 
              status: 'sync_failed',
              syncError: 'Múltiplas tentativas falharam'
            })
            logger.error(`❌ Venda ${sale.id} marcada como falha após ${retryCount} tentativas`)
          }
          
          failed++
        }
      }
      
      const syncResult = { timestamp: new Date(), synced, failed }
      setLastSync(syncResult)
      
      // Atualizar contagem
      await updatePendingCount()
      
      logger.log(`✅ Sincronização concluída: ${synced} sucesso, ${failed} falha`, syncResult)
      
      // Se sincronizou algo, disparar evento para atualizar UI
      if (synced > 0) {
        window.dispatchEvent(new CustomEvent('offline-sales-synced', { 
          detail: { synced, failed } 
        }))
      }
      
    } catch (error) {
      logger.error('❌ Erro durante sincronização:', error)
    } finally {
      setIsSyncing(false)
      setSyncProgress(null)
    }
  }, [isSyncing, profile?.id, updatePendingCount])
  
  /**
   * Cancela vendas que falharam permanentemente
   */
  const clearFailedSales = useCallback(async () => {
    try {
      const sales = await getOfflineSales()
      const failed = sales.filter(s => s.status === 'sync_failed' || s.retryCount >= 3)
      
      for (const sale of failed) {
        await removeOfflineSale(sale.id)
      }
      
      await updatePendingCount()
      logger.log(`🧹 Limpas ${failed.length} vendas com falha permanente`)
      
      return failed.length
    } catch (error) {
      logger.error('Erro ao limpar vendas falhas:', error)
      return 0
    }
  }, [updatePendingCount])
  
  // Inicializar e configurar intervalos
  useEffect(() => {
    updatePendingCount()
    
    // Verificar a cada 30 segundos
    const interval = setInterval(updatePendingCount, 30000)
    
    return () => clearInterval(interval)
  }, [updatePendingCount])
  
  // Sincronizar quando voltar online
  useEffect(() => {
    const handleOnline = () => {
      logger.log('🌐 Conexão restaurada - iniciando sincronização')
      syncNow()
    }
    
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [syncNow])
  
  // Escutar evento de sync do Service Worker
  useEffect(() => {
    const handleSyncEvent = (event) => {
      if (event.data?.type === 'SYNC_PENDING_SALES') {
        logger.log('📱 Evento de sync recebido do Service Worker')
        syncNow()
      }
    }
    
    if (navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener('message', handleSyncEvent)
    }
    
    return () => {
      if (navigator.serviceWorker) {
        navigator.serviceWorker.removeEventListener('message', handleSyncEvent)
      }
    }
  }, [syncNow])
  
  // Sincronizar automaticamente quando o componente montar (se online)
  useEffect(() => {
    if (navigator.onLine) {
      // Pequeno delay para não bloquear a UI
      const timer = setTimeout(() => {
        syncNow()
      }, 2000)
      
      return () => clearTimeout(timer)
    }
  }, [])
  
  return {
    pendingCount,
    isSyncing,
    lastSync,
    syncProgress,
    syncNow,
    updatePendingCount,
    clearFailedSales
  }
}

export default useOfflineSync
