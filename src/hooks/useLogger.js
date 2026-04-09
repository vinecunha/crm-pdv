import useSystemLogs from './useSystemLogs'

const useLogger = (componentName) => {
  const { logAction, logCreate, logUpdate, logDelete, logError } = useSystemLogs()

  // Log de ações específicas do componente
  const logComponentAction = (action, data, details = {}) => {
    return logAction({
      action,
      entityType: componentName,
      details: { ...details, component: componentName, data },
      severity: 'INFO'
    })
  }

  // Log de navegação
  const logNavigation = (from, to, details = {}) => {
    return logAction({
      action: 'NAVIGATE',
      entityType: componentName,
      details: { from, to, ...details },
      severity: 'INFO'
    })
  }

  // Log de erro com contexto do componente
  const logComponentError = (error, context = {}) => {
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