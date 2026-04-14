// utils/actions.js
import { 
  Eye, Edit2, Plus, Trash2, CheckCircle, Shield, Lock,
  MessageCircle, Printer, Download, RefreshCw, Ban,
  Truck, Users, RotateCcw, Copy, Unlock, TrendingUp
} from '../lib/icons'

export const actionColors = {
  view: 'text-blue-600 hover:bg-blue-50',
  edit: 'text-blue-600 hover:bg-blue-50',
  create: 'text-green-600 hover:bg-green-50',
  delete: 'text-red-600 hover:bg-red-50',
  activate: 'text-green-600 hover:bg-green-50',
  deactivate: 'text-yellow-600 hover:bg-yellow-50',
  block: 'text-red-600 hover:bg-red-50',
  communicate: 'text-green-600 hover:bg-green-50',
  print: 'text-gray-600 hover:bg-gray-100',
  export: 'text-gray-600 hover:bg-gray-100',
  refresh: 'text-gray-600 hover:bg-gray-100',
  cancel: 'text-red-600 hover:bg-red-50',
  restore: 'text-green-600 hover:bg-green-50',
  copy: 'text-gray-600 hover:bg-gray-100',
  unlock: 'text-green-600 hover:bg-green-50',
  entry: 'text-green-600 hover:bg-green-50',
  manage: 'text-purple-600 hover:bg-purple-50'
}

export const actionConfigs = {
  view: { label: 'Ver detalhes', icon: Eye, color: 'view' },
  edit: { label: 'Editar', icon: Edit2, color: 'edit' },
  create: { label: 'Novo', icon: Plus, color: 'create' },
  delete: { label: 'Excluir', icon: Trash2, color: 'delete' },
  activate: { label: 'Ativar', icon: CheckCircle, color: 'activate' },
  deactivate: { label: 'Desativar', icon: Shield, color: 'deactivate' },
  block: { label: 'Bloquear', icon: Lock, color: 'block' },
  communicate: { label: 'Comunicar', icon: MessageCircle, color: 'communicate' },
  print: { label: 'Imprimir', icon: Printer, color: 'print' },
  export: { label: 'Exportar', icon: Download, color: 'export' },
  refresh: { label: 'Atualizar', icon: RefreshCw, color: 'refresh' },
  cancel: { label: 'Cancelar', icon: Ban, color: 'cancel' },
  restore: { label: 'Restaurar', icon: RotateCcw, color: 'restore' },
  copy: { label: 'Copiar', icon: Copy, color: 'copy' },
  unlock: { label: 'Desbloquear', icon: Unlock, color: 'unlock' },
  entry: { label: 'Registrar entrada', icon: TrendingUp, color: 'entry' },
  manage: { label: 'Gerenciar', icon: Users, color: 'manage' }
}

export const createAction = (type, onClick, options = {}) => {
  const config = actionConfigs[type]
  if (!config) return null
  
  const label = typeof options.label === 'function' 
    ? options.label 
    : options.label || config.label
    
  const icon = typeof options.icon === 'function'
    ? options.icon
    : options.icon || <config.icon size={16} />
    
  const color = options.color || config.color
  
  return {
    label,
    icon,
    onClick,
    className: actionColors[color],
    disabled: options.disabled,
    show: options.show
  }
}