import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Send, MessageCircle, Mail, Phone, Copy, Check,
  Clock, User, MapPin, Calendar, ShoppingCart, DollarSign,
  MessageSquare, ExternalLink, RefreshCw, AlertCircle,
  Smartphone, AtSign, Hash, FileText, Image, Paperclip,
  History, ChevronRight, Star, TrendingUp
} from 'lucide-react'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import FormInput from '../components/forms/FormInput'
import FeedbackMessage from '../components/ui/FeedbackMessage'
import DataLoadingSkeleton from '../components/ui/DataLoadingSkeleton'
import Badge from '../components/Badge'
import { supabase } from '../lib/supabase'
import useSystemLogs from '../hooks/useSystemLogs'
import { useAuth } from '../contexts/AuthContext.jsx'

const CustomerCommunication = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { logCreate, logAction, logError } = useSystemLogs()

  // Estados
  const [customer, setCustomer] = useState(null)
  const [customerStats, setCustomerStats] = useState(null)
  const [recentPurchases, setRecentPurchases] = useState([])
  const [communicationHistory, setCommunicationHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState({ show: false, type: 'success', message: '' })

  // Estados dos modais de comunicação
  const [activeChannel, setActiveChannel] = useState(null) // 'whatsapp', 'telegram', 'email', 'sms'
  const [messageForm, setMessageForm] = useState({
    subject: '',
    message: '',
    template: 'custom'
  })
  const [isSending, setIsSending] = useState(false)
  const [copied, setCopied] = useState('')

  // Templates de mensagem
  const messageTemplates = {
    welcome: {
      subject: 'Bem-vindo(a) à nossa loja!',
      message: 'Olá {nome}, seja bem-vindo(a) à nossa loja! Estamos muito felizes em tê-lo(a) como cliente. Conte conosco para o que precisar!'
    },
    promotion: {
      subject: 'Oferta especial para você!',
      message: 'Olá {nome}, temos uma oferta especial para você! Aproveite descontos exclusivos em nossos produtos. Venha conferir!'
    },
    birthday: {
      subject: 'Feliz Aniversário!',
      message: 'Olá {nome}, a equipe da nossa loja deseja um feliz aniversário! Para celebrar, preparamos um desconto especial para você. Parabéns!'
    },
    thankYou: {
      subject: 'Obrigado pela preferência!',
      message: 'Olá {nome}, agradecemos pela sua preferência! Sua satisfação é nossa prioridade. Volte sempre!'
    },
    reminder: {
      subject: 'Lembrete importante',
      message: 'Olá {nome}, passando para lembrar que você tem itens no carrinho. Aproveite para finalizar sua compra!'
    }
  }

  // Log de acesso
  useEffect(() => {
    logAction({
      action: 'VIEW',
      entityType: 'customer_communication',
      entityId: id,
      details: {
        component: 'CustomerCommunication',
        user_role: profile?.role
      }
    })
  }, [id])

  // Carregar dados do cliente
  useEffect(() => {
    if (id) {
      loadCustomerData()
    }
  }, [id])

  const loadCustomerData = async () => {
    setLoading(true)
    try {
      // Buscar dados do cliente
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single()

      if (customerError) throw customerError
      setCustomer(customerData)

      // Buscar estatísticas de compras
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('*')
        .eq('customer_id', id)
        .order('created_at', { ascending: false })

      if (salesError) throw salesError

      // Calcular estatísticas
      const totalPurchases = salesData?.length || 0
      const totalSpent = salesData?.reduce((sum, s) => sum + (s.final_amount || 0), 0) || 0
      const averageTicket = totalPurchases > 0 ? totalSpent / totalPurchases : 0
      const lastPurchase = salesData?.[0]?.created_at || null

      setCustomerStats({
        totalPurchases,
        totalSpent,
        averageTicket,
        lastPurchase
      })

      setRecentPurchases(salesData?.slice(0, 5) || [])

      // Buscar histórico de comunicação
      await loadCommunicationHistory()

    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      showFeedback('error', 'Erro ao carregar dados do cliente')
      await logError('customer_communication', error, {
        action: 'load_data',
        customer_id: id
      })
    } finally {
      setLoading(false)
    }
  }

  const loadCommunicationHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_communications')
        .select('*')
        .eq('customer_id', id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      setCommunicationHistory(data || [])
    } catch (error) {
      console.error('Erro ao carregar histórico:', error)
    }
  }

  const showFeedback = (type, message) => {
    setFeedback({ show: true, type, message })
    setTimeout(() => setFeedback({ show: false, type: 'success', message: '' }), 4000)
  }

  // Gerar link do WhatsApp
  const getWhatsAppLink = (message = null) => {
    const phone = customer?.phone?.replace(/\D/g, '')
    if (!phone) return null
    
    const baseUrl = `https://wa.me/55${phone}`
    if (message) {
      return `${baseUrl}?text=${encodeURIComponent(message)}`
    }
    return baseUrl
  }

  // Gerar link do Telegram
  const getTelegramLink = (message = null) => {
    // Telegram requer um username ou número
    const phone = customer?.phone?.replace(/\D/g, '')
    if (!phone) return null
    
    if (message) {
      return `https://t.me/share/url?url=&text=${encodeURIComponent(message)}`
    }
    return `https://t.me/+55${phone}`
  }

  // Enviar e-mail (abre cliente de e-mail padrão)
  const sendEmail = (subject, body) => {
    const email = customer?.email
    if (!email) {
      showFeedback('error', 'Cliente não possui e-mail cadastrado')
      return
    }
    
    const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.open(mailtoLink, '_blank')
    
    // Registrar comunicação
    registerCommunication('email', subject, body)
  }

  // Enviar SMS (via API gratuita - Textbelt ou similar)
  const sendSMS = async (message) => {
    const phone = customer?.phone?.replace(/\D/g, '')
    if (!phone) {
      showFeedback('error', 'Cliente não possui telefone cadastrado')
      return
    }

    setIsSending(true)
    try {
      // Usando Textbelt (1 SMS grátis por dia)
      const response = await fetch('https://textbelt.com/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: `55${phone}`,
          message: message,
          key: 'textbelt', // Chave gratuita (1 SMS/dia)
        })
      })

      const data = await response.json()
      
      if (data.success) {
        showFeedback('success', 'SMS enviado com sucesso!')
        await registerCommunication('sms', null, message)
      } else {
        // Se a cota gratuita acabou, abrir WhatsApp como alternativa
        showFeedback('warning', 'Limite de SMS gratuito atingido. Use WhatsApp!')
        setTimeout(() => {
          window.open(getWhatsAppLink(message), '_blank')
        }, 2000)
      }
    } catch (error) {
      console.error('Erro ao enviar SMS:', error)
      showFeedback('error', 'Erro ao enviar SMS. Tente WhatsApp.')
    } finally {
      setIsSending(false)
      setActiveChannel(null)
    }
  }

  // Registrar comunicação no histórico
  const registerCommunication = async (channel, subject, content) => {
    try {
      const processedContent = content.replace(/{nome}/g, customer?.name || 'Cliente')
      const processedSubject = subject?.replace(/{nome}/g, customer?.name || 'Cliente')

      const { data, error } = await supabase
        .from('customer_communications')
        .insert([{
          customer_id: id,
          channel: channel,
          subject: processedSubject,
          content: processedContent,
          sent_by: profile?.id,
          status: 'sent'
        }])
        .select()
        .single()

      if (error) throw error

      await logCreate('customer_communication', data.id, {
        customer_id: id,
        customer_name: customer?.name,
        channel: channel,
        sent_by: profile?.email
      })

      await loadCommunicationHistory()
    } catch (error) {
      console.error('Erro ao registrar comunicação:', error)
    }
  }

  // Processar e enviar mensagem
  const handleSendMessage = async () => {
    if (!messageForm.message.trim()) {
      showFeedback('error', 'Digite uma mensagem')
      return
    }

    const processedMessage = messageForm.message.replace(/{nome}/g, customer?.name || 'Cliente')
    const processedSubject = messageForm.subject.replace(/{nome}/g, customer?.name || 'Cliente')

    switch (activeChannel) {
      case 'whatsapp':
        window.open(getWhatsAppLink(processedMessage), '_blank')
        await registerCommunication('whatsapp', null, processedMessage)
        showFeedback('success', 'WhatsApp aberto!')
        setActiveChannel(null)
        break

      case 'telegram':
        window.open(getTelegramLink(processedMessage), '_blank')
        await registerCommunication('telegram', null, processedMessage)
        showFeedback('success', 'Telegram aberto!')
        setActiveChannel(null)
        break

      case 'email':
        sendEmail(processedSubject, processedMessage)
        showFeedback('success', 'Cliente de e-mail aberto!')
        setActiveChannel(null)
        break

      case 'sms':
        await sendSMS(processedMessage)
        break

      default:
        break
    }
  }

  // Aplicar template
  const applyTemplate = (templateKey) => {
    const template = messageTemplates[templateKey]
    if (template) {
      setMessageForm({
        subject: template.subject,
        message: template.message,
        template: templateKey
      })
    }
  }

  // Copiar texto
  const handleCopy = (text, type) => {
    navigator.clipboard?.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(''), 2000)
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0)
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('pt-BR')
  }

  const formatDateTime = (date) => {
    return new Date(date).toLocaleString('pt-BR')
  }

  // Canais disponíveis
  const channels = [
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'green',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      borderColor: 'border-green-200',
      hoverColor: 'hover:bg-green-100',
      available: !!customer?.phone,
      description: 'Envie mensagem via WhatsApp'
    },
    {
      id: 'telegram',
      name: 'Telegram',
      icon: Send,
      color: 'blue',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      borderColor: 'border-blue-200',
      hoverColor: 'hover:bg-blue-100',
      available: !!customer?.phone,
      description: 'Envie mensagem via Telegram'
    },
    {
      id: 'email',
      name: 'E-mail',
      icon: Mail,
      color: 'purple',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      borderColor: 'border-purple-200',
      hoverColor: 'hover:bg-purple-100',
      available: !!customer?.email,
      description: 'Envie um e-mail para o cliente'
    },
    {
      id: 'sms',
      name: 'SMS',
      icon: Smartphone,
      color: 'orange',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
      borderColor: 'border-orange-200',
      hoverColor: 'hover:bg-orange-100',
      available: !!customer?.phone,
      description: 'Envie SMS (1 grátis por dia)'
    }
  ]

  if (loading) {
    return <DataLoadingSkeleton type="cards" rows={3} />
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">Cliente não encontrado</p>
          <Button className="mt-4" onClick={() => navigate('/customers')}>
            Voltar para Clientes
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/customers')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft size={18} />
            Voltar para Clientes
          </button>

          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <User size={32} className="text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
                <div className="flex items-center gap-4 mt-1">
                  {customer.email && (
                    <span className="text-sm text-gray-600 flex items-center gap-1">
                      <Mail size={14} />
                      {customer.email}
                    </span>
                  )}
                  {customer.phone && (
                    <span className="text-sm text-gray-600 flex items-center gap-1">
                      <Phone size={14} />
                      {customer.phone}
                    </span>
                  )}
                  <Badge variant={customer.status === 'active' ? 'success' : 'danger'}>
                    {customer.status === 'active' ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feedback */}
        {feedback.show && (
          <div className="mb-4">
            <FeedbackMessage
              type={feedback.type}
              message={feedback.message}
              onClose={() => setFeedback({ show: false })}
            />
          </div>
        )}

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={ShoppingCart}
            label="Total de Compras"
            value={customerStats?.totalPurchases || 0}
            color="blue"
          />
          <StatCard
            icon={DollarSign}
            label="Total Gasto"
            value={formatCurrency(customerStats?.totalSpent || 0)}
            color="green"
          />
          <StatCard
            icon={TrendingUp}
            label="Ticket Médio"
            value={formatCurrency(customerStats?.averageTicket || 0)}
            color="purple"
          />
          <StatCard
            icon={Calendar}
            label="Última Compra"
            value={customerStats?.lastPurchase ? formatDate(customerStats.lastPurchase) : 'Nunca'}
            color="orange"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Esquerda - Canais de Comunicação */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MessageSquare size={20} className="text-blue-600" />
                Canais de Comunicação
              </h2>

              <div className="space-y-3">
                {channels.map(channel => {
                  const Icon = channel.icon
                  return (
                    <button
                      key={channel.id}
                      onClick={() => channel.available && setActiveChannel(channel.id)}
                      disabled={!channel.available}
                      className={`
                        w-full flex items-center gap-3 p-3 rounded-lg border transition-all
                        ${channel.available 
                          ? `${channel.bgColor} ${channel.borderColor} ${channel.hoverColor} cursor-pointer` 
                          : 'bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed'
                        }
                      `}
                    >
                      <div className={`p-2 rounded-lg ${channel.bgColor}`}>
                        <Icon size={20} className={channel.textColor} />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium">{channel.name}</p>
                        <p className="text-xs text-gray-500">{channel.description}</p>
                      </div>
                      {channel.available ? (
                        <ChevronRight size={18} className="text-gray-400" />
                      ) : (
                        <span className="text-xs text-gray-400">Indisponível</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Informações de Contato */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4">Informações de Contato</h2>

              <div className="space-y-3">
                {customer.phone && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Phone size={16} className="text-gray-500" />
                      <span className="text-sm">{customer.phone}</span>
                    </div>
                    <button
                      onClick={() => handleCopy(customer.phone, 'phone')}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {copied === 'phone' ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                    </button>
                  </div>
                )}

                {customer.email && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AtSign size={16} className="text-gray-500" />
                      <span className="text-sm">{customer.email}</span>
                    </div>
                    <button
                      onClick={() => handleCopy(customer.email, 'email')}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {copied === 'email' ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                    </button>
                  </div>
                )}

                {customer.address && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin size={16} className="text-gray-500" />
                      <span className="text-sm font-medium">Endereço</span>
                    </div>
                    <p className="text-sm text-gray-600 ml-7">
                      {customer.address}
                      {customer.city && `, ${customer.city}`}
                      {customer.state && ` - ${customer.state}`}
                      {customer.zip_code && ` (CEP: ${customer.zip_code})`}
                    </p>
                  </div>
                )}

                {customer.document && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Hash size={16} className="text-gray-500" />
                      <span className="text-sm">{customer.document}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Coluna Direita - Últimas Compras e Histórico */}
          <div className="lg:col-span-2 space-y-4">
            {/* Últimas Compras */}
            {recentPurchases.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <ShoppingCart size={20} className="text-blue-600" />
                  Últimas Compras
                </h2>

                <div className="space-y-2">
                  {recentPurchases.map(purchase => (
                    <div key={purchase.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">Venda #{purchase.sale_number}</p>
                        <p className="text-xs text-gray-500">{formatDateTime(purchase.created_at)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">{formatCurrency(purchase.final_amount)}</p>
                        <p className="text-xs text-gray-500">{purchase.payment_method}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Histórico de Comunicação */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <History size={20} className="text-blue-600" />
                Histórico de Comunicação
              </h2>

              {communicationHistory.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Nenhuma comunicação registrada ainda
                </p>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {communicationHistory.map(comm => {
                    const channelInfo = channels.find(c => c.id === comm.channel)
                    const Icon = channelInfo?.icon || MessageSquare
                    
                    return (
                      <div key={comm.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon size={14} className={channelInfo?.textColor || 'text-gray-500'} />
                          <span className="text-xs font-medium text-gray-600 uppercase">
                            {comm.channel}
                          </span>
                          <span className="text-xs text-gray-400">
                            {formatDateTime(comm.created_at)}
                          </span>
                        </div>
                        {comm.subject && (
                          <p className="text-sm font-medium mb-1">{comm.subject}</p>
                        )}
                        <p className="text-sm text-gray-600 line-clamp-2">{comm.content}</p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal de Mensagem */}
        <Modal
          isOpen={!!activeChannel}
          onClose={() => setActiveChannel(null)}
          title={`Enviar ${channels.find(c => c.id === activeChannel)?.name || 'Mensagem'}`}
          size="lg"
        >
          <div className="space-y-4">
            {/* Seleção de Template */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Templates Rápidos
              </label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(messageTemplates).map(([key, template]) => (
                  <button
                    key={key}
                    onClick={() => applyTemplate(key)}
                    className={`
                      px-3 py-1.5 text-xs rounded-full border transition-all
                      ${messageForm.template === key
                        ? 'bg-blue-100 border-blue-300 text-blue-700'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                      }
                    `}
                  >
                    {key === 'welcome' && 'Boas-vindas'}
                    {key === 'promotion' && 'Promoção'}
                    {key === 'birthday' && 'Aniversário'}
                    {key === 'thankYou' && 'Agradecimento'}
                    {key === 'reminder' && 'Lembrete'}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Use {'{nome}'} para inserir o nome do cliente
              </p>
            </div>

            {/* Campo Assunto (apenas para e-mail) */}
            {activeChannel === 'email' && (
              <FormInput
                label="Assunto"
                name="subject"
                value={messageForm.subject}
                onChange={(e) => setMessageForm(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Assunto do e-mail"
                icon={FileText}
              />
            )}

            {/* Campo Mensagem */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mensagem
              </label>
              <textarea
                value={messageForm.message}
                onChange={(e) => setMessageForm(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Digite sua mensagem..."
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Preview */}
            {messageForm.message && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-600 mb-1">Preview:</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {messageForm.message.replace(/{nome}/g, customer?.name || '[NOME]')}
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <Button variant="outline" onClick={() => setActiveChannel(null)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSendMessage}
              loading={isSending}
              icon={channels.find(c => c.id === activeChannel)?.icon}
            >
              Enviar Mensagem
            </Button>
          </div>
        </Modal>
      </div>
    </div>
  )
}

// Componente auxiliar
const StatCard = ({ icon: Icon, label, value, color }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600'
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colors[color]}`}>
          <Icon size={20} />
        </div>
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          <p className="text-xl font-semibold">{value}</p>
        </div>
      </div>
    </div>
  )
}

export default CustomerCommunication