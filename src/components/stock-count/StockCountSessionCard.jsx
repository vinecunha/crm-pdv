import React from 'react'
import { ClipboardList, Clock, CheckCircle, XCircle, Eye, FileText, ArrowRight } from '../../lib/icons'
import Button from '../ui/Button'
import Badge from '../Badge'

const statusConfig = {
  in_progress: { label: 'Em Andamento', color: 'warning', icon: Clock },
  completed: { label: 'Concluído', color: 'success', icon: CheckCircle },
  cancelled: { label: 'Cancelado', color: 'danger', icon: XCircle }
}

const StockCountSessionCard = ({ session, onContinue, onViewDetails }) => {
  const config = statusConfig[session.status] || statusConfig.in_progress
  const StatusIcon = config.icon

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <ClipboardList size={20} className="text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{session.name}</h3>
            <p className="text-xs text-gray-500">#{session.id?.slice(0, 8)}</p>
          </div>
        </div>
        <Badge variant={config.color}>
          <StatusIcon size={12} className="mr-1" />
          {config.label}
        </Badge>
      </div>

      {session.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{session.description}</p>
      )}

      <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
        <div>
          <p className="text-gray-500">Local</p>
          <p className="font-medium">{session.location || 'Geral'}</p>
        </div>
        <div>
          <p className="text-gray-500">Responsável</p>
          <p className="font-medium truncate">{session.responsible}</p>
        </div>
        <div>
          <p className="text-gray-500">Início</p>
          <p className="font-medium">
            {new Date(session.created_at).toLocaleDateString('pt-BR')}
          </p>
        </div>
        <div>
          <p className="text-gray-500">Itens</p>
          <p className="font-medium">{session.items?.[0]?.count || 0}</p>
        </div>
      </div>

      {session.status === 'completed' && (
        <div className="mb-3 p-2 bg-green-50 rounded-lg">
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">Divergências:</span>
            <span className="font-medium text-orange-600">{session.diverged_items || 0}</span>
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span className="text-gray-600">Concluído em:</span>
            <span className="font-medium">
              {session.completed_at && new Date(session.completed_at).toLocaleDateString('pt-BR')}
            </span>
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-3 border-t">
        {session.status === 'in_progress' ? (
          <>
            <Button
              size="sm"
              variant="primary"
              fullWidth
              onClick={() => onContinue(session)}
            >
              Continuar
              <ArrowRight size={14} />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onViewDetails(session)}
            >
              <Eye size={14} />
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            variant="outline"
            fullWidth
            onClick={() => onViewDetails(session)}
          >
            <FileText size={14} />
            Ver Relatório
          </Button>
        )}
      </div>
    </div>
  )
}

export default StockCountSessionCard