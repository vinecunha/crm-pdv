import { useState } from 'react'
import { sendCommunication, sendBulkCommunication, getChannelConfig } from '@services/customer/communicationService'
import { useAuth } from '@contexts/AuthContext'
import { useSystemLogs } from '@hooks/system/useSystemLogs'
import type { Customer } from '@/types'

// Baseado em: public.customer_communications
interface Communication {
  customer_id: number
  channel: string
  subject: string | null
  content: string
  status: string | null
  sent_by: string | null
  created_at: string | null
  [key: string]: unknown
}

type CommunicationChannel = 'whatsapp' | 'email' | 'sms'

interface ChannelConfig {
  available: boolean
  icon: string
  label: string
  [key: string]: unknown
}

interface SendParams {
  customer: Customer
  channel: CommunicationChannel
  subject: string
  message: string
  couponCode?: string
}

interface BulkProgress {
  current: number
  total: number
}

interface SendBulkParams {
  customers: Customer[]
  channel: CommunicationChannel
  subject: string
  messageTemplate: string
  couponCode?: string
}

interface SendResult {
  success: boolean
  message?: string
  [key: string]: unknown
}

interface SendBulkResult {
  successCount: number
  failCount: number
  [key: string]: unknown
}

interface UseCommunicationReturn {
  send: (params: SendParams) => Promise<SendResult>
  sendBulk: (params: SendBulkParams) => Promise<SendBulkResult>
  getChannels: (customer: Customer) => Record<CommunicationChannel, ChannelConfig>
  loading: boolean
  progress: BulkProgress | null
}

export const useCommunication = (): UseCommunicationReturn => {
  const { user } = useAuth()
  const { logAction } = useSystemLogs()
  const [loading, setLoading] = useState<boolean>(false)
  const [progress, setProgress] = useState<BulkProgress | null>(null)

  const send = async ({ customer, channel, subject, message, couponCode }: SendParams): Promise<SendResult> => {
    setLoading(true)
    try {
      const result = await sendCommunication({
        customer,
        channel,
        subject,
        message,
        couponCode,
        userId: user?.id
      })
      
      await logAction({
        action: 'SEND_COMMUNICATION',
        entityType: 'customer',
        entityId: customer.id,
        details: { channel, subject, couponCode }
      })
      
      return result
    } finally {
      setLoading(false)
    }
  }

  const sendBulk = async ({ customers, channel, subject, messageTemplate, couponCode }: SendBulkParams): Promise<SendBulkResult> => {
    setLoading(true)
    setProgress({ current: 0, total: customers.length })
    
    try {
      const result = await sendBulkCommunication({
        customers,
        channel,
        subject,
        messageTemplate,
        couponCode,
        userId: user?.id,
        onProgress: (p: BulkProgress) => setProgress(p)
      })
      
      await logAction({
        action: 'SEND_BULK_COMMUNICATION',
        entityType: 'customer',
        details: { 
          channel, 
          total: customers.length, 
          success: result.successCount 
        }
      })
      
      return result
    } finally {
      setLoading(false)
      setProgress(null)
    }
  }

  const getChannels = (customer: Customer): Record<CommunicationChannel, ChannelConfig> => 
    getChannelConfig(customer)

  return {
    send,
    sendBulk,
    getChannels,
    loading,
    progress
  }
}