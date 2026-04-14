// src/components/coupons/CouponTable.jsx
import React from 'react'
import { Copy, Globe, Users, Percent, DollarSign } from 'lucide-react'
import DataTable from '../../components/ui/DataTable'
import Badge from '../../components/Badge'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { createAction } from '../../utils/actions'

const CouponTable = ({ 
  coupons, 
  onEdit, 
  onManageCustomers, 
  onToggleStatus, 
  onDelete, 
  onCopyCode 
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
      render: (row) => (
        <div className="flex items-center gap-2 group">
          <span className="font-mono font-bold text-blue-600">{row.code}</span>
          <button
            onClick={(e) => { e.stopPropagation(); onCopyCode(row.code) }}
            className="p-1 hover:bg-gray-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
            title="Copiar código"
          >
            <Copy size={14} className="text-gray-400" />
          </button>
        </div>
      )
    },
    {
      key: 'name',
      header: 'Nome',
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-medium text-gray-900">{row.name}</div>
          {row.description && (
            <div className="text-xs text-gray-500 truncate max-w-xs">{row.description}</div>
          )}
        </div>
      )
    },
    {
      key: 'discount',
      header: 'Desconto',
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-semibold text-green-600">
            {row.discount_type === 'percent' ? `${row.discount_value}%` : formatCurrency(row.discount_value)}
          </div>
          {row.min_purchase > 0 && (
            <div className="text-xs text-gray-500">Mín: {formatCurrency(row.min_purchase)}</div>
          )}
        </div>
      )
    },
    {
      key: 'type',
      header: 'Tipo',
      render: (row) => (
        <div className="space-y-1">
          {getTypeBadge(row.discount_type)}
          <div className="flex items-center gap-1 text-xs text-gray-500">
            {row.is_global ? <Globe size={10} /> : <Users size={10} />}
            <span>{row.is_global ? 'Global' : 'Restrito'}</span>
          </div>
        </div>
      )
    },
    {
      key: 'validity',
      header: 'Validade',
      render: (row) => (
        <div>
          {row.valid_from && row.valid_to ? (
            <div className="text-xs">
              <div>{formatDate(row.valid_from)} - {formatDate(row.valid_to)}</div>
              {new Date(row.valid_to) < new Date() && row.is_active && (
                <div className="text-red-500 text-xs mt-1">Expirado</div>
              )}
            </div>
          ) : (
            <span className="text-xs text-gray-500">Indeterminada</span>
          )}
          {row.usage_limit && (
            <div className="text-xs text-gray-500 mt-1">
              Usos: {row.used_count || 0}/{row.usage_limit}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'is_active',
      header: 'Status',
      sortable: true,
      render: (row) => getStatusBadge(row.is_active)
    }
  ]

  const actions = [
    createAction('edit', onEdit),
    createAction('manage', onManageCustomers, {
      disabled: (row) => row.is_global === true
    }),
    createAction('deactivate', onToggleStatus, {
      label: (row) => row.is_active ? 'Desativar' : 'Ativar'
    }),
    createAction('delete', onDelete)
  ]

  return (
    <DataTable
      columns={columns}
      data={coupons}
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
  )
}

export default CouponTable