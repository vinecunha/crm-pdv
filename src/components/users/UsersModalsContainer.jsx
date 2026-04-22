// src/components/users/UsersModalsContainer.jsx
import React from 'react'
import Modal from '@components/ui/Modal'
import Button from '@components/ui/Button'
import { AlertTriangle } from '@lib/icons'
import UserForm from './UserForm'
import UserDeleteModal from './UserDeleteModal'

const UsersModalsContainer = ({
  showModal,
  onCloseModal,
  editingUser,
  formData,
  setFormData,
  onSubmit,
  isSubmitting,
  canChangeRole,
  showDeleteModal,
  onCloseDeleteModal,
  userToDelete,
  onConfirmDelete,
  isDeleting,
  showUnlockAllModal,
  onCloseUnlockAllModal,
  onConfirmUnlockAll,
  isUnlockingAll,
  unlockStats
}) => {
  return (
    <>
      {/* Modal de Formulário */}
      <Modal 
        isOpen={showModal} 
        onClose={!isSubmitting ? onCloseModal : undefined} 
        title={editingUser ? 'Editar Usuário' : 'Novo Usuário'}
      >
        <UserForm 
          editingUser={editingUser} 
          formData={formData} 
          setFormData={setFormData} 
          onSubmit={onSubmit} 
          onCancel={onCloseModal} 
          isSubmitting={isSubmitting} 
          canChangeRole={canChangeRole} 
        />
      </Modal>

      {/* Modal de Exclusão */}
      <UserDeleteModal 
        isOpen={showDeleteModal} 
        onClose={onCloseDeleteModal} 
        user={userToDelete} 
        onConfirm={onConfirmDelete} 
        isSubmitting={isDeleting} 
      />

      {/* Modal de Desbloqueio em Massa */}
      <Modal 
        isOpen={showUnlockAllModal} 
        onClose={onCloseUnlockAllModal} 
        title="Desbloquear Todos" 
        size="sm"
      >
        <div className="space-y-4">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle size={18} className="text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                Tem certeza que deseja desbloquear todos os {unlockStats?.totalBlocked || 0} usuários?
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={onCloseUnlockAllModal} 
              disabled={isUnlockingAll} 
              className="flex-1 order-2 sm:order-1"
            >
              Cancelar
            </Button>
            <Button 
              variant="success" 
              onClick={onConfirmUnlockAll} 
              loading={isUnlockingAll} 
              className="flex-1 order-1 sm:order-2"
            >
              Confirmar
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

export default UsersModalsContainer