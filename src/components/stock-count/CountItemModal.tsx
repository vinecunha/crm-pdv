import React, { useEffect, useRef } from 'react'
import { Calculator, CheckCircle, AlertTriangle, Package, Hash, Calendar } from '@lib/icons'
import Modal from '@components/ui/Modal'
import FormInput from '@components/forms/FormInput'
import Button from '@components/ui/Button'
import { formShortcuts } from '@utils/formShortcuts'

const CountItemModal = ({
  isOpen,
  onClose,
  selectedItem,
  form,
  setForm,
  errors,
  onSubmit,
  isSubmitting,
  onNext,
  onPrevious,
  hasNext,
  hasPrevious,
  currentIndex,
  totalItems
}) => {
  const quantityInputRef = useRef(null)

  useEffect(() => {
    if (isOpen && quantityInputRef.current) {
      setTimeout(() => {
        quantityInputRef.current?.focus()
        quantityInputRef.current?.select()
      }, 100)
    }
  }, [isOpen, selectedItem?.id])

  if (!selectedItem) return null

  const countedValue = parseFloat(form.counted_quantity)
  const isMatched = !isNaN(countedValue) && Math.abs(countedValue - selectedItem.system_quantity) < 0.001
  const difference = !isNaN(countedValue) ? countedValue - selectedItem.system_quantity : 0

  const handleQuantityKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (form.counted_quantity && !isNaN(countedValue) && countedValue >= 0) {
        onSubmit()
      }
    }
  }

  const handleShortcutAction = (action) => {
    if (action === 'next' && hasNext) {
      onNext?.()
    } else if (action === 'previous' && hasPrevious) {
      onPrevious?.()
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Package size={20} className="text-blue-600 dark:text-blue-400" />
          <span className="dark:text-white">Contar: {selectedItem.product?.name}</span>
          {totalItems > 0 && (
            <span className="ml-auto text-sm font-normal text-gray-500 dark:text-gray-400">
              {currentIndex + 1} de {totalItems}
            </span>
          )}
        </div>
      }
      size="md"
    >
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100 dark:from-blue-900/20 dark:to-indigo-900/20 dark:border-blue-800">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 flex items-center gap-1 dark:text-gray-400">
                <Hash size={12} />
                Código
              </p>
              <p className="font-mono text-sm dark:text-white">{selectedItem.product?.code || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Unidade</p>
              <p className="font-medium dark:text-white">{selectedItem.product?.unit || 'un'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 flex items-center gap-1 dark:text-gray-400">
                <Package size={12} />
                Estoque no Sistema
              </p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{selectedItem.system_quantity}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Último Custo</p>
              <p className="text-green-600 font-medium dark:text-green-400">
                R$ {selectedItem.system_cost?.toFixed(2) || '0,00'}
              </p>
            </div>
          </div>
          
          {selectedItem.product?.updated_at && (
            <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
              <p className="text-xs text-gray-500 flex items-center gap-1 dark:text-gray-400">
                <Calendar size={12} />
                Última atualização
              </p>
              <p className="text-sm dark:text-white">
                {new Date(selectedItem.product.updated_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
          )}
        </div>

        <FormInput
          ref={quantityInputRef}
          label="Quantidade Contada"
          name="counted_quantity"
          type="number"
          step="0.01"
          min="0"
          value={form.counted_quantity}
          onChange={(e) => setForm(prev => ({ ...prev, counted_quantity: e.target.value }))}
          onKeyDown={handleQuantityKeyDown}
          placeholder={`Digite a quantidade em ${selectedItem.product?.unit || 'unidades'}`}
          required
          error={errors.counted_quantity}
          icon={Calculator}
          autoFocus
          shortcut={{
            key: 'q',
            ctrl: true,
            description: 'Focar quantidade'
          }}
          helperText="Pressione Enter para confirmar rapidamente"
        />

        <FormInput
          label="Observações"
          name="notes"
          value={form.notes}
          onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Ex: Produto avariado, vencido, etc."
          shortcut={{
            key: 'o',
            ctrl: true,
            description: 'Adicionar observação'
          }}
        />

        {form.counted_quantity && !isNaN(countedValue) && (
          <div className={`p-3 rounded-lg border ${
            isMatched
              ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
              : 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800'
          }`}>
            <p className="text-sm flex items-center gap-2">
              {isMatched ? (
                <>
                  <CheckCircle size={18} className="text-green-600 dark:text-green-400" />
                  <span className="text-green-700 font-medium dark:text-green-300">
                    Quantidade confere com o sistema
                  </span>
                </>
              ) : (
                <>
                  <AlertTriangle size={18} className="text-orange-600 dark:text-orange-400" />
                  <span className="text-orange-700 font-medium dark:text-orange-300">
                    Divergência de {difference > 0 ? '+' : ''}{difference.toFixed(2)} {selectedItem.product?.unit}
                  </span>
                </>
              )}
            </p>
          </div>
        )}

        {(hasPrevious || hasNext) && (
          <div className="flex items-center justify-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-100 border rounded dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300">↑</kbd>
              Anterior
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-100 border rounded dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300">↓</kbd>
              Próximo
            </span>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mt-6 pt-4 border-t dark:border-gray-700">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onPrevious}
            disabled={!hasPrevious}
            shortcut={{ key: 'ArrowUp', description: 'Anterior' }}
          >
            ← Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onNext}
            disabled={!hasNext}
            shortcut={{ key: 'ArrowDown', description: 'Próximo' }}
          >
            Próximo →
          </Button>
        </div>

        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={onClose}
            shortcut={{ key: 'Escape', description: 'Cancelar' }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={onSubmit} 
            loading={isSubmitting}
            shortcut={{ key: 'Enter', description: 'Confirmar' }}
          >
            {isMatched ? 'Confirmar' : 'Registrar Divergência'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default CountItemModal
