import { supabase } from '@lib/supabase'
import { useAuth } from '@contexts/AuthContext'

// Baseado em: public.system_logs
interface SystemLog {
  id: string // uuid
  user_id: string | null // uuid, FK auth.users
  user_email: string | null // text
  user_role: string | null // text
  action: string // text
  entity_type: string | null // text
  entity_id: string | null // text
  old_data: Record<string, unknown> | null // jsonb
  new_data: Record<string, unknown> | null // jsonb
  ip_address: string | null // text
  user_agent: string | null // text
  details: Record<string, unknown> | null // jsonb
  created_at: string | null // timestamp with time zone
}

type LogAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'VIEW' | 'EXPORT' | 'ERROR'
type LogSeverity = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'

interface LogActionParams {
  action: LogAction
  entityType: string
  entityId?: string | number | null
  oldData?: Record<string, unknown> | null
  newData?: Record<string, unknown> | null
  details?: Record<string, unknown> | null
  severity?: LogSeverity
}

interface LogDetails {
  [key: string]: unknown
}

interface ChangeRecord {
  old: unknown
  new: unknown
}

interface CalculatedChanges {
  changes: Record<string, ChangeRecord> | null
  critical: boolean
}

interface UseSystemLogsReturn {
  logAction: (params: LogActionParams) => Promise<boolean>
  logCreate: (
    entityType: string,
    entityId: string | number | null,
    newData: Record<string, unknown>,
    details?: LogDetails
  ) => Promise<boolean>
  logUpdate: (
    entityType: string,
    entityId: string | number | null,
    oldData: Record<string, unknown>,
    newData: Record<string, unknown>,
    details?: LogDetails
  ) => Promise<boolean>
  logDelete: (
    entityType: string,
    entityId: string | number | null,
    oldData: Record<string, unknown>,
    details?: LogDetails
  ) => Promise<boolean>
  logError: (
    entityType: string,
    error: Error,
    details?: LogDetails
  ) => Promise<boolean>
}

export const useSystemLogs = (): UseSystemLogsReturn => {
  const { profile } = useAuth()

  const getClientIP = async (): Promise<string | null> => {
    try {
      const response = await fetch('https://api.ipify.org?format=json')
      const data = await response.json()
      return data.ip
    } catch (error) {
      return null
    }
  }

  const calculateChanges = (
    oldData: Record<string, unknown> | null,
    newData: Record<string, unknown> | null
  ): CalculatedChanges | null => {
    if (!oldData || !newData) return null
    
    const changes: Record<string, ChangeRecord> = {}
    let critical = false
    
    Object.keys(newData).forEach(key => {
      if (oldData[key] !== newData[key]) {
        changes[key] = {
          old: oldData[key],
          new: newData[key]
        }
        
        if (key === 'role' || key === 'password' || key === 'status') {
          critical = true
        }
      }
    })
    
    return { changes, critical }
  }

  const logAction = async ({
    action,
    entityType,
    entityId = null,
    oldData = null,
    newData = null,
    details = null,
    severity = 'INFO'
  }: LogActionParams): Promise<boolean> => {
    try {
      const logData: Partial<SystemLog> = {
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
          component: (details?.component as string) || 'Unknown'
        }
      }

      const { error } = await supabase
        .from('system_logs')
        .insert(logData)

      if (error) {
        console.error('Erro ao salvar log:', error)
      }

      return true
    } catch (error) {
      console.error('Erro ao criar log:', error)
      return false
    }
  }

  const logCreate = (
    entityType: string,
    entityId: string | number | null,
    newData: Record<string, unknown>,
    details: LogDetails = {}
  ): Promise<boolean> => {
    return logAction({
      action: 'CREATE',
      entityType,
      entityId,
      newData,
      details,
      severity: 'INFO'
    })
  }

  const logUpdate = (
    entityType: string,
    entityId: string | number | null,
    oldData: Record<string, unknown>,
    newData: Record<string, unknown>,
    details: LogDetails = {}
  ): Promise<boolean> => {
    const changes = calculateChanges(oldData, newData)
    
    return logAction({
      action: 'UPDATE',
      entityType,
      entityId,
      oldData,
      newData,
      details: { ...details, changes },
      severity: changes?.critical ? 'WARNING' : 'INFO'
    })
  }

  const logDelete = (
    entityType: string,
    entityId: string | number | null,
    oldData: Record<string, unknown>,
    details: LogDetails = {}
  ): Promise<boolean> => {
    return logAction({
      action: 'DELETE',
      entityType,
      entityId,
      oldData,
      details,
      severity: 'WARNING'
    })
  }

  const logError = (
    entityType: string,
    error: Error,
    details: LogDetails = {}
  ): Promise<boolean> => {
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

  return {
    logAction,
    logCreate,
    logUpdate,
    logDelete,
    logError
  }
}