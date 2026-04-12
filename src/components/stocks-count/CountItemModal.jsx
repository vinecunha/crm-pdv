import React from 'react'
import { Calculator, CheckCircle, AlertTriangle } from 'lucide-react'
import Modal from '../ui/Modal'
import FormInput from '../forms/FormInput'
import Button from '../ui/Button'

const CountItemModal = ({
  isOpen,
  onClose,
  selectedItem,
  form,
  setForm,
  errors,
  onSubmit,
  isSubmitting
}) => {
  if (!selectedItem) return null

  const countedValue = parseFloat(form.counted_quantity)
  const isMatched = !isNaN(countedValue) && countedValue === selectedItem.system_quantity
  const difference = !isNaN(countedValue) ? countedValue - selectedItem.system_quantity : 0

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Contar: ${selectedItem.product?.name}`}
      size="md"
    >
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500">Código</p>
              <p className="font-mono">{selectedItem.product?.code || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Unidade</p>
              <p>{selectedItem.product?.unit}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Estoque no Sistema</p>
              <p className="text-lg font-semibold">{selectedItem.system_quantity}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Último Custo</p>
              <p className="text-green-600">
                R$ {selectedItem.system_cost?.toFixed(2) || '0,00'}
              </p>
            </div>
          </div>
        </div>

        <FormInput
          label="Quantidade Contada"
          name="counted_quantity"
          type="number"
          step="0.01"
          value={form.counted_quantity}
          onChange={(e) => setForm(prev => ({ ...prev, counted_quantity: e.target.value }))}
          placeholder={`Quantidade em ${selectedItem.product?.unit}`}
          required
          error={errors.counted_quantity}
          icon={Calculator}
          autoFocus
        />

        <FormInput
          label="Observações"
          name="notes"
          value={form.notes}
          onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Ex: Produto avariado, vencido, etc."
        />

        {form.counted_quantity && !isNaN(countedValue) && (
          <div className={`p-3 rounded-lg ${
            isMatched
              ? 'bg-green-50 border border-green-200'
              : 'bg-orange-50 border border-orange-200'
          }`}>
            <p className="text-sm">
              {isMatched ? (
                <span className="text-green-700 flex items-center gap-2">
                  <CheckCircle size={16} />
                  Quantidade confere com o sistema
                </span>
              ) : (
                <span className="text-orange-700 flex items-center gap-2">
                  <AlertTriangle size={16} />
                  Divergência de {difference > 0 ? '+' : ''}{difference} unidades
                </span>
              )}
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={onSubmit} loading={isSubmitting}>
          Registrar Contagem
        </Button>
      </div>
    </Modal>
  )
}

export default CountItemModal