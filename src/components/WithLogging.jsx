import React, { useEffect } from 'react'
import useSystemLogs from '../hooks/useSystemLogs'

// HOC para log automático de ações em componentes
export const withLogging = (WrappedComponent, entityType, options = {}) => {
  return function WithLoggingComponent(props) {
    const { logAction } = useSystemLogs()

    useEffect(() => {
      if (options.logView) {
        logAction({
          action: 'VIEW',
          entityType,
          details: {
            component: WrappedComponent.name,
            props: options.logProps ? props : undefined
          }
        })
      }
    }, [])

    return <WrappedComponent {...props} />
  }
}

// Hook para log em mutations
export const useMutationWithLog = (mutationFn, entityType, options = {}) => {
  const { logCreate, logUpdate, logDelete, logError } = useSystemLogs()

  const executeMutation = async (action, data, oldData = null) => {
    try {
      let result
      let entityId = data?.id

      switch (action) {
        case 'CREATE':
          result = await mutationFn(data)
          entityId = result?.data?.id || result?.id
          await logCreate(entityType, entityId, data)
          break
          
        case 'UPDATE':
          result = await mutationFn(data)
          await logUpdate(entityType, entityId, oldData, data)
          break
          
        case 'DELETE':
          result = await mutationFn(data)
          await logDelete(entityType, entityId, oldData)
          break
          
        default:
          result = await mutationFn(data)
      }

      return result
    } catch (error) {
      await logError(entityType, error, { action, data })
      throw error
    }
  }

  return { executeMutation }
}