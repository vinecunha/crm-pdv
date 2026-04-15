import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { Gift, Search, CheckSquare, Square, Users, Send, ChevronRight, Smartphone, Mail, MessageCircle } from '../../lib/icons'
import logger from '../../utils/logger'
import * as couponService from '../../services/couponService'

const CouponCampaignModal = ({ isOpen, onClose, coupon, onSuccess }) => {
  // Estados
  const [step, setStep] = useState(1) // 1: Selecionar clientes, 2: Escolher canal/mensagem
  const [customers, setCustomers] = useState([])
  const [selectedCustomers, setSelectedCustomers] = useState(new Set())
  const [allowedCustomerIds, setAllowedCustomerIds] = useState(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const [loadingSend, setLoadingSend] = useState(false)
  
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

  // Canais disponíveis
  const channels = [
    { id: 'whatsapp', name: 'WhatsApp', icon: Smartphone, color: 'green' },
    { id: 'email', name: 'E-mail', icon: Mail, color: 'blue' },
    { id: 'sms', name: 'SMS', icon: MessageCircle, color: 'orange' }
  ]

  // ✅ Carregar clientes e associações quando o modal abre
  useEffect(() => {
    if (isOpen && coupon) {
      loadCustomersAndAssociations()
      setStep(1)
      setSelectedCustomers(new Set())
      updateMessageTemplate(templates[0])
    }
  }, [isOpen, coupon])

  // ✅ Atualizar mensagem quando template mudar
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

  // ✅ Carregar clientes e quais já estão associados ao cupom
  const loadCustomersAndAssociations = async () => {
    setLoadingCustomers(true)
    try {
      // 1. Buscar todos os clientes ativos
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .eq('status', 'active')
        .order('name')
      
      if (customersError) throw customersError
      
      // 2. Buscar associações existentes para este cupom
      const { data: allowedData, error: allowedError } = await supabase
        .from('coupon_allowed_customers')
        .select('customer_id')
        .eq('coupon_id', coupon.id)
      
      if (allowedError) throw allowedError
      
      const allowedIds = new Set(allowedData?.map(a => a.customer_id) || [])
      
      setCustomers(customersData || [])
      setAllowedCustomerIds(allowedIds)
      setSelectedCustomers(new Set(allowedIds)) // ✅ Pré-selecionar os já associados
      
      logger.log('✅ [CouponCampaign] Clientes carregados', { 
        total: customersData?.length, 
        associados: allowedIds.size 
      })
    } catch (error) {
      logger.error('❌ [CouponCampaign] Erro ao carregar clientes', { error: error.message })
    } finally {
      setLoadingCustomers(false)
    }
  }

  // ✅ Filtrar clientes por busca
  const filteredCustomers = useMemo(() => {
    if (!searchTerm.trim()) return customers
    
    const term = searchTerm.toLowerCase()
    return customers.filter(c => 
      c.name?.toLowerCase().includes(term) || 
      c.email?.toLowerCase().includes(term) || 
      c.phone?.includes(term)
    )
  }, [customers, searchTerm])

  // ✅ Handlers de seleção
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

  // ✅ Avançar para o passo 2
  const handleContinue = () => {
    if (selectedCustomers.size === 0) {
      alert('Selecione pelo menos um cliente')
      return
    }
    setStep(2)
  }

  // ✅ Enviar campanha
  const handleSendCampaign = async () => {
    setLoadingSend(true)
    
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
      
      // 1. Atualizar associações no banco
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
      
      // 2. Enviar comunicações
      for (const customer of selectedCustomersList) {
        const personalizedMsg = customMessage.replace(/{{nome}}/g, customer.name || 'Cliente')
        
        // Registrar comunicação
        await supabase.from('customer_communications').insert({
          customer_id: customer.id,
          channel: selectedChannel,
          subject: `Campanha: ${coupon.code}`,
          content: personalizedMsg,
          status: 'sent',
          sent_by: (await supabase.auth.getUser()).data.user?.id
        })
        
        // Abrir link se for WhatsApp
        if (selectedChannel === 'whatsapp' && customer.phone) {
          const phone = customer.phone.replace(/\D/g, '')
          window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(personalizedMsg)}`, '_blank')
        }
        
        // Pequeno delay entre envios
        await new Promise(resolve => setTimeout(resolve, 300))
      }
      
      logger.log('✅ [CouponCampaign] Campanha enviada com sucesso')
      onSuccess?.({
        successCount: selectedCustomersList.length,
        newlyAdded: newlyAdded.length,
        removed: removed.length
      })
      onClose()
      
    } catch (error) {
      logger.error('❌ [CouponCampaign] Erro ao enviar campanha', { error: error.message })
      alert('Erro ao enviar campanha: ' + error.message)
    } finally {
      setLoadingSend(false)
    }
  }

  if (!coupon) return null

  const allFilteredSelected = filteredCustomers.length > 0 && 
    filteredCustomers.every(c => selectedCustomers.has(c.id))

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`📢 Campanha: ${coupon.code}`}
      size="xl"
    >
      {/* Steps */}
      <div className="flex items-center mb-6">
        <StepIndicator number={1} label="Selecionar Clientes" active={step === 1} completed={step > 1} />
        <StepIndicator number={2} label="Mensagem e Canal" active={step === 2} completed={step > 2} />
      </div>

      {/* Step 1: Selecionar Clientes */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="bg-blue-50 rounded-lg p-3 flex items-center gap-3">
            <Gift size={20} className="text-blue-600" />
            <div>
              <p className="font-medium text-blue-900">{coupon.name}</p>
              <p className="text-sm text-blue-700">
                {coupon.discount_type === 'percent' ? `${coupon.discount_value}%` : `R$ ${coupon.discount_value}`} • 
                {coupon.is_global ? ' Global' : ' Restrito'}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Buscar cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <button
              onClick={handleSelectAll}
              className="text-sm text-blue-600 hover:underline ml-4"
            >
              {allFilteredSelected ? 'Desmarcar todos' : 'Selecionar todos'}
            </button>
          </div>

          <div className="border rounded-lg max-h-80 overflow-y-auto">
            {loadingCustomers ? (
              <div className="p-8 text-center text-gray-500">Carregando clientes...</div>
            ) : filteredCustomers.length === 0 ? (
              <div className="p-8 text-center text-gray-500">Nenhum cliente encontrado</div>
            ) : (
              filteredCustomers.map(customer => {
                const isSelected = selectedCustomers.has(customer.id)
                const isAlreadyAllowed = allowedCustomerIds.has(customer.id)
                
                return (
                  <label
                    key={customer.id}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                  >
                    <button
                      onClick={(e) => { e.preventDefault(); handleToggleCustomer(customer.id) }}
                      className="flex-shrink-0"
                    >
                      {isSelected ? (
                        <CheckSquare size={20} className="text-blue-600" />
                      ) : (
                        <Square size={20} className="text-gray-400" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{customer.name}</span>
                        {isAlreadyAllowed && !isSelected && (
                          <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                            Será removido
                          </span>
                        )}
                        {!isAlreadyAllowed && isSelected && (
                          <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
                            Será adicionado
                          </span>
                        )}
                        {isAlreadyAllowed && isSelected && (
                          <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                            Mantido
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 truncate">
                        {customer.email} • {customer.phone}
                      </div>
                    </div>
                  </label>
                )
              })
            )}
          </div>

          <div className="text-sm text-gray-500">
            {selectedCustomers.size} cliente(s) selecionado(s)
            {allowedCustomerIds.size > 0 && (
              <span className="ml-2 text-blue-600">
                ({allowedCustomerIds.size} já associado(s))
              </span>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button 
              onClick={handleContinue} 
              disabled={selectedCustomers.size === 0}
              icon={ChevronRight}
            >
              Continuar
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Mensagem e Canal */}
      {step === 2 && (
        <div className="space-y-5">
          {/* Canal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Canal de Envio
            </label>
            <div className="grid grid-cols-3 gap-2">
              {channels.map(channel => {
                const Icon = channel.icon
                const isSelected = selectedChannel === channel.id
                
                return (
                  <button
                    key={channel.id}
                    onClick={() => setSelectedChannel(channel.id)}
                    className={`
                      p-3 rounded-lg border text-center transition-all
                      ${isSelected 
                        ? `border-${channel.color}-500 bg-${channel.color}-50 ring-2 ring-${channel.color}-200` 
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <Icon size={20} className={`mx-auto mb-1 text-${channel.color}-600`} />
                    <div className="font-medium text-sm">{channel.name}</div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Templates */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Template de Mensagem
            </label>
            <div className="grid grid-cols-2 gap-2">
              {templates.map(tpl => (
                <button
                  key={tpl.id}
                  onClick={() => handleTemplateChange(tpl)}
                  className={`
                    p-3 rounded-lg border text-left transition-all
                    ${selectedTemplate.id === tpl.id 
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="font-medium text-sm">{tpl.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Mensagem */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mensagem
            </label>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Use {'{{nome}}'} para personalizar com o nome do cliente
            </p>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 p-4 rounded-lg border">
            <p className="text-xs font-medium text-gray-700 mb-2">
              📱 Pré-visualização:
            </p>
            <p className="text-sm whitespace-pre-wrap">
              {customMessage.replace(/{{nome}}/g, customers.find(c => selectedCustomers.has(c.id))?.name || 'Cliente')}
            </p>
          </div>

          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={() => setStep(1)}>Voltar</Button>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
              <Button 
                onClick={handleSendCampaign} 
                loading={loadingSend}
                icon={Send}
              >
                Enviar para {selectedCustomers.size} cliente(s)
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}

// Componente auxiliar para Steps
const StepIndicator = ({ number, label, active, completed }) => (
  <>
    <div className="flex items-center">
      <div className={`
        w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
        ${completed ? 'bg-green-500 text-white' : active ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'}
      `}>
        {completed ? '✓' : number}
      </div>
      <span className={`ml-2 text-sm ${active ? 'font-medium text-gray-900' : 'text-gray-500'}`}>
        {label}
      </span>
    </div>
    {number < 2 && <div className="flex-1 h-0.5 bg-gray-200 mx-4" />}
  </>
)

export default CouponCampaignModal