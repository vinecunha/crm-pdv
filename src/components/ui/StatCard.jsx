// components/StatCard.jsx - Versão com altura consistente

import React, { useState, useCallback } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  MoreVertical,
  Eye,
  EyeOff,
  Maximize2,
  Download
} from '@lib/icons'

// Hook para animação de contagem
const useCountAnimation = (value, duration = 1000, shouldAnimate = true) => {
  const [displayValue, setDisplayValue] = useState(value)
  const [isAnimating, setIsAnimating] = useState(false)

  React.useEffect(() => {
    if (!shouldAnimate || typeof value !== 'number') {
      setDisplayValue(value)
      return
    }

    setIsAnimating(true)
    const startValue = displayValue
    const endValue = value
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Easing function (ease-out)
      const easeProgress = 1 - Math.pow(1 - progress, 3)
      
      const current = startValue + (endValue - startValue) * easeProgress
      setDisplayValue(current)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setIsAnimating(false)
      }
    }

    requestAnimationFrame(animate)
  }, [value, duration, shouldAnimate])

  return { displayValue, isAnimating }
}

// Componente de tendência compacto
const TrendIndicator = ({ trend, value, showPercentage = true, compact = false }) => {
  if (!trend && trend !== 0) return null

  const isPositive = trend > 0
  const isNeutral = trend === 0

  const config = {
    positive: {
      icon: TrendingUp,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30'
    },
    negative: {
      icon: TrendingDown,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900/30'
    },
    neutral: {
      icon: Minus,
      color: 'text-gray-600 dark:text-gray-400',
      bgColor: 'bg-gray-100 dark:bg-gray-800'
    }
  }

  const type = isNeutral ? 'neutral' : (isPositive ? 'positive' : 'negative')
  const { icon: Icon, color, bgColor } = config[type]

  return (
    <div className={`inline-flex items-center gap-1 ${compact ? 'px-1.5 py-0.5' : 'px-2 py-1'} rounded-full text-xs font-medium ${bgColor} ${color}`}>
      <Icon size={compact ? 10 : 12} />
      {showPercentage && (
        <span>{Math.abs(trend).toFixed(1)}%</span>
      )}
      {value && !compact && <span className="ml-1">({value})</span>}
    </div>
  )
}

// Menu de ações do card
const CardActions = ({ onView, onHide, onMaximize, onExport, variant }) => {
  const [showMenu, setShowMenu] = useState(false)

  const actions = [
    { icon: Eye, label: 'Ver detalhes', onClick: onView },
    { icon: EyeOff, label: 'Ocultar', onClick: onHide },
    { icon: Maximize2, label: 'Maximizar', onClick: onMaximize },
    { icon: Download, label: 'Exportar', onClick: onExport }
  ].filter(action => action.onClick)

  if (actions.length === 0) return null

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Ações do card"
      >
        <MoreVertical size={16} className="text-gray-400" />
      </button>

      {showMenu && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 top-full mt-1 z-20 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[160px]">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={() => {
                  action.onClick()
                  setShowMenu(false)
                }}
                className="w-full px-3 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
              >
                <action.icon size={14} />
                {action.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// Indicador de meta compacto
const GoalProgress = ({ current, goal, variant }) => {
  if (!goal) return null
  
  const percentage = Math.min((current / goal) * 100, 100)
  
  const colorMap = {
    success: 'bg-green-500 dark:bg-green-400',
    warning: 'bg-yellow-500 dark:bg-yellow-400',
    danger: 'bg-red-500 dark:bg-red-400',
    info: 'bg-blue-500 dark:bg-blue-400',
    purple: 'bg-purple-500 dark:bg-purple-400',
    default: 'bg-gray-500 dark:bg-gray-400'
  }

  return (
    <div className="mt-3 space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-500 dark:text-gray-400">Progresso</span>
        <span className="font-medium text-gray-700 dark:text-gray-300">
          {percentage.toFixed(0)}%
        </span>
      </div>
      <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div 
          className={`h-full ${colorMap[variant]} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

// Sparkline compacto
const Sparkline = ({ data, variant, height = 24 }) => {
  if (!data || data.length < 2) return null

  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100
    const y = range === 0 ? 50 : ((value - min) / range) * 100
    return `${x},${100 - y}`
  }).join(' ')

  const colorMap = {
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6',
    purple: '#8b5cf6',
    default: '#6b7280'
  }

  const strokeColor = colorMap[variant] || colorMap.default

  return (
    <svg className="w-full mt-2" height={height} viewBox="0 0 100 100" preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const StatCard = ({ 
  label, 
  value, 
  sublabel, 
  icon: Icon, 
  variant = 'default',
  trend,
  trendValue,
  goal,
  animate = true,
  formatValue,
  onClick,
  actions,
  sparklineData,
  loading = false,
  error = false,
  onRetry,
  className = '',
  size = 'default',
  showTrend = true,
  compact = false,
  blur = false,
  tooltip,
  consistentHeight = true // Nova prop para forçar altura consistente
}) => {
  const [isHovered, setIsHovered] = useState(false)
  
  // Animar valor se for número
  const numericValue = typeof value === 'number' ? value : parseFloat(value)
  const { displayValue, isAnimating } = useCountAnimation(
    numericValue,
    1000,
    animate && !isNaN(numericValue)
  )

  const variants = {
    default: {
      bg: 'bg-white dark:bg-gray-900',
      border: 'border-gray-200 dark:border-gray-700',
      hover: 'hover:border-gray-300 dark:hover:border-gray-600'
    },
    success: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      hover: 'hover:border-green-300 dark:hover:border-green-700'
    },
    warning: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      border: 'border-yellow-200 dark:border-yellow-800',
      hover: 'hover:border-yellow-300 dark:hover:border-yellow-700'
    },
    danger: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      hover: 'hover:border-red-300 dark:hover:border-red-700'
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      hover: 'hover:border-blue-300 dark:hover:border-blue-700'
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      border: 'border-purple-200 dark:border-purple-800',
      hover: 'hover:border-purple-300 dark:hover:border-purple-700'
    }
  }

  const iconColors = {
    default: 'text-gray-600 dark:text-gray-400',
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    danger: 'text-red-600 dark:text-red-400',
    info: 'text-blue-600 dark:text-blue-400',
    purple: 'text-purple-600 dark:text-purple-400'
  }

  const sizes = {
    small: 'p-3',
    default: 'p-4',
    large: 'p-6'
  }

  // Classes de altura consistente
  const heightClasses = consistentHeight ? {
    small: 'min-h-[100px]',
    default: 'min-h-[140px]',
    large: 'min-h-[180px]'
  } : {}

  // Formatar valor
  const formattedValue = React.useMemo(() => {
    if (formatValue) return formatValue(value)
    if (!isNaN(numericValue) && animate) {
      return displayValue.toLocaleString(undefined, {
        maximumFractionDigits: 2
      })
    }
    return value
  }, [value, displayValue, formatValue, animate, numericValue])

  // Estado de loading
  if (loading) {
    return (
      <div className={`
        ${variants.default.bg} 
        rounded-xl border ${variants.default.border} 
        ${sizes[size]} 
        ${consistentHeight ? heightClasses[size] : ''}
        ${className}
      `}>
        <div className="animate-pulse h-full flex flex-col">
          <div className="flex items-start justify-between flex-1">
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
              <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-32" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24" />
            </div>
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  // Estado de erro
  if (error) {
    return (
      <div className={`
        ${variants.danger.bg} 
        rounded-xl border ${variants.danger.border} 
        ${sizes[size]} 
        ${consistentHeight ? heightClasses[size] : ''}
        ${className}
      `}>
        <div className="text-center h-full flex flex-col justify-center">
          <p className="text-sm text-red-600 dark:text-red-400 mb-2">Erro ao carregar</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-xs text-red-600 dark:text-red-400 underline hover:no-underline"
            >
              Tentar novamente
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      className={`
        ${variants[variant].bg} 
        ${variants[variant].border}
        ${variants[variant].hover}
        rounded-xl border 
        ${sizes[size]}
        ${consistentHeight ? heightClasses[size] : ''}
        transition-all duration-200
        hover:shadow-lg dark:hover:shadow-gray-900/50
        ${onClick ? 'cursor-pointer' : ''}
        ${isAnimating ? 'ring-2 ring-blue-500/20' : ''}
        ${blur ? 'backdrop-blur-sm bg-opacity-80 dark:bg-opacity-80' : ''}
        relative overflow-hidden
        flex flex-col
        ${className}
      `}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={tooltip}
    >
      {/* Indicador de animação */}
      {isAnimating && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500 animate-pulse" />
      )}

      <div className="relative z-10 flex-1 flex flex-col">
        {/* Header - Sempre mesmo tamanho */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className={`text-sm font-medium text-gray-500 dark:text-gray-400 truncate`}>
                {label}
              </p>
              {trend !== undefined && showTrend && !compact && (
                <TrendIndicator trend={trend} value={trendValue} compact={compact} />
              )}
            </div>
            
            {/* Valor - Sempre ocupa mesmo espaço */}
            <div className="mt-1 min-h-[2.5rem]">
              <p className={`
                text-2xl font-bold text-gray-900 dark:text-white
                ${isAnimating ? 'text-blue-600 dark:text-blue-400' : ''}
                transition-colors duration-300 truncate
              `}>
                {formattedValue}
              </p>
            </div>
            
            {/* Sublabel - Espaço reservado */}
            <div className="min-h-[1.25rem]">
              {sublabel && (
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                  {sublabel}
                </p>
              )}
            </div>

            {trend !== undefined && showTrend && compact && (
              <div className="mt-1">
                <TrendIndicator trend={trend} value={trendValue} compact={true} />
              </div>
            )}
          </div>

          <div className="flex items-start gap-2 ml-2">
            {/* Menu de ações */}
            {actions && (
              <CardActions 
                {...actions}
                variant={variant}
              />
            )}

            {/* Ícone principal */}
            <div className={`
              p-2 rounded-lg flex-shrink-0
              ${variant === 'default' ? 'bg-gray-100 dark:bg-gray-800' : 'bg-white/50 dark:bg-black/50'}
              transition-transform duration-200
              ${isHovered ? 'scale-110' : ''}
            `}>
              <Icon size={20} className={iconColors[variant]} />
            </div>
          </div>
        </div>

        {/* Conteúdo adicional - Espaço flexível mas com altura mínima */}
        <div className="flex-1 flex flex-col justify-end">
          {/* Meta de progresso */}
          {goal && !compact && (
            <GoalProgress 
              current={numericValue} 
              goal={goal} 
              variant={variant}
            />
          )}

          {/* Sparkline */}
          {sparklineData && !compact && sparklineData.length > 0 && (
            <Sparkline 
              data={sparklineData} 
              variant={variant}
            />
          )}
        </div>
      </div>

      {/* Efeito de brilho no hover */}
      <div 
        className={`
          absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent
          -translate-x-full hover:translate-x-full transition-transform duration-1000
          pointer-events-none
        `}
      />
    </div>
  )
}

// Componente de grupo para múltiplos cards
export const StatCardGroup = ({ children, columns = 4, gap = 4, className = '' }) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
    6: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'
  }

  const gaps = {
    2: 'gap-2',
    4: 'gap-4',
    6: 'gap-6',
    8: 'gap-8'
  }

  return (
    <div className={`grid ${gridCols[columns]} ${gaps[gap]} ${className}`}>
      {React.Children.map(children, child => (
        <div className="h-full">
          {child}
        </div>
      ))}
    </div>
  )
}

export default StatCard