import React from 'react'
import ConfirmModal from '@components/ui/ConfirmModal'
import UserRoleBadge from '@components/users/UserRoleBadge'

const UserDeleteModal = ({ isOpen, onClose, user, onConfirm, isSubmitting }) => {
  if (!user) return null

  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      loading={isSubmitting}
      title="Confirmar Exclusão"
      message={
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Você está prestes a excluir o usuário:</p>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 mb-4">
            <p className="font-medium text-gray-900 dark:text-white">{user.full_name || user.email?.split('@')[0]}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 break-all">{user.email}</p>
            <span className="inline-block mt-1">
              <UserRoleBadge role={user.role} size="sm" />
            </span>
          </div>
          <p className="text-xs text-red-600 dark:text-red-400">
            ⚠️ Esta ação não pode ser desfeita.
          </p>
        </div>
      }
      confirmText="Sim, excluir"
      variant="danger"
    />
  )
}

export default UserDeleteModal