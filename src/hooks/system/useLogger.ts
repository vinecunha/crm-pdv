import { useSystemLogs } from '@hooks/system/useSystemLogs'

interface LogDetails {
  [key: string]: unknown
}

interface LogNavigationDetails extends LogDetails {
  from: string
  to: string
}

interface UseLoggerReturn {
  logComponentAction: (action: string, data: unknown, details?: LogDetails) => Promise<void>
  logNavigation: (from: string, to: string, details?: LogDetails) => Promise<void>
  logComponentError: (error: Error | string, context?: LogDetails) => Promise<void>
  logCreate: ReturnType<typeof useSystemLogs>['logCreate']
  logUpdate: ReturnType<typeof useSystemLogs>['logUpdate']
  logDelete: ReturnType<typeof useSystemLogs>['logDelete']
}

const useLogger = (componentName: string): UseLoggerReturn => {
  const { logAction, logCreate, logUpdate, logDelete, logError } = useSystemLogs()

  const logComponentAction = (action: string, data: unknown, details: LogDetails = {}): Promise<void> => {
    return logAction({
      action,
      entityType: componentName,
      details: { ...details, component: componentName, data },
      severity: 'INFO'
    })
  }

  const logNavigation = (from: string, to: string, details: LogDetails = {}): Promise<void> => {
    return logAction({
      action: 'NAVIGATE',
      entityType: componentName,
      details: { from, to, ...details },
      severity: 'INFO'
    })
  }

  const logComponentError = (error: Error | string, context: LogDetails = {}): Promise<void> => {
    return logError(componentName, error, {
      component: componentName,
      ...context
    })
  }

  return {
    logComponentAction,
    logNavigation,
    logComponentError,
    logCreate,
    logUpdate,
    logDelete
  }
}

export default useLogger