import React from 'react'
import { UserPlus, User, Phone, Mail } from 'lucide-react'
import Modal from '../../ui/Modal'
import FormInput from '../../forms/FormInput'
import Button from '../../ui/Button'

const QuickCustomerForm = ({ 
  isOpen, 
  onClose, 
  formData, 
  setFormData, 
  errors, 
  onSubmit, 
  isSubmitting 
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !isSubmitting && onClose()}
      title="Novo Cliente"
      size="sm"
      isLoading={isSubmitting}
    >
      <div className="space-y-4">
        <div className="text-center">
          <UserPlus size={48} className="mx-auto text-blue-600 mb-3" />
          <p className="text-gray-600 mb-2">
            Cliente não encontrado. Faça o cadastro rápido:
          </p>
        </div>
        
        <FormInput
          label="Nome Completo"
          name="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          error={errors.name}
          placeholder="Digite o nome completo"
          icon={User}
        />
        
        <FormInput
          label="Telefone"
          name="phone"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          required
          error={errors.phone}
          placeholder="(11) 99999-9999"
          icon={Phone}
          disabled
          mask="phone"
        />
        
        <FormInput
          label="E-mail (opcional)"
          name="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          error={errors.email}
          placeholder="cliente@email.com"
          icon={Mail}
        />
        
        <div className="flex gap-3 pt-2">
          <Button 
            variant="outline" 
            onClick={onClose} 
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button 
            onClick={onSubmit} 
            loading={isSubmitting}
            className="flex-1"
          >
            Cadastrar
          </Button>
        </div>
        
        <p className="text-xs text-gray-400 text-center">
          Após o cadastro, o cliente será automaticamente vinculado à venda.
        </p>
      </div>
    </Modal>
  )
}

export default QuickCustomerForm