import React, { useState } from 'react'
import { sendCommunication, sendBulkCommunication, getChannelConfig } from '@services/communicationService'
import { useAuth } from '@contexts/AuthContext'
import { useSystemLogs } from './useSystemLogs'

export const useCommunication = () => {
  const { user } = useAuth()
  const { logAction } = useSystemLogs()
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(null)

  const send = async ({ customer, channel, subject, message, couponCode }) => {
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

  const sendBulk = async ({ customers, channel, subject, messageTemplate, couponCode }) => {
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
        onProgress: (p) => setProgress(p)
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

  const getChannels = (customer) => getChannelConfig(customer)

  return {
    send,
    sendBulk,
    getChannels,
    loading,
    progress
  }
}