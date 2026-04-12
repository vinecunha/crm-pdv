import React from 'react'
import { AlertTriangle } from 'lucide-react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'

const UnlockClearAllModal = ({ isOpen, onClose, onConfirm, count, isLoading }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Desbloquear Todos os Usuários" size="sm">
      <div className="space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-yellow-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800">
                Tem certeza que deseja desbloquear todos os usuários?
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                {count} usuário(s) serão desbloqueados imediatamente.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onClose} disabled={isLoading} className="flex-1">
            Cancelar
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={isLoading} className="flex-1">
            Confirmar
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default UnlockClearAllModal