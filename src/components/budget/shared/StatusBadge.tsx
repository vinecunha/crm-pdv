import React from 'react'
import Badge from '@components/ui/Badge'
import { Clock, CheckCircle, XCircle, AlertTriangle, Check } from '@lib/icons'
import { BUDGET_STATUS } from '@utils/budgetConstants.jsx'

const statusIcons = {
  [BUDGET_STATUS.PENDING]: Clock,
  [BUDGET_STATUS.APPROVED]: CheckCircle,
  [BUDGET_STATUS.REJECTED]: XCircle,
  [BUDGET_STATUS.EXPIRED]: AlertTriangle,
  [BUDGET_STATUS.CONVERTED]: Check
}

const variantMap = {
  [BUDGET_STATUS.PENDING]: 'warning',
  [BUDGET_STATUS.APPROVED]: 'success',
  [BUDGET_STATUS.REJECTED]: 'danger',
  [BUDGET_STATUS.EXPIRED]: 'secondary',
  [BUDGET_STATUS.CONVERTED]: 'info'
}

const labelMap = {
  [BUDGET_STATUS.PENDING]: 'Pendente',
  [BUDGET_STATUS.APPROVED]: 'Aprovado',
  [BUDGET_STATUS.REJECTED]: 'Rejeitado',
  [BUDGET_STATUS.EXPIRED]: 'Expirado',
  [BUDGET_STATUS.CONVERTED]: 'Convertido'
}

const StatusBadge = ({ status, size = 'md', showIcon = true }) => {
  const Icon = statusIcons[status] || Clock
  const variant = variantMap[status] || 'warning'
  const label = labelMap[status] || 'Pendente'
  
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5'
  }
  
  return (
    <Badge variant={variant} className={sizeClasses[size]}>
      {showIcon && <Icon size={size === 'sm' ? 10 : 12} className="mr-1" />}
      {label}
    </Badge>
  )
}

export default StatusBadge

