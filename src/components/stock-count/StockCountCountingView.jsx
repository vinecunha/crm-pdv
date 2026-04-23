import React from 'react'
import DataCards from '@components/ui/DataCards'
import DataEmptyState from '@components/ui/DataEmptyState'
import StockCountProgressBar from './StockCountProgressBar'
import StockCountItemCard from './StockCountItemCard'
import Button from '@components/ui/Button'
import { Plus } from '@lib/icons'

const StockCountCountingView = ({
  items,
  stats,
  activeFilters,
  setActiveFilters,
  onItemClick,
  onAddProduct,
  onFinish,
  isFinishingDisabled
}) => {
  const filteredItems = items.filter(item => {
    if (activeFilters.status === 'pending') return item.counted_quantity === null
    if (activeFilters.status === 'diverged') return item.status === 'diverged'
    if (activeFilters.status === 'matched') return item.status === 'matched'
    return true
  })

  return (
    <>
      <StockCountProgressBar
        stats={stats}
        onFinish={onFinish}
        disabled={isFinishingDisabled}
      />

      <div className="mb-4 flex gap-2">
        <Button
          variant={!activeFilters.status ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setActiveFilters({})}
        >
          Todos
        </Button>
        <Button
          variant={activeFilters.status === 'pending' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setActiveFilters({ status: 'pending' })}
        >
          Pendentes
        </Button>
        <Button
          variant={activeFilters.status === 'diverged' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setActiveFilters({ status: 'diverged' })}
        >
          Divergentes
        </Button>
        <Button
          variant={activeFilters.status === 'matched' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setActiveFilters({ status: 'matched' })}
        >
          Conferidos
        </Button>
      </div>

      {items.length === 0 ? (
        <DataEmptyState
          title="Nenhum produto na lista"
          description="Adicione produtos para iniciar a contagem"
          action={{
            label: "Adicionar Produtos",
            icon: <Plus size={18} />,
            onClick: onAddProduct
          }}
        />
      ) : (
        <DataCards
          data={filteredItems}
          renderCard={(item) => (
            <StockCountItemCard
              item={item}
              onClick={() => onItemClick(item)}
            />
          )}
          keyExtractor={(item) => item.id}
          columns={3}
          gap={3}
        />
      )}
    </>
  )
}

export default StockCountCountingView
