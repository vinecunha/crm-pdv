import React, { useEffect, useRef } from 'react'
import { Calculator, CheckCircle, AlertTriangle, Package, Hash, Calendar } from '../../lib/icons'
import Modal from '../ui/Modal'
import FormInput from '../forms/FormInput'
import Button from '../ui/Button'
import { formShortcuts } from '../../utils/formShortcuts'

const CountItemModal = ({
  isOpen,
  onClose,
  selectedItem,
  form,
  setForm,
  errors,
  onSubmit,
  isSubmitting,
  // Novos props para navegação
  onNext,
  onPrevious,
  hasNext,
  hasPrevious,
  currentIndex,
  totalItems
}) => {
  const quantityInputRef = useRef(null)

  // Auto-focus no campo de quantidade quando abrir
  useEffect(() => {
    if (isOpen && quantityInputRef.current) {
      // Pequeno delay para garantir que o modal está renderizado
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

  // Handler para Enter no campo de quantidade
  const handleQuantityKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (form.counted_quantity && !isNaN(countedValue) && countedValue >= 0) {
        onSubmit()
      }
    }
  }

  // Handler para atalho de próximo/anterior
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
          <Package size={20} className="text-blue-600" />
          <span>Contar: {selectedItem.product?.name}</span>
          {totalItems > 0 && (
            <span className="ml-auto text-sm font-normal text-gray-500">
              {currentIndex + 1} de {totalItems}
            </span>
          )}
        </div>
      }
      size="md"
    >
      <div className="space-y-4">
        {/* Informações do Produto */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Hash size={12} />
                Código
              </p>
              <p className="font-mono text-sm">{selectedItem.product?.code || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Unidade</p>
              <p className="font-medium">{selectedItem.product?.unit || 'un'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Package size={12} />
                Estoque no Sistema
              </p>
              <p className="text-xl font-bold text-gray-900">{selectedItem.system_quantity}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Último Custo</p>
              <p className="text-green-600 font-medium">
                R$ {selectedItem.system_cost?.toFixed(2) || '0,00'}
              </p>
            </div>
          </div>
          
          {selectedItem.product?.updated_at && (
            <div className="mt-3 pt-3 border-t border-blue-200">
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Calendar size={12} />
                Última atualização
              </p>
              <p className="text-sm">
                {new Date(selectedItem.product.updated_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
          )}
        </div>

        {/* Campo de Quantidade com Atalho */}
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

        {/* Campo de Observações */}
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

        {/* Preview da Divergência */}
        {form.counted_quantity && !isNaN(countedValue) && (
          <div className={`p-3 rounded-lg border ${
            isMatched
              ? 'bg-green-50 border-green-200'
              : 'bg-orange-50 border-orange-200'
          }`}>
            <p className="text-sm flex items-center gap-2">
              {isMatched ? (
                <>
                  <CheckCircle size={18} className="text-green-600" />
                  <span className="text-green-700 font-medium">
                    Quantidade confere com o sistema
                  </span>
                </>
              ) : (
                <>
                  <AlertTriangle size={18} className="text-orange-600" />
                  <span className="text-orange-700 font-medium">
                    Divergência de {difference > 0 ? '+' : ''}{difference.toFixed(2)} {selectedItem.product?.unit}
                  </span>
                </>
              )}
            </p>
          </div>
        )}

        {/* Indicador de Navegação */}
        {(hasPrevious || hasNext) && (
          <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-100 border rounded">↑</kbd>
              Anterior
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-100 border rounded">↓</kbd>
              Próximo
            </span>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mt-6 pt-4 border-t">
        {/* Navegação entre itens */}
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

        {/* Ações principais */}
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