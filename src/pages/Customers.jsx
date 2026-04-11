// Customers.jsx - COM LOGS INTEGRADOS
import React, { useState, useEffect } from 'react'
import { UserPlus, Edit2, Trash2, Phone, Mail, MapPin, Calendar, User, MessageCircle } from 'lucide-react'
import DataTable from '../components/ui/DataTable'
import DataFilters from '../components/ui/DataFilters'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import FormInput from '../components/forms/FormInput'
import FeedbackMessage from '../components/ui/FeedbackMessage'
import DataLoadingSkeleton from '../components/ui/DataLoadingSkeleton'
import DataEmptyState from '../components/ui/DataEmptyState'
import Badge from '../components/Badge'
import { supabase } from '../lib/supabase'
import useSystemLogs from '../hooks/useSystemLogs' 
import { useAuth } from '../contexts/AuthContext.jsx' 
import { useNavigate } from 'react-router-dom'

const Customers = () => {
  const { profile } = useAuth() // Pegar perfil do usuário logado
  const { logCreate, logUpdate, logDelete, logError, logAction } = useSystemLogs()
  
  const [customers, setCustomers] = useState([])
  const [filteredCustomers, setFilteredCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilters, setActiveFilters] = useState({})
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    document: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    birth_date: '',
    status: 'active'
  })
  const [formErrors, setFormErrors] = useState({})
  const [feedback, setFeedback] = useState({ show: false, type: 'success', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

  // Log de acesso à página
  useEffect(() => {
    logAction({
      action: 'VIEW',
      entityType: 'customer',
      details: {
        component: 'Customers',
        action: 'access_page',
        user_role: profile?.role,
        user_email: profile?.email
      }
    })
  }, [])

  // Carregar clientes do Supabase
  useEffect(() => {
    fetchCustomers()
  }, [])

  // Filtrar clientes
  useEffect(() => {
    filterCustomers()
  }, [searchTerm, customers, activeFilters])

  const fetchCustomers = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      
      setCustomers(data || [])
      setFilteredCustomers(data || [])
      
      // Log de busca
      await logAction({
        action: 'SEARCH',
        entityType: 'customer',
        details: {
          filters: activeFilters,
          result_count: data?.length || 0,
          user_email: profile?.email
        }
      })
      
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
      await logError('customer', error, { 
        action: 'fetch_customers',
        filters: activeFilters
      })
      showFeedback('error', 'Erro ao carregar clientes: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const filterCustomers = () => {
    let filtered = [...customers]

    // Busca textual
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(customer =>
        customer.name?.toLowerCase().includes(search) ||
        customer.email?.toLowerCase().includes(search) ||
        customer.phone?.includes(search) ||
        customer.document?.includes(search)
      )
    }

    // Filtros avançados
    if (activeFilters.status) {
      filtered = filtered.filter(c => c.status === activeFilters.status)
    }
    if (activeFilters.city) {
      filtered = filtered.filter(c => 
        c.city?.toLowerCase().includes(activeFilters.city.toLowerCase())
      )
    }

    setFilteredCustomers(filtered)
  }

  const showFeedback = (type, message) => {
    setFeedback({ show: true, type, message })
    setTimeout(() => {
      setFeedback({ show: false, type: 'success', message: '' })
    }, 3000)
  }

  const validateForm = () => {
    const errors = {}
    
    if (!formData.name?.trim()) {
      errors.name = 'Nome é obrigatório'
    } else if (formData.name.length < 3) {
      errors.name = 'Nome deve ter pelo menos 3 caracteres'
    }
    
    if (!formData.email?.trim()) {
      errors.email = 'E-mail é obrigatório'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'E-mail inválido'
    }
    
    if (!formData.phone?.trim()) {
      errors.phone = 'Telefone é obrigatório'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleOpenModal = (customer = null) => {
    if (customer) {
      setSelectedCustomer(customer)
      setFormData({
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        document: customer.document || '',
        address: customer.address || '',
        city: customer.city || '',
        state: customer.state || '',
        zip_code: customer.zip_code || '',
        birth_date: customer.birth_date || '',
        status: customer.status || 'active'
      })
      
      // Log de abertura do modal de edição
      logAction({
        action: 'VIEW',
        entityType: 'customer',
        entityId: customer.id,
        details: {
          component: 'Customers',
          action: 'open_edit_modal',
          customer_name: customer.name,
          customer_email: customer.email,
          user_email: profile?.email
        }
      })
    } else {
      setSelectedCustomer(null)
      setFormData({
        name: '',
        email: '',
        phone: '',
        document: '',
        address: '',
        city: '',
        state: '',
        zip_code: '',
        birth_date: '',
        status: 'active'
      })
      
      // Log de abertura do modal de criação
      logAction({
        action: 'VIEW',
        entityType: 'customer',
        details: {
          component: 'Customers',
          action: 'open_create_modal',
          user_email: profile?.email
        }
      })
    }
    setFormErrors({})
    setIsModalOpen(true)
  }

  const handleSubmit = async () => {
    if (!validateForm()) return
    
    setIsSubmitting(true)
    try {
      if (selectedCustomer) {
        // Salvar dados antigos para o log
        const oldCustomerData = { ...selectedCustomer }
        
        // Atualizar cliente existente
        const { data, error } = await supabase
          .from('customers')
          .update({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            document: formData.document || null,
            address: formData.address || null,
            city: formData.city || null,
            state: formData.state || null,
            zip_code: formData.zip_code || null,
            birth_date: formData.birth_date || null,
            status: formData.status,
            updated_at: new Date()
          })
          .eq('id', selectedCustomer.id)
          .select()
          .single()

        if (error) throw error
        
        // LOG DE ATUALIZAÇÃO
        const newCustomerData = {
          ...oldCustomerData,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          document: formData.document,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip_code: formData.zip_code,
          birth_date: formData.birth_date,
          status: formData.status
        }
        
        await logUpdate('customer', selectedCustomer.id, oldCustomerData, newCustomerData, {
          updated_by: profile?.email,
          updated_by_role: profile?.role,
          changes: {
            name: oldCustomerData.name !== formData.name,
            email: oldCustomerData.email !== formData.email,
            phone: oldCustomerData.phone !== formData.phone,
            status: oldCustomerData.status !== formData.status
          }
        })
        
        setCustomers(prev => prev.map(c => c.id === selectedCustomer.id ? data : c))
        showFeedback('success', 'Cliente atualizado com sucesso!')
      } else {
        // Criar novo cliente
        const { data, error } = await supabase
          .from('customers')
          .insert([{
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            document: formData.document || null,
            address: formData.address || null,
            city: formData.city || null,
            state: formData.state || null,
            zip_code: formData.zip_code || null,
            birth_date: formData.birth_date || null,
            status: formData.status,
            total_purchases: 0,
            created_at: new Date(),
            updated_at: new Date()
          }])
          .select()
          .single()

        if (error) throw error
        
        // LOG DE CRIAÇÃO
        await logCreate('customer', data.id, {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          document: formData.document,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip_code: formData.zip_code,
          birth_date: formData.birth_date,
          status: formData.status,
          created_by: profile?.email,
          created_by_role: profile?.role
        })
        
        setCustomers(prev => [...prev, data])
        showFeedback('success', 'Cliente cadastrado com sucesso!')
      }
      
      setIsModalOpen(false)
    } catch (error) {
      console.error('Erro ao salvar cliente:', error)
      await logError('customer', error, { 
        action: selectedCustomer ? 'update_customer' : 'create_customer',
        customer_id: selectedCustomer?.id,
        customer_email: formData.email,
        form_data: { ...formData, document: '[PRESENT]', phone: '[PRESENT]' }
      })
      showFeedback('error', error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const confirmDelete = (customer) => {
    setSelectedCustomer(customer)
    setIsDeleteModalOpen(true)
    
    // Log de abertura do modal de exclusão
    logAction({
      action: 'VIEW',
      entityType: 'customer',
      entityId: customer.id,
      details: {
        component: 'Customers',
        action: 'open_delete_modal',
        customer_name: customer.name,
        customer_email: customer.email,
        user_email: profile?.email
      }
    })
  }

  const handleDelete = async () => {
    setIsSubmitting(true)
    
    // Salvar dados do cliente para o log antes de deletar
    const customerData = { ...selectedCustomer }
    
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', selectedCustomer.id)

      if (error) throw error
      
      // LOG DE EXCLUSÃO
      await logDelete('customer', selectedCustomer.id, customerData, {
        deleted_by: profile?.email,
        deleted_by_role: profile?.role,
        customer_name: customerData.name,
        customer_email: customerData.email,
        customer_phone: customerData.phone
      })
      
      setCustomers(prev => prev.filter(c => c.id !== selectedCustomer.id))
      showFeedback('success', 'Cliente excluído com sucesso!')
      setIsDeleteModalOpen(false)
      setSelectedCustomer(null)
    } catch (error) {
      console.error('Erro ao excluir cliente:', error)
      await logError('customer', error, { 
        action: 'delete_customer',
        customer_id: selectedCustomer?.id,
        customer_email: selectedCustomer?.email,
        customer_name: selectedCustomer?.name
      })
      showFeedback('error', error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusBadge = (status) => {
    if (status === 'active') {
      return <Badge variant="success">Ativo</Badge>
    }
    return <Badge variant="danger">Inativo</Badge>
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0)
  }

  const formatDate = (date) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('pt-BR')
  }

  const actions = [
     {
      label: 'Comunicar',
      icon: <MessageCircle size={16} />,
      onClick: (row) => navigate(`/customers/${row.id}/communication`),
      className: 'text-green-600 hover:text-green-700 hover:bg-green-50'
    },
    {
      label: 'Editar',
      icon: <Edit2 size={16} />,
      onClick: (row) => handleOpenModal(row),
      className: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
    },
    {
      label: 'Excluir',
      icon: <Trash2 size={16} />,
      onClick: (row) => confirmDelete(row),
      className: 'text-red-600 hover:text-red-700 hover:bg-red-50'
    }
  ]

  const columns = [
    {
      key: 'name',
      header: 'Cliente',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <User size={16} className="text-blue-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{row.name || '-'}</div>
            <div className="text-xs text-gray-500">{row.email || '-'}</div>
          </div>
        </div>
      )
    },
    {
      key: 'phone',
      header: 'Telefone',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Phone size={14} className="text-gray-400" />
          <span>{row.phone || '-'}</span>
        </div>
      )
    },
    {
      key: 'document',
      header: 'CPF/CNPJ',
      render: (row) => row.document || '-'
    },
    {
      key: 'total_purchases',
      header: 'Total em Compras',
      sortable: true,
      render: (row) => (
        <span className="font-medium text-green-600">
          {formatCurrency(row.total_purchases)}
        </span>
      )
    },
    {
      key: 'last_purchase',
      header: 'Última Compra',
      sortable: true,
      render: (row) => formatDate(row.last_purchase)
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => getStatusBadge(row.status)
    }
  ]

  const filters = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'active', label: 'Ativo' },
        { value: 'inactive', label: 'Inativo' }
      ]
    },
    {
      key: 'city',
      label: 'Cidade',
      type: 'text',
      placeholder: 'Digite a cidade'
    }
  ]

  const handleFilterChange = (filters) => {
    setActiveFilters(filters)
    
    // Log de aplicação de filtros
    logAction({
      action: 'FILTER',
      entityType: 'customer',
      details: {
        filters_applied: filters,
        user_email: profile?.email
      }
    })
  }

  if (loading) {
    return <DataLoadingSkeleton />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
            <p className="text-gray-600 mt-1">Gerencie seus clientes cadastrados</p>
          </div>
          <Button onClick={() => handleOpenModal()} icon={UserPlus}>
            Novo Cliente
          </Button>
        </div>

        {feedback.show && (
          <div className="mb-4">
            <FeedbackMessage
              type={feedback.type}
              message={feedback.message}
              onClose={() => setFeedback({ show: false, type: 'success', message: '' })}
            />
          </div>
        )}

        <div className="mb-6">
          <DataFilters
            searchPlaceholder="Buscar por nome, e-mail, telefone ou CPF..."
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            filters={filters}
            onFilterChange={handleFilterChange}
          />
        </div>

        {filteredCustomers.length === 0 && !loading ? (
          <DataEmptyState
            title="Nenhum cliente encontrado"
            description={searchTerm ? "Tente buscar por outro termo" : "Comece cadastrando seu primeiro cliente"}
            action={
              <Button onClick={() => handleOpenModal()} variant="primary">
                Cadastrar Cliente
              </Button>
            }
          />
        ) : (
          <DataTable
            columns={columns}
            data={filteredCustomers}
            actions={actions}
            onRowClick={(row) => handleOpenModal(row)}
            striped
            hover
          />
        )}

        {/* Modal de Cadastro/Edição */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => !isSubmitting && setIsModalOpen(false)}
          title={selectedCustomer ? 'Editar Cliente' : 'Novo Cliente'}
          size="lg"
          isLoading={isSubmitting}
        >
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label="Nome Completo"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  error={formErrors.name}
                  placeholder="Digite o nome completo"
                  icon={User}
                />
                
                <FormInput
                  label="E-mail"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  error={formErrors.email}
                  placeholder="cliente@email.com"
                  icon={Mail}
                />
                
                <FormInput
                  label="Telefone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  error={formErrors.phone}
                  placeholder="(11) 99999-9999"
                  icon={Phone}
                />
                
                <FormInput
                  label="CPF/CNPJ"
                  name="document"
                  value={formData.document}
                  onChange={handleInputChange}
                  placeholder="123.456.789-00"
                />
                
                <FormInput
                  label="Data de Nascimento"
                  name="birth_date"
                  type="date"
                  value={formData.birth_date}
                  onChange={handleInputChange}
                  icon={Calendar}
                />
                
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                  </select>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Endereço</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    label="Endereço"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Rua, número, complemento"
                    icon={MapPin}
                  />
                  
                  <FormInput
                    label="Cidade"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="Cidade"
                  />
                  
                  <FormInput
                    label="Estado"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder="UF"
                  />
                  
                  <FormInput
                    label="CEP"
                    name="zip_code"
                    value={formData.zip_code}
                    onChange={handleInputChange}
                    placeholder="12345-678"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={isSubmitting}
              >
                {selectedCustomer ? 'Atualizar' : 'Cadastrar'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal de Confirmação de Exclusão */}
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => !isSubmitting && setIsDeleteModalOpen(false)}
          title="Excluir Cliente"
          size="sm"
          isLoading={isSubmitting}
        >
          <div className="space-y-4">
            <p className="text-gray-700">
              Tem certeza que deseja excluir o cliente <strong>{selectedCustomer?.name}</strong>?
            </p>
            <p className="text-sm text-red-600">
              Esta ação não poderá ser desfeita.
            </p>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={handleDelete}
                loading={isSubmitting}
              >
                Excluir
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  )
}

export default Customers