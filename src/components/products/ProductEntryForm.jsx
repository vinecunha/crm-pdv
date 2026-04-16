import React, { useState } from 'react'
import { FileText, Building, Calendar, Box, DollarSign, Search } from '../../lib/icons'
import FormInput from '../forms/FormInput'
import Button from '../ui/Button'

const ProductEntryForm = ({ 
  formData, 
  formErrors, 
  onChange, 
  onSubmit, 
  onCancel, 
  isSubmitting,
  productName,
  showFeedback 
}) => {
  const [loadingCNPJ, setLoadingCNPJ] = useState(false)

  const consultarCNPJ = async () => {
    const cnpj = formData.supplier_cnpj
    if (!cnpj) {
      showFeedback?.('error', 'Digite um CNPJ')
      return
    }

    const cnpjLimpo = cnpj.replace(/\D/g, '')
    if (cnpjLimpo.length !== 14) {
      showFeedback?.('error', 'CNPJ deve ter 14 dígitos')
      return
    }

    setLoadingCNPJ(true)
    try {
      // Usando Brasil API (gratuita e estável)
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`)
      
      if (!response.ok) {
        throw new Error('CNPJ não encontrado')
      }
      
      const data = await response.json()
      
      // Preencher nome do fornecedor
      const nomeFornecedor = data.razao_social || data.nome_fantasia || ''
      onChange({ target: { name: 'supplier_name', value: nomeFornecedor } })
      
      showFeedback?.('success', `Fornecedor: ${nomeFornecedor}`)
      
    } catch (error) {
      console.error('Erro ao consultar CNPJ:', error)
      showFeedback?.('error', 'CNPJ não encontrado ou serviço indisponível')
    } finally {
      setLoadingCNPJ(false)
    }
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
      <div className="space-y-4">
        {productName && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-2">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <span className="font-medium">Produto:</span> {productName}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label="Número da NF *"
            name="invoice_number"
            value={formData.invoice_number || ''}
            onChange={onChange}
            required
            error={formErrors.invoice_number}
            placeholder="000000"
            icon={FileText}
          />
          
          <FormInput
            label="Série da NF"
            name="invoice_series"
            value={formData.invoice_series || ''}
            onChange={onChange}
            placeholder="1"
          />
          
          <div className="relative">
            <FormInput
              label="CNPJ do Fornecedor"
              name="supplier_cnpj"
              value={formData.supplier_cnpj || ''}
              onChange={onChange}
              placeholder="00.000.000/0001-00"
              mask="cnpj"
            />
            <button
              type="button"
              onClick={consultarCNPJ}
              disabled={loadingCNPJ || !formData.supplier_cnpj}
              className="absolute right-3 top-8 p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors disabled:opacity-50"
              title="Consultar CNPJ"
            >
              <Search size={16} className={loadingCNPJ ? 'animate-spin' : ''} />
            </button>
          </div>
          
          <FormInput
            label="Fornecedor"
            name="supplier_name"
            value={formData.supplier_name || ''}
            onChange={onChange}
            placeholder="Nome do fornecedor"
            icon={Building}
          />
          
          <FormInput
            label="Número do Lote"
            name="batch_number"
            value={formData.batch_number || ''}
            onChange={onChange}
            placeholder="Lote"
          />
          
          <FormInput
            label="Data de Fabricação"
            name="manufacture_date"
            type="date"
            value={formData.manufacture_date || ''}
            onChange={onChange}
            icon={Calendar}
          />
          
          <FormInput
            label="Data de Validade"
            name="expiration_date"
            type="date"
            value={formData.expiration_date || ''}
            onChange={onChange}
            icon={Calendar}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label="Quantidade *"
            name="quantity"
            type="number"
            step="0.01"
            min="0.01"
            value={formData.quantity || ''}
            onChange={onChange}
            required
            error={formErrors.quantity}
            placeholder="0,00"
            icon={Box}
          />
          
          <FormInput
            label="Valor Unitário (R$) *"
            name="unit_cost"
            type="number"
            step="0.01"
            min="0.01"
            value={formData.unit_cost || ''}
            onChange={onChange}
            required
            error={formErrors.unit_cost}
            placeholder="0,00"
            icon={DollarSign}
          />
        </div>
        
        {formData.quantity && formData.unit_cost && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">Valor Total da Entrada:</p>
            <p className="text-xl font-bold text-green-600 dark:text-green-400">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
                .format(parseFloat(formData.quantity) * parseFloat(formData.unit_cost))}
            </p>
          </div>
        )}
        
        <FormInput
          label="Observações"
          name="notes"
          value={formData.notes || ''}
          onChange={onChange}
          placeholder="Observações sobre esta entrada"
        />
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button type="submit" variant="primary" loading={isSubmitting}>
          Registrar Entrada
        </Button>
      </div>
    </form>
  )
}

export default ProductEntryForm