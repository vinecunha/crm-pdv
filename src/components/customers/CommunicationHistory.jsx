import React from 'react'
import { History, MessageSquare } from '@lib/icons'
import { formatDateTime } from '@utils/formatters'

const CommunicationHistory = ({ history, channels }) => {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
        <History size={20} className="text-blue-600 dark:text-blue-400" />
        Histórico de Comunicação
      </h2>

      {history.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
          Nenhuma comunicação registrada ainda
        </p>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {history.map(comm => {
            const channelInfo = channels.find(c => c.id === comm.channel)
            const Icon = channelInfo?.icon || MessageSquare
            
            return (
              <div key={comm.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={14} className={channelInfo?.textColor || 'text-gray-500 dark:text-gray-400'} />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">
                    {comm.channel}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {formatDateTime(comm.created_at)}
                  </span>
                </div>
                {comm.subject && (
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">{comm.subject}</p>
                )}
                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{comm.content}</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default CommunicationHistory
