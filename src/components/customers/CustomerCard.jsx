// components/customers/CustomerCard.jsx
import React from 'react'
import { 
  Edit, 
  Trash2, 
  MessageCircle, 
  Send,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Award,
  Star,
  User,
  FileText
} from '../../lib/icons'
import Badge from '../Badge'
import { formatDate } from '../../utils/formatters'

const CustomerCard = ({ 
  customer, 
  onEdit, 
  onDelete, 
  onCommunicate, 
  onSendCampaign 
}) => {
  const getStatusBadge = () => {
    const configs = {
      active: { label: 'Ativo', variant: 'success' },
      inactive: { label: 'Inativo', variant: 'secondary' },
      blocked: { label: 'Bloqueado', variant: 'danger' }
    }
    const config = configs[customer.status] || configs.active
    return <Badge variant={config.variant} size="sm">{config.label}</Badge>
  }

  const getRfvScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400'
    if (score >= 50) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getRfvBadge = (score) => {
    if (score >= 80) return { label: 'Cliente VIP', variant: 'success' }
    if (score >= 50) return { label: 'Cliente Regular', variant: 'warning' }
    if (score > 0) return { label: 'Cliente Inativo', variant: 'secondary' }
    return { label: 'Novo Cliente', variant: 'info' }
  }

  const rfvScore = customer.rfv_score || 0
  const rfvBadge = getRfvBadge(rfvScore)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow duration-200">
      {/* Cabeçalho do Card */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
              {customer.name?.charAt(0) || 'C'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                  {customer.name}
                </h3>
                {getStatusBadge()}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={rfvBadge.variant} size="sm">
                  <Star size={12} className="mr-1" />
                  {rfvBadge.label}
                </Badge>
                {rfvScore > 0 && (
                  <span className={`text-xs font-medium ${getRfvScoreColor(rfvScore)}`}>
                    RFV: {rfvScore}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Informações de Contato */}
        <div className="space-y-2 mb-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
          {customer.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail size={14} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
              <span className="text-gray-700 dark:text-gray-300 truncate">{customer.email}</span>
            </div>
          )}
          {customer.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone size={14} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
              <span className="text-gray-700 dark:text-gray-300">{customer.phone}</span>
            </div>
          )}
          {(customer.city || customer.state) && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin size={14} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
              <span className="text-gray-700 dark:text-gray-300 truncate">
                {[customer.city, customer.state].filter(Boolean).join(' - ')}
              </span>
            </div>
          )}
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">Compras</p>
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {customer.total_purchases || 0}
            </p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
            <p className="text-sm font-bold text-green-600 dark:text-green-400">
              R$ {customer.total_spent?.toFixed(2) || '0,00'}
            </p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">Última</p>
            <p className="text-xs font-medium text-purple-600 dark:text-purple-400">
              {customer.last_purchase ? formatDate(customer.last_purchase) : '---'}
            </p>
          </div>
        </div>

        {/* Data de Cadastro */}
        {customer.created_at && (
          <div className="mt-3 flex items-center justify-end gap-1 text-xs text-gray-500 dark:text-gray-400">
            <Calendar size={12} />
            <span>Cliente desde {formatDate(customer.created_at)}</span>
          </div>
        )}
      </div>

      {/* Ações do Card */}
      <div className="grid grid-cols-4 gap-1 p-2 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => onEdit?.(customer)}
          className="flex items-center justify-center p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
          title="Editar"
        >
          <Edit size={16} />
        </button>

        <button
          onClick={() => onCommunicate?.(customer)}
          className="flex items-center justify-center p-2 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
          title="Comunicar"
        >
          <MessageCircle size={16} />
        </button>

        <button
          onClick={() => onSendCampaign?.(customer)}
          className="flex items-center justify-center p-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
          title="Enviar Campanha"
        >
          <Send size={16} />
        </button>

        <button
          onClick={() => onDelete?.(customer)}
          className="flex items-center justify-center p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
          title="Excluir"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  )
}

export default CustomerCard