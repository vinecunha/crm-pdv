import React from 'react'
import { Package, DollarSign, Hash } from '@lib/icons'
import FormInput from '@components/forms/FormInput'
import Button from '@components/ui/Button'

const ProductForm = ({ 
  formData, 
  formErrors, 
  onChange, 
  onSubmit, 
  onCancel, 
  isSubmitting,
  isEditing,
  units,
  categories 
}) => {
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label="Código"
            name="code"
            value={formData.code}
            onChange={onChange}
            placeholder="001"
            icon={Hash}
            disabled={isEditing} // Não permite editar código de produto existente
            helperText={!isEditing ? "Código gerado automaticamente" : "Código não pode ser alterado"}
          />
          
          <FormInput
            label="Nome do Produto *"
            name="name"
            value={formData.name}
            onChange={onChange}
            required
            error={formErrors.name}
            placeholder="Nome do produto"
            icon={Package}
          />
          
          <div className="md:col-span-2">
            <FormInput
              label="Descrição"
              name="description"
              value={formData.description}
              onChange={onChange}
              placeholder="Descrição detalhada do produto"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Categoria
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={onChange}
              className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione uma categoria</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Unidade
            </label>
            <select
              name="unit"
              value={formData.unit}
              onChange={onChange}
              className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {units.map(unit => (
                <option key={unit.value} value={unit.value}>{unit.label}</option>
              ))}
            </select>
          </div>
          
          <FormInput
            label="Preço de Venda (R$)"
            name="price"
            type="number"
            step="0.01"
            min="0"
            value={formData.price}
            onChange={onChange}
            placeholder="0,00"
            icon={DollarSign}
          />
          
          <FormInput
            label="Estoque Mínimo"
            name="min_stock"
            type="number"
            step="0.01"
            min="0"
            value={formData.min_stock}
            onChange={onChange}
            placeholder="0"
          />
          
          <FormInput
            label="Estoque Máximo"
            name="max_stock"
            type="number"
            step="0.01"
            min="0"
            value={formData.max_stock}
            onChange={onChange}
            placeholder="0"
          />
          
          <FormInput
            label="Localização"
            name="location"
            value={formData.location}
            onChange={onChange}
            placeholder="Prateleira, corredor..."
          />
          
          <FormInput
            label="Marca"
            name="brand"
            value={formData.brand}
            onChange={onChange}
            placeholder="Marca do produto"
          />
          
          <FormInput
            label="Peso (kg)"
            name="weight"
            type="number"
            step="0.001"
            min="0"
            value={formData.weight}
            onChange={onChange}
            placeholder="0,000"
          />
        </div>
        
        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            name="is_active"
            checked={formData.is_active}
            onChange={onChange}
            className="w-4 h-4 text-blue-600 dark:text-blue-400 rounded focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600"
          />
          <label className="text-sm text-gray-700 dark:text-gray-200">
            Produto ativo para venda no PDV
          </label>
        </div>
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
          {isEditing ? 'Atualizar' : 'Cadastrar'}
        </Button>
      </div>
    </form>
  )
}

export default ProductForm
