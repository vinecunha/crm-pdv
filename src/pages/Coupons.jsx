import React, { useState, useEffect } from 'react'
import { 
  Plus, Edit, Trash2, Ticket, Percent, DollarSign, 
  Users, Globe, Clock, CheckCircle, XCircle, 
  Calendar, AlertCircle, UserPlus, UserMinus,
  Copy, RefreshCw, Search, Filter
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext.jsx'
import FeedbackMessage from '../components/ui/FeedbackMessage'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import DataLoadingSkeleton from '../components/ui/DataLoadingSkeleton'
import DataTable from '../components/ui/DataTable'
import DataFilters from '../components/ui/DataFilters'
import useSystemLogs from '../hooks/useSystemLogs'
import useLogger from '../hooks/useLogger'

const Coupons = () => {
  const { profile } = useAuth()
  const { logAction, logError } = useSystemLogs()
  const { logComponentAction, logComponentError, logCreate, logUpdate, logDelete } = useLogger('Coupons')
  
  // Estados
  const [coupons, setCoupons] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({})
  
  // Estados do formulário
  const [showModal, setShowModal] = useState(false)
  const [showCustomersModal, setShowCustomersModal] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState(null)
  const [selectedCoupon, setSelectedCoupon] = useState(null)
  const [allowedCustomers, setAllowedCustomers] = useState([])
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    discount_type: 'percent',
    discount_value: '',
    max_discount: '',
    min_purchase: '0',
    is_global: true,
    is_active: true,
    valid_from: '',
    valid_to: '',
    usage_limit: ''
  })
  
  // Estados de clientes no modal
  const [customerSearch, setCustomerSearch] = useState('')
  const [filteredCustomers, setFilteredCustomers] = useState([])
  const [selectedCustomers, setSelectedCustomers] = useState([])
  
  // Feedback
  const [feedback, setFeedback] = useState({ show: false, type: 'success', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchCoupons()
    fetchCustomers()
    
    logComponentAction('ACCESS_PAGE', null, {
      page: 'coupons',
      user_email: profile?.email
    })
  }, [])

  useEffect(() => {
    fetchCoupons()
  }, [searchTerm, filters])

  const showFeedback = (type, message) => {
    setFeedback({ show: true, type, message })
    setTimeout(() => setFeedback({ show: false, type: 'success', message: '' }), 3000)
  }

  const fetchCoupons = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (searchTerm.trim()) {
        query = query.or(`code.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%`)
      }
      
      if (filters.status && filters.status !== 'all') {
        query = query.eq('is_active', filters.status === 'active')
      }
      
      if (filters.discount_type && filters.discount_type !== 'all') {
        query = query.eq('discount_type', filters.discount_type)
      }
      
      if (filters.is_global && filters.is_global !== 'all') {
        query = query.eq('is_global', filters.is_global === 'global')
      }
      
      const { data, error } = await query
      
      if (error) throw error
      
      setCoupons(data || [])
      
    } catch (error) {
      console.error('Erro ao carregar cupons:', error)
      showFeedback('error', 'Erro ao carregar cupons')
      await logComponentError(error, { action: 'fetch_coupons' })
    } finally {
      setLoading(false)
    }
  }

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, phone, email')
        .eq('status', 'active')
        .order('name')
      
      if (error) throw error
      
      setCustomers(data || [])
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
    }
  }

  const fetchAllowedCustomers = async (couponId) => {
    try {
      const { data, error } = await supabase
        .from('coupon_allowed_customers')
        .select('customer_id, customers(id, name, phone, email)')
        .eq('coupon_id', couponId)
        .eq('is_active', true)
      
      if (error) throw error
      
      setAllowedCustomers(data || [])
      setSelectedCustomers((data || []).map(ac => ac.customer_id))
    } catch (error) {
      console.error('Erro ao carregar clientes permitidos:', error)
    }
  }

  const handleOpenModal = (coupon = null) => {
    if (coupon) {
      setEditingCoupon(coupon)
      setFormData({
        code: coupon.code,
        name: coupon.name,
        description: coupon.description || '',
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        max_discount: coupon.max_discount || '',
        min_purchase: coupon.min_purchase || '0',
        is_global: coupon.is_global,
        is_active: coupon.is_active,
        valid_from: coupon.valid_from ? coupon.valid_from.split('T')[0] : '',
        valid_to: coupon.valid_to ? coupon.valid_to.split('T')[0] : '',
        usage_limit: coupon.usage_limit || ''
      })
      
      if (!coupon.is_global) {
        fetchAllowedCustomers(coupon.id)
      } else {
        setAllowedCustomers([])
        setSelectedCustomers([])
      }
    } else {
      setEditingCoupon(null)
      setFormData({
        code: '',
        name: '',
        description: '',
        discount_type: 'percent',
        discount_value: '',
        max_discount: '',
        min_purchase: '0',
        is_global: true,
        is_active: true,
        valid_from: '',
        valid_to: '',
        usage_limit: ''
      })
      setAllowedCustomers([])
      setSelectedCustomers([])
    }
    setShowModal(true)
  }

  const handleOpenCustomersModal = (coupon) => {
    setSelectedCoupon(coupon)
    setSelectedCustomers([])
    fetchAllowedCustomers(coupon.id)
    setShowCustomersModal(true)
  }

  const handleSaveCoupon = async () => {
    // Validações
    if (!formData.code) {
      showFeedback('error', 'Código do cupom é obrigatório')
      return
    }
    if (!formData.name) {
      showFeedback('error', 'Nome do cupom é obrigatório')
      return
    }
    if (!formData.discount_value || formData.discount_value <= 0) {
      showFeedback('error', 'Valor do desconto é obrigatório')
      return
    }
    if (formData.discount_type === 'percent' && formData.discount_value > 100) {
      showFeedback('error', 'Desconto percentual não pode ser maior que 100%')
      return
    }
    if (formData.valid_from && formData.valid_to && new Date(formData.valid_from) > new Date(formData.valid_to)) {
      showFeedback('error', 'Data inicial não pode ser maior que data final')
      return
    }
    
    setIsSubmitting(true)
    
    try {
      const now = new Date().toISOString()
      const couponData = {
        code: formData.code.toUpperCase(),
        name: formData.name,
        description: formData.description || null,
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value),
        max_discount: formData.max_discount ? parseFloat(formData.max_discount) : null,
        min_purchase: parseFloat(formData.min_purchase) || 0,
        is_global: formData.is_global,
        is_active: formData.is_active,
        valid_from: formData.valid_from ? new Date(formData.valid_from).toISOString() : null,
        valid_to: formData.valid_to ? new Date(formData.valid_to).toISOString() : null,
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
        updated_at: now,
        updated_by: profile?.id
      }
      
      let result
      
      if (editingCoupon) {
        // Update
        const { data, error } = await supabase
          .from('coupons')
          .update(couponData)
          .eq('id', editingCoupon.id)
          .select()
          .single()
        
        if (error) throw error
        result = data
        
        await logUpdate('coupon', result.id, editingCoupon, result)
        await logComponentAction('UPDATE_COUPON', result.id, {
          coupon_code: result.code,
          changes: {
            old: editingCoupon,
            new: result
          }
        })
        
        showFeedback('success', `Cupom ${result.code} atualizado com sucesso!`)
      } else {
        // Create
        couponData.created_at = now
        couponData.created_by = profile?.id
        
        const { data, error } = await supabase
          .from('coupons')
          .insert([couponData])
          .select()
          .single()
        
        if (error) throw error
        result = data
        
        await logCreate('coupon', result.id, result)
        await logComponentAction('CREATE_COUPON', result.id, {
          coupon_code: result.code
        })
        
        showFeedback('success', `Cupom ${result.code} criado com sucesso!`)
      }
      
      // Salvar clientes permitidos para cupom restrito
      if (!formData.is_global && selectedCustomers.length > 0) {
        // Remover clientes antigos
        await supabase
          .from('coupon_allowed_customers')
          .delete()
          .eq('coupon_id', result.id)
        
        // Adicionar novos clientes
        const allowedData = selectedCustomers.map(customerId => ({
          coupon_id: result.id,
          customer_id: customerId,
          created_at: now
        }))
        
        const { error: allowedError } = await supabase
          .from('coupon_allowed_customers')
          .insert(allowedData)
        
        if (allowedError) {
          console.error('Erro ao salvar clientes permitidos:', allowedError)
        }
      }
      
      setShowModal(false)
      fetchCoupons()
      
    } catch (error) {
      console.error('Erro ao salvar cupom:', error)
      await logComponentError(error, {
        action: editingCoupon ? 'update_coupon' : 'create_coupon',
        formData
      })
      showFeedback('error', `Erro ao salvar cupom: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteCoupon = async (coupon) => {
    if (!confirm(`Tem certeza que deseja excluir o cupom ${coupon.code}?`)) return
    
    setIsSubmitting(true)
    
    try {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', coupon.id)
      
      if (error) throw error
      
      await logDelete('coupon', coupon.id, coupon)
      await logComponentAction('DELETE_COUPON', coupon.id, {
        coupon_code: coupon.code
      })
      
      showFeedback('success', `Cupom ${coupon.code} excluído com sucesso!`)
      fetchCoupons()
      
    } catch (error) {
      console.error('Erro ao excluir cupom:', error)
      await logComponentError(error, {
        action: 'delete_coupon',
        coupon_id: coupon.id,
        coupon_code: coupon.code
      })
      showFeedback('error', `Erro ao excluir cupom: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleStatus = async (coupon) => {
    try {
      const newStatus = !coupon.is_active
      const { error } = await supabase
        .from('coupons')
        .update({ 
          is_active: newStatus,
          updated_at: new Date().toISOString(),
          updated_by: profile?.id
        })
        .eq('id', coupon.id)
      
      if (error) throw error
      
      await logUpdate('coupon', coupon.id, coupon, { ...coupon, is_active: newStatus })
      await logComponentAction('TOGGLE_COUPON_STATUS', coupon.id, {
        coupon_code: coupon.code,
        old_status: coupon.is_active,
        new_status: newStatus
      })
      
      showFeedback('success', `Cupom ${coupon.code} ${newStatus ? 'ativado' : 'desativado'} com sucesso!`)
      fetchCoupons()
      
    } catch (error) {
      console.error('Erro ao alterar status:', error)
      showFeedback('error', `Erro ao alterar status: ${error.message}`)
    }
  }

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code)
    showFeedback('success', `Código ${code} copiado!`)
  }

  const handleCustomerSearch = (search) => {
    setCustomerSearch(search)
    if (search.trim()) {
      const filtered = customers.filter(c => 
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search) ||
        c.email?.toLowerCase().includes(search.toLowerCase())
      )
      setFilteredCustomers(filtered)
    } else {
      setFilteredCustomers(customers)
    }
  }

  const toggleCustomerSelection = (customerId) => {
    setSelectedCustomers(prev => 
      prev.includes(customerId) 
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    )
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0)
  }

  const formatDate = (date) => {
    if (!date) return 'Sem data'
    return new Date(date).toLocaleDateString('pt-BR')
  }

  const getStatusBadge = (isActive) => {
    return isActive ? (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckCircle size={12} />
        Ativo
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <XCircle size={12} />
        Inativo
      </span>
    )
  }

  const getTypeBadge = (type) => {
    return type === 'percent' ? (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        <Percent size={12} />
        Percentual
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
        <DollarSign size={12} />
        Valor Fixo
      </span>
    )
  }

  // Configuração das colunas da tabela
  const columns = [
    {
      key: 'code',
      header: 'Código',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-blue-600">{row.code}</span>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleCopyCode(row.code)
            }}
            className="p-1 hover:bg-gray-100 rounded"
            title="Copiar código"
          >
            <Copy size={14} className="text-gray-400" />
          </button>
        </div>
      )
    },
    {
      key: 'name',
      header: 'Nome',
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-medium text-gray-900">{row.name}</div>
          {row.description && (
            <div className="text-xs text-gray-500 truncate max-w-xs">{row.description}</div>
          )}
        </div>
      )
    },
    {
      key: 'discount',
      header: 'Desconto',
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-semibold text-green-600">
            {row.discount_type === 'percent' 
              ? `${row.discount_value}%`
              : formatCurrency(row.discount_value)}
          </div>
          {row.min_purchase > 0 && (
            <div className="text-xs text-gray-500">
              Mín: {formatCurrency(row.min_purchase)}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'type',
      header: 'Tipo',
      render: (row) => (
        <div className="flex flex-col gap-1">
          {getTypeBadge(row.discount_type)}
          {row.is_global ? (
            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
              <Globe size={10} />
              Global
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-blue-600">
              <Users size={10} />
              Restrito
            </span>
          )}
        </div>
      )
    },
    {
      key: 'validity',
      header: 'Validade',
      render: (row) => (
        <div>
          {row.valid_from && row.valid_to ? (
            <div className="text-xs">
              <div>{formatDate(row.valid_from)} - {formatDate(row.valid_to)}</div>
              {new Date(row.valid_to) < new Date() && row.is_active && (
                <div className="text-red-500 text-xs mt-1">Expirado</div>
              )}
            </div>
          ) : (
            <span className="text-xs text-gray-500">Indeterminada</span>
          )}
          {row.usage_limit && (
            <div className="text-xs text-gray-500 mt-1">
              Usos: {row.used_count || 0}/{row.usage_limit}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'is_active',
      header: 'Status',
      sortable: true,
      render: (row) => getStatusBadge(row.is_active)
    }
  ]

  // Ações da tabela
  const actions = [
    {
      label: 'Editar',
      icon: <Edit size={18} />,
      className: 'text-blue-600 hover:text-blue-800 hover:bg-blue-50',
      onClick: (row) => handleOpenModal(row)
    },
    {
      label: 'Gerenciar Clientes',
      icon: <Users size={18} />,
      className: 'text-green-600 hover:text-green-800 hover:bg-green-50',
      onClick: (row) => handleOpenCustomersModal(row),
      disabled: (row) => row.is_global === true
    },
    {
      label: 'Ativar/Desativar',
      icon: <RefreshCw size={18} />,
      className: 'text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50',
      onClick: (row) => handleToggleStatus(row)
    },
    {
      label: 'Excluir',
      icon: <Trash2 size={18} />,
      className: 'text-red-600 hover:text-red-800 hover:bg-red-50',
      onClick: (row) => handleDeleteCoupon(row)
    }
  ]

  // Configuração dos filtros
  const filterConfig = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'all', label: 'Todos' },
        { value: 'active', label: 'Ativos' },
        { value: 'inactive', label: 'Inativos' }
      ]
    },
    {
      key: 'discount_type',
      label: 'Tipo de Desconto',
      type: 'select',
      options: [
        { value: 'all', label: 'Todos' },
        { value: 'percent', label: 'Percentual' },
        { value: 'fixed', label: 'Valor Fixo' }
      ]
    },
    {
      key: 'is_global',
      label: 'Abrangência',
      type: 'select',
      options: [
        { value: 'all', label: 'Todos' },
        { value: 'global', label: 'Global' },
        { value: 'restricted', label: 'Restrito' }
      ]
    }
  ]

  if (loading && coupons.length === 0) {
    return <DataLoadingSkeleton />
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Feedback */}
        {feedback.show && (
          <div className="mb-4">
            <FeedbackMessage
              type={feedback.type}
              message={feedback.message}
              onClose={() => setFeedback({ show: false, type: 'success', message: '' })}
            />
          </div>
        )}

        {/* Cabeçalho */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cupons de Desconto</h1>
            <p className="text-gray-600 mt-1">Gerencie cupons globais e restritos para seus clientes</p>
          </div>
          <Button onClick={() => handleOpenModal()} icon={Plus}>
            Novo Cupom
          </Button>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total de Cupons</p>
                <p className="text-2xl font-bold text-gray-900">{coupons.length}</p>
              </div>
              <Ticket size={24} className="text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Cupons Ativos</p>
                <p className="text-2xl font-bold text-green-600">
                  {coupons.filter(c => c.is_active).length}
                </p>
              </div>
              <CheckCircle size={24} className="text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Cupons Globais</p>
                <p className="text-2xl font-bold text-purple-600">
                  {coupons.filter(c => c.is_global).length}
                </p>
              </div>
              <Globe size={24} className="text-purple-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Cupons Restritos</p>
                <p className="text-2xl font-bold text-orange-600">
                  {coupons.filter(c => !c.is_global).length}
                </p>
              </div>
              <Users size={24} className="text-orange-500" />
            </div>
          </div>
        </div>

        {/* Filtros e Tabela */}
        <div className="space-y-4">
          <DataFilters
            searchPlaceholder="Buscar por código ou nome..."
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            filters={filterConfig}
            onFilterChange={setFilters}
            showFilters={true}
          />
          
          <DataTable
            columns={columns}
            data={coupons}
            actions={actions}
            onRowClick={(row) => handleOpenModal(row)}
            emptyMessage="Nenhum cupom encontrado"
            striped={true}
            hover={true}
            pagination={true}
            itemsPerPageOptions={[20, 50, 100]}
            defaultItemsPerPage={20}
            showTotalItems={true}
          />
        </div>

        {/* Modal de Cadastro/Edição */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={editingCoupon ? 'Editar Cupom' : 'Novo Cupom'}
          size="lg"
          isLoading={isSubmitting}
        >
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código *
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="Ex: PRIMEIRACOMPRA"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 uppercase"
                  disabled={!!editingCoupon}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Desconto Primeira Compra"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                placeholder="Descrição do cupom..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Desconto *
                </label>
                <select
                  value={formData.discount_type}
                  onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="percent">Percentual (%)</option>
                  <option value="fixed">Valor Fixo (R$)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor do Desconto *
                </label>
                <div className="relative">
                  {formData.discount_type === 'percent' ? (
                    <input
                      type="number"
                      step="0.01"
                      value={formData.discount_value}
                      onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                      placeholder="Ex: 10"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 pr-8"
                    />
                  ) : (
                    <input
                      type="number"
                      step="0.01"
                      value={formData.discount_value}
                      onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                      placeholder="Ex: 10.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 pr-8"
                    />
                  )}
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {formData.discount_type === 'percent' ? '%' : 'R$'}
                  </span>
                </div>
              </div>
            </div>

            {formData.discount_type === 'percent' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Desconto Máximo (opcional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.max_discount}
                  onChange={(e) => setFormData({ ...formData, max_discount: e.target.value })}
                  placeholder="Ex: 50.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Limite máximo de desconto em reais</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valor Mínimo da Compra
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.min_purchase}
                onChange={(e) => setFormData({ ...formData, min_purchase: e.target.value })}
                placeholder="Ex: 100.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Inicial
                </label>
                <input
                  type="date"
                  value={formData.valid_from}
                  onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Final
                </label>
                <input
                  type="date"
                  value={formData.valid_to}
                  onChange={(e) => setFormData({ ...formData, valid_to: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Limite de Uso
                </label>
                <input
                  type="number"
                  value={formData.usage_limit}
                  onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                  placeholder="Sem limite"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Abrangência
                </label>
                <select
                  value={formData.is_global ? 'global' : 'restricted'}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    is_global: e.target.value === 'global',
                    selectedCustomers: e.target.value === 'global' ? [] : selectedCustomers
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="global">Global (todos os clientes)</option>
                  <option value="restricted">Restrito (clientes específicos)</option>
                </select>
              </div>
            </div>

            {!formData.is_global && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Clientes Permitidos
                </label>
                <div className="border rounded-lg p-3">
                  <div className="mb-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="text"
                        placeholder="Buscar clientes..."
                        value={customerSearch}
                        onChange={(e) => handleCustomerSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {filteredCustomers.map(customer => (
                      <label key={customer.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedCustomers.includes(customer.id)}
                          onChange={() => toggleCustomerSelection(customer.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                          <div className="text-xs text-gray-500">{customer.phone}</div>
                        </div>
                      </label>
                    ))}
                    {filteredCustomers.length === 0 && (
                      <p className="text-center text-gray-500 text-sm py-4">
                        Nenhum cliente encontrado
                      </p>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Selecione os clientes que poderão usar este cupom
                </p>
              </div>
            )}

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Cupom ativo</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4 mt-4 border-t">
            <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleSaveCoupon} loading={isSubmitting} className="flex-1">
              {editingCoupon ? 'Atualizar' : 'Criar'} Cupom
            </Button>
          </div>
        </Modal>

        {/* Modal de Gerenciar Clientes */}
        <Modal
          isOpen={showCustomersModal}
          onClose={() => setShowCustomersModal(false)}
          title={`Clientes Permitidos - ${selectedCoupon?.code}`}
          size="lg"
        >
          {selectedCoupon && (
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Ticket size={20} className="text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">{selectedCoupon.name}</p>
                    <p className="text-xs text-blue-600">
                      {selectedCoupon.discount_type === 'percent' 
                        ? `${selectedCoupon.discount_value}% de desconto`
                        : `${formatCurrency(selectedCoupon.discount_value)} de desconto`}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-medium text-gray-900">
                    Clientes que podem usar este cupom
                  </h3>
                  <Button size="sm" variant="outline" onClick={() => {
                    // Lógica para adicionar cliente
                    setCustomerSearch('')
                    handleCustomerSearch('')
                  }}>
                    <UserPlus size={14} className="mr-1" />
                    Adicionar
                  </Button>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <div className="max-h-96 overflow-y-auto">
                    {allowedCustomers.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">
                        Nenhum cliente permitido. Adicione clientes para restringir o uso.
                      </p>
                    ) : (
                      allowedCustomers.map(ac => (
                        <div key={ac.customer_id} className="flex justify-between items-center p-3 border-b hover:bg-gray-50">
                          <div>
                            <p className="font-medium text-gray-900">{ac.customers?.name}</p>
                            <p className="text-xs text-gray-500">{ac.customers?.phone}</p>
                          </div>
                          <button
                            onClick={async () => {
                              const { error } = await supabase
                                .from('coupon_allowed_customers')
                                .delete()
                                .eq('coupon_id', selectedCoupon.id)
                                .eq('customer_id', ac.customer_id)
                              
                              if (!error) {
                                setAllowedCustomers(allowedCustomers.filter(c => c.customer_id !== ac.customer_id))
                                setSelectedCustomers(selectedCustomers.filter(id => id !== ac.customer_id))
                                showFeedback('success', 'Cliente removido com sucesso')
                              }
                            }}
                            className="text-red-600 hover:text-red-800"
                          >
                            <UserMinus size={18} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowCustomersModal(false)} className="flex-1">
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  )
}

export default Coupons