import React from 'react'
import { FileText, Building, Calendar, Box, DollarSign } from 'lucide-react'
import FormInput from '../forms/FormInput'
import Button from '../ui/Button'

const ProductEntryForm = ({ 
  formData, 
  formErrors, 
  onChange, 
  onSubmit, 
  onCancel, 
  isSubmitting,
  productName 
}) => {
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label="Número da NF"
            name="invoice_number"
            value={formData.invoice_number}
            onChange={onChange}
            required
            error={formErrors.invoice_number}
            placeholder="000000"
            icon={FileText}
          />
          
          <FormInput
            label="Série da NF"
            name="invoice_series"
            value={formData.invoice_series}
            onChange={onChange}
            placeholder="1"
          />
          
          <FormInput
            label="Fornecedor"
            name="supplier_name"
            value={formData.supplier_name}
            onChange={onChange}
            placeholder="Nome do fornecedor"
            icon={Building}
          />
          
          <FormInput
            label="CNPJ do Fornecedor"
            name="supplier_cnpj"
            value={formData.supplier_cnpj}
            onChange={onChange}
            placeholder="00.000.000/0001-00"
          />
          
          <FormInput
            label="Número do Lote"
            name="batch_number"
            value={formData.batch_number}
            onChange={onChange}
            placeholder="Lote"
          />
          
          <FormInput
            label="Data de Fabricação"
            name="manufacture_date"
            type="date"
            value={formData.manufacture_date}
            onChange={onChange}
            icon={Calendar}
          />
          
          <FormInput
            label="Data de Validade"
            name="expiration_date"
            type="date"
            value={formData.expiration_date}
            onChange={onChange}
            icon={Calendar}
          />
          
          <FormInput
            label="Quantidade"
            name="quantity"
            type="number"
            step="0.01"
            value={formData.quantity}
            onChange={onChange}
            required
            error={formErrors.quantity}
            placeholder="0,00"
            icon={Box}
          />
          
          <FormInput
            label="Valor Unitário (R$)"
            name="unit_cost"
            type="number"
            step="0.01"
            value={formData.unit_cost}
            onChange={onChange}
            required
            error={formErrors.unit_cost}
            placeholder="0,00"
            icon={DollarSign}
          />
        </div>
        
        <FormInput
          label="Observações"
          name="notes"
          value={formData.notes}
          onChange={onChange}
          placeholder="Observações sobre esta entrada"
        />
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
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