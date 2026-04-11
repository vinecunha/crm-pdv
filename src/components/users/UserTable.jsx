import React from 'react'
import { Edit, Trash2 } from 'lucide-react'
import DataTable from '../ui/DataTable'
import UserRoleBadge from './UserRoleBadge'
import { formatDate } from '../../utils/formatters'

const UserTable = ({ 
  users, 
  currentUserId,
  onEdit, 
  onDelete, 
  canEdit, 
  canDelete,
  isAdmin 
}) => {
  const columns = [
    {
      key: 'full_name',
      header: 'Nome',
      sortable: true,
      render: (row) => (
        <div className="font-medium text-gray-900">
          {row.full_name || row.email?.split('@')[0]}
          {row.id === currentUserId && (
            <span className="ml-2 text-xs text-green-600">(Você)</span>
          )}
        </div>
      )
    },
    {
      key: 'email',
      header: 'Email',
      sortable: true,
      render: (row) => <div className="text-sm text-gray-500">{row.email}</div>
    },
    {
      key: 'role',
      header: 'Papel',
      sortable: true,
      render: (row) => <UserRoleBadge role={row.role} size="sm" />
    },
    {
      key: 'created_at',
      header: 'Criado em',
      sortable: true,
      render: (row) => <div className="text-sm text-gray-500">{formatDate(row.created_at)}</div>
    }
  ]

  const actions = [
    {
      label: 'Editar',
      icon: <Edit size={16} />,
      onClick: onEdit,
      disabled: (row) => !canEdit || (!isAdmin && row.role === 'admin'),
      className: 'text-blue-600 hover:text-blue-800 hover:bg-blue-50'
    },
    {
      label: 'Excluir',
      icon: <Trash2 size={16} />,
      onClick: onDelete,
      disabled: (row) => !canDelete || row.id === currentUserId || (!isAdmin && row.role === 'admin'),
      className: 'text-red-600 hover:text-red-800 hover:bg-red-50'
    }
  ]

  return (
    <DataTable
      columns={columns}
      data={users}
      actions={actions}
      onRowClick={onEdit}
      emptyMessage="Nenhum usuário encontrado"
      striped
      hover
      pagination
      itemsPerPageOptions={[20, 50, 100]}
      defaultItemsPerPage={20}
      showTotalItems
    />
  )
}

export default UserTable