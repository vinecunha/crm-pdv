// components/dashboard/DashboardStats.jsx

import React from 'react'
import { useNavigate } from 'react-router-dom'
import StatCard, { StatCardGroup } from '../../components/ui/StatCard'
import SectionErrorBoundary from '../SectionErrorBoundary'
import { 
  ShoppingCart, 
  TrendingUp, 
  CreditCard, 
  Users, 
  Package, 
  AlertCircle, 
  DollarSign 
} from '../../lib/icons'
import { formatCurrency, formatNumber } from '../../utils/formatters'

const iconMap = {
  ShoppingCart,
  TrendingUp,
  CreditCard,
  Users,
  Package,
  AlertCircle,
  DollarSign
}

const DashboardStats = ({ stats, isLoading, onRefresh }) => {
  const navigate = useNavigate()

  const handleStatClick = (stat) => {
    const routes = {
      'sales-today': '/sales-list',
      'sales-month': '/reports',
      'average-ticket': '/reports',
      'customers': '/customers',
      'products': '/products',
      'low-stock': '/products?filter=low-stock',
      'revenue': '/reports'
    }
    
    if (routes[stat.id]) {
      navigate(routes[stat.id])
    }
  }

  const renderStatCard = (stat) => (
    <SectionErrorBoundary 
      title={`Erro ao carregar ${stat.label}`}
      fallback={
        <StatCard
          label={stat.label}
          value={0}
          icon={iconMap[stat.icon]}
          variant="danger"
          error={true}
          onRetry={onRefresh}
          consistentHeight={true}
        />
      }
    >
      <StatCard
        {...stat}
        icon={iconMap[stat.icon]}
        formatValue={stat.id.includes('sales') || stat.id === 'revenue' || stat.id === 'average-ticket' 
          ? formatCurrency 
          : formatNumber}
        loading={isLoading}
        onClick={() => handleStatClick(stat)}
        animate={!isLoading}
        consistentHeight={true}
        size="default"
      />
    </SectionErrorBoundary>
  )

  if (!stats) return null

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Cards principais */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Visão Geral
          </h2>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              disabled={isLoading}
            >
              Atualizar dados
            </button>
          )}
        </div>
        
        <StatCardGroup columns={4} gap={4}>
          {stats.primaryStats.map(stat => (
            <div 
              key={stat.id} 
              className="h-full min-h-[130px] sm:min-h-[140px]"
            >
              {renderStatCard(stat)}
            </div>
          ))}
        </StatCardGroup>
      </div>

      {/* Cards secundários */}
      <div>
        <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">
          Métricas Adicionais
        </h3>
        
        <StatCardGroup columns={2} gap={4}>
          {stats.secondaryStats.map(stat => (
            <div key={stat.id} className="h-full">
              {renderStatCard({
                ...stat,
                compact: true // Cards secundários em modo compacto
              })}
            </div>
          ))}
        </StatCardGroup>
      </div>
    </div>
  )
}

export default DashboardStats