import React from 'react'
import { AlertCircle, AlertTriangle } from '../../utils/icons'

const ErrorAlert = ({ error, remainingAttempts }) => {
  if (!error) return null

  const isWarning = remainingAttempts <= 2

  return (
    <div className={`rounded-lg p-3 flex items-center gap-2 ${
      isWarning 
        ? 'bg-orange-50 border border-orange-200 text-orange-700' 
        : 'bg-red-50 border border-red-200 text-red-700'
    }`}>
      {isWarning ? <AlertTriangle size={18} /> : <AlertCircle size={18} />}
      <span className="text-sm">{error}</span>
    </div>
  )
}

export default ErrorAlert