import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Settings as SettingsIcon, Building2, ArrowRight } from '@lib/icons'
import PageHeader from '@components/ui/PageHeader'
import Button from '@components/ui/Button'
import FormInput from '@components/forms/FormInput'
import SplashScreen from '@components/ui/SplashScreen'
import FeedbackMessage from '@components/ui/FeedbackMessage'
import { useSetup } from '@hooks/system/useSetup'

const brazilianStates = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
]

const Setup: React.FC = () => {
  const navigate = useNavigate()
  const { loading, checking, error, checkExisting, createCompany } = useSetup()
  
  const [form, setForm] = React.useState({
    company_name: '',
    cnpj: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    primary_color: '#2563eb',
    secondary_color: '#7c3aed',
    domain: ''
  })

  useEffect(() => {
    checkExisting()
  }, [checkExisting])

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const [success, setSuccess] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.company_name.trim()) return

    setSuccess(false)
    const result = await createCompany(form)
    if (result.success) {
      setSuccess(true)
      setTimeout(() => {
        navigate('/login', { replace: true })
      }, 2000)
    }
  }

  if (checking) {
    return <SplashScreen fullScreen message="Verificando configurações..." />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white">
            <div className="flex items-center gap-3 mb-4">
              <Building2 size={32} />
              <div>
                <h1 className="text-2xl font-bold">Bem-vindo ao CRM-PDV</h1>
                <p className="text-blue-100">Configure sua empresa para começar</p>
              </div>
            </div>
          </div>

          <div className="p-8">
            <PageHeader
              title="Configuração Inicial"
              description="Preencha os dados da sua empresa para começar a usar o sistema"
              icon={SettingsIcon}
            />

            {error && (
              <FeedbackMessage type="error" message={error} position="static" />
            )}

            {success && (
              <FeedbackMessage 
                type="success" 
                message="Empresa configurada com sucesso! Redirecionando para o login..." 
                position="static" 
              />
            )}

            <form onSubmit={handleSubmit} className="space-y-6 mt-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Building2 size={20} />
                  Dados da Empresa
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <FormInput
                      label="Nome da Empresa *"
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
                    label="E-mail"
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

                  <FormInput
                    label="Domínio (opcional)"
                    name="domain"
                    value={form.domain}
                    onChange={(e) => handleChange('domain', e.target.value)}
                    placeholder="minhaempresa.com"
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
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
                        aria-label="Cor primária"
                      />
                      <FormInput
                        name="primary_color"
                        value={form.primary_color}
                        onChange={(e) => handleChange('primary_color', e.target.value)}
                        className="font-mono text-sm"
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
                        aria-label="Cor secundária"
                      />
                      <FormInput
                        name="secondary_color"
                        value={form.secondary_color}
                        onChange={(e) => handleChange('secondary_color', e.target.value)}
                        className="font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={loading}
                  fullWidth
                  style={{ backgroundColor: loading ? undefined : form.primary_color }}
                  icon={ArrowRight}
                  iconPosition="right"
                >
                  {loading ? 'Salvando...' : 'Salvar e Continuar'}
                </Button>
              </div>

              <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                <p>Após salvar, você será redirecionado para o login.</p>
                <p className="mt-1">O primeiro usuário a se cadastrar será o <strong class="text-gray-700 dark:text-gray-300">administrador</strong>.</p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Setup
