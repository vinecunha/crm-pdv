import React, { useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, RefreshCw } from 'lucide-react'

const DataCards = ({
  data,
  renderCard,
  keyExtractor,
  columns = { default: 1, sm: 2, lg: 3, xl: 4 },
  gap = 4,
  onCardClick,
  emptyMessage = "Nenhum dado encontrado",
  loading = false,
  loadingSkeleton,
  className = "",
  enableAnimations = true,
  infiniteScroll,
  hasMore,
  onLoadMore,
  refreshControl,
  onRefresh,
  containerProps = {}
}) => {
  // Gaps otimizados para mobile
  const gapClasses = {
    0: 'gap-0',
    1: 'gap-1',
    2: 'gap-2',
    3: 'gap-3',
    4: 'gap-4',
    5: 'gap-5',
    6: 'gap-6',
    8: 'gap-8',
    10: 'gap-10'
  }

  // Configuração de colunas responsivas melhorada
  const getGridCols = useMemo(() => {
    const cols = typeof columns === 'number' 
      ? { default: columns } 
      : columns

    return `
      grid-cols-${cols.default || 1}
      ${cols.sm ? `sm:grid-cols-${cols.sm}` : ''}
      ${cols.md ? `md:grid-cols-${cols.md}` : ''}
      ${cols.lg ? `lg:grid-cols-${cols.lg}` : ''}
      ${cols.xl ? `xl:grid-cols-${cols.xl}` : ''}
      ${cols['2xl'] ? `2xl:grid-cols-${cols['2xl']}` : ''}
    `
  }, [columns])

  // Animação para cards
  const cardAnimation = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3, ease: "easeOut" }
  }

  // Scroll infinito com Intersection Observer
  const observerRef = React.useRef()
  const lastCardRef = useCallback((node) => {
    if (loading || !hasMore || !onLoadMore) return
    if (observerRef.current) observerRef.current.disconnect()
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        onLoadMore()
      }
    }, { threshold: 0.1, rootMargin: '100px' })
    
    if (node) observerRef.current.observe(node)
  }, [loading, hasMore, onLoadMore])

  // Estado vazio melhorado
  if (!loading && data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] p-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="text-center space-y-3">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            {emptyMessage}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Tente ajustar seus filtros ou recarregar a página
          </p>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full" {...containerProps}>
      {/* Pull to refresh indicator para mobile */}
      {refreshControl && (
        <div className="sticky top-0 z-10 bg-gradient-to-b from-white dark:from-gray-900 to-transparent">
          {refreshControl}
        </div>
      )}

      {/* Grid de cards com animações */}
      <div 
        className={`
          grid 
          ${getGridCols} 
          ${gapClasses[gap] || 'gap-4'} 
          auto-rows-min
          ${className}
        `}
        role="grid"
        aria-label="Grid de cards de dados"
      >
        <AnimatePresence mode="popLayout">
          {data.map((item, index) => {
            const isLast = index === data.length - 1
            const key = keyExtractor?.(item, index) || index
            
            const card = (
              <motion.div
                key={key}
                {...(enableAnimations ? cardAnimation : {})}
                layout={enableAnimations}
                onClick={() => onCardClick?.(item, index)}
                className={`
                  relative group
                  ${onCardClick ? 'cursor-pointer transform transition-all duration-200 hover:-translate-y-1 hover:shadow-lg' : ''}
                `}
                role="gridcell"
                tabIndex={onCardClick ? 0 : undefined}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && onCardClick) {
                    onCardClick(item, index)
                  }
                }}
                aria-label={onCardClick ? `Card ${index + 1} de ${data.length}` : undefined}
              >
                {/* Efeito de hover */}
                {onCardClick && (
                  <div className="absolute inset-0 bg-blue-500 opacity-0 group-hover:opacity-5 dark:group-hover:opacity-10 rounded-lg transition-opacity duration-200" />
                )}
                
                {/* Indicador de clique */}
                {onCardClick && (
                  <ChevronRight className="absolute top-4 right-4 w-5 h-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                )}
                
                {renderCard(item, index)}
              </motion.div>
            )

            // Adiciona ref para scroll infinito no último card
            return isLast ? (
              <div key={key} ref={lastCardRef}>
                {card}
              </div>
            ) : card
          })}
        </AnimatePresence>
      </div>

      {/* Loading states */}
      {loading && (
        <div className="mt-4">
          {loadingSkeleton || (
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns.default || 1}, 1fr)` }}>
              {[...Array(columns.default || 3)].map((_, i) => (
                <div
                  key={i}
                  className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Indicador de carregamento para scroll infinito */}
      {hasMore && !loading && (
        <div className="mt-4 text-center">
          <button
            onClick={onLoadMore}
            className="px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            Carregar mais...
          </button>
        </div>
      )}
    </div>
  )
}

// HOC para adicionar funcionalidades comuns
export const withVirtualization = (Component) => {
  return ({ virtualize, itemHeight = 300, ...props }) => {
    if (!virtualize) return <Component {...props} />
    
    // Implementação de virtualização para grandes listas
    // Você pode usar react-window ou react-virtual aqui
    return <Component {...props} />
  }
}

export default DataCards