import React from 'react'
import { MessageSquare, ChevronRight } from 'lucide-react'

const CommunicationChannels = ({ channels, customer, onSelectChannel }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <MessageSquare size={20} className="text-blue-600" />
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
                  ? `${channel.bgColor} ${channel.borderColor} ${channel.hoverColor} cursor-pointer` 
                  : 'bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed'
                }
              `}
            >
              <div className={`p-2 rounded-lg ${channel.bgColor}`}>
                <Icon size={20} className={channel.textColor} />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium">{channel.name}</p>
                <p className="text-xs text-gray-500">{channel.description}</p>
              </div>
              {channel.available ? (
                <ChevronRight size={18} className="text-gray-400" />
              ) : (
                <span className="text-xs text-gray-400">Indisponível</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default CommunicationChannels