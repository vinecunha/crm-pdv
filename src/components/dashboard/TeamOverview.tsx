// src/components/dashboard/TeamOverview.jsx
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, TrendingUp, Award, ChevronRight } from '@lib/icons'
import { formatCurrency } from '@utils/formatters'

const TeamOverview = ({ teamData, userRole }) => {
  const navigate = useNavigate()
  
  // Garantir que teamData é um array
  const members = Array.isArray(teamData) ? teamData : []
  
  // Mapear os dados do SellerData para o formato esperado
  const formattedMembers = members.map(member => ({
    id: member.id,
    full_name: member.name || member.full_name,
    email: member.email,
    role: member.role,
    stats: {
      totalSales: member.total || member.totalRevenue || member.total_revenue || 0,
      salesCount: member.count || 0,
      averageTicket: member.average || 0
    }
  }))
  
  if (formattedMembers.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="text-blue-500" size={20} />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Equipe
          </h2>
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Nenhum membro da equipe encontrado.
        </p>
      </div>
    )
  }
  
  // Ordenar por total de vendas (maior primeiro)
  const sortedMembers = [...formattedMembers].sort((a, b) => 
    b.stats.totalSales - a.stats.totalSales
  )
  
  const totalTeamSales = sortedMembers.reduce((sum, member) => 
    sum + member.stats.totalSales, 0
  ) || 0
  
  const topPerformer = sortedMembers[0]
  
  const handleMemberClick = (memberId) => {
    navigate(`/sellers/${memberId}`)
  }
  
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="p-6 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="text-blue-500" size={20} />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {userRole === 'admin' ? 'Todos os Usuários' : 'Equipe de Operadores'}
            </h2>
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {sortedMembers.length} membros
          </span>
        </div>
      </div>
      
      {/* Destaque do top performer */}
      {topPerformer && topPerformer.stats.totalSales > 0 && (
        <div 
          className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => handleMemberClick(topPerformer.id)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                <Award className="text-yellow-600 dark:text-yellow-400" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Top Performer</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {topPerformer.full_name || topPerformer.email?.split('@')[0]}
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  {formatCurrency(topPerformer.stats.totalSales)} em vendas
                </p>
              </div>
            </div>
            <ChevronRight className="text-gray-400" size={20} />
          </div>
        </div>
      )}
      
      {/* Lista da equipe */}
      <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-80 overflow-y-auto">
        {sortedMembers.map((member) => (
          <div 
            key={member.id} 
            className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            onClick={() => handleMemberClick(member.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-white truncate">
                  {member.full_name || member.email?.split('@')[0] || 'Usuário'}
                </p>
                {member.email && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {member.email}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {member.stats.salesCount} vendas
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Ticket médio: {formatCurrency(member.stats.averageTicket)}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(member.stats.totalSales)}
                </p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  member.role === 'admin' 
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                    : member.role === 'gerente'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}>
                  {member.role || 'operador'}
                </span>
              </div>
            </div>
            
            {/* Barra de progresso relativa */}
            {totalTeamSales > 0 && (
              <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div 
                  className="bg-blue-500 h-1.5 rounded-full transition-all"
                  style={{ 
                    width: `${(member.stats.totalSales / totalTeamSales) * 100}%` 
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default TeamOverview
