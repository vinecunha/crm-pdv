import React from 'react'
import { FileText, AlertCircle, Activity, Clock } from '@lib/icons'
import StatCard from '../ui/StatCard'

const LogStats = ({ logs }) => {
  const totalLogs = logs.length
  const errorLogs = logs.filter(l => l.action === 'ERROR').length
  const todayLogs = logs.filter(l => {
    const today = new Date()
    const logDate = new Date(l.created_at)
    return logDate.toDateString() === today.toDateString()
  }).length
  const uniqueUsers = new Set(logs.map(l => l.user_email).filter(Boolean)).size

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard label="Total de Logs" value={totalLogs} icon={FileText} variant="info" />
      <StatCard label="Erros" value={errorLogs} icon={AlertCircle} variant={errorLogs > 0 ? 'danger' : 'default'} />
      <StatCard label="Hoje" value={todayLogs} icon={Clock} variant="success" />
      <StatCard label="Usuários Ativos" value={uniqueUsers} icon={Activity} variant="default" />
    </div>
  )
}

export default LogStats