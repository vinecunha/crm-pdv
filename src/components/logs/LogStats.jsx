import React from 'react'
import { FileText, AlertCircle, Activity, Clock } from 'lucide-react'

const StatCard = ({ label, value, sublabel, icon: Icon, variant = 'default' }) => {
  const variants = {
    default: 'bg-white border-gray-200',
    success: 'bg-green-50 border-green-200',
    warning: 'bg-yellow-50 border-yellow-200',
    danger: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200'
  }

  const iconColors = {
    default: 'text-gray-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    danger: 'text-red-600',
    info: 'text-blue-600'
  }

  return (
    <div className={`${variants[variant]} rounded-xl border p-5 transition-all hover:shadow-md`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {sublabel && <p className="text-xs text-gray-400">{sublabel}</p>}
        </div>
        <div className="p-2.5 rounded-lg bg-white/50">
          <Icon size={22} className={iconColors[variant]} />
        </div>
      </div>
    </div>
  )
}

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
      <StatCard label="Erros" value={errorLogs} sublabel={totalLogs > 0 ? `${Math.round((errorLogs / totalLogs) * 100)}% do total` : '0%'} icon={AlertCircle} variant={errorLogs > 0 ? 'danger' : 'default'} />
      <StatCard label="Hoje" value={todayLogs} icon={Clock} variant="success" />
      <StatCard label="Usuários Ativos" value={uniqueUsers} icon={Activity} variant="default" />
    </div>
  )
}

export default LogStats