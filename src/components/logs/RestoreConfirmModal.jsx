import React from 'react'
import { AlertTriangle, RotateCcw } from '../../lib/icons'
import Modal from '../ui/Modal'
import Button from '../ui/Button'

const RestoreConfirmModal = ({ isOpen, onClose, record, onConfirm, isLoading }) => {
  if (!record) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirmar Restauração" size="sm">
      <div className="space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-yellow-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800">
                Tem certeza que deseja restaurar este registro?
              </p>
              <p className="text-xs text-yellow-700 mt-2">
                <strong>{record._typeLabel}:</strong> {record.name || record.full_name || record.code}
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                O registro voltará a ficar disponível no sistema.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onClose} disabled={isLoading} className="flex-1">
            Cancelar
          </Button>
          <Button variant="success" onClick={onConfirm} loading={isLoading} className="flex-1">
            <RotateCcw size={16} className="mr-1" />
            Restaurar
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default RestoreConfirmModal