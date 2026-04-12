import React from 'react'
import { RotateCcw, Package, User } from 'lucide-react'
import Badge from '../Badge'
import Button from '../ui/Button'
import { formatDateTime } from '../../utils/formatters'

const DeletedRecordCard = ({ record, onRestore, canRestore }) => {
  const Icon = record._type === 'product' ? Package : User

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <Badge variant={record._type === 'product' ? 'info' : 'purple'}>
          {record._typeLabel}
        </Badge>
      </div>
      
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
          <Icon size={20} className="text-gray-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate">
            {record.name || record.full_name || record.code || '-'}
          </p>
          {record._type === 'product' && record.code && (
            <p className="text-xs text-gray-500">Código: {record.code}</p>
          )}
          {record._type === 'customer' && record.email && (
            <p className="text-xs text-gray-500 truncate">{record.email}</p>
          )}
        </div>
      </div>
      
      <div className="space-y-1 text-sm border-t border-gray-100 pt-3">
        <div className="flex justify-between">
          <span className="text-gray-500">Excluído em:</span>
          <span className="text-gray-700">{formatDateTime(record.deleted_at)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Excluído por:</span>
          <span className="text-gray-700">{record.deleter?.full_name || record.deleter?.email || '-'}</span>
        </div>
      </div>
      
      {canRestore && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <Button size="sm" variant="outline" onClick={() => onRestore(record)} fullWidth>
            <RotateCcw size={14} className="mr-1" />
            Restaurar
          </Button>
        </div>
      )}
    </div>
  )
}

export default DeletedRecordCard