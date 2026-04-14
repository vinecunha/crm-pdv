import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, User, Mail, Phone, MapPin, AtSign, Hash, Copy, Check, MessageCircle, Send, Smartphone, AlertCircle } from '../lib/icons'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import useSystemLogs from '../hooks/useSystemLogs'

import Button from '../components/ui/Button'
import FeedbackMessage from '../components/ui/FeedbackMessage'
import DataLoadingSkeleton from '../components/ui/DataLoadingSkeleton'
import Badge from '../components/Badge'

import CustomerStats from '../components/customers/CustomerStats'
import CommunicationChannels from '../components/customers/CommunicationChannels'
import RecentPurchases from '../components/customers/RecentPurchases'
import CommunicationHistory from '../components/customers/CommunicationHistory'
import MessageModal from '../components/customers/MessageModal'

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
  const [feedback, setFeedback] = useState({ show: false, type: 'success', message: '' })
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
    { id: 'whatsapp', name: 'WhatsApp', icon: MessageCircle, color: 'green', bgColor: 'bg-green-50', textColor: 'text-green-600', borderColor: 'border-green-200', hoverColor: 'hover:bg-green-100', available: !!customer?.phone, description: 'Envie mensagem via WhatsApp' },
    { id: 'telegram', name: 'Telegram', icon: Send, color: 'blue', bgColor: 'bg-blue-50', textColor: 'text-blue-600', borderColor: 'border-blue-200', hoverColor: 'hover:bg-blue-100', available: !!customer?.phone, description: 'Envie mensagem via Telegram' },
    { id: 'email', name: 'E-mail', icon: Mail, color: 'purple', bgColor: 'bg-purple-50', textColor: 'text-purple-600', borderColor: 'border-purple-200', hoverColor: 'hover:bg-purple-100', available: !!customer?.email, description: 'Envie um e-mail' },
    { id: 'sms', name: 'SMS', icon: Smartphone, color: 'orange', bgColor: 'bg-orange-50', textColor: 'text-orange-600', borderColor: 'border-orange-200', hoverColor: 'hover:bg-orange-100', available: !!customer?.phone, description: 'Envie SMS (1 grátis/dia)' }
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

  const showFeedback = (type, message) => {
    setFeedback({ show: true, type, message })
    setTimeout(() => setFeedback({ show: false, type: 'success', message: '' }), 4000)
  }

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
  if (!customer) return <div className="min-h-screen flex items-center justify-center"><div className="text-center"><AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" /><p className="text-gray-600">Cliente não encontrado</p><Button className="mt-4" onClick={() => navigate('/customers')}>Voltar</Button></div></div>

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button onClick={() => navigate('/customers')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"><ArrowLeft size={18} />Voltar para Clientes</button>

        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center"><User size={32} className="text-blue-600" /></div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
              <div className="flex items-center gap-4 mt-1">
                {customer.email && <span className="text-sm text-gray-600 flex items-center gap-1"><Mail size={14} />{customer.email}</span>}
                {customer.phone && <span className="text-sm text-gray-600 flex items-center gap-1"><Phone size={14} />{customer.phone}</span>}
                <Badge variant={customer.status === 'active' ? 'success' : 'danger'}>{customer.status === 'active' ? 'Ativo' : 'Inativo'}</Badge>
              </div>
            </div>
          </div>
        </div>

        {feedback.show && <FeedbackMessage type={feedback.type} message={feedback.message} onClose={() => setFeedback({ show: false })} />}

        <CustomerStats stats={customerStats} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <CommunicationChannels channels={channels} customer={customer} onSelectChannel={setActiveChannel} />
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4">Informações de Contato</h2>
              <div className="space-y-3">
                {customer.phone && <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"><div className="flex items-center gap-2"><Phone size={16} className="text-gray-500" /><span className="text-sm">{customer.phone}</span></div><button onClick={() => handleCopy(customer.phone, 'phone')} className="text-gray-400 hover:text-gray-600">{copied === 'phone' ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}</button></div>}
                {customer.email && <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"><div className="flex items-center gap-2"><AtSign size={16} className="text-gray-500" /><span className="text-sm">{customer.email}</span></div><button onClick={() => handleCopy(customer.email, 'email')} className="text-gray-400 hover:text-gray-600">{copied === 'email' ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}</button></div>}
                {customer.address && <div className="p-3 bg-gray-50 rounded-lg"><div className="flex items-center gap-2 mb-2"><MapPin size={16} className="text-gray-500" /><span className="text-sm font-medium">Endereço</span></div><p className="text-sm text-gray-600 ml-7">{customer.address}{customer.city && `, ${customer.city}`}{customer.state && ` - ${customer.state}`}</p></div>}
                {customer.document && <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"><div className="flex items-center gap-2"><Hash size={16} className="text-gray-500" /><span className="text-sm">{customer.document}</span></div></div>}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <RecentPurchases purchases={recentPurchases} />
            <CommunicationHistory history={communicationHistory} channels={channels} />
          </div>
        </div>

        <MessageModal isOpen={!!activeChannel} onClose={() => setActiveChannel(null)} activeChannel={activeChannel} channels={channels} messageForm={messageForm} setMessageForm={setMessageForm} messageTemplates={messageTemplates} customer={customer} onSend={handleSendMessage} isSending={isSending} />
      </div>
    </div>
  )
}

export default CustomerCommunication