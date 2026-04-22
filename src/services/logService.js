import { supabase } from '@lib/supabase'
import { logger } from '@utils/logger' 

class LogService {
  constructor() {
    this.currentUser = null
    this.enabled = true // Em produção, pode desabilitar se necessário
    this.init()
  }

  async init() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      this.currentUser = user
    } catch (error) {
      console.warn('LogService: Erro ao inicializar', error)
      this.enabled = false
    }
  }

  async getCurrentUserInfo() {
    try {
      if (!this.currentUser) {
        const { data: { user } } = await supabase.auth.getUser()
        this.currentUser = user
      }
      
      if (!this.currentUser) return null

      // Tentar buscar o perfil, se falhar usar dados básicos
      let role = 'operador'
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', this.currentUser.id)
          .single()
        
        if (profile) role = profile.role
      } catch (error) {
        console.warn('LogService: Erro ao buscar role', error)
      }

      return {
        id: this.currentUser.id,
        email: this.currentUser.email,
        role: role
      }
    } catch (error) {
      console.error('LogService: Erro ao buscar user info', error)
      return null
    }
  }

  async addLog(action, data = {}) {
    if (!this.enabled) return
    
    try {
      const userInfo = await this.getCurrentUserInfo()
      
      const logEntry = {
        user_id: userInfo?.id || null,
        user_email: userInfo?.email || 'sistema',
        user_role: userInfo?.role || 'sistema',
        action: action,
        entity_type: data.entity_type || null,
        entity_id: data.entity_id || null,
        old_data: data.old_data || null,
        new_data: data.new_data || null,
        ip_address: await this.getUserIP(),
        user_agent: navigator.userAgent,
        details: data.details || {}
      }

      const { error } = await supabase
        .from('system_logs')
        .insert(logEntry)

      if (error) {
        console.warn('LogService: Erro ao salvar log (não crítico):', error.message)
      }
      
      // Em desenvolvimento, loga no console
      if (import.meta.env.DEV) {
        logger.log('[LOG]', action, logEntry)
      }
    } catch (error) {
      // Não deixar o erro de log quebrar a aplicação
      console.warn('LogService: Erro não crítico:', error.message)
    }
  }

  async addAccessLog(eventType, details = {}) {
    if (!this.enabled) return
    
    try {
      const userInfo = await this.getCurrentUserInfo()
      
      const logEntry = {
        user_id: userInfo?.id || null,
        user_email: userInfo?.email || null,
        event_type: eventType,
        ip_address: await this.getUserIP(),
        user_agent: navigator.userAgent,
        details: details
      }

      const { error } = await supabase
        .from('access_logs')
        .insert(logEntry)

      if (error) {
        console.warn('LogService: Erro ao salvar log de acesso (não crítico):', error.message)
      }
    } catch (error) {
      console.warn('LogService: Erro não crítico:', error.message)
    }
  }

  const logAction = async (logData) => {
    // IP é automaticamente adicionado pelo Supabase via request.headers['x-forwarded-for']
    return supabase.from('system_logs').insert(logData)
  }

  async logLogin(email, success) {
    await this.addAccessLog(success ? 'login' : 'login_failed', { 
      email, 
      success,
      timestamp: new Date().toISOString()
    })
  }

  async logLogout() {
    await this.addAccessLog('logout', { timestamp: new Date().toISOString() })
  }

  async logUserCreation(userData) {
    await this.addLog('user_created', {
      entity_type: 'user',
      new_data: userData,
      details: { method: 'manual_creation' }
    })
  }

  async logUserUpdate(userId, oldData, newData) {
    await this.addLog('user_updated', {
      entity_type: 'user',
      entity_id: userId,
      old_data: oldData,
      new_data: newData
    })
  }

  async logSale(saleData) {
    await this.addLog('sale_completed', {
      entity_type: 'sale',
      new_data: saleData,
      details: { 
        total: saleData.total,
        items_count: saleData.items?.length 
      }
    })
  }
}

export const logService = new LogService()