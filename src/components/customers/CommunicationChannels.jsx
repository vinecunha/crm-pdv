import React from 'react'
import { MessageSquare, ChevronRight } from '@lib/icons'

const CommunicationChannels = ({ channels, customer, onSelectChannel }) => {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
        <MessageSquare size={20} className="text-blue-600 dark:text-blue-400" />
        Canais de Comunicação
      </h2>

      <div className="space-y-3">
        {channels.map(channel => {
          const Icon = channel.icon
          return (
            <button
              key={channel.id}
              onClick={() => channel.available && onSelectChannel(channel.id)}
              disabled={!channel.available}
              className={`
                w-full flex items-center gap-3 p-3 rounded-lg border transition-all
                ${channel.available 
                  ? `${channel.bgColor} ${channel.borderColor} ${channel.hoverColor} cursor-pointer dark:bg-opacity-20 dark:border-opacity-50` 
                  : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed'
                }
              `}
            >
              <div className={`p-2 rounded-lg ${channel.bgColor} dark:bg-opacity-30`}>
                <Icon size={20} className={channel.textColor} />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-gray-900 dark:text-white">{channel.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{channel.description}</p>
              </div>
              {channel.available ? (
                <ChevronRight size={18} className="text-gray-400 dark:text-gray-500" />
              ) : (
                <span className="text-xs text-gray-400 dark:text-gray-500">Indisponível</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default CommunicationChannels