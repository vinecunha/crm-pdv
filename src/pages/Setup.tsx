import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Settings as SettingsIcon } from '@lib/icons'
import { setupCompany, fetchCompanySettings } from '@services/system/companyService'
import PageHeader from '@components/ui/PageHeader'
import Button from '@components/ui/Button'
import FormInput from '@components/forms/FormInput'
import SplashScreen from '@components/ui/SplashScreen'
import { logger } from '@utils/logger'

const brazilianStates = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
]

const Setup: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    company_name: '',
    cnpj: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    primary_color: '#2563eb',
    secondary_color: '#7c3aed'
  })

  useEffect(() => {
    const checkExisting = async () => {
      const settings = await fetchCompanySettings()
      if (settings) {
        navigate('/login', { replace: true })
        return
      }
      setChecking(false)
    }
    checkExisting()
  }, [navigate])

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.company_name.trim()) {
      setError('Nome da empresa é obrigatório')
      return
    }
    setLoading(true)
    setError('')
    try {
      const result = await setupCompany({
        company_name: form.company_name,
        cnpj: form.cnpj || null,
        email: form.email || null,
        phone: form.phone || null,
        address: form.address || null,
        city: form.city || null,
        state: form.state || null,
        zip_code: form.zip_code || null,
        primary_color: form.primary_color,
        secondary_color: form.secondary_color
      })
      if (result?.success === false) {
        throw new Error(result.error || 'Erro ao configurar empresa')
      }
      navigate('/login', { replace: true })
    } catch (err: any) {
      logger.error('Erro no setup:', err)
      setError(err.message || 'Erro ao salvar configurações')
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return <SplashScreen fullScreen message="Verificando configurações..." />
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-8">
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sm:p-8">
        <PageHeader
          title="Configuração Inicial"
          description="Configure os dados da sua empresa para começar a usar o sistema"
          icon={SettingsIcon}
        />

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Dados da Empresa
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <FormInput
                  label="Nome da Empresa"
                  name="company_name"
                  value={form.company_name}
                  onChange={(e) => handleChange('company_name', e.target.value)}
                  placeholder="Ex: Minha Empresa Ltda"
                  required
                />
              </div>

              <FormInput
                label="CNPJ"
                name="cnpj"
                value={form.cnpj}
                onChange={(e) => handleChange('cnpj', e.target.value)}
                placeholder="00.000.000/0001-00"
                mask="cnpj"
              />

              <FormInput
                label="Email"
                name="email"
                type="email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="contato@empresa.com"
              />

              <FormInput
                label="Telefone"
                name="phone"
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="(11) 99999-9999"
                mask="phone"
              />

              <div className="md:col-span-2">
                <FormInput
                  label="Endereço"
                  name="address"
                  value={form.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="Rua Exemplo, 123"
                />
              </div>

              <FormInput
                label="Cidade"
                name="city"
                value={form.city}
                onChange={(e) => handleChange('city', e.target.value)}
                placeholder="São Paulo"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Estado
                </label>
                <select
                  value={form.state}
                  onChange={(e) => handleChange('state', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione...</option>
                  {brazilianStates.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <FormInput
                label="CEP"
                name="zip_code"
                value={form.zip_code}
                onChange={(e) => handleChange('zip_code', e.target.value)}
                placeholder="00000-000"
                mask="cep"
              />
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Personalização
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Cor Primária
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.primary_color}
                    onChange={(e) => handleChange('primary_color', e.target.value)}
                    className="w-12 h-10 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                  />
                  <FormInput
                    name="primary_color"
                    value={form.primary_color}
                    onChange={(e) => handleChange('primary_color', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Cor Secundária
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.secondary_color}
                    onChange={(e) => handleChange('secondary_color', e.target.value)}
                    className="w-12 h-10 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                  />
                  <FormInput
                    name="secondary_color"
                    value={form.secondary_color}
                    onChange={(e) => handleChange('secondary_color', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            fullWidth
            style={{ backgroundColor: loading ? undefined : form.primary_color }}
          >
            {loading ? 'Salvando...' : 'Salvar e Continuar'}
          </Button>
        </form>
      </div>
    </div>
  )
}

export default Setup
