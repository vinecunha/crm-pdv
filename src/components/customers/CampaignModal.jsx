import React, { useState, useEffect } from 'react'
import { supabase } from '@lib/supabase'
import Modal from '@components/ui/Modal'
import Button from '@components/ui/Button'
import { Gift, Tag, MessageSquare, Plus, RefreshCw, Smartphone, Mail, MessageCircle } from '@lib/icons'
import logger from '@utils/logger'
import * as couponService from '@services/coupon/couponService'

const CampaignModal = ({ isOpen, onClose, onSend, customer, loading }) => {
  // Canais disponíveis
  const channels = [
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      icon: Smartphone,
      description: 'Enviar via WhatsApp',
      available: !!customer?.phone,
      color: 'green'
    },
    {
      id: 'email',
      name: 'E-mail',
      icon: Mail,
      description: 'Enviar via E-mail',
      available: !!customer?.email,
      color: 'blue'
    },
    {
      id: 'sms',
      name: 'SMS',
      icon: MessageCircle,
      description: 'Enviar via SMS',
      available: !!customer?.phone,
      color: 'orange'
    }
  ]

  const [templates] = useState([
    {
      id: 'miss_you',
      name: 'Sentimos sua falta',
      content: 'Olá {{nome}}, sentimos sua falta! Volte e ganhe {{desconto}} de desconto na sua próxima compra. Use o cupom **{{cupom}}**!',
      discount: '15%',
      discountValue: 15,
      discountType: 'percent'
    },
    {
      id: 'special_offer',
      name: 'Oferta Especial',
      content: 'Olá {{nome}}, preparamos uma oferta especial para você! {{desconto}} OFF em todos os produtos. Cupom: **{{cupom}}**',
      discount: '20%',
      discountValue: 20,
      discountType: 'percent'
    },
    {
      id: 'vip_benefit',
      name: 'Benefício VIP',
      content: 'Olá {{nome}}, como cliente especial, você tem {{desconto}} de desconto! Use **{{cupom}}** e aproveite!',
      discount: '10%',
      discountValue: 10,
      discountType: 'percent'
    },
    {
      id: 'fixed_discount',
      name: 'Desconto Fixo',
      content: 'Olá {{nome}}, ganhe R$ {{desconto}} de desconto na sua próxima compra! Cupom: **{{cupom}}**',
      discount: '20,00',
      discountValue: 20,
      discountType: 'fixed'
    }
  ])
  
  const [selectedTemplate, setSelectedTemplate] = useState(templates[0])
  const [selectedChannel, setSelectedChannel] = useState('whatsapp')
  const [customMessage, setCustomMessage] = useState('')
  const [coupons, setCoupons] = useState([])
  const [selectedCoupon, setSelectedCoupon] = useState(null)
  const [isCreatingCoupon, setIsCreatingCoupon] = useState(false)
  const [loadingCoupons, setLoadingCoupons] = useState(false)

  useEffect(() => {
    if (isOpen && customer) {
      setSelectedTemplate(templates[0])
      setSelectedCoupon(null)
      const whatsappAvailable = !!customer?.phone
      const emailAvailable = !!customer?.email
      setSelectedChannel(whatsappAvailable ? 'whatsapp' : (emailAvailable ? 'email' : 'sms'))
      fetchCoupons()
    }
  }, [isOpen, customer])

  useEffect(() => {
    if (!customer) return
    
    const couponCode = selectedCoupon?.code || 'CUPOM'
    let discount = selectedTemplate.discount
    
    let msg = selectedTemplate.content
      .replace(/{{nome}}/g, customer.name || 'Cliente')
      .replace(/{{desconto}}/g, discount)
      .replace(/{{cupom}}/g, couponCode)
    
    setCustomMessage(msg)
  }, [selectedTemplate, selectedCoupon, customer])

  const fetchCoupons = async () => {
    setLoadingCoupons(true)
    try {
      const data = await couponService.fetchActiveCoupons()
      setCoupons(data || [])
    } catch (error) {
      logger.error('❌ [CampaignModal] Erro ao buscar cupons', { error: error.message })
    } finally {
      setLoadingCoupons(false)
    }
  }

  const forceRefreshCoupons = async () => {
    setLoadingCoupons(true)
    try {
      await fetchCoupons()
      setTimeout(async () => {
        const data = await couponService.fetchActiveCoupons()
        setCoupons(data || [])
        setLoadingCoupons(false)
      }, 300)
    } catch (error) {
      logger.error('❌ [CampaignModal] Erro ao forçar refresh', { error: error.message })
      setLoadingCoupons(false)
    }
  }

  const createCouponFromTemplate = async () => {
    setIsCreatingCoupon(true)
    
    try {
      const timestamp = Date.now().toString().slice(-4)
      const couponCode = `${selectedTemplate.id.toUpperCase()}_${timestamp}`
      
      logger.log('🆕 [CampaignModal] Criando novo cupom', { code: couponCode })
      
      const { data: newCoupon, error } = await supabase
        .from('coupons')
        .insert({
          code: couponCode,
          name: `Campanha: ${selectedTemplate.name}`,
          description: `Cupom gerado automaticamente para campanha`,
          discount_type: selectedTemplate.discountType,
          discount_value: selectedTemplate.discountValue,
          max_discount: selectedTemplate.discountType === 'percent' ? 100 : null,
          min_purchase: 0,
          is_global: false,
          is_active: true,
          usage_limit: 1,
          valid_from: new Date().toISOString(),
          valid_to: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single()
      
      if (error) throw error
      
      logger.log('✅ [CampaignModal] Cupom criado', { id: newCoupon.id, code: newCoupon.code })
      
      await supabase
        .from('coupon_allowed_customers')
        .upsert({
          coupon_id: newCoupon.id,
          customer_id: customer.id
        }, { onConflict: 'coupon_id,customer_id' })
      
      await forceRefreshCoupons()
      setSelectedCoupon(newCoupon)
      
      return newCoupon
    } catch (error) {
      logger.error('❌ [CampaignModal] Erro ao criar cupom:', error)
      alert('Erro ao criar cupom: ' + error.message)
      return null
    } finally {
      setIsCreatingCoupon(false)
    }
  }

  const handleSend = async () => {
    let finalCoupon = selectedCoupon
    
    if (!finalCoupon) {
      finalCoupon = await createCouponFromTemplate()
      if (!finalCoupon) return
    } else {
      if (!finalCoupon.is_global) {
        await supabase
          .from('coupon_allowed_customers')
          .upsert({
            coupon_id: finalCoupon.id,
            customer_id: customer.id
          }, { onConflict: 'coupon_id,customer_id' })
      }
    }
    
    onSend(customMessage, finalCoupon.code, selectedChannel)
  }

  if (!customer) return null

  const previewChannelName = channels.find(c => c.id === selectedChannel)?.name || 'WhatsApp'

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`📧 Campanha para ${customer.name}`}
      size="lg"
    >
      <div className="space-y-5">
        {/* Seleção de Canal */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            Canal de Envio
          </label>
          <div className="grid grid-cols-3 gap-2">
            {channels.map(channel => {
              const Icon = channel.icon
              const isSelected = selectedChannel === channel.id
              
              return (
                <button
                  key={channel.id}
                  onClick={() => channel.available && setSelectedChannel(channel.id)}
                  disabled={!channel.available}
                  className={`
                    p-3 rounded-lg border text-center transition-all
                    ${channel.available ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-900'}
                    ${isSelected 
                      ? `border-${channel.color}-500 dark:border-${channel.color}-400 bg-${channel.color}-50 dark:bg-${channel.color}-900/20 ring-2 ring-${channel.color}-200 dark:ring-${channel.color}-800` 
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }
                  `}
                >
                  <Icon size={20} className={`mx-auto mb-1 ${channel.available ? `text-${channel.color}-600 dark:text-${channel.color}-400` : 'text-gray-400 dark:text-gray-500'}`} />
                  <div className="font-medium text-sm text-gray-900 dark:text-white">{channel.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{channel.description}</div>
                  {!channel.available && (
                    <div className="text-xs text-red-500 dark:text-red-400 mt-1">
                      {channel.id === 'whatsapp' || channel.id === 'sms' ? 'Sem telefone' : 'Sem email'}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Templates */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            Template de Mensagem
          </label>
          <div className="grid grid-cols-2 gap-2">
            {templates.map(tpl => (
              <button
                key={tpl.id}
                onClick={() => setSelectedTemplate(tpl)}
                className={`
                  p-3 rounded-lg border text-left transition-all
                  ${selectedTemplate.id === tpl.id 
                    ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-200 dark:ring-blue-800' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }
                `}
              >
                <div className="font-medium text-sm text-gray-900 dark:text-white">{tpl.name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{tpl.discount}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Cupom */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            <Tag size={14} className="inline mr-1" />
            Cupom de Desconto
          </label>
          
          <div className="flex gap-2">
            <select
              value={selectedCoupon?.id || ''}
              onChange={(e) => {
                const couponId = e.target.value
                if (!couponId) {
                  setSelectedCoupon(null)
                  return
                }
                const coupon = coupons.find(c => c.id === couponId)
                setSelectedCoupon(coupon || null)
                logger.log('📌 [CampaignModal] Cupom selecionado:', coupon?.code)
              }}
              className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg disabled:bg-gray-100 dark:disabled:bg-gray-800"
              disabled={loadingCoupons || isCreatingCoupon}
            >
              <option value="">+ Criar novo cupom automaticamente</option>
              {coupons.map(c => (
                <option key={c.id} value={c.id}>
                  {c.code} - {c.discount_type === 'percent' ? `${c.discount_value}%` : `R$ ${c.discount_value}`}
                  {c.is_global ? ' (Global)' : ' (Restrito)'}
                </option>
              ))}
            </select>
            
            <button
              onClick={forceRefreshCoupons}
              className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Atualizar lista"
              disabled={loadingCoupons}
            >
              <RefreshCw size={16} className={loadingCoupons ? 'animate-spin' : ''} />
            </button>
          </div>
          
          {!selectedCoupon && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
              <Plus size={12} />
              Um novo cupom será criado automaticamente e associado a este cliente
            </p>
          )}
          
          {selectedCoupon && !selectedCoupon.is_global && (
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              ✅ Este cupom será associado ao cliente (restrito)
            </p>
          )}
          
          {selectedCoupon && selectedCoupon.is_global && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              🌐 Cupom global - qualquer cliente pode usar
            </p>
          )}
        </div>

        {/* Mensagem */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            <MessageSquare size={14} className="inline mr-1" />
            Mensagem
          </label>
          <textarea
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            rows={5}
            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg resize-none font-mono text-sm placeholder-gray-400 dark:placeholder-gray-500"
            placeholder="Digite a mensagem..."
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Use {'{{nome}}'}, {'{{desconto}}'}, {'{{cupom}}'}
          </p>
        </div>

        {/* Preview */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
          <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-2">
            📱 Pré-visualização ({previewChannelName}):
          </p>
          <div className="bg-white dark:bg-gray-900 p-3 rounded-lg shadow-sm">
            <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{customMessage}</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button variant="outline" onClick={onClose} disabled={loading || isCreatingCoupon}>
          Cancelar
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSend} 
          loading={loading || isCreatingCoupon}
          icon={Gift}
        >
          {isCreatingCoupon ? 'Criando cupom...' : 'Enviar Campanha'}
        </Button>
      </div>
    </Modal>
  )
}

export default CampaignModal
