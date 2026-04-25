import React from 'react'
import DataTable from '@components/ui/DataTable'
import DataCards from '@components/ui/DataCards'
import BudgetCard from './BudgetCard'
import useMediaQuery from '@/hooks/utils/useMediaQuery'

const BudgetContent = ({ 
  budgets, 
  viewMode, 
  columns, 
  actions, 
  onViewDetails,
  onRefresh,
  id = "tabela-orcamentos"
}) => {
  const isMobile = useMediaQuery('(max-width: 768px)')
  
  const renderBudgetCard = (budget) => (
    <BudgetCard
      budget={budget}
      onClick={onViewDetails}
      onApprove={(budget) => actions.find(a => a.id === 'approve')?.onClick(budget)}
      onReject={(budget) => actions.find(a => a.id === 'reject')?.onClick(budget)}
    />
  )
  
  if (viewMode === 'cards') {
    return (
      <DataCards
        data={budgets}
        renderCard={renderBudgetCard}
        keyExtractor={(budget) => budget.id}
        columns={isMobile ? 1 : 2}
        gap={4}
        emptyMessage="Nenhum orçamento encontrado"
      />
    )
  }
  
  return (
    <DataTable
      columns={columns}
      data={budgets}
      actions={actions}
      onRowClick={onViewDetails}
      emptyMessage="Nenhum orçamento encontrado"
      striped
      hover
      pagination
      itemsPerPageOptions={[20, 50, 100]}
      defaultItemsPerPage={20}
      showTotalItems
      id={id}
      exportable={true}
      exportFilename="orcamentos.csv"
      refreshable={true}
      onRefresh={onRefresh}
      selectable={true}
      stickyHeader={true}
      compact={false}
    />
  )
}

export default BudgetContent
