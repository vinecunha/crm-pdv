import React from 'react'
import Modal from '../ui/Modal'
import { formatDateTime } from '../../utils/formatters'

const LogDetailsModal = ({ isOpen, onClose, log, getActionLabel }) => {
  if (!log) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detalhes do Log" size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase">Data/Hora</label>
            <p className="mt-1 text-sm text-gray-900">{formatDateTime(log.created_at)}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase">Usuário</label>
            <p className="mt-1 text-sm text-gray-900">{log.user_email || 'Sistema'}</p>
            {log.user_role && <span className="inline-block mt-1 text-xs text-gray-500 capitalize">{log.user_role}</span>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase">Ação</label>
            <p className="mt-1 text-sm text-gray-900">{getActionLabel(log.action)}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase">Entidade</label>
            <p className="mt-1 text-sm text-gray-900 capitalize">{log.entity_type || '-'}</p>
            {log.entity_id && <p className="text-xs text-gray-500 font-mono mt-1 break-all">ID: {log.entity_id}</p>}
          </div>
        </div>

        {log.ip_address && (
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase">IP Address</label>
            <p className="mt-1 text-sm text-gray-900 font-mono">{log.ip_address}</p>
          </div>
        )}

        {log.user_agent && (
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase">Navegador</label>
            <p className="mt-1 text-xs text-gray-500 break-words">{log.user_agent}</p>
          </div>
        )}

        {log.old_data && (
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase">Dados Antigos</label>
            <pre className="mt-1 p-3 bg-gray-50 rounded-lg text-xs overflow-x-auto max-h-40">
              {JSON.stringify(log.old_data, null, 2)}
            </pre>
          </div>
        )}

        {log.new_data && (
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase">Dados Novos</label>
            <pre className="mt-1 p-3 bg-gray-50 rounded-lg text-xs overflow-x-auto max-h-40">
              {JSON.stringify(log.new_data, null, 2)}
            </pre>
          </div>
        )}

        {log.details && (
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase">Detalhes Adicionais</label>
            <pre className="mt-1 p-3 bg-gray-50 rounded-lg text-xs overflow-x-auto max-h-40">
              {JSON.stringify(log.details, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default LogDetailsModal