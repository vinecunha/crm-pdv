import React, { useState } from 'react'
import { User, Mail, Phone, Calendar, MapPin, Hash, Search } from '../../lib/icons'
import FormInput from '../forms/FormInput'
import Button from '../ui/Button'

const CustomerForm = ({ 
  formData, 
  formErrors, 
  onChange, 
  onSubmit, 
  onCancel, 
  isSubmitting,
  isEditing,
  showFeedback 
}) => {
  const [loadingCEP, setLoadingCEP] = useState(false)

  const consultarCEP = async () => {
    const cep = formData.zip_code
    if (!cep) {
      showFeedback?.('error', 'Digite um CEP')
      return
    }

    const cepLimpo = cep.replace(/\D/g, '')
    if (cepLimpo.length !== 8) {
      showFeedback?.('error', 'CEP deve ter 8 dígitos')
      return
    }

    setLoadingCEP(true)
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cep/v1/${cepLimpo}`)
      
      if (!response.ok) {
        throw new Error('CEP não encontrado')
      }
      
      const data = await response.json()
      
      onChange({ target: { name: 'address', value: data.street || '' } })
      onChange({ target: { name: 'city', value: data.city || '' } })
      onChange({ target: { name: 'state', value: data.state || '' } })
      
      showFeedback?.('success', 'Endereço preenchido automaticamente!')
      
    } catch (error) {
      showFeedback?.('error', 'CEP não encontrado')
    } finally {
      setLoadingCEP(false)
    }
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
      <div className="space-y-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-2">
          <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">Campos obrigatórios *</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label="Nome Completo *"
            name="name"
            value={formData.name || ''}
            onChange={onChange}
            required
            error={formErrors.name}
            placeholder="Digite o nome completo"
            icon={User}
          />
          
          <FormInput
            label="E-mail *"
            name="email"
            type="email"
            value={formData.email || ''}
            onChange={onChange}
            required
            error={formErrors.email}
            placeholder="cliente@email.com"
            icon={Mail}
          />
          
          <FormInput
            label="Telefone *"
            name="phone"
            value={formData.phone || ''}
            onChange={onChange}
            required
            error={formErrors.phone}
            placeholder="(11) 99999-9999"
            icon={Phone}
            mask="phone"
          />
          
          <FormInput
            label="CPF/CNPJ"
            name="document"
            value={formData.document || ''}
            onChange={onChange}
            placeholder="123.456.789-00"
            icon={Hash}
            mask="cpfCnpj"
            helperText="Opcional"
          />
          
          <FormInput
            label="Data de Nascimento"
            name="birth_date"
            type="date"
            value={formData.birth_date || ''}
            onChange={onChange}
            icon={Calendar}
            helperText="Opcional"
          />
          
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Status</label>
            <select
              name="status"
              value={formData.status || 'active'}
              onChange={onChange}
              className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg"
            >
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
            </select>
          </div>
        </div>

        {/* Endereço */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-2">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
            Endereço <span className="text-xs text-gray-400 dark:text-gray-500 font-normal">(opcional)</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* CEP com botão */}
            <div className="relative">
              <FormInput
                label="CEP"
                name="zip_code"
                value={formData.zip_code || ''}
                onChange={onChange}
                placeholder="12345-678"
                mask="cep"
              />
              <button
                type="button"
                onClick={consultarCEP}
                disabled={loadingCEP || !formData.zip_code}
                className="absolute right-3 top-8 p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg disabled:opacity-50"
                title="Consultar CEP"
              >
                <Search size={16} className={loadingCEP ? 'animate-spin' : ''} />
              </button>
            </div>

            <FormInput
              label="Endereço"
              name="address"
              value={formData.address || ''}
              onChange={onChange}
              placeholder="Rua, número, complemento"
              icon={MapPin}
            />
            
            <FormInput
              label="Cidade"
              name="city"
              value={formData.city || ''}
              onChange={onChange}
              placeholder="Cidade"
            />
            
            <FormInput
              label="Estado"
              name="state"
              value={formData.state || ''}
              onChange={onChange}
              placeholder="UF"
              maxLength={2}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
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