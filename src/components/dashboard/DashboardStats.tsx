// src/components/dashboard/DashboardStats.tsx
import React, { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import StatCard, { StatCardGroup } from '@components/ui/StatCard'
import SectionErrorBoundary from '@components/error/SectionErrorBoundary'
import { 
  ShoppingCart, 
  TrendingUp, 
  CreditCard, 
  Users, 
  Package, 
  AlertCircle, 
  DollarSign,
  RefreshCw,
  BarChart3,
} from '@lib/icons'
import { formatCurrency, formatNumber } from '@utils/formatters'
import type { ComponentType } from 'react'
import { logger } from '@utils/logger'

// Tipos
interface StatItem {
  id: string
  label: string
  value: number
  change?: number
  changeLabel?: string
  icon: keyof typeof iconMap
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  trend?: 'up' | 'down' | 'neutral'
  compact?: boolean
}

interface DashboardStatsProps {
  stats: {
    primaryStats: StatItem[]
    secondaryStats?: StatItem[]
  } | null
  isLoading: boolean
  onRefresh?: () => void | Promise<void>
}

interface RouteMap {
  [key: string]: string
}

// Mapeamento de ícones
const iconMap: Record<string, ComponentType<{ size?: number; className?: string }>> = {
  ShoppingCart,
  TrendingUp,
  CreditCard,
  Users,
  Package,
  AlertCircle,
  DollarSign
}

// Mapeamento de rotas para navegação
const routeMap: RouteMap = {
  'sales-today': '/sales-list',
  'sales-month': '/reports',
  'average-ticket': '/reports',
  'customers': '/customers',
  'products': '/products',
  'low-stock': '/products?filter=low-stock',
  'revenue': '/reports'
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ 
  stats, 
  isLoading, 
  onRefresh 
}) => {
  const navigate = useNavigate()
  const [isRefreshing, setIsRefreshing] = React.useState(false)

  // Handler de clique nos cards
  const handleStatClick = useCallback((statId: string) => {
    const route = routeMap[statId]
    if (route) {
      navigate(route)
    }
  }, [navigate])

  // Handler de refresh com feedback visual
  const handleRefresh = useCallback(async () => {
    if (!onRefresh || isRefreshing) return

    setIsRefreshing(true)
    try {
      await onRefresh()
    } catch (error) {
      logger.error('Erro ao atualizar dashboard:', error)
    } finally {
      // Pequeno delay para feedback visual
      setTimeout(() => {
        setIsRefreshing(false)
      }, 800)
    }
  }, [onRefresh, isRefreshing])

  // Determinar formatador baseado no tipo do stat
  const getFormatter = useCallback((statId: string) => {
    const isCurrency = statId.includes('sales') || 
                       statId === 'revenue' || 
                       statId === 'average-ticket'
    return isCurrency ? formatCurrency : formatNumber
  }, [])

  // Renderizar card individual com tratamento de erro
  const renderStatCard = useCallback((stat: StatItem) => {
    const IconComponent = iconMap[stat.icon]
    const formatter = getFormatter(stat.id)

    return (
      <SectionErrorBoundary 
        title={`Erro ao carregar ${stat.label}`}
        fallback={
          <StatCard
            label={stat.label}
            value={0}
            icon={AlertCircle}
            variant="danger"
            error={true}
            onRetry={handleRefresh}
          />
        }
      >
        <StatCard
          label={stat.label}
          value={stat.value}
          change={stat.change}
          changeLabel={stat.changeLabel}
          icon={IconComponent}
          variant={stat.variant || 'default'}
          trend={stat.trend}
          formatValue={formatter}
          loading={isLoading}
          onClick={() => handleStatClick(stat.id)}
          animate={!isLoading}
          compact={stat.compact}
          className="h-full cursor-pointer hover:shadow-md transition-shadow duration-200"
        />
      </SectionErrorBoundary>
    )
  }, [isLoading, handleStatClick, handleRefresh, getFormatter])

  // Se não houver stats, não renderiza nada
  if (!stats) {
    return null
  }

  const { primaryStats, secondaryStats } = stats
  const hasSecondaryStats = secondaryStats && secondaryStats.length > 0

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Cabeçalho da seção */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Visão Geral
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Principais indicadores do negócio
          </p>
        </div>
        
        {onRefresh && (
          <button
            onClick={handleRefresh}
            disabled={isLoading || isRefreshing}
            className={`
              inline-flex items-center gap-2 px-3 py-1.5 
              text-sm font-medium rounded-lg
              transition-all duration-200
              ${isRefreshing 
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                : 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
            title="Atualizar dados do dashboard"
          >
            <RefreshCw 
              size={16} 
              className={`
                transition-transform duration-300
                ${isRefreshing ? 'animate-spin' : ''}
              `} 
            />
            <span className="hidden sm:inline">
              {isRefreshing ? 'Atualizando...' : 'Atualizar dados'}
            </span>
          </button>
        )}
      </div>

      {/* Cards principais */}
      <div>
        <StatCardGroup columns={4} gap={4}>
          {primaryStats.map((stat) => (
            <div 
              key={stat.id} 
              className="min-h-[180px] sm:min-h-[200px] h-full"
            >
              {renderStatCard(stat)}
            </div>
          ))}
        </StatCardGroup>
      </div>

      {/* Cards secundários */}
      {hasSecondaryStats && (
        <div>
          <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">
            Métricas Adicionais
          </h3>
          
          <StatCardGroup columns={2} gap={4}>
            {secondaryStats!.map((stat) => (
              <div 
                key={stat.id} 
                className="min-h-[120px] sm:min-h-[140px] h-full"
              >
                {renderStatCard({
                  ...stat,
                  compact: true
                })}
              </div>
            ))}
          </StatCardGroup>
        </div>
      )}

      {/* Estado vazio */}
      {primaryStats.length === 0 && !isLoading && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <BarChart3 size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
            Nenhum dado disponível
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Os dados do dashboard aparecerão aqui conforme as vendas forem realizadas.
          </p>
          {onRefresh && (
            <button
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 px-4 py-2 
                bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                transition-colors text-sm font-medium"
            >
              <RefreshCw size={16} />
              Verificar novamente
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default DashboardStats