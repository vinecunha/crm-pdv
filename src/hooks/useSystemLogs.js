import { supabase } from '@lib/supabase'
import { useAuth } from '@contexts/AuthContext.jsx'

export const useSystemLogs = () => {
  const { profile } = useAuth()

  const logAction = async ({
    action,        // 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'VIEW', 'EXPORT'
    entityType,    // 'user', 'product', 'customer', 'sale', 'report', etc
    entityId,      // ID do registro afetado
    oldData = null,
    newData = null,
    details = null,
    severity = 'INFO' // 'INFO', 'WARNING', 'ERROR', 'CRITICAL'
  }) => {
    try {
      // Capturar informações do ambiente
      const logData = {
        user_id: profile?.id || null,
        user_email: profile?.email || null,
        user_role: profile?.role || null,
        action: action.toUpperCase(),
        entity_type: entityType,
        entity_id: entityId?.toString() || null,
        old_data: oldData,
        new_data: newData,
        ip_address: await getClientIP(),
        user_agent: navigator.userAgent,
        details: {
          ...details,
          severity,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          component: details?.component || 'Unknown'
        }
      }

      // Inserir log
      const { error } = await supabase
        .from('system_logs')
        .insert(logData)

      if (error) {
        console.error('Erro ao salvar log:', error)
        // Não lançar erro para não interromper a ação principal
      }

      return true
    } catch (error) {
      console.error('Erro ao criar log:', error)
      return false
    }
  }

  // Função auxiliar para obter IP do cliente
  const getClientIP = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json')
      const data = await response.json()
      return data.ip
    } catch (error) {
      return null
    }
  }

  // Wrappers para ações comuns
  const logCreate = (entityType, entityId, newData, details = {}) => {
    return logAction({
      action: 'CREATE',
      entityType,
      entityId,
      newData,
      details,
      severity: 'INFO'
    })
  }

  const logUpdate = (entityType, entityId, oldData, newData, details = {}) => {
    // Calcular diferenças automaticamente
    const changes = calculateChanges(oldData, newData)
    
    return logAction({
      action: 'UPDATE',
      entityType,
      entityId,
      oldData,
      newData,
      details: { ...details, changes },
      severity: changes.critical ? 'WARNING' : 'INFO'
    })
  }

  const logDelete = (entityType, entityId, oldData, details = {}) => {
    return logAction({
      action: 'DELETE',
      entityType,
      entityId,
      oldData,
      details,
      severity: 'WARNING'
    })
  }

  const logError = (entityType, error, details = {}) => {
    return logAction({
      action: 'ERROR',
      entityType,
      details: {
        ...details,
        error: error.message,
        stack: error.stack,
        severity: 'ERROR'
      },
      severity: 'ERROR'
    })
  }

  // Função auxiliar para calcular mudanças
  const calculateChanges = (oldData, newData) => {
    if (!oldData || !newData) return null
    
    const changes = {}
    let critical = false
    
    Object.keys(newData).forEach(key => {
      if (oldData[key] !== newData[key]) {
        changes[key] = {
          old: oldData[key],
          new: newData[key]
        }
        
        // Marcar mudanças críticas
        if (key === 'role' || key === 'password' || key === 'status') {
          critical = true
        }
      }
    })
    
    return { changes, critical }
  }

  return {
    logAction,
    logCreate,
    logUpdate,
    logDelete,
    logError
  }
}