import { perfMonitor } from '@lib/performance'
import { logger } from '@utils/logger'
import { 
  setupServiceWorker, 
  setupNetworkListener, 
  setupSyncOnReconnect,
  setupVersionCheck,
  setupPrefetch,
  setupPerformanceMetrics,
  setupPWA,
  setupiOSFix,
  setupDebugHelpers,
  isDev
} from './init'

export * from './init'

export const bootstrap = async () => {
  perfMonitor.measurePageLoad()
  perfMonitor.measureFirstInputDelay()

  setupServiceWorker()
  setupNetworkListener()
  setupSyncOnReconnect()
  setupVersionCheck()
  setupPrefetch()
  setupPerformanceMetrics()
  setupPWA()
  setupiOSFix()
  setupDebugHelpers()

  if (isDev) {
    logger.log('Desenvolvimento Mode')
    logger.log('Service Worker: DESATIVADO')
  }
}