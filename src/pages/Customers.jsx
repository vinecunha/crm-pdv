import React, { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { UserPlus, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useReactQuery } from '../hooks/useReactQuery'
import useSystemLogs from '../hooks/useSystemLogs'

import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import FeedbackMessage from '../components/ui/FeedbackMessage'
import DataLoadingSkeleton from '../components/ui/DataLoadingSkeleton'
import DataEmptyState from '../components/ui/DataEmptyState'

import CustomerForm from '../components/customers/CustomerForm'
import CustomerDeleteModal from '../components/customers/CustomerDeleteModal'
import CustomerTable from '../components/customers/CustomerTable'
import CustomerFilters from '../components/customers/CustomerFilters'

// ============= API Functions =============
const fetchCustomers = async () => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('name')
  
  if (error) throw error
  return data || []
}

const createCustomer = async (customerData) => {
  const { data, error } = await supabase
    .from('customers')
    .insert([{ 
      ...customerData, 
      total_purchases: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select()
    .single()
  
  if (error) throw error
  return data
}

const updateCustomer = async ({ id, customerData }) => {
  const { data, error } = await supabase
    .from('customers')
    .update({ 
      ...customerData, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

const deleteCustomer = async (id) => {
  const { error } = await supabase.from('customers').delete().eq('id', id)
  if (error) throw error
  return id
}

// ============= Componente Principal =============
const Customers = () => {
  const { profile } = useAuth()
  const { logCreate, logUpdate, logDelete, logError, logAction } = useSystemLogs()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { invalidateQueries } = useReactQuery()
  
  // Estado local
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilters, setActiveFilters] = useState({})
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', document: '', address: '',
    city: '', state: '', zip_code: '', birth_date: '', status: 'active'
  })
  const [formErrors, setFormErrors] = useState({})
  const [feedback, setFeedback] = useState({ show: false, type: 'success', message: '' })

  // ============= Queries =============
  const { 
    data: customers = [], 
    isLoading,
    error: customersError,
    refetch: refetchCustomers,
    isFetching
  } = useQuery({
    queryKey: ['customers'],
    queryFn: fetchCustomers,
    staleTime: 0,
    refetchOnMount: true,
  })

  // ============= Filtragem em Memória =============
  const filteredCustomers = useMemo(() => {
    const customersArray = Array.isArray(customers) ? customers : []
    let filtered = [...customersArray]
    
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(c => 
        c.name?.toLowerCase().includes(search) || 
        c.email?.toLowerCase().includes(search) || 
        c.phone?.includes(search)
      )
    }
    
    if (activeFilters.status) {
      filtered = filtered.filter(c => c.status === activeFilters.status)
    }
    
    if (activeFilters.city) {
      filtered = filtered.filter(c => 
        c.city?.toLowerCase().includes(activeFilters.city.toLowerCase())
      )
    }
    
    return filtered
  }, [customers, searchTerm, activeFilters])

  // ============= Mutations =============
  const createMutation = useMutation({
    mutationFn: createCustomer,
    onSuccess: async (data) => {
      await logCreate('customer', data.id, data)
      await invalidateQueries(['customers'])
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      showFeedback('success', 'Cliente cadastrado com sucesso!')
      setIsModalOpen(false)
    },
    onError: async (error) => {
      console.error('Erro ao salvar cliente:', error)
      
      let errorMessage = 'Erro ao salvar cliente'
      if (error.message?.includes('duplicate key') || error.message?.includes('email')) {
        errorMessage = 'Este e-mail já está cadastrado'
      } else if (error.message?.includes('phone')) {
        errorMessage = 'Este telefone já está cadastrado'
      } else {
        errorMessage = error.message
      }
      
      showFeedback('error', errorMessage)
      await logError('customer', error, { action: 'create' })
    }
  })

  const updateMutation = useMutation({
    mutationFn: updateCustomer,
    onSuccess: async (data) => {
      await logUpdate('customer', data.id, selectedCustomer, data)
      await invalidateQueries(['customers'])
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      showFeedback('success', 'Cliente atualizado com sucesso!')
      setIsModalOpen(false)
    },
    onError: async (error) => {
      console.error('Erro ao atualizar cliente:', error)
      
      let errorMessage = 'Erro ao atualizar cliente'
      if (error.message?.includes('duplicate key') || error.message?.includes('email')) {
        errorMessage = 'Este e-mail já está cadastrado'
      } else if (error.message?.includes('phone')) {
        errorMessage = 'Este telefone já está cadastrado'
      } else {
        errorMessage = error.message
      }
      
      showFeedback('error', errorMessage)
      await logError('customer', error, { action: 'update' })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: deleteCustomer,
    onSuccess: async (id) => {
      await logDelete('customer', id, selectedCustomer)
      await invalidateQueries(['customers'])
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      showFeedback('success', 'Cliente excluído!')
      setIsDeleteModalOpen(false)
    },
    onError: async (error) => {
      showFeedback('error', error.message)
      await logError('customer', error, { action: 'delete' })
    }
  })

  // ============= Efeitos =============
  useEffect(() => {
    logAction({ 
      action: 'VIEW', 
      entityType: 'customer', 
      details: { user_role: profile?.role } 
    })
  }, [])

  // ============= Handlers =============
  const showFeedback = (type, message) => {
    setFeedback({ show: true, type, message })
    setTimeout(() => setFeedback({ show: false, type: 'success', message: '' }), 3000)
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
    
    if (formData.document && formData.document.replace(/\D/g, '').length < 11) {
      errors.document = 'Documento inválido'
    }
    
    if (formData.zip_code && formData.zip_code.replace(/\D/g, '').length < 8) {
      errors.zip_code = 'CEP inválido'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleOpenModal = (customer = null) => {
    setSelectedCustomer(customer)
    setFormData(customer ? 
      { ...customer, status: customer.status || 'active' } : 
      { 
        name: '', email: '', phone: '', document: '', address: '',
        city: '', state: '', zip_code: '', birth_date: '', status: 'active' 
      }
    )
    setFormErrors({})
    setIsModalOpen(true)
  }

  const handleSubmit = () => {
    if (!validateForm()) return
    
    const customerData = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.replace(/\D/g, ''),
      document: formData.document?.replace(/\D/g, '') || null,
      address: formData.address?.trim() || null,
      city: formData.city?.trim() || null,
      state: formData.state?.trim() || null,
      zip_code: formData.zip_code?.replace(/\D/g, '') || null,
      birth_date: formData.birth_date || null,
      status: formData.status || 'active'
    }

    if (selectedCustomer) {
      updateMutation.mutate({ 
        id: selectedCustomer.id, 
        customerData 
      })
    } else {
      createMutation.mutate(customerData)
    }
  }

  const handleDelete = () => {
    deleteMutation.mutate(selectedCustomer.id)
  }

  const isMutating = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending

  // ============= Render =============
  if (customersError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erro ao carregar clientes</h2>
          <p className="text-gray-600 mb-4">{customersError.message}</p>
          <Button onClick={() => refetchCustomers()} icon={RefreshCw}>
            Tentar novamente
          </Button>
        </div>
      </div>
    )
  }

  if (isLoading) return <DataLoadingSkeleton />

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
            <p className="text-gray-600 mt-1">
              Gerencie seus clientes cadastrados ({customers.length})
              {isFetching && (
                <span className="ml-2 inline-flex items-center text-xs text-gray-400">
                  <RefreshCw size={12} className="animate-spin mr-1" />
                  Atualizando...
                </span>
              )}
            </p>
          </div>
          <Button 
            onClick={() => handleOpenModal()} 
            icon={UserPlus}
            disabled={isMutating}
          >
            Novo Cliente
          </Button>
        </div>

        {feedback.show && (
          <FeedbackMessage 
            type={feedback.type} 
            message={feedback.message} 
            onClose={() => setFeedback({ show: false })} 
          />
        )}

        <div className="mb-6">
          <CustomerFilters 
            searchTerm={searchTerm} 
            setSearchTerm={setSearchTerm} 
            onFilterChange={setActiveFilters} 
          />
        </div>

        {filteredCustomers.length === 0 ? (
          <DataEmptyState 
            title="Nenhum cliente encontrado" 
            description={searchTerm ? "Tente buscar por outro termo" : "Comece cadastrando seu primeiro cliente"} 
            action={
              <Button onClick={() => handleOpenModal()} disabled={isMutating}>
                Cadastrar Cliente
              </Button>
            } 
          />
        ) : (
          <CustomerTable 
            customers={filteredCustomers} 
            onEdit={handleOpenModal} 
            onDelete={(c) => { 
              setSelectedCustomer(c)
              setIsDeleteModalOpen(true) 
            }} 
            onCommunicate={(c) => navigate(`/customers/${c.id}/communication`)} 
          />
        )}

        <Modal 
          isOpen={isModalOpen} 
          onClose={() => !isMutating && setIsModalOpen(false)} 
          title={selectedCustomer ? 'Editar Cliente' : 'Novo Cliente'} 
          size="lg"
        >
          <CustomerForm 
            formData={formData} 
            formErrors={formErrors} 
            onChange={(e) => { 
              const { name, value } = e.target
              setFormData(prev => ({ ...prev, [name]: value })) 
            }} 
            onSubmit={handleSubmit} 
            onCancel={() => setIsModalOpen(false)} 
            isSubmitting={createMutation.isPending || updateMutation.isPending} 
            isEditing={!!selectedCustomer} 
          />
        </Modal>

        <CustomerDeleteModal 
          isOpen={isDeleteModalOpen} 
          onClose={() => setIsDeleteModalOpen(false)} 
          customer={selectedCustomer} 
          onConfirm={handleDelete} 
          isSubmitting={deleteMutation.isPending} 
        />
      </div>
    </div>
  )
}

export default Customers