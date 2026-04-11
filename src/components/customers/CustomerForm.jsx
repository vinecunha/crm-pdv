import React from 'react'
import { User, Mail, Phone, Calendar, MapPin } from 'lucide-react'
import FormInput from '../forms/FormInput'
import Button from '../ui/Button'

const CustomerForm = ({ 
  formData, 
  formErrors, 
  onChange, 
  onSubmit, 
  onCancel, 
  isSubmitting,
  isEditing 
}) => {
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label="Nome Completo"
            name="name"
            value={formData.name}
            onChange={onChange}
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
            onChange={onChange}
            required
            error={formErrors.email}
            placeholder="cliente@email.com"
            icon={Mail}
          />
          
          <FormInput
            label="Telefone"
            name="phone"
            value={formData.phone}
            onChange={onChange}
            required
            error={formErrors.phone}
            placeholder="(11) 99999-9999"
            icon={Phone}
          />
          
          <FormInput
            label="CPF/CNPJ"
            name="document"
            value={formData.document}
            onChange={onChange}
            placeholder="123.456.789-00"
          />
          
          <FormInput
            label="Data de Nascimento"
            name="birth_date"
            type="date"
            value={formData.birth_date}
            onChange={onChange}
            icon={Calendar}
          />
          
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={onChange}
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
              onChange={onChange}
              placeholder="Rua, número, complemento"
              icon={MapPin}
            />
            
            <FormInput
              label="Cidade"
              name="city"
              value={formData.city}
              onChange={onChange}
              placeholder="Cidade"
            />
            
            <FormInput
              label="Estado"
              name="state"
              value={formData.state}
              onChange={onChange}
              placeholder="UF"
              maxLength={2}
            />
            
            <FormInput
              label="CEP"
              name="zip_code"
              value={formData.zip_code}
              onChange={onChange}
              placeholder="12345-678"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" loading={isSubmitting}>
          {isEditing ? 'Atualizar' : 'Cadastrar'}
        </Button>
      </div>
    </form>
  )
}

export default CustomerForm