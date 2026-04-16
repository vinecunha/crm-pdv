import React from 'react'
import { AlertTriangle } from '../../lib/icons'
import Modal from '../ui/Modal'
import Button from '../ui/Button'

const FinishSessionModal = ({
  isOpen,
  onClose,
  stats,
  onFinish,
  onCancel,
  isSubmitting
}) => {
  const pendingItems = stats.totalItems - stats.countedItems

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Finalizar Balanço"
      size="md"
    >
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-4 dark:bg-gray-900">
          <h3 className="font-medium mb-3 dark:text-white">Resumo do Balanço</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Total de Itens:</span>
              <span className="font-medium dark:text-white">{stats.totalItems}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Itens Contados:</span>
              <span className="font-medium text-green-600 dark:text-green-400">{stats.countedItems}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Itens Pendentes:</span>
              <span className="font-medium text-orange-600 dark:text-orange-400">{pendingItems}</span>
            </div>
            <div className="flex justify-between pt-2 border-t dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">Divergências Encontradas:</span>
              <span className={`font-medium ${stats.differences > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}`}>
                {stats.differences}
              </span>
            </div>
          </div>
        </div>

        {pendingItems > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 dark:bg-yellow-900/20 dark:border-yellow-800">
            <p className="text-sm text-yellow-800 flex items-center gap-2 dark:text-yellow-300">
              <AlertTriangle size={16} />
              Existem {pendingItems} itens não contados.
              Estes itens manterão o estoque atual do sistema.
            </p>
          </div>
        )}

        {stats.differences > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 dark:bg-blue-900/20 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>Ajustes serão aplicados:</strong> O estoque será atualizado
              com as quantidades contadas para os itens com divergência.
            </p>
          </div>
        )}

        <div className="bg-red-50 border border-red-200 rounded-lg p-3 dark:bg-red-900/20 dark:border-red-800">
          <p className="text-sm text-red-800 dark:text-red-300">
            <strong>Atenção:</strong> Esta ação não pode ser desfeita.
            O estoque será atualizado com base nesta contagem.
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t dark:border-gray-700">
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button variant="danger" onClick={onCancel} disabled={isSubmitting}>
          Cancelar Balanço
        </Button>
        <Button variant="success" onClick={onFinish} loading={isSubmitting}>
          Finalizar e Aplicar Ajustes
        </Button>
      </div>
    </Modal>
  )
}

export default FinishSessionModal