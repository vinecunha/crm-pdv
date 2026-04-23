import React, { useState } from 'react'
import { Key, Shield, AlertCircle } from '@lib/icons'
import Button from '@components/ui/Button'
import ChangePasswordModal from './ChangePasswordModal'

const SecuritySection = ({ user, onChangePassword, onLogout }) => {
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  return (
    <>
      <div className="space-y-6">
        {/* Alterar Senha */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Key size={20} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Alterar Senha</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Recomendamos usar uma senha forte que você não usa em outros sites
                </p>
              </div>
            </div>
            <Button size="sm" onClick={() => setShowPasswordModal(true)}>
              Alterar
            </Button>
          </div>
        </div>

        {/* Sessões Ativas */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Shield size={20} className="text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Sessões Ativas</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Você está logado neste dispositivo
                </p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={onLogout}>
              Sair de todos
            </Button>
          </div>
        </div>

        {/* Excluir Conta */}
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <AlertCircle size={20} className="text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h4 className="font-medium text-red-900 dark:text-red-300">Excluir Conta</h4>
                <p className="text-sm text-red-700 dark:text-red-400">
                  Esta ação é permanente e não pode ser desfeita
                </p>
              </div>
            </div>
            <Button size="sm" variant="danger" disabled>
              Excluir
            </Button>
          </div>
        </div>
      </div>

      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        user={user}
        onChangePassword={onChangePassword}
      />
    </>
  )
}

export default SecuritySection
