import React from 'react'
import { AlertCircle, AlertTriangle } from '@lib/icons'

interface ErrorAlertProps {
  error: string | null
  remainingAttempts: number
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({ error, remainingAttempts }) => {
  if (!error) return null

  const isWarning = remainingAttempts <= 2

  return (
    <div className={`rounded-lg p-3 flex items-center gap-2 ${
      isWarning 
        ? 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300' 
        : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
    }`}>
      {isWarning ? <AlertTriangle size={18} /> : <AlertCircle size={18} />}
      <span className="text-sm">{error}</span>
    </div>
  )
}

export default ErrorAlert