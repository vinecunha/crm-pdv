import React from 'react'
import { 
  Edit, 
  Users, 
  Power, 
  Trash2, 
  Copy, 
  Send,
  Calendar,
  Percent,
  DollarSign,
  Tag,
  ChevronRight,
  CheckCircle,
  XCircle
} from '@lib/icons'
import Badge from '../Badge'
import { formatCurrency, formatDate } from '@utils/formatters'

const CouponCard = ({ 
  coupon, 
  onEdit, 
  onManageCustomers, 
  onToggleStatus, 
  onDelete, 
  onCopyCode,
  onSendCampaign 
}) => {
  const isExpired = coupon.valid_to && new Date(coupon.valid_to) < new Date()
  const isValid = coupon.is_active && !isExpired && (!coupon.usage_limit || coupon.used_count < coupon.usage_limit)
  
  const getStatusBadge = () => {
    if (!coupon.is_active) {
      return <Badge variant="secondary" className="text-xs">Inativo</Badge>
    }
    if (isExpired) {
      return <Badge variant="danger" className="text-xs">Expirado</Badge>
    }
    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      return <Badge variant="warning" className="text-xs">Limite Atingido</Badge>
    }
    return <Badge variant="success" className="text-xs">Ativo</Badge>
  }

  const getDiscountText = () => {
    if (coupon.discount_type === 'percent') {
      return `${coupon.discount_value}%`
    }
    return formatCurrency(coupon.discount_value)
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow duration-200">
      {/* Cabeçalho do Card */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div 
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-900 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                onClick={() => onCopyCode?.(coupon.code)}
              >
                <Tag size={14} className="text-blue-600 dark:text-blue-400" />
                <code className="font-mono font-bold text-gray-900 dark:text-white">
                  {coupon.code}
                </code>
                <Copy size={12} className="text-gray-400 dark:text-gray-500" />
              </div>
              {getStatusBadge()}
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
              {coupon.name}
            </h3>
            {coupon.description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                {coupon.description}
              </p>
            )}
          </div>
        </div>

        {/* Informações de Desconto */}
        <div className="grid grid-cols-2 gap-3 mb-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Desconto</p>
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
              {coupon.discount_type === 'percent' ? (
                <Percent size={18} />
              ) : (
                <DollarSign size={18} />
              )}
              {getDiscountText()}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Uso</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {coupon.used_count || 0}
              {coupon.usage_limit && (
                <span className="text-xs text-gray-500 dark:text-gray-400"> / {coupon.usage_limit}</span>
              )}
            </p>
          </div>
        </div>

        {/* Datas e Restrições */}
        <div className="space-y-2 text-xs">
          {coupon.valid_from && (
            <div className="flex items-center justify-between">
              <span className="text-gray-500 dark:text-gray-400">Início:</span>
              <span className="text-gray-700 dark:text-gray-300">
                {formatDate(coupon.valid_from)}
              </span>
            </div>
          )}
          {coupon.valid_to && (
            <div className="flex items-center justify-between">
              <span className="text-gray-500 dark:text-gray-400">Validade:</span>
              <span className={`${isExpired ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>
                {formatDate(coupon.valid_to)}
              </span>
            </div>
          )}
          {coupon.min_purchase > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-gray-500 dark:text-gray-400">Compra mín.:</span>
              <span className="text-gray-700 dark:text-gray-300">
                {formatCurrency(coupon.min_purchase)}
              </span>
            </div>
          )}
          {coupon.max_discount && (
            <div className="flex items-center justify-between">
              <span className="text-gray-500 dark:text-gray-400">Desconto máx.:</span>
              <span className="text-gray-700 dark:text-gray-300">
                {formatCurrency(coupon.max_discount)}
              </span>
            </div>
          )}
        </div>

        {/* Badge de Tipo */}
        <div className="mt-3">
          <Badge variant={coupon.is_global ? 'info' : 'warning'} size="sm">
            {coupon.is_global ? '🌍 Global' : '👤 Restrito'}
          </Badge>
        </div>
      </div>

      {/* Ações do Card */}
      <div className="grid grid-cols-5 gap-1 p-2 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => onEdit?.(coupon)}
          className="flex items-center justify-center p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
          title="Editar"
        >
          <Edit size={16} />
        </button>
        
        {!coupon.is_global && (
          <button
            onClick={() => onManageCustomers?.(coupon)}
            className="flex items-center justify-center p-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
            title="Gerenciar Clientes"
          >
            <Users size={16} />
          </button>
        )}

        <button
          onClick={() => onToggleStatus?.(coupon)}
          className={`flex items-center justify-center p-2 rounded-lg transition-colors ${
            coupon.is_active
              ? 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
          title={coupon.is_active ? 'Desativar' : 'Ativar'}
        >
          <Power size={16} />
        </button>

        <button
          onClick={() => onSendCampaign?.(coupon)}
          className="flex items-center justify-center p-2 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
          title="Enviar Campanha"
        >
          <Send size={16} />
        </button>

        <button
          onClick={() => onDelete?.(coupon)}
          className="flex items-center justify-center p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
          title="Excluir"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  )
}

export default CouponCard
