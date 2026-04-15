import React from 'react'
import { 
  Copy, Globe, Users, Percent, DollarSign, Send, 
  Edit, Trash2, UserPlus, Power
} from '../../lib/icons'
import DataTable from '../../components/ui/DataTable'
import Badge from '../../components/Badge'
import { formatCurrency, formatDate } from '../../utils/formatters'

const CouponTable = ({ 
  coupons = [],
  onEdit, 
  onManageCustomers, 
  onToggleStatus, 
  onDelete, 
  onCopyCode,
  onSendCampaign
}) => {
  const getStatusBadge = (isActive) => (
    <Badge variant={isActive ? 'success' : 'danger'}>
      {isActive ? 'Ativo' : 'Inativo'}
    </Badge>
  )

  const getTypeBadge = (type) => (
    <Badge variant={type === 'percent' ? 'info' : 'purple'}>
      {type === 'percent' ? (
        <><Percent size={12} className="mr-1" /> Percentual</>
      ) : (
        <><DollarSign size={12} className="mr-1" /> Valor Fixo</>
      )}
    </Badge>
  )

  const columns = [
    {
      key: 'code',
      header: 'Código',
      sortable: true,
      width: '100px',
      render: (row) => (
        <div className="flex items-center gap-1 group">
          <span className="font-mono font-bold text-blue-600 truncate text-sm">{row?.code || '-'}</span>
          <button
            onClick={(e) => { e.stopPropagation(); onCopyCode?.(row?.code) }}
            className="p-0.5 hover:bg-gray-100 rounded opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
            title="Copiar código"
          >
            <Copy size={12} className="text-gray-400" />
          </button>
        </div>
      )
    },
    {
      key: 'name',
      header: 'Nome',
      sortable: true,
      width: '140px',
      render: (row) => (
        <div className="min-w-0">
          <div className="font-medium text-gray-900 truncate text-sm">{row?.name || '-'}</div>
          {row?.description && (
            <div className="text-xs text-gray-500 truncate">{row.description}</div>
          )}
        </div>
      )
    },
    {
      key: 'discount',
      header: 'Desc.',
      sortable: true,
      width: '95px',
      render: (row) => {
        if (!row) return <span>-</span>
        return (
          <div>
            <div className="font-semibold text-green-600 truncate text-sm">
              {row.discount_type === 'percent' 
                ? `${row.discount_value || 0}%` 
                : formatCurrency(row.discount_value || 0)}
            </div>
            {(row.min_purchase > 0) && (
              <div className="text-xs text-gray-500 truncate">
                Mín: {formatCurrency(row.min_purchase)}
              </div>
            )}
          </div>
        )
      }
    },
    {
      key: 'type',
      header: 'Tipo',
      width: '115px',
      render: (row) => {
        if (!row) return <span>-</span>
        return (
          <div className="space-y-1">
            {getTypeBadge(row.discount_type)}
            <div className="flex items-center gap-1 text-xs text-gray-500">
              {row.is_global ? <Globe size={10} className="flex-shrink-0" /> : <Users size={10} className="flex-shrink-0" />}
              <span className="truncate">{row.is_global ? 'Global' : 'Restrito'}</span>
            </div>
          </div>
        )
      }
    },
    {
      key: 'validity',
      header: 'Validade',
      width: '130px',
      render: (row) => {
        if (!row) return <span>-</span>
        const isExpired = row.valid_to && new Date(row.valid_to) < new Date()
        return (
          <div className="min-w-0">
            {row.valid_from && row.valid_to ? (
              <div className="text-xs">
                <div className="truncate">{formatDate(row.valid_from)}</div>
                <div className="truncate">{formatDate(row.valid_to)}</div>
                {isExpired && row.is_active && (
                  <div className="text-red-500 text-xs mt-0.5">Expirado</div>
                )}
              </div>
            ) : (
              <span className="text-xs text-gray-500">-</span>
            )}
            {row.usage_limit && (
              <div className="text-xs text-gray-500 mt-0.5 truncate">
                {row.used_count || 0}/{row.usage_limit}
              </div>
            )}
          </div>
        )
      }
    },
    {
      key: 'is_active',
      header: 'Status',
      sortable: true,
      width: '80px',
      render: (row) => {
        if (!row) return <span>-</span>
        return getStatusBadge(row.is_active)
      }
    }
  ]

  const actions = [
    {
      id: 'campaign',
      label: 'Campanha',
      icon: Send, 
      onClick: onSendCampaign,
      show: (row) => row?.is_active === true,
      className: 'text-green-600 hover:text-green-700 hover:bg-green-50'
    },
    {
      id: 'edit',
      label: 'Editar',
      icon: Edit, 
      onClick: onEdit,
      className: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
    },
    {
      id: 'customers',
      label: 'Clientes',
      icon: UserPlus, 
      onClick: onManageCustomers,
      disabled: (row) => row?.is_global === true,
      className: 'text-purple-600 hover:text-purple-700 hover:bg-purple-50'
    },
    {
      id: 'toggle', 
      label: (row) => row?.is_active ? 'Desativar' : 'Ativar',
      icon: Power, 
      onClick: onToggleStatus,
      className: (row) => row?.is_active 
        ? 'text-orange-600 hover:text-orange-700 hover:bg-orange-50' 
        : 'text-green-600 hover:text-green-700 hover:bg-green-50'
    },
    {
      id: 'delete', 
      label: 'Excluir',
      icon: Trash2,
       onClick: (row) => onDelete(row),
      className: 'text-red-600 hover:text-red-700 hover:bg-red-50'
    }
  ]

  const safeCoupons = Array.isArray(coupons) ? coupons : []

  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: '850px' }}>
        <DataTable
          columns={columns}
          data={safeCoupons}
          actions={actions}
          onRowClick={onEdit}
          emptyMessage="Nenhum cupom encontrado"
          striped
          hover
          pagination
          itemsPerPageOptions={[20, 50, 100]}
          defaultItemsPerPage={20}
          showTotalItems
        />
      </div>
    </div>
  )
}

export default CouponTable