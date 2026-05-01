import { logger } from '@utils/logger' 

const isDevelopment = import.meta.env.DEV
const isProduction = import.meta.env.PROD

export const isDev = isDevelopment
export const isProd = isProduction

export const setupServiceWorker = async (): Promise<void> => {
  if (!('serviceWorker' in navigator)) return

  if (isProduction) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/service-worker.js', { scope: '/', updateViaCache: 'none' })
        .then((registration: ServiceWorkerRegistration) => {
          logger.log('Service Worker registrado', { scope: registration.scope })
          setInterval(() => { registration.update() }, 60 * 60 * 1000)
        })
        .catch((error: Error) => logger.error('Erro SW', error))
    })
  } else {
    const regs = await navigator.serviceWorker.getRegistrations()
    regs.forEach(reg => reg.unregister())
  }
}

export const setupNetworkListener = (): void => {
  const updateStatus = (): void => {
    logger.log(navigator.onLine ? 'Online' : 'Offline')
    window.dispatchEvent(new CustomEvent('networkchange', { detail: { isOnline: navigator.onLine } }))
  }
  window.addEventListener('online', updateStatus)
  window.addEventListener('offline', updateStatus)
  updateStatus()
}

export const setupSyncOnReconnect = (): void => {
  if (!isProduction) return
  window.addEventListener('online', () => {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      navigator.serviceWorker.ready.then((registration: ServiceWorkerRegistration) => {
        registration.sync.register('sync-pending-sales')
      })
    }
  })
}

export const setupVersionCheck = (): void => {
  if (!isProduction) return
  setInterval(async () => {
    try {
      const res = await fetch('/version.json', { cache: 'no-cache' })
      const data = await res.json()
      const current = localStorage.getItem('app-version')
      if (current && current !== data.version) {
        localStorage.setItem('app-version', data.version)
        if (confirm('Nova versao! Atualizar agora?')) {
          window.location.reload()
        }
      }
    } catch {
      // Silencioso
    }
  }, 30 * 60 * 1000)
}

export const setupPrefetch = (): void => {
  if (!('requestIdleCallback' in window)) return
  requestIdleCallback(() => {
    // Prefetch apenas a logo padrão - a logo da company será carregada dinamicamente
    const images = ['/logo.png']
    images.forEach(src => {
      const link = document.createElement('link')
      link.rel = 'prefetch'
      link.href = src
      document.head.appendChild(link)
    })
  })
}

export const setupPerformanceMetrics = (): void => {
  if (!isProduction) return
  import('web-vitals').then((vitals: any) => {
    vitals.onCLS(logger.log)
    vitals.onFID(logger.log)
    vitals.onLCP(logger.log)
    vitals.onTTFB(logger.log)
  })
}

export const setupPWA = (): void => {
  if (window.matchMedia('(display-mode: standalone)').matches) {
    document.body.classList.add('pwa-mode')
  }
}

export const setupiOSFix = (): void => {
  if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
    const style = document.createElement('style')
    style.textContent = 'input, textarea, select { font-size: 16px !important; }'
    document.head.appendChild(style)
  }
}

export const setupDebugHelpers = (): void => {
  if (!isDevelopment) return
  window.debug = {
    clearAllCaches: async () => {
      if ('caches' in window) {
        const keys = await caches.keys()
        keys.forEach(key => caches.delete(key))
      }
    },
    unregisterSW: async () => {
      const regs = await navigator.serviceWorker.getRegistrations()
      regs.forEach(reg => reg.unregister())
    }
  }
}