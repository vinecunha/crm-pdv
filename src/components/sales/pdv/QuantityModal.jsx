import React from 'react'
import { Package, Minus, Plus } from 'lucide-react'
import Modal from '../../ui/Modal'
import Button from '../../ui/Button'
import { formatCurrency } from '../../../utils/formatters'

const QuantityModal = ({ 
  isOpen, 
  onClose, 
  item, 
  maxStock, 
  tempQuantity, 
  setTempQuantity, 
  onConfirm, 
  onRemove 
}) => {
  if (!item) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Alterar Quantidade" size="sm">
      <div className="space-y-4">
        <div className="text-center">
          <Package size={48} className="mx-auto text-blue-600 mb-3" />
          <p className="font-medium text-gray-900">{item.name}</p>
          <p className="text-sm text-gray-500">{formatCurrency(item.price)} / {item.unit}</p>
        </div>
        
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setTempQuantity(Math.max(1, tempQuantity - 1))}
            className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <Minus size={20} />
          </button>
          <div className="text-center">
            <input
              type="number"
              min="1"
              max={maxStock}
              value={tempQuantity}
              onChange={(e) => setTempQuantity(Math.min(maxStock, Math.max(1, parseInt(e.target.value) || 1)))}
              className="w-24 text-center text-2xl font-bold py-2 border border-gray-300 rounded-lg"
            />
            <p className="text-xs text-gray-500 mt-1">Estoque: {maxStock} {item.unit}</p>
          </div>
          <button
            onClick={() => setTempQuantity(tempQuantity + 1)}
            disabled={tempQuantity >= maxStock}
            className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors disabled:opacity-50"
          >
            <Plus size={20} />
          </button>
        </div>
        
        <div className="text-center pt-2">
          <p className="text-sm text-gray-600">Total do item</p>
          <p className="text-xl font-bold text-green-600">
            {formatCurrency(item.price * tempQuantity)}
          </p>
        </div>
        
        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onRemove} className="flex-1">
            Remover Item
          </Button>
          <Button onClick={onConfirm} className="flex-1">
            Confirmar
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default QuantityModal