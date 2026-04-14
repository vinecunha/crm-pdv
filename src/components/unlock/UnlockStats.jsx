import React from 'react'
import { XCircle, Clock, Shield } from '../../lib/icons'

const StatCard = ({ label, value, icon: Icon, color }) => {
  const colors = {
    red: { bg: 'bg-red-100', text: 'text-red-600' },
    orange: { bg: 'bg-orange-100', text: 'text-orange-600' },
    blue: { bg: 'bg-blue-100', text: 'text-blue-600' }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className={`text-2xl font-bold ${colors[color].text}`}>{value}</p>
        </div>
        <div className={`p-3 ${colors[color].bg} rounded-full`}>
          <Icon size={24} className={colors[color].text} />
        </div>
      </div>
    </div>
  )
}

const UnlockStats = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <StatCard label="Total Bloqueados" value={stats.totalBlocked} icon={XCircle} color="red" />
      <StatCard label="Bloqueios Hoje" value={stats.blockedToday} icon={Clock} color="orange" />
      <StatCard label="Total de Tentativas" value={stats.totalAttempts} icon={Shield} color="blue" />
    </div>
  )
}

export default UnlockStats