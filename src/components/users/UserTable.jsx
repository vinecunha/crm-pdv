import React, { useState } from 'react'
import { Edit, Trash2, MoreVertical, CheckCircle, Shield, Lock } from 'lucide-react'
import UserRoleBadge from './UserRoleBadge'
import Badge from '../Badge'
import { formatDate } from '../../utils/formatters'

const UserTable = ({ 
  users, 
  currentUserId,
  onEdit, 
  onDelete,
  onUpdateStatus,
  canEdit, 
  canDelete,
  isAdmin 
}) => {
  const [openMenuId, setOpenMenuId] = useState(null)

  const getStatusBadge = (status) => {
    const configs = {
      active: { label: 'Ativo', variant: 'success' },
      inactive: { label: 'Inativo', variant: 'warning' },
      blocked: { label: 'Bloqueado', variant: 'danger' },
      locked: { label: 'Bloqueado', variant: 'danger' }
    }
    const config = configs[status] || configs.active
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const handleStatusClick = (e, userId) => {
    e.stopPropagation()
    setOpenMenuId(openMenuId === userId ? null : userId)
  }

  const handleStatusChange = (e, user, newStatus) => {
    e.stopPropagation()
    console.log('🔄 Alterando status:', user.email, '→', newStatus)
    onUpdateStatus(user, newStatus)
    setOpenMenuId(null)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Papel</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Criado em</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                Nenhum usuário encontrado
              </td>
            </tr>
          ) : (
            users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => onEdit(user)}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">
                    {user.display_name || user.full_name || user.email?.split('@')[0]}
                    {user.id === currentUserId && (
                      <span className="ml-2 text-xs text-green-600">(Você)</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <UserRoleBadge role={user.role} size="sm" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(user.status || 'active')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{formatDate(user.created_at)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-1">
                    {/* Botão Status */}
                    {isAdmin && user.id !== currentUserId && (
                      <div className="relative">
                        <button
                          onClick={(e) => handleStatusClick(e, user.id)}
                          className="p-1.5 rounded-lg text-purple-600 hover:bg-purple-50"
                          title="Alterar status"
                        >
                          <MoreVertical size={16} />
                        </button>
                        
                        {openMenuId === user.id && (
                          <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                            {user.status !== 'active' && (
                              <button
                                onClick={(e) => handleStatusChange(e, user, 'active')}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-green-600 hover:bg-green-50"
                              >
                                <CheckCircle size={14} />
                                Ativar
                              </button>
                            )}
                            {user.status !== 'inactive' && (
                              <button
                                onClick={(e) => handleStatusChange(e, user, 'inactive')}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-yellow-600 hover:bg-yellow-50"
                              >
                                <Shield size={14} />
                                Desativar
                              </button>
                            )}
                            {user.status !== 'blocked' && user.status !== 'locked' && (
                              <button
                                onClick={(e) => handleStatusChange(e, user, 'blocked')}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                              >
                                <Lock size={14} />
                                Bloquear
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Botão Editar */}
                    {canEdit && (!isAdmin ? user.role !== 'admin' : true) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onEdit(user)
                        }}
                        className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50"
                        title="Editar"
                      >
                        <Edit size={16} />
                      </button>
                    )}
                    
                    {/* Botão Excluir */}
                    {canDelete && user.id !== currentUserId && (!isAdmin ? user.role !== 'admin' : true) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onDelete(user)
                        }}
                        className="p-1.5 rounded-lg text-red-600 hover:bg-red-50"
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export default UserTable