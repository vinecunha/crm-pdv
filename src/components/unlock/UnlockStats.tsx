import React from 'react'
import { XCircle, Clock, Shield } from '@lib/icons'
import StatCard from '@components/ui/StatCard'

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
