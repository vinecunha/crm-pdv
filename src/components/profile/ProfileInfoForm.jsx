import React from 'react'
import { Phone, MapPin, Calendar, Hash, User, AtSign } from 'lucide-react'
import FormInput from '../forms/FormInput'

const ProfileInfoForm = ({ formData, formErrors, onChange }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormInput
          label="Nome Completo"
          name="full_name"
          value={formData.full_name}
          disabled
          readOnly
          placeholder="Seu nome completo"
          icon={User}
          helperText="Nome registrado na conta (não pode ser alterado)"
        />

        <FormInput
          label="Nome de Exibição"
          name="display_name"
          value={formData.display_name}
          onChange={onChange}
          placeholder="Como você quer ser chamado"
          icon={AtSign}
          helperText="Este nome aparecerá no sistema"
        />

        <FormInput
          label="Email"
          name="email"
          value={formData.email}
          disabled
          readOnly
          placeholder="seu@email.com"
          helperText="Email não pode ser alterado"
        />

        <FormInput
          label="Telefone"
          name="phone"
          value={formData.phone}
          onChange={onChange}
          placeholder="(11) 99999-9999"
          icon={Phone}
          mask="phone"
        />

        <FormInput
          label="CPF/CNPJ"
          name="document"
          value={formData.document}
          onChange={onChange}
          placeholder="123.456.789-00"
          icon={Hash}
          mask="cpfCnpj"
        />

        <FormInput
          label="Data de Nascimento"
          name="birth_date"
          type="date"
          value={formData.birth_date}
          onChange={onChange}
          icon={Calendar}
        />
      </div>

      {/* Endereço */}
      <div className="border-t pt-4 mt-4">
        <h4 className="font-medium text-gray-900 mb-4">Endereço</h4>

        <div className="space-y-4">
          <FormInput
            label="Endereço"
            name="address"
            value={formData.address}
            onChange={onChange}
            placeholder="Rua, número, complemento"
            icon={MapPin}
          />

          <div className="grid grid-cols-2 gap-4">
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
              mask="cep"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfileInfoForm