import React from 'react'
import { AlertTriangle } from 'lucide-react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import UserRoleBadge from './UserRoleBadge'

const UserDeleteModal = ({ isOpen, onClose, user, onConfirm, isSubmitting }) => {
  if (!user) return null

  return (
    <Modal isOpen={isOpen} onClose={() => !isSubmitting && onClose()} title="Confirmar Exclusão" size="sm">
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
          <AlertTriangle className="h-6 w-6 text-red-600" />
        </div>
        
        <h3 className="text-lg font-medium text-gray-900 mb-2">Tem certeza?</h3>
        <p className="text-sm text-gray-500 mb-4">Você está prestes a excluir o usuário:</p>
        
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <p className="font-medium text-gray-900">{user.full_name || user.email?.split('@')[0]}</p>
          <p className="text-xs text-gray-500 break-all">{user.email}</p>
          <span className="inline-block mt-1">
            <UserRoleBadge role={user.role} size="sm" />
          </span>
        </div>
        
        <p className="text-xs text-red-600 mb-6">
          ⚠️ Esta ação não pode ser desfeita. O usuário será permanentemente removido.
        </p>
        
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={onClose} fullWidth>Cancelar</Button>
          <Button type="button" variant="danger" onClick={onConfirm} loading={isSubmitting} fullWidth>Sim, excluir</Button>
        </div>
      </div>
    </Modal>
  )
}

export default UserDeleteModal