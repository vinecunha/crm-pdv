import React, { useState, useEffect } from 'react'
import { UserPlus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
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

const Customers = () => {
  const { profile } = useAuth()
  const { logCreate, logUpdate, logDelete, logError, logAction } = useSystemLogs()
  const navigate = useNavigate()
  
  const [customers, setCustomers] = useState([])
  const [filteredCustomers, setFilteredCustomers] = useState([])
  const [loading, setLoading] = useState(true)
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
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    logAction({ action: 'VIEW', entityType: 'customer', details: { user_role: profile?.role } })
    fetchCustomers()
  }, [])

  useEffect(() => { filterCustomers() }, [searchTerm, customers, activeFilters])

  const fetchCustomers = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from('customers').select('*').order('name')
      if (error) throw error
      setCustomers(data || [])
      setFilteredCustomers(data || [])
    } catch (error) {
      showFeedback('error', 'Erro ao carregar clientes: ' + error.message)
      await logError('customer', error, { action: 'fetch_customers' })
    } finally {
      setLoading(false)
    }
  }

  const filterCustomers = () => {
    let filtered = [...customers]
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(c => c.name?.toLowerCase().includes(search) || c.email?.toLowerCase().includes(search) || c.phone?.includes(search))
    }
    if (activeFilters.status) filtered = filtered.filter(c => c.status === activeFilters.status)
    if (activeFilters.city) filtered = filtered.filter(c => c.city?.toLowerCase().includes(activeFilters.city.toLowerCase()))
    setFilteredCustomers(filtered)
  }

  const showFeedback = (type, message) => {
    setFeedback({ show: true, type, message })
    setTimeout(() => setFeedback({ show: false, type: 'success', message: '' }), 3000)
  }

  const validateForm = () => {
    const errors = {}
    
    // Apenas valida os campos obrigatórios
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
    
    // Validações opcionais (só se preenchido)
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
    setFormData(customer ? { ...customer, status: customer.status || 'active' } : { name: '', email: '', phone: '', document: '', address: '', city: '', state: '', zip_code: '', birth_date: '', status: 'active' })
    setFormErrors({})
    setIsModalOpen(true)
  }

  const handleSubmit = async () => {
    if (!validateForm()) return
    
    setIsSubmitting(true)
    try {
      // Preparar dados - remover máscaras e converter vazios para null
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

      console.log('📝 Salvando cliente:', customerData)

      if (selectedCustomer) {
        const { error } = await supabase
          .from('customers')
          .update({ ...customerData, updated_at: new Date().toISOString() })
          .eq('id', selectedCustomer.id)
        
        if (error) throw error
        
        await logUpdate('customer', selectedCustomer.id, selectedCustomer, customerData)
        showFeedback('success', 'Cliente atualizado com sucesso!')
      } else {
        const { error } = await supabase
          .from('customers')
          .insert([{ 
            ...customerData, 
            total_purchases: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
        
        if (error) throw error
        
        await logCreate('customer', null, customerData)
        showFeedback('success', 'Cliente cadastrado com sucesso!')
      }
      
      setIsModalOpen(false)
      await fetchCustomers()
      
    } catch (error) {
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
      await logError('customer', error, { action: selectedCustomer ? 'update' : 'create' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    setIsSubmitting(true)
    try {
      const { error } = await supabase.from('customers').delete().eq('id', selectedCustomer.id)
      if (error) throw error
      await logDelete('customer', selectedCustomer.id, selectedCustomer)
      setCustomers(prev => prev.filter(c => c.id !== selectedCustomer.id))
      showFeedback('success', 'Cliente excluído!')
      setIsDeleteModalOpen(false)
    } catch (error) {
      showFeedback('error', error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) return <DataLoadingSkeleton />

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
            <p className="text-gray-600 mt-1">Gerencie seus clientes cadastrados</p>
          </div>
          <Button onClick={() => handleOpenModal()} icon={UserPlus}>Novo Cliente</Button>
        </div>

        {feedback.show && <FeedbackMessage type={feedback.type} message={feedback.message} onClose={() => setFeedback({ show: false })} />}

        <div className="mb-6">
          <CustomerFilters searchTerm={searchTerm} setSearchTerm={setSearchTerm} onFilterChange={setActiveFilters} />
        </div>

        {filteredCustomers.length === 0 && !loading ? (
          <DataEmptyState title="Nenhum cliente encontrado" description={searchTerm ? "Tente buscar por outro termo" : "Comece cadastrando seu primeiro cliente"} action={<Button onClick={() => handleOpenModal()}>Cadastrar Cliente</Button>} />
        ) : (
          <CustomerTable customers={filteredCustomers} onEdit={handleOpenModal} onDelete={(c) => { setSelectedCustomer(c); setIsDeleteModalOpen(true) }} onCommunicate={(c) => navigate(`/customers/${c.id}/communication`)} />
        )}

        <Modal isOpen={isModalOpen} onClose={() => !isSubmitting && setIsModalOpen(false)} title={selectedCustomer ? 'Editar Cliente' : 'Novo Cliente'} size="lg">
          <CustomerForm formData={formData} formErrors={formErrors} onChange={(e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })) }} onSubmit={handleSubmit} onCancel={() => setIsModalOpen(false)} isSubmitting={isSubmitting} isEditing={!!selectedCustomer} />
        </Modal>

        <CustomerDeleteModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} customer={selectedCustomer} onConfirm={handleDelete} isSubmitting={isSubmitting} />
      </div>
    </div>
  )
}

export default Customers