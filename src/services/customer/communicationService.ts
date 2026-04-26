import { supabase } from '@lib/supabase'
import { logger } from '@utils/logger'

// ============= Constantes =============
export const COMMUNICATION_CHANNELS = {
  WHATSAPP: 'whatsapp',
  TELEGRAM: 'telegram',
  EMAIL: 'email',
  SMS: 'sms',
  INTERNAL: 'internal'
}

// ============= Configuração dos Canais =============
export const getChannelConfig = (customer) => {
  const phone = customer?.phone?.replace(/\D/g, '')
  const email = customer?.email
  
  return [
    {
      id: COMMUNICATION_CHANNELS.WHATSAPP,
      name: 'WhatsApp',
      description: 'Enviar mensagem via WhatsApp',
      icon: 'MessageCircle',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      hoverColor: 'hover:bg-green-100',
      textColor: 'text-green-600',
      available: !!phone,
      disabledReason: !phone ? 'Telefone não cadastrado' : null,
      getLink: (message) => `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`,
      send: async (message) => {
        // Abre WhatsApp Web/App
        window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(message)}`, '_blank')
        return { success: true, channel: 'whatsapp' }
      }
    },
    {
      id: COMMUNICATION_CHANNELS.TELEGRAM,
      name: 'Telegram',
      description: 'Enviar mensagem via Telegram',
      icon: 'Send',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      hoverColor: 'hover:bg-blue-100',
      textColor: 'text-blue-600',
      available: false, // Requer configuração de bot
      disabledReason: 'Em desenvolvimento',
      getLink: null,
      send: null
    },
    {
      id: COMMUNICATION_CHANNELS.EMAIL,
      name: 'E-mail',
      description: 'Enviar e-mail marketing',
      icon: 'Mail',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      hoverColor: 'hover:bg-purple-100',
      textColor: 'text-purple-600',
      available: !!email,
      disabledReason: !email ? 'E-mail não cadastrado' : null,
      send: async (subject, message, userId) => {
        // Usar Edge Function do Supabase para enviar email
        const { data, error } = await supabase.functions.invoke('send-email', {
          body: { to: email, subject, message }
        })
        if (error) throw error
        return { success: true, channel: 'email', data }
      }
    },
    {
      id: COMMUNICATION_CHANNELS.SMS,
      name: 'SMS',
      description: 'Enviar mensagem de texto',
      icon: 'Smartphone',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      hoverColor: 'hover:bg-orange-100',
      textColor: 'text-orange-600',
      available: !!phone,
      disabledReason: !phone ? 'Telefone não cadastrado' : 'Em desenvolvimento',
      send: null
    }
  ]
}

// ============= Função Principal de Envio =============
export const sendCommunication = async ({
  customer,
  channel,
  subject,
  message,
  couponCode = null,
  userId
}) => {
  try {
    // 1. Registrar comunicação no banco
    const { data: communication, error } = await supabase
      .from('customer_communications')
      .insert({
        customer_id: customer.id,
        channel: channel,
        subject: subject,
        content: message,
        status: 'sent',
        sent_by: userId,
        details: couponCode ? { coupon_code: couponCode } : null
      })
      .select()
      .single()

    if (error) throw error

    // 2. Se for WhatsApp, abrir link
    if (channel === COMMUNICATION_CHANNELS.WHATSAPP) {
      const phone = customer.phone?.replace(/\D/g, '')
      if (phone) {
        window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(message)}`, '_blank')
      }
    }

    // 3. Se for Email, chamar Edge Function
    if (channel === COMMUNICATION_CHANNELS.EMAIL) {
      await supabase.functions.invoke('send-email', {
        body: {
          to: customer.email,
          subject: subject,
          message: message
        }
      })
    }

    return { success: true, communication }
  } catch (error) {
    logger.error('Erro ao enviar comunicação:', error)
    
    // Registrar falha
    await supabase
      .from('customer_communications')
      .insert({
        customer_id: customer.id,
        channel: channel,
        subject: subject,
        content: message,
        status: 'failed',
        sent_by: userId,
        details: { error: error.message }
      })
    
    throw error
  }
}

// ============= Envio em Massa =============
export const sendBulkCommunication = async ({
  customers,
  channel,
  subject,
  messageTemplate,
  couponCode = null,
  userId,
  onProgress = null
}) => {
  const results = []
  const errors = []
  
  for (let i = 0; i < customers.length; i++) {
    const customer = customers[i]
    
    try {
      // Personalizar mensagem
      const personalizedMessage = messageTemplate
        .replace(/{{nome}}/g, customer.name || 'Cliente')
        .replace(/{{email}}/g, customer.email || '')
        .replace(/{{telefone}}/g, customer.phone || '')
        .replace(/{{cupom}}/g, couponCode || '')
      
      const result = await sendCommunication({
        customer,
        channel,
        subject,
        message: personalizedMessage,
        couponCode,
        userId
      })
      
      results.push({ customer: customer.id, success: true, ...result })
      
      if (onProgress) {
        onProgress({
          current: i + 1,
          total: customers.length,
          customer: customer.name,
          success: true
        })
      }
      
      // Pequena pausa para evitar rate limit
      await new Promise(resolve => setTimeout(resolve, 500))
      
    } catch (error) {
      errors.push({ customer: customer.id, error: error.message })
      
      if (onProgress) {
        onProgress({
          current: i + 1,
          total: customers.length,
          customer: customer.name,
          success: false,
          error: error.message
        })
      }
    }
  }
  
  return { results, errors, total: customers.length, successCount: results.length }
}
