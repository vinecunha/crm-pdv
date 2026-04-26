// src/pages/CustomerCommunication.jsx
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, User, Mail, Phone, MapPin, AtSign, Hash, Copy, Check, MessageCircle, Send, Smartphone, AlertCircle } from '@lib/icons'
import { supabase } from '@lib/supabase'
import { useAuth } from '@contexts/AuthContext'
import { useUI } from '@contexts/UIContext'
import { useSystemLogs } from '@hooks/system/useSystemLogs'

import Button from '@components/ui/Button'
import DataLoadingSkeleton from '@components/ui/DataLoadingSkeleton'
import Badge from '@components/Badge'
import PageHeader from '@components/ui/PageHeader'

import CustomerStats from '@components/customers/CustomerStats'
import CommunicationChannels from '@components/customers/CommunicationChannels'
import RecentPurchases from '@components/customers/RecentPurchases'
import CommunicationHistory from '@components/customers/CommunicationHistory'
import MessageModal from '@components/customers/MessageModal'

const CustomerCommunication = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { logCreate, logAction, logError } = useSystemLogs()

  const [customer, setCustomer] = useState(null)
  const [customerStats, setCustomerStats] = useState(null)
  const [recentPurchases, setRecentPurchases] = useState([])
  const [communicationHistory, setCommunicationHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeChannel, setActiveChannel] = useState(null)
  const [messageForm, setMessageForm] = useState({ subject: '', message: '', template: 'custom' })
  const [isSending, setIsSending] = useState(false)
  const [copied, setCopied] = useState('')

  const messageTemplates = {
    welcome: { subject: 'Bem-vindo(a)!', message: 'Olá {nome}, seja bem-vindo(a)!' },
    promotion: { subject: 'Oferta especial!', message: 'Olá {nome}, temos uma oferta especial!' },
    birthday: { subject: 'Feliz Aniversário!', message: 'Olá {nome}, feliz aniversário!' },
    thankYou: { subject: 'Obrigado!', message: 'Olá {nome}, obrigado pela preferência!' },
    reminder: { subject: 'Lembrete', message: 'Olá {nome}, você tem itens no carrinho!' }
  }

  const channels = [
    { id: 'whatsapp', name: 'WhatsApp', icon: MessageCircle, color: 'green', bgColor: 'bg-green-50 dark:bg-green-900/20', textColor: 'text-green-600 dark:text-green-400', borderColor: 'border-green-200 dark:border-green-800', hoverColor: 'hover:bg-green-100 dark:hover:bg-green-900/30', available: !!customer?.phone, description: 'Envie mensagem via WhatsApp' },
    { id: 'telegram', name: 'Telegram', icon: Send, color: 'blue', bgColor: 'bg-blue-50 dark:bg-blue-900/20', textColor: 'text-blue-600 dark:text-blue-400', borderColor: 'border-blue-200 dark:border-blue-800', hoverColor: 'hover:bg-blue-100 dark:hover:bg-blue-900/30', available: !!customer?.phone, description: 'Envie mensagem via Telegram' },
    { id: 'email', name: 'E-mail', icon: Mail, color: 'purple', bgColor: 'bg-purple-50 dark:bg-purple-900/20', textColor: 'text-purple-600 dark:text-purple-400', borderColor: 'border-purple-200 dark:border-purple-800', hoverColor: 'hover:bg-purple-100 dark:hover:bg-purple-900/30', available: !!customer?.email, description: 'Envie um e-mail' },
    { id: 'sms', name: 'SMS', icon: Smartphone, color: 'orange', bgColor: 'bg-orange-50 dark:bg-orange-900/20', textColor: 'text-orange-600 dark:text-orange-400', borderColor: 'border-orange-200 dark:border-orange-800', hoverColor: 'hover:bg-orange-100 dark:hover:bg-orange-900/30', available: !!customer?.phone, description: 'Envie SMS (1 grátis/dia)' }
  ]

  useEffect(() => { if (id) loadCustomerData() }, [id])

  const loadCustomerData = async () => {
    setLoading(true)
    try {
      const { data: customerData, error } = await supabase.from('customers').select('*').eq('id', id).single()
      if (error) throw error
      setCustomer(customerData)

      const { data: salesData } = await supabase.from('sales').select('*').eq('customer_id', id).order('created_at', { ascending: false })
      const totalPurchases = salesData?.length || 0
      const totalSpent = salesData?.reduce((sum, s) => sum + (s.final_amount || 0), 0) || 0
      setCustomerStats({ totalPurchases, totalSpent, averageTicket: totalPurchases > 0 ? totalSpent / totalPurchases : 0, lastPurchase: salesData?.[0]?.created_at || null })
      setRecentPurchases(salesData?.slice(0, 5) || [])

      const { data: commData } = await supabase.from('customer_communications').select('*').eq('customer_id', id).order('created_at', { ascending: false }).limit(20)
      setCommunicationHistory(commData || [])
    } catch (error) {
      showFeedback('error', 'Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const { showFeedback } = useUI()

  const getWhatsAppLink = (message) => `https://wa.me/55${customer?.phone?.replace(/\D/g, '')}${message ? `?text=${encodeURIComponent(message)}` : ''}`
  const getTelegramLink = (message) => message ? `https://t.me/share/url?url=&text=${encodeURIComponent(message)}` : `https://t.me/+55${customer?.phone?.replace(/\D/g, '')}`

  const registerCommunication = async (channel, subject, content) => {
    const { data, error } = await supabase.from('customer_communications').insert([{ customer_id: id, channel, subject: subject?.replace(/{nome}/g, customer?.name), content: content.replace(/{nome}/g, customer?.name), sent_by: profile?.id, status: 'sent' }]).select().single()
    if (!error) { await logCreate('customer_communication', data.id, { customer_id: id, channel }); await loadCustomerData() }
  }

  const handleSendMessage = async () => {
    if (!messageForm.message.trim()) { showFeedback('error', 'Digite uma mensagem'); return }
    const msg = messageForm.message.replace(/{nome}/g, customer?.name || 'Cliente')
    const subj = messageForm.subject.replace(/{nome}/g, customer?.name || 'Cliente')
    if (activeChannel === 'whatsapp') { window.open(getWhatsAppLink(msg), '_blank'); await registerCommunication('whatsapp', null, msg) }
    else if (activeChannel === 'telegram') { window.open(getTelegramLink(msg), '_blank'); await registerCommunication('telegram', null, msg) }
    else if (activeChannel === 'email') { window.open(`mailto:${customer?.email}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(msg)}`, '_blank'); await registerCommunication('email', subj, msg) }
    showFeedback('success', 'Mensagem enviada!')
    setActiveChannel(null)
  }

  const handleCopy = (text, type) => { navigator.clipboard?.writeText(text); setCopied(type); setTimeout(() => setCopied(''), 2000) }

  if (loading) return <DataLoadingSkeleton type="cards" rows={3} />
  if (!customer) return (
    <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center px-4">
      <div className="text-center">
        <AlertCircle className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
        <p className="text-gray-600 dark:text-gray-400">Cliente não encontrado</p>
        <Button className="mt-4" onClick={() => navigate('/customers')}>Voltar</Button>
      </div>
    </div>
  )

  const headerActions = [
    {
      label: 'Voltar',
      icon: ArrowLeft,
      onClick: () => navigate('/customers'),
      variant: 'outline'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">

        {/* ✅ PageHeader com título STRING */}
        <PageHeader
          title={customer.name}
          description={
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {customer.email && (
                <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                  <Mail size={12} />{customer.email}
                </span>
              )}
              {customer.phone && (
                <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                  <Phone size={12} />{customer.phone}
                </span>
              )}
              <Badge variant={customer.status === 'active' ? 'success' : 'danger'} size="sm">
                {customer.status === 'active' ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
          }
          icon={User}
          actions={headerActions}
        />

        {/* ✅ Avatar e informações adicionais */}
        <div className="flex items-center gap-3 mb-6 p-4 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
            <User size={28} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{customer.name}</h2>
              <Badge variant={customer.status === 'active' ? 'success' : 'danger'} size="sm">
                {customer.status === 'active' ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-gray-500 dark:text-gray-400">
              {customer.email && <span className="flex items-center gap-1"><Mail size={12} /> {customer.email}</span>}
              {customer.phone && <span className="flex items-center gap-1"><Phone size={12} /> {customer.phone}</span>}
              {customer.document && <span className="flex items-center gap-1"><Hash size={12} /> {customer.document}</span>}
            </div>
          </div>
        </div>

        <div className="mb-4 sm:mb-6">
          <CustomerStats stats={customerStats} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-1 space-y-4">
            <CommunicationChannels channels={channels} customer={customer} onSelectChannel={setActiveChannel} />
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 dark:text-white">Informações de Contato</h2>
              <div className="space-y-2 sm:space-y-3">
                {customer.phone && (
                  <div className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-gray-500 dark:text-gray-400 flex-shrink-0" />
                      <span className="text-xs sm:text-sm dark:text-white truncate">{customer.phone}</span>
                    </div>
                    <button onClick={() => handleCopy(customer.phone, 'phone')} className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 flex-shrink-0">
                      {copied === 'phone' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                    </button>
                  </div>
                )}
                {customer.email && (
                  <div className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AtSign size={14} className="text-gray-500 dark:text-gray-400 flex-shrink-0" />
                      <span className="text-xs sm:text-sm dark:text-white truncate">{customer.email}</span>
                    </div>
                    <button onClick={() => handleCopy(customer.email, 'email')} className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 flex-shrink-0">
                      {copied === 'email' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                    </button>
                  </div>
                )}
                {customer.address && (
                  <div className="p-2 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-2 mb-1 sm:mb-2">
                      <MapPin size={14} className="text-gray-500 dark:text-gray-400 flex-shrink-0" />
                      <span className="text-xs sm:text-sm font-medium dark:text-white">Endereço</span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 ml-6">
                      {customer.address}{customer.city && `, ${customer.city}`}{customer.state && ` - ${customer.state}`}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <RecentPurchases purchases={recentPurchases} />
            <CommunicationHistory history={communicationHistory} channels={channels} />
          </div>
        </div>

        <MessageModal 
          isOpen={!!activeChannel} 
          onClose={() => setActiveChannel(null)} 
          activeChannel={activeChannel} 
          channels={channels} 
          messageForm={messageForm} 
          setMessageForm={setMessageForm} 
          messageTemplates={messageTemplates} 
          customer={customer} 
          onSend={handleSendMessage} 
          isSending={isSending} 
        />
      </div>
    </div>
  )
}

export default CustomerCommunication
