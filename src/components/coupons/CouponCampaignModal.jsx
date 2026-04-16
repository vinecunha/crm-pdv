import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import ConfirmModal from '../ui/ConfirmModal'
import FeedbackMessage from '../ui/FeedbackMessage'
import { Gift, Search, CheckSquare, Square, Send, ChevronRight, Smartphone, Mail, MessageCircle, Copy } from '../../lib/icons'
import logger from '../../utils/logger'

// ============= SUB-COMPONENTES =============

// Botão de copiar reutilizável com feedback visual via estado local
const CopyButton = ({ text, label = 'Copiar' }) => {
  const [copied, setCopied] = useState(false)
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      // silencioso
    }
  }
  
  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-1 text-xs border rounded px-2 py-1 transition ${
        copied
          ? 'text-green-700 dark:text-green-400 border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/30'
          : 'text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-700 bg-white dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/30'
      }`}
    >
      <Copy size={12} />
      {copied ? 'Copiado!' : label}
    </button>
  )
}

// Linha de cliente com número e botões de copiar número e abrir WhatsApp
const CustomerPhoneRow = ({ customer, customMessage }) => {
  const personalizedMsg = customMessage.replace(/{{nome}}/g, customer.name || 'Cliente')
  const waUrl = `https://wa.me/55${customer.phoneClean}?text=${encodeURIComponent(personalizedMsg)}`
  
  return (
    <div className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{customer.name}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{customer.phone}</p>
      </div>
      <div className="flex items-center gap-2 ml-3 flex-shrink-0">
        <CopyButton text={customer.phoneClean} label="Copiar" />
        <a
          href={waUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 text-xs text-green-700 dark:text-green-400 border border-green-200 dark:border-green-700 bg-white dark:bg-gray-700 hover:bg-green-50 dark:hover:bg-green-900/30 rounded px-2 py-1 transition"
        >
          <Smartphone size={12} />
          Abrir Direto
        </a>
      </div>
    </div>
  )
}

// ============= COMPONENTE PRINCIPAL =============

const CouponCampaignModal = ({ isOpen, onClose, coupon, onSuccess }) => {
  // Estados
  const [step, setStep] = useState(1)
  const [customers, setCustomers] = useState([])
  const [selectedCustomers, setSelectedCustomers] = useState(new Set())
  const [allowedCustomerIds, setAllowedCustomerIds] = useState(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const [loadingSend, setLoadingSend] = useState(false)
  const [sendProgress, setSendProgress] = useState({ current: 0, total: 0 })
  
  // Estados para modais de confirmação
  const [showWhatsAppPanel, setShowWhatsAppPanel] = useState(false)
  const [whatsAppData, setWhatsAppData] = useState(null)
  const [showNoPhoneWarning, setShowNoPhoneWarning] = useState(false)
  const [showNoEmailWarning, setShowNoEmailWarning] = useState(false)
  const [showNoSelectionWarning, setShowNoSelectionWarning] = useState(false)
  
  // Estado para feedback
  const [feedback, setFeedback] = useState({ show: false, type: 'success', message: '' })
  
  // Estados do passo 2
  const [selectedChannel, setSelectedChannel] = useState('whatsapp')
  const [customMessage, setCustomMessage] = useState('')
  const [templates] = useState([
    {
      id: 'miss_you',
      name: 'Sentimos sua falta',
      content: 'Olá {{nome}}, sentimos sua falta! Volte e ganhe {{desconto}} na sua próxima compra. Use o cupom **{{cupom}}**!',
      discount: coupon?.discount_type === 'percent' ? `${coupon?.discount_value}%` : `R$ ${coupon?.discount_value}`
    },
    {
      id: 'special_offer',
      name: 'Oferta Especial',
      content: 'Olá {{nome}}, preparamos uma oferta especial para você! Use o cupom **{{cupom}}** e ganhe {{desconto}}!',
      discount: coupon?.discount_type === 'percent' ? `${coupon?.discount_value}%` : `R$ ${coupon?.discount_value}`
    }
  ])
  const [selectedTemplate, setSelectedTemplate] = useState(templates[0])

  const channels = [
    { id: 'whatsapp', name: 'WhatsApp', icon: Smartphone, color: 'green' },
    { id: 'email', name: 'E-mail', icon: Mail, color: 'blue' },
    { id: 'sms', name: 'SMS', icon: MessageCircle, color: 'orange' }
  ]

  const showFeedback = (type, message) => {
    setFeedback({ show: true, type, message })
    setTimeout(() => setFeedback({ show: false, type: 'success', message: '' }), 4000)
  }

  useEffect(() => {
    if (isOpen && coupon) {
      loadCustomersAndAssociations()
      setStep(1)
      setSelectedCustomers(new Set())
      updateMessageTemplate(templates[0])
    }
  }, [isOpen, coupon])

  const updateMessageTemplate = (template) => {
    const discount = coupon?.discount_type === 'percent' 
      ? `${coupon?.discount_value}%` 
      : `R$ ${coupon?.discount_value}`
    
    let msg = template.content
      .replace(/{{desconto}}/g, discount)
      .replace(/{{cupom}}/g, coupon?.code || 'CUPOM')
    
    setCustomMessage(msg)
  }

  const handleTemplateChange = (template) => {
    setSelectedTemplate(template)
    updateMessageTemplate(template)
  }

  const loadCustomersAndAssociations = async () => {
    setLoadingCustomers(true)
    try {
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .eq('status', 'active')
        .order('name')
      
      if (customersError) throw customersError
      
      const { data: allowedData, error: allowedError } = await supabase
        .from('coupon_allowed_customers')
        .select('customer_id')
        .eq('coupon_id', coupon.id)
      
      if (allowedError) throw allowedError
      
      const allowedIds = new Set(allowedData?.map(a => a.customer_id) || [])
      
      setCustomers(customersData || [])
      setAllowedCustomerIds(allowedIds)
      setSelectedCustomers(new Set(allowedIds))
      
      logger.log('✅ [CouponCampaign] Clientes carregados', { 
        total: customersData?.length, 
        associados: allowedIds.size 
      })
    } catch (error) {
      logger.error('❌ [CouponCampaign] Erro ao carregar clientes', { error: error.message })
      showFeedback('error', 'Erro ao carregar clientes')
    } finally {
      setLoadingCustomers(false)
    }
  }

  const filteredCustomers = useMemo(() => {
    if (!searchTerm.trim()) return customers
    const term = searchTerm.toLowerCase()
    return customers.filter(c => 
      c.name?.toLowerCase().includes(term) || 
      c.email?.toLowerCase().includes(term) || 
      c.phone?.includes(term)
    )
  }, [customers, searchTerm])

  const handleSelectAll = () => {
    if (selectedCustomers.size === filteredCustomers.length) {
      setSelectedCustomers(new Set())
    } else {
      setSelectedCustomers(new Set(filteredCustomers.map(c => c.id)))
    }
  }

  const handleToggleCustomer = (customerId) => {
    const newSelected = new Set(selectedCustomers)
    if (newSelected.has(customerId)) {
      newSelected.delete(customerId)
    } else {
      newSelected.add(customerId)
    }
    setSelectedCustomers(newSelected)
  }

  const handleContinue = () => {
    if (selectedCustomers.size === 0) {
      setShowNoSelectionWarning(true)
      return
    }
    setStep(2)
  }

  const registerCommunicationsOnly = async (customersList) => {
    const userId = (await supabase.auth.getUser()).data.user?.id
    
    for (let i = 0; i < customersList.length; i++) {
      const customer = customersList[i]
      const personalizedMsg = customMessage.replace(/{{nome}}/g, customer.name || 'Cliente')
      
      await supabase.from('customer_communications').insert({
        customer_id: customer.id,
        channel: selectedChannel,
        subject: `Campanha: ${coupon.code}`,
        content: personalizedMsg,
        status: 'sent',
        sent_by: userId
      })
      
      setSendProgress({ current: i + 1, total: customersList.length })
    }
  }

  const handleWhatsAppCampaign = async (customersList) => {
    const validCustomers = customersList.filter(c => c.phone)
    
    if (validCustomers.length === 0) {
      setShowNoPhoneWarning(true)
      return
    }
    
    await registerCommunicationsOnly(validCustomers)
    
    if (validCustomers.length === 1) {
      const customer = validCustomers[0]
      const personalizedMsg = customMessage.replace(/{{nome}}/g, customer.name || 'Cliente')
      const phone = customer.phone.replace(/\D/g, '')
      window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(personalizedMsg)}`, '_blank')
      onClose()
      return
    }
    
    // Múltiplos: monta dados e abre painel único
    const validCustomersWithPhone = validCustomers.map(c => ({
      ...c,
      phoneClean: c.phone.replace(/\D/g, '')
    }))
    
    setWhatsAppData({ validCustomers: validCustomersWithPhone })
    setShowWhatsAppPanel(true)
  }

  const handleEmailCampaign = async (customersList) => {
    const validCustomers = customersList.filter(c => c.email)
    
    if (validCustomers.length === 0) {
      setShowNoEmailWarning(true)
      return
    }
    
    await registerCommunicationsOnly(validCustomers)
    
    const emails = validCustomers.map(c => c.email).join(',')
    const subject = `Campanha: ${coupon.code}`
    const body = customMessage.replace(/{{nome}}/g, '[Nome do Cliente]')
    
    const mailtoUrl = `mailto:${emails}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.location.href = mailtoUrl
    
    showFeedback('success', `${validCustomers.length} cliente(s) adicionados ao email`)
    onClose()
  }

  const handleSMSCampaign = async (customersList) => {
    const validCustomers = customersList.filter(c => c.phone)
    
    if (validCustomers.length === 0) {
      setShowNoPhoneWarning(true)
      return
    }
    
    await registerCommunicationsOnly(validCustomers)
    
    const phones = validCustomers.map(c => c.phone.replace(/\D/g, '')).join(',')
    const body = customMessage.replace(/{{nome}}/g, '[Nome]')
    
    const smsUrl = `sms:${phones}?body=${encodeURIComponent(body)}`
    window.location.href = smsUrl
    
    showFeedback('success', `${validCustomers.length} cliente(s) adicionados ao SMS`)
    onClose()
  }

  const handleSendCampaign = async () => {
    setLoadingSend(true)
    setSendProgress({ current: 0, total: selectedCustomers.size })
    
    try {
      const selectedCustomersList = customers.filter(c => selectedCustomers.has(c.id))
      const newlyAdded = selectedCustomersList.filter(c => !allowedCustomerIds.has(c.id))
      const removed = customers.filter(c => allowedCustomerIds.has(c.id) && !selectedCustomers.has(c.id))
      
      logger.log('📤 [CouponCampaign] Enviando campanha', {
        total: selectedCustomersList.length,
        novos: newlyAdded.length,
        removidos: removed.length,
        canal: selectedChannel
      })
      
      if (newlyAdded.length > 0) {
        await supabase
          .from('coupon_allowed_customers')
          .upsert(
            newlyAdded.map(c => ({ coupon_id: coupon.id, customer_id: c.id })),
            { onConflict: 'coupon_id,customer_id' }
          )
      }
      
      if (removed.length > 0) {
        await supabase
          .from('coupon_allowed_customers')
          .delete()
          .eq('coupon_id', coupon.id)
          .in('customer_id', removed.map(c => c.id))
      }
      
      const isWhatsAppMultiple = selectedChannel === 'whatsapp' && 
        selectedCustomersList.filter(c => c.phone).length > 1
      
      if (selectedChannel === 'whatsapp') {
        await handleWhatsAppCampaign(selectedCustomersList)
      } else if (selectedChannel === 'email') {
        await handleEmailCampaign(selectedCustomersList)
      } else if (selectedChannel === 'sms') {
        await handleSMSCampaign(selectedCustomersList)
      } else {
        await registerCommunicationsOnly(selectedCustomersList)
        onClose()
      }
      
      logger.log('✅ [CouponCampaign] Campanha processada com sucesso')
      
      if (!isWhatsAppMultiple) {
        onSuccess?.({
          successCount: selectedCustomersList.length,
          newlyAdded: newlyAdded.length,
          removed: removed.length,
          channel: selectedChannel
        })
      }
      
    } catch (error) {
      logger.error('❌ [CouponCampaign] Erro ao enviar campanha', { error: error.message })
      showFeedback('error', 'Erro ao enviar campanha: ' + error.message)
    } finally {
      setLoadingSend(false)
      setSendProgress({ current: 0, total: 0 })
    }
  }

  const handleCloseWhatsAppPanel = () => {
    setShowWhatsAppPanel(false)
    setWhatsAppData(null)
    onSuccess?.({
      successCount: whatsAppData?.validCustomers?.length || 0,
      newlyAdded: 0,
      removed: 0,
      channel: 'whatsapp'
    })
    onClose()
  }

  if (!coupon) return null

  const allFilteredSelected = filteredCustomers.length > 0 && filteredCustomers.every(c => selectedCustomers.has(c.id))

  return (
    <>
      {feedback.show && (
        <div className="fixed top-4 right-4 z-50">
          <FeedbackMessage type={feedback.type} message={feedback.message} onClose={() => setFeedback({ show: false })} />
        </div>
      )}

      <Modal isOpen={isOpen} onClose={onClose} title={`📢 Campanha: ${coupon.code}`} size="xl">
        {/* Step 1: Selecionar Clientes */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 flex items-center gap-3">
              <Gift size={20} className="text-blue-600 dark:text-blue-400" />
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-300">{coupon.name}</p>
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  {coupon.discount_type === 'percent' ? `${coupon.discount_value}%` : `R$ ${coupon.discount_value}`} • 
                  {coupon.is_global ? ' Global' : ' Restrito'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={16} />
                <input
                  type="text"
                  placeholder="Buscar cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg"
                />
              </div>
              <button onClick={handleSelectAll} className="text-sm text-blue-600 dark:text-blue-400 hover:underline ml-4">
                {allFilteredSelected ? 'Desmarcar todos' : 'Selecionar todos'}
              </button>
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-lg max-h-80 overflow-y-auto">
              {loadingCustomers ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">Carregando clientes...</div>
              ) : filteredCustomers.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">Nenhum cliente encontrado</div>
              ) : (
                filteredCustomers.map(customer => {
                  const isSelected = selectedCustomers.has(customer.id)
                  const isAlreadyAllowed = allowedCustomerIds.has(customer.id)
                  
                  return (
                    <label key={customer.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                      <button onClick={(e) => { e.preventDefault(); handleToggleCustomer(customer.id) }} className="flex-shrink-0">
                        {isSelected ? <CheckSquare size={20} className="text-blue-600 dark:text-blue-400" /> : <Square size={20} className="text-gray-400 dark:text-gray-500" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-white truncate">{customer.name}</span>
                          {isAlreadyAllowed && !isSelected && <span className="text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 px-2 py-0.5 rounded">Será removido</span>}
                          {!isAlreadyAllowed && isSelected && <span className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded">Será adicionado</span>}
                          {isAlreadyAllowed && isSelected && <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded">Mantido</span>}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate">{customer.email} • {customer.phone}</div>
                      </div>
                    </label>
                  )
                })
              )}
            </div>

            <div className="text-sm text-gray-500 dark:text-gray-400">
              {selectedCustomers.size} cliente(s) selecionado(s)
              {allowedCustomerIds.size > 0 && <span className="ml-2 text-blue-600 dark:text-blue-400">({allowedCustomerIds.size} já associado(s))</span>}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
              <Button onClick={handleContinue} disabled={selectedCustomers.size === 0} icon={ChevronRight}>Continuar</Button>
            </div>
          </div>
        )}

        {/* Step 2: Mensagem e Canal */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Canal de Envio</label>
              <div className="grid grid-cols-3 gap-2">
                {channels.map(channel => {
                  const Icon = channel.icon
                  const isSelected = selectedChannel === channel.id
                  return (
                    <button
                      key={channel.id}
                      onClick={() => setSelectedChannel(channel.id)}
                      className={`p-3 rounded-lg border text-center transition-all ${
                        isSelected 
                          ? `border-${channel.color}-500 dark:border-${channel.color}-400 bg-${channel.color}-50 dark:bg-${channel.color}-900/20 ring-2 ring-${channel.color}-200 dark:ring-${channel.color}-800` 
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <Icon size={20} className={`mx-auto mb-1 text-${channel.color}-600 dark:text-${channel.color}-400`} />
                      <div className="font-medium text-sm text-gray-900 dark:text-white">{channel.name}</div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Template de Mensagem</label>
              <div className="grid grid-cols-2 gap-2">
                {templates.map(tpl => (
                  <button
                    key={tpl.id}
                    onClick={() => handleTemplateChange(tpl)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      selectedTemplate.id === tpl.id 
                        ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-200 dark:ring-blue-800' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="font-medium text-sm text-gray-900 dark:text-white">{tpl.name}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Mensagem</label>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={5}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg resize-none font-mono text-sm"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Use {'{{nome}}'} para personalizar com o nome do cliente</p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">📱 Pré-visualização:</p>
              <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                {customMessage.replace(/{{nome}}/g, customers.find(c => selectedCustomers.has(c.id))?.name || 'Cliente')}
              </p>
            </div>

            {loadingSend && sendProgress.total > 1 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <div className="text-sm text-blue-700 dark:text-blue-300 mb-1">Registrando comunicações... {sendProgress.current} de {sendProgress.total}</div>
                <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                  <div className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all" style={{ width: `${(sendProgress.current / sendProgress.total) * 100}%` }} />
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button variant="outline" onClick={() => setStep(1)}>Voltar</Button>
              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSendCampaign} loading={loadingSend} icon={Send}>Enviar para {selectedCustomers.size} cliente(s)</Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Painel único WhatsApp */}
      <Modal
        isOpen={showWhatsAppPanel}
        onClose={handleCloseWhatsAppPanel}
        title="📱 Enviar via WhatsApp"
        size="lg"
      >
        <div className="space-y-4">
          {/* Instrução */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-3">
            <p className="text-sm text-blue-800 dark:text-blue-300 font-medium mb-1">Como criar uma Lista de Transmissão:</p>
            <ol className="text-xs text-blue-700 dark:text-blue-400 list-decimal list-inside space-y-1">
              <li>Abra o WhatsApp Web em outra aba</li>
              <li>Crie uma Nova Lista de Transmissão</li>
              <li>Copie cada número abaixo e adicione à lista</li>
              <li>Copie a mensagem e envie para a lista</li>
            </ol>
          </div>

          {/* Lista de clientes com número individual copiável */}
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Clientes ({whatsAppData?.validCustomers?.length || 0})
            </p>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-200 dark:divide-gray-700 max-h-48 overflow-y-auto">
              {whatsAppData?.validCustomers?.map((customer) => (
                <CustomerPhoneRow
                  key={customer.id}
                  customer={customer}
                  customMessage={customMessage}
                />
              ))}
            </div>
          </div>

          {/* Mensagem com botão copiar */}
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">💬 Mensagem da campanha</p>
              <CopyButton text={customMessage.replace(/{{nome}}/g, '[Cliente]')} label="Copiar mensagem" />
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-wrap font-mono bg-white dark:bg-gray-700 p-2 rounded border border-gray-200 dark:border-gray-600">
              {customMessage.replace(/{{nome}}/g, '[Cliente]')}
            </p>
          </div>

          <div className="flex justify-end pt-2 border-t border-gray-200 dark:border-gray-700">
            <Button onClick={handleCloseWhatsAppPanel}>Concluir</Button>
          </div>
        </div>
      </Modal>

      {/* Modais de aviso */}
      <ConfirmModal
        isOpen={showNoSelectionWarning}
        onClose={() => setShowNoSelectionWarning(false)}
        onConfirm={() => setShowNoSelectionWarning(false)}
        title="Nenhum cliente selecionado"
        message="Selecione pelo menos um cliente para continuar."
        confirmText="OK"
        cancelText=""
        variant="warning"
      />

      <ConfirmModal
        isOpen={showNoPhoneWarning}
        onClose={() => setShowNoPhoneWarning(false)}
        onConfirm={() => setShowNoPhoneWarning(false)}
        title="Nenhum telefone cadastrado"
        message="Nenhum cliente selecionado possui telefone cadastrado."
        confirmText="OK"
        cancelText=""
        variant="warning"
      />

      <ConfirmModal
        isOpen={showNoEmailWarning}
        onClose={() => setShowNoEmailWarning(false)}
        onConfirm={() => setShowNoEmailWarning(false)}
        title="Nenhum email cadastrado"
        message="Nenhum cliente selecionado possui email cadastrado."
        confirmText="OK"
        cancelText=""
        variant="warning"
      />
    </>
  )
}

const StepIndicator = ({ number, label, active, completed }) => (
  <>
    <div className="flex items-center">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
        completed ? 'bg-green-500 text-white' : active ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
      }`}>
        {completed ? '✓' : number}
      </div>
      <span className={`ml-2 text-sm ${active ? 'font-medium text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>{label}</span>
    </div>
    {number < 2 && <div className="flex-1 h-0.5 bg-gray-200 dark:bg-gray-700 mx-4" />}
  </>
)

export default CouponCampaignModal