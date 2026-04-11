// pages/Settings.jsx - COM ABA DE PERMISSÕES
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
  Palette,
  Globe,
  Users,
  BarChart3,
  Eye,
  EyeOff,
  Trash2,
  Key,
  UserCheck,
  RotateCcw
} from 'lucide-react'
import FeedbackMessage from '../components/ui/FeedbackMessage'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import SplashScreen from '../components/ui/SplashScreen'

// Componente de Permissões (integrado)
const RolePermissionsTab = () => {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [permissions, setPermissions] = useState([])
  const [rolePermissions, setRolePermissions] = useState({})
  const [selectedRole, setSelectedRole] = useState('admin')
  const [feedback, setFeedback] = useState({ show: false, type: 'success', message: '' })
  const [hasChanges, setHasChanges] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)

  const roleColors = {
    admin: 'from-purple-600 to-purple-700',
    gerente: 'from-blue-500 to-cyan-500',
    operador: 'from-gray-500 to-gray-600'
  }

  const roleNames = {
    admin: 'Administrador',
    gerente: 'Gerente',
    operador: 'Operador'
  }

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const { data: perms, error: permsError } = await supabase
        .from('permissions')
        .select('*')
        .order('module', { ascending: true })
        .order('name', { ascending: true })

      if (permsError) throw permsError

      const grouped = {}
      perms?.forEach(p => {
        const module = p.module || 'outros'
        if (!grouped[module]) grouped[module] = []
        grouped[module].push(p)
      })
      setPermissions(grouped)

      const { data: rolePerms, error: roleError } = await supabase
        .from('role_permissions')
        .select('role_name, permission_id')

      if (roleError) throw roleError

      const roleMap = { admin: new Set(), gerente: new Set(), operador: new Set() }
      rolePerms?.forEach(rp => {
        if (roleMap[rp.role_name]) {
          roleMap[rp.role_name].add(rp.permission_id)
        }
      })
      
      setRolePermissions({
        admin: setToObject(roleMap.admin),
        gerente: setToObject(roleMap.gerente),
        operador: setToObject(roleMap.operador)
      })

    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      showFeedback('error', 'Erro ao carregar permissões')
    } finally {
      setLoading(false)
    }
  }

  const setToObject = (set) => {
    const obj = {}
    set.forEach(id => obj[id] = true)
    return obj
  }

  const showFeedback = (type, message) => {
    setFeedback({ show: true, type, message })
    setTimeout(() => setFeedback({ show: false, type: 'success', message: '' }), 3000)
  }

  const handleTogglePermission = (permissionId) => {
    if (selectedRole === 'admin') {
      showFeedback('warning', 'Administrador sempre tem todas as permissões')
      return
    }

    setRolePermissions(prev => {
      const currentPerms = { ...prev[selectedRole] }
      if (currentPerms[permissionId]) {
        delete currentPerms[permissionId]
      } else {
        currentPerms[permissionId] = true
      }
      return { ...prev, [selectedRole]: currentPerms }
    })
    setHasChanges(true)
  }

  const handleToggleAllModule = (modulePermissions) => {
    if (selectedRole === 'admin') {
      showFeedback('warning', 'Administrador sempre tem todas as permissões')
      return
    }

    const allGranted = modulePermissions.every(p => rolePermissions[selectedRole]?.[p.id])
    
    setRolePermissions(prev => {
      const newPerms = { ...prev[selectedRole] }
      modulePermissions.forEach(p => {
        if (allGranted) {
          delete newPerms[p.id]
        } else {
          newPerms[p.id] = true
        }
      })
      return { ...prev, [selectedRole]: newPerms }
    })
    setHasChanges(true)
  }

  const handleSave = async () => {
    if (selectedRole === 'admin') {
      showFeedback('warning', 'Permissões do admin não podem ser alteradas')
      return
    }

    setSaving(true)
    try {
      const currentPerms = rolePermissions[selectedRole] || {}
      
      await supabase.from('role_permissions').delete().eq('role_name', selectedRole)

      const insertData = Object.keys(currentPerms).map(permId => ({
        role_name: selectedRole,
        permission_id: parseInt(permId)
      }))

      if (insertData.length > 0) {
        const { error: insertError } = await supabase
          .from('role_permissions')
          .insert(insertData)
        if (insertError) throw insertError
      }

      showFeedback('success', `Permissões do ${roleNames[selectedRole]} salvas!`)
      setHasChanges(false)
      await loadData()

    } catch (error) {
      console.error('Erro ao salvar:', error)
      showFeedback('error', 'Erro ao salvar permissões')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    setShowResetModal(false)
    setSaving(true)
    
    try {
      await supabase.from('role_permissions').delete().eq('role_name', selectedRole)

      const defaultPerms = getDefaultPermissions(selectedRole)
      const insertData = defaultPerms.map(permName => {
        const perm = Object.values(permissions).flat().find(p => p.name === permName)
        return perm ? { role_name: selectedRole, permission_id: perm.id } : null
      }).filter(Boolean)

      if (insertData.length > 0) {
        await supabase.from('role_permissions').insert(insertData)
      }

      showFeedback('success', `Permissões do ${roleNames[selectedRole]} restauradas!`)
      await loadData()
      setHasChanges(false)

    } catch (error) {
      console.error('Erro ao resetar:', error)
      showFeedback('error', 'Erro ao restaurar permissões')
    } finally {
      setSaving(false)
    }
  }

  const getDefaultPermissions = (role) => {
    const defaults = {
      admin: Object.values(permissions).flat().map(p => p.name),
      gerente: [
        'canViewDashboard', 'canViewSales', 'canCreateSales', 'canCancelSales', 
        'canViewSalesList', 'canApplyDiscount', 'canViewProducts', 'canCreateProducts', 
        'canEditProducts', 'canManageStock', 'canViewCustomers', 'canCreateCustomers', 
        'canEditCustomers', 'canCommunicateWithCustomers', 'canViewCoupons', 
        'canCreateCoupons', 'canEditCoupons', 'canViewCashier', 'canCloseCashier',
        'canViewReports', 'canExportReports'
      ],
      operador: [
        'canViewDashboard', 'canViewSales', 'canCreateSales',
        'canViewProducts', 'canViewCustomers', 'canCreateCustomers'
      ]
    }
    return defaults[role] || []
  }

  const getModuleStats = (modulePermissions) => {
    const granted = modulePermissions.filter(p => rolePermissions[selectedRole]?.[p.id]).length
    const total = modulePermissions.length
    return { granted, total, allGranted: granted === total, someGranted: granted > 0 && granted < total }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Feedback */}
      {feedback.show && (
        <FeedbackMessage
          type={feedback.type}
          message={feedback.message}
          onClose={() => setFeedback({ show: false })}
        />
      )}

      {/* Seletor de Role */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Selecione a função para gerenciar permissões
        </label>
        <div className="flex gap-2">
          {['admin', 'gerente', 'operador'].map(role => (
            <button
              key={role}
              onClick={() => {
                setSelectedRole(role)
                setHasChanges(false)
              }}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
                ${selectedRole === role 
                  ? `bg-gradient-to-r ${roleColors[role]} text-white shadow-md` 
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }
              `}
            >
              {role === 'admin' && <Lock size={16} />}
              {role === 'gerente' && <Key size={16} />}
              {role === 'operador' && <UserCheck size={16} />}
              {roleNames[role]}
            </button>
          ))}
        </div>
        
        {selectedRole === 'admin' && (
          <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <p className="text-sm text-purple-800">
              <strong>Administrador</strong> possui automaticamente todas as permissões do sistema.
            </p>
          </div>
        )}
      </div>

      {/* Permissões por Módulo */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
        {Object.entries(permissions).map(([module, modulePermissions]) => {
          const stats = getModuleStats(modulePermissions)
          
          return (
            <div key={module} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h4 className="font-medium text-gray-900 capitalize">
                      {module === 'dashboard' ? 'Dashboard' :
                       module === 'sales' ? 'Vendas' :
                       module === 'products' ? 'Produtos' :
                       module === 'customers' ? 'Clientes' :
                       module === 'cashier' ? 'Caixa' :
                       module === 'coupons' ? 'Cupons' :
                       module === 'reports' ? 'Relatórios' :
                       module === 'users' ? 'Usuários' :
                       module === 'system' ? 'Sistema' : module}
                    </h4>
                    <span className="text-xs text-gray-500">
                      {stats.granted}/{stats.total}
                    </span>
                  </div>
                  
                  {selectedRole !== 'admin' && (
                    <button
                      onClick={() => handleToggleAllModule(modulePermissions)}
                      className="text-xs text-blue-600 hover:text-blue-700"
                    >
                      {stats.allGranted ? 'Desmarcar todos' : 'Marcar todos'}
                    </button>
                  )}
                </div>
                
                {selectedRole !== 'admin' && (
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
                    <div 
                      className={`h-1 rounded-full transition-all ${
                        stats.allGranted ? 'bg-green-500' : 
                        stats.someGranted ? 'bg-yellow-500' : 'bg-gray-300'
                      }`}
                      style={{ width: `${(stats.granted / stats.total) * 100}%` }}
                    />
                  </div>
                )}
              </div>
              
              <div className="divide-y divide-gray-100">
                {modulePermissions.map(permission => {
                  const granted = selectedRole === 'admin' 
                    ? true 
                    : rolePermissions[selectedRole]?.[permission.id] || false
                  
                  return (
                    <div
                      key={permission.id}
                      className={`
                        px-4 py-2 flex items-center justify-between
                        ${selectedRole !== 'admin' ? 'cursor-pointer hover:bg-gray-50' : ''}
                      `}
                      onClick={() => selectedRole !== 'admin' && handleTogglePermission(permission.id)}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`
                          w-4 h-4 rounded border flex items-center justify-center
                          ${granted 
                            ? 'bg-green-500 border-green-500 text-white' 
                            : 'border-gray-300'
                          }
                        `}>
                          {granted && <CheckCircle size={10} />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{permission.name}</p>
                          <p className="text-xs text-gray-500">{permission.description}</p>
                        </div>
                      </div>
                      
                      <span className={`text-xs ${granted ? 'text-green-600' : 'text-red-500'}`}>
                        {granted ? 'Permitido' : 'Negado'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Botões de ação */}
      {hasChanges && (
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" size="sm" onClick={() => setShowResetModal(true)}>
            <RotateCcw size={14} className="mr-1" />
            Restaurar Padrão
          </Button>
          <Button variant="outline" size="sm" onClick={loadData}>
            Descartar
          </Button>
          <Button size="sm" onClick={handleSave} loading={saving}>
            <Save size={14} className="mr-1" />
            Salvar
          </Button>
        </div>
      )}

      {/* Modal de Reset */}
      <Modal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        title="Restaurar Permissões Padrão"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Restaurar permissões padrão para <strong>{roleNames[selectedRole]}</strong>?
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowResetModal(false)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleReset}>
              Restaurar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// Componente principal Settings
const Settings = () => {
  const { profile, isAdmin } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('company')
  const [feedback, setFeedback] = useState({ message: null, type: 'success' })
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [availableLogos, setAvailableLogos] = useState([])

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

  const logosDisponiveis = [
    { name: 'Logo Padrão', path: '/brasalino-pollo.png' },
    { name: 'Logo Dark', path: '/logo-dark.png' },
    { name: 'Logo Light', path: '/logo-light.png' },
    { name: 'Logo Branca', path: '/logo-white.png' },
    { name: 'Logo Azul', path: '/logo-blue.png' },
  ]

  useEffect(() => {
    fetchSettings()
    setAvailableLogos(logosDisponiveis)
  }, [])

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
    { id: 'appearance', label: 'Aparência', icon: Palette },
    { id: 'permissions', label: 'Permissões', icon: Shield },
    { id: 'security', label: 'Segurança', icon: Lock },
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gerencie as preferências e configurações do sistema
          </p>
        </div>

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
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Logo da Empresa
                      </label>
                      
                      <div className="flex flex-col sm:flex-row items-start gap-6">
                        <div className="w-32 h-32 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                          {companySettings.company_logo_url ? (
                            <img 
                              src={companySettings.company_logo_url} 
                              alt="Logo" 
                              className="max-w-full max-h-full object-contain"
                              onError={(e) => { e.target.src = '/brasalino-pollo.png' }}
                            />
                          ) : (
                            <ImageIcon className="w-8 h-8 text-gray-400" />
                          )}
                        </div>

                        <div className="flex-1 space-y-3">
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
                        </div>
                      </div>
                    </div>

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
                        <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
                        <input
                          type="text"
                          value={companySettings.cnpj}
                          onChange={(e) => setCompanySettings({ ...companySettings, cnpj: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="00.000.000/0001-00"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                          type="email"
                          value={companySettings.email}
                          onChange={(e) => setCompanySettings({ ...companySettings, email: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="contato@empresa.com"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                        <input
                          type="text"
                          value={companySettings.phone}
                          onChange={(e) => setCompanySettings({ ...companySettings, phone: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="(00) 0000-0000"
                        />
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

              {/* Permissões (RLS) */}
              {activeTab === 'permissions' && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Gerenciamento de Permissões</h2>
                  <RolePermissionsTab />
                </div>
              )}

              {/* Segurança */}
              {activeTab === 'security' && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Segurança</h2>
                  <button
                    onClick={() => setShowPasswordModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Alterar Senha
                  </button>
                </div>
              )}

              {/* Botão Salvar (apenas para abas que precisam) */}
              {(activeTab === 'company' || activeTab === 'appearance') && (
                <div className="border-t border-gray-200 p-6 bg-gray-50 rounded-b-lg">
                  <Button onClick={handleSave} loading={saving} icon={Save}>
                    Salvar configurações
                  </Button>
                </div>
              )}
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