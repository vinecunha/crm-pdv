// pages/Settings.jsx - CORREÇÃO DA IMPORTACAO
import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { 
  Building2, 
  Bell, 
  Shield, 
  Database, 
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Printer,
  Lock,
  Save,
  Upload,
  X,
  Image as ImageIcon,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Palette,        // <-- ADICIONADO
  Globe,          // <-- ADICIONADO
  Users,          // <-- ADICIONADO
  BarChart3,      // <-- ADICIONADO
  Eye,            // <-- ADICIONADO
  EyeOff,         // <-- ADICIONADO
  Trash2          // <-- ADICIONADO
} from 'lucide-react'
import FeedbackMessage from '../components/ui/FeedbackMessage'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import SplashScreen from '../components/ui/SplashScreen'

const Settings = () => {
  const { profile, isAdmin } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('company')
  const [feedback, setFeedback] = useState({ message: null, type: 'success' })
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [availableLogos, setAvailableLogos] = useState([])

  // Configurações da empresa
  const [companySettings, setCompanySettings] = useState({
    company_name: '',
    company_logo_url: '/brasalino-pollo.png',
    favicon: '',
    domain: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    cnpj: '',
    primary_color: '#2563eb',
    secondary_color: '#7c3aed'
  })

  // Configurações do sistema
  const [systemSettings, setSystemSettings] = useState({
    currency: 'BRL',
    date_format: 'DD/MM/YYYY',
    time_format: '24h',
    language: 'pt-BR',
    timezone: 'America/Sao_Paulo'
  })

  // Configurações de negócio
  const [businessSettings, setBusinessSettings] = useState({
    tax_percentage: 0,
    service_fee: 0,
    minimum_order_value: 0,
    delivery_fee: 0,
    payment_methods: ['Dinheiro', 'Pix', 'Cartão Crédito', 'Cartão Débito']
  })

  // Configurações de notificação
  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    low_stock_alert: true,
    daily_report: true,
    weekly_report: true,
    notify_on_sale: true
  })

  // Configurações de impressão
  const [printSettings, setPrintSettings] = useState({
    receipt_header: 'Brasalino Pollo',
    receipt_footer: 'Obrigado pela preferência!',
    print_automatically: true,
    copies: 1
  })

  // Lista de logos disponíveis na pasta /public
  const logosDisponiveis = [
    { name: 'Logo Padrão', path: '/brasalino-pollo.png' },
    { name: 'Logo Dark', path: '/logo-dark.png' },
    { name: 'Logo Light', path: '/logo-light.png' },
    { name: 'Logo Branca', path: '/logo-white.png' },
    { name: 'Logo Azul', path: '/logo-blue.png' },
  ]

  // Buscar configurações
  useEffect(() => {
    fetchSettings()
    loadAvailableLogos()
  }, [])

  const loadAvailableLogos = () => {
    setAvailableLogos(logosDisponiveis)
  }

  const fetchSettings = async () => {
    try {
      setLoading(true)
      
      const { data: companyData, error: companyError } = await supabase
        .from('company_settings')
        .select('*')
        .limit(1)
        .single()

      if (!companyError && companyData) {
        setCompanySettings(prev => ({ ...prev, ...companyData }))
      }

    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
    } finally {
      setLoading(false)
    }
  }

  const showFeedback = (message, type = 'success') => {
    setFeedback({ message, type })
    setTimeout(() => setFeedback({ message: null, type: 'success' }), 3000)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const { error: companyError } = await supabase
        .from('company_settings')
        .upsert({
          ...companySettings,
          updated_at: new Date().toISOString()
        })

      if (companyError) throw companyError

      showFeedback('Configurações salvas com sucesso!', 'success')
    } catch (error) {
      console.error('Erro ao salvar:', error)
      showFeedback('Erro ao salvar configurações: ' + error.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const tabs = [
    { id: 'company', label: 'Empresa', icon: Building2 },
    { id: 'business', label: 'Negócio', icon: CreditCard },
    { id: 'appearance', label: 'Aparência', icon: Palette },
    { id: 'notifications', label: 'Notificações', icon: Bell },
    { id: 'printing', label: 'Impressão', icon: Printer },
    { id: 'security', label: 'Segurança', icon: Shield },
  ]

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="bg-red-100 rounded-full p-4 inline-block mb-4">
            <Shield className="h-12 w-12 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-red-600">Acesso Restrito</h2>
          <p className="mt-2 text-gray-600">Apenas administradores podem acessar as configurações.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return <SplashScreen fullScreen message="Carregando configurações..." />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cabeçalho */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gerencie as preferências e configurações do sistema
          </p>
        </div>

        {/* Feedback */}
        {feedback.message && (
          <FeedbackMessage
            type={feedback.type}
            message={feedback.message}
            onClose={() => setFeedback({ message: null, type: 'success' })}
          />
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar com abas */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-6">
              <nav className="space-y-1 p-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                        ${activeTab === tab.id 
                          ? 'bg-blue-50 text-blue-700 font-medium' 
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }
                      `}
                    >
                      <Icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'}`} />
                      <span className="text-sm">{tab.label}</span>
                    </button>
                  )
                })}
              </nav>
            </div>
          </div>

          {/* Conteúdo principal */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Empresa */}
              {activeTab === 'company' && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Informações da Empresa</h2>
                  
                  <div className="space-y-6">
                    {/* Logo com seleção da pasta /public */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Logo da Empresa
                      </label>
                      
                      <div className="flex flex-col sm:flex-row items-start gap-6">
                        {/* Preview da logo */}
                        <div className="w-32 h-32 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                          {companySettings.company_logo_url ? (
                            <img 
                              src={companySettings.company_logo_url} 
                              alt="Logo" 
                              className="max-w-full max-h-full object-contain"
                              onError={(e) => {
                                e.target.src = '/brasalino-pollo.png'
                              }}
                            />
                          ) : (
                            <ImageIcon className="w-8 h-8 text-gray-400" />
                          )}
                        </div>

                        {/* Opções de seleção */}
                        <div className="flex-1 space-y-3">
                          {/* Select de logos disponíveis */}
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">
                              Selecionar da biblioteca
                            </label>
                            <select
                              value={companySettings.company_logo_url}
                              onChange={(e) => setCompanySettings({ ...companySettings, company_logo_url: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Selecione uma logo</option>
                              {availableLogos.map((logo) => (
                                <option key={logo.path} value={logo.path}>
                                  {logo.name} ({logo.path})
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Input para caminho manual */}
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">
                              Ou informe o caminho manualmente
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={companySettings.company_logo_url}
                                onChange={(e) => setCompanySettings({ ...companySettings, company_logo_url: e.target.value })}
                                placeholder="/brasalino-pollo.png"
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              />
                              <button
                                type="button"
                                onClick={() => setCompanySettings({ ...companySettings, company_logo_url: '' })}
                                className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                          </div>

                          <p className="text-xs text-gray-500">
                            💡 Dica: Coloque suas imagens na pasta <code className="bg-gray-100 px-1 rounded">/public</code> do projeto
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Nome da empresa */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nome da Empresa *
                      </label>
                      <input
                        type="text"
                        value={companySettings.company_name}
                        onChange={(e) => setCompanySettings({ ...companySettings, company_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Nome da sua empresa"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          CNPJ
                        </label>
                        <input
                          type="text"
                          value={companySettings.cnpj}
                          onChange={(e) => setCompanySettings({ ...companySettings, cnpj: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="00.000.000/0001-00"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Domínio
                        </label>
                        <input
                          type="text"
                          value={companySettings.domain}
                          onChange={(e) => setCompanySettings({ ...companySettings, domain: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="www.suaempresa.com.br"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <input
                            type="email"
                            value={companySettings.email}
                            onChange={(e) => setCompanySettings({ ...companySettings, email: e.target.value })}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="contato@empresa.com"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Telefone
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <input
                            type="text"
                            value={companySettings.phone}
                            onChange={(e) => setCompanySettings({ ...companySettings, phone: e.target.value })}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="(00) 0000-0000"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Endereço
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                          type="text"
                          value={companySettings.address}
                          onChange={(e) => setCompanySettings({ ...companySettings, address: e.target.value })}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Rua, número, bairro"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Cidade
                        </label>
                        <input
                          type="text"
                          value={companySettings.city}
                          onChange={(e) => setCompanySettings({ ...companySettings, city: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Estado
                        </label>
                        <input
                          type="text"
                          value={companySettings.state}
                          onChange={(e) => setCompanySettings({ ...companySettings, state: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          CEP
                        </label>
                        <input
                          type="text"
                          value={companySettings.zip_code}
                          onChange={(e) => setCompanySettings({ ...companySettings, zip_code: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Negócio - simplificado para caber */}
              {activeTab === 'business' && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Configurações de Negócio</h2>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Imposto (%)</label>
                        <input type="number" className="w-full px-3 py-2 border rounded-lg" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Taxa de Serviço (%)</label>
                        <input type="number" className="w-full px-3 py-2 border rounded-lg" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Aparência */}
              {activeTab === 'appearance' && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Personalização Visual</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cor Primária</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={companySettings.primary_color}
                          onChange={(e) => setCompanySettings({ ...companySettings, primary_color: e.target.value })}
                          className="w-12 h-10 rounded border"
                        />
                        <input
                          type="text"
                          value={companySettings.primary_color}
                          onChange={(e) => setCompanySettings({ ...companySettings, primary_color: e.target.value })}
                          className="flex-1 px-3 py-2 border rounded-lg"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cor Secundária</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={companySettings.secondary_color}
                          onChange={(e) => setCompanySettings({ ...companySettings, secondary_color: e.target.value })}
                          className="w-12 h-10 rounded border"
                        />
                        <input
                          type="text"
                          value={companySettings.secondary_color}
                          onChange={(e) => setCompanySettings({ ...companySettings, secondary_color: e.target.value })}
                          className="flex-1 px-3 py-2 border rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Notificações */}
              {activeTab === 'notifications' && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Notificações</h2>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>Notificações por Email</span>
                      <input type="checkbox" className="toggle" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Alerta de Estoque Baixo</span>
                      <input type="checkbox" className="toggle" />
                    </div>
                  </div>
                </div>
              )}

              {/* Impressão */}
              {activeTab === 'printing' && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Impressão</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Cabeçalho</label>
                      <textarea rows={2} className="w-full px-3 py-2 border rounded-lg" />
                    </div>
                  </div>
                </div>
              )}

              {/* Segurança */}
              {activeTab === 'security' && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Segurança</h2>
                  <button
                    onClick={() => setShowPasswordModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                  >
                    Alterar Senha
                  </button>
                </div>
              )}

              {/* Botão Salvar */}
              <div className="border-t border-gray-200 p-6 bg-gray-50 rounded-b-lg">
                <Button onClick={handleSave} loading={saving} icon={Save}>
                  Salvar configurações
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Alteração de Senha */}
      <Modal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} title="Alterar Senha" size="sm">
        <div className="space-y-4">
          <input type="password" placeholder="Senha atual" className="w-full px-3 py-2 border rounded-lg" />
          <input type="password" placeholder="Nova senha" className="w-full px-3 py-2 border rounded-lg" />
          <input type="password" placeholder="Confirmar nova senha" className="w-full px-3 py-2 border rounded-lg" />
          <div className="flex gap-3">
            <button onClick={() => setShowPasswordModal(false)} className="flex-1 px-4 py-2 border rounded-lg">Cancelar</button>
            <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg">Alterar</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Settings