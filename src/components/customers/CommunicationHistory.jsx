import React from 'react'
import { History, MessageSquare } from 'lucide-react'
import { formatDateTime } from '../../utils/formatters'

const CommunicationHistory = ({ history, channels }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <History size={20} className="text-blue-600" />
        Histórico de Comunicação
      </h2>

      {history.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          Nenhuma comunicação registrada ainda
        </p>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {history.map(comm => {
            const channelInfo = channels.find(c => c.id === comm.channel)
            const Icon = channelInfo?.icon || MessageSquare
            
            return (
              <div key={comm.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={14} className={channelInfo?.textColor || 'text-gray-500'} />
                  <span className="text-xs font-medium text-gray-600 uppercase">
                    {comm.channel}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatDateTime(comm.created_at)}
                  </span>
                </div>
                {comm.subject && (
                  <p className="text-sm font-medium mb-1">{comm.subject}</p>
                )}
                <p className="text-sm text-gray-600 line-clamp-2">{comm.content}</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default CommunicationHistory