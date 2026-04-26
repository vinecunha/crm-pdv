import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'  
import { perfMonitor } from '@lib/performance'
import { logger } from '@utils/logger' 

perfMonitor.measurePageLoad()
perfMonitor.measureFirstInputDelay()

// ============= Service Worker Registration (APENAS PRODUÇÃO) =============
const isDevelopment = import.meta.env.DEV
const isProduction = import.meta.env.PROD

if ('serviceWorker' in navigator) {
  if (isProduction) {
    // ============= PRODUÇÃO: Registrar Service Worker =============
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/service-worker.js', {
          scope: '/',
          // Não esperar pelo SW para começar a funcionar
          updateViaCache: 'none'
        })
        .then((registration) => {
          logger.log('✅ Service Worker registrado com sucesso!', {
            scope: registration.scope,
            state: registration.installing?.state || registration.waiting?.state || registration.active?.state
          })

          // Verificar atualizações a cada 60 minutos
          setInterval(() => {
            registration.update()
            logger.log('🔄 Verificando atualizações do Service Worker...')
          }, 60 * 60 * 1000)

          // Escutar mensagens do Service Worker
          navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'SYNC_COMPLETE') {
              logger.log(`✅ Sincronização completa: ${event.data.count} vendas sincronizadas`)
              
              // Opcional: Mostrar notificação para o usuário
              if (event.data.count > 0) {
                // Você pode usar um toast notification aqui
                logger.log(`🎉 ${event.data.count} vendas foram sincronizadas com sucesso!`)
              }
            }
            
            if (event.data && event.data.type === 'CACHE_UPDATED') {
              logger.log('📦 Cache atualizado:', event.data.url)
            }
          })
        })
        .catch((error) => {
          logger.error('❌ Erro ao registrar Service Worker:', error)
        })

      // Quando uma nova versão do Service Worker é encontrada
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        logger.log('🔄 Service Worker atualizado! Recarregando página...')
        // Opcional: Recarregar a página para usar a nova versão
        // window.location.reload()
      })
    })
  } else {
    // ============= DESENVOLVIMENTO: REMOVER Service Worker =============
    logger.log('🔧 Modo desenvolvimento: Removendo Service Workers...')
    
    // Desregistrar TODOS os service workers existentes
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      if (registrations.length > 0) {
        registrations.forEach((registration) => {
          registration.unregister()
          logger.log('🗑️ Service Worker removido:', registration.scope)
        })
        
        // Limpar caches do Service Worker
        if ('caches' in window) {
          caches.keys().then((cacheNames) => {
            cacheNames.forEach((cacheName) => {
              if (cacheName.includes('pdv') || cacheName.includes('workbox')) {
                caches.delete(cacheName)
                logger.log('🗑️ Cache removido:', cacheName)
              }
            })
          })
        }
        
        // Recarregar após 1 segundo para garantir que tudo foi limpo
        setTimeout(() => {
          if (registrations.some(r => r.active)) {
            logger.log('🔄 Recarregando para limpar Service Worker completamente...')
            window.location.reload()
          }
        }, 1000)
      } else {
        logger.log('✅ Nenhum Service Worker ativo encontrado')
      }
    })
  }
}

// ============= Verificar status da rede =============
const updateOnlineStatus = () => {
  const isOnline = navigator.onLine
  logger.log(isOnline ? '🌐 Online' : '📴 Offline')
  
  // Disparar evento personalizado para componentes React
  window.dispatchEvent(new CustomEvent('networkchange', { 
    detail: { isOnline } 
  }))
}

window.addEventListener('online', updateOnlineStatus)
window.addEventListener('offline', updateOnlineStatus)
updateOnlineStatus() // Verificar inicial

// ============= Registrar Sync quando voltar online (APENAS PRODUÇÃO) =============
if (isProduction) {
  window.addEventListener('online', () => {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.sync.register('sync-pending-sales')
          .then(() => logger.log('🔄 Sincronização de vendas pendentes registrada'))
          .catch(err => logger.error('❌ Erro ao registrar sync:', err))
      })
    }
  })
}

// ============= Verificar atualizações da aplicação =============
if (isProduction) {
  // Verificar nova versão a cada 30 minutos
  setInterval(() => {
    fetch('/version.json', { cache: 'no-cache' })
      .then(res => res.json())
      .then(data => {
        const currentVersion = localStorage.getItem('app-version')
        if (currentVersion && currentVersion !== data.version) {
          logger.log('🆕 Nova versão disponível!', data.version)
          
          // Limpar cache e recarregar
          if ('caches' in window) {
            caches.keys().then(keys => {
              keys.forEach(key => caches.delete(key))
            })
          }
          
          localStorage.setItem('app-version', data.version)
          
          // Notificar usuário
          if (confirm('Nova versão disponível! Deseja atualizar agora?')) {
            window.location.reload()
          }
        }
      })
      .catch(() => {}) // Silencioso
  }, 30 * 60 * 1000)
}

// ============= Prefetch de recursos críticos =============
if ('requestIdleCallback' in window) {
  requestIdleCallback(() => {
    // Prefetch de imagens importantes
    const imagesToPrefetch = [
      '/logomarca.png',
      '/brasalino-pollo.png'
    ]
    
    imagesToPrefetch.forEach(src => {
      const link = document.createElement('link')
      link.rel = 'prefetch'
      link.href = src
      document.head.appendChild(link)
    })
  })
}

// ============= Renderizar App =============
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// ============= Registrar métricas de performance =============
if (isProduction) {
  // Web Vitals
  import('web-vitals').then(({ onCLS, onFID, onLCP, onTTFB }) => {
    onCLS(logger.log)
    onFID(logger.log)
    onLCP(logger.log)
    onTTFB(logger.log)
  })
}

// ============= Detectar se é PWA instalado =============
if (window.matchMedia('(display-mode: standalone)').matches) {
  logger.log('📱 Executando como PWA instalado')
  document.body.classList.add('pwa-mode')
}

// ============= Prevenir zoom em inputs no iOS =============
if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
  const style = document.createElement('style')
  style.textContent = 'input, textarea, select { font-size: 16px !important; }'
  document.head.appendChild(style)
}

// ============= DESENVOLVIMENTO: Ajuda para debug =============
if (isDevelopment) {
  logger.log('🔧 Modo Desenvolvimento Ativo')
  logger.log('📌 Dicas:')
  logger.log('  - Service Worker DESATIVADO (para evitar conflitos com HMR)')
  logger.log('  - Use F12 > Application > Service Workers para verificar')
  logger.log('  - HMR do Vite ativo em ws://localhost:5173')
  
  // Expor objetos úteis para debug no console
  window.debug = {
    clearAllCaches: async () => {
      if ('caches' in window) {
        const keys = await caches.keys()
        for (const key of keys) {
          await caches.delete(key)
          logger.log('🗑️ Cache removido:', key)
        }
        logger.log('✅ Todos os caches foram limpos')
      }
    },
    unregisterSW: async () => {
      const registrations = await navigator.serviceWorker.getRegistrations()
      for (const reg of registrations) {
        await reg.unregister()
        logger.log('🗑️ SW removido:', reg.scope)
      }
    }
  }
  
  logger.log('💡 Dica: Use debug.clearAllCaches() ou debug.unregisterSW() se necessário')
}
