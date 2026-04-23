import React from 'react'
import DataEmptyState from '@components/ui/DataEmptyState'
import { Plus } from '@lib/icons'

const BudgetEmptyState = ({ onCreateNew }) => {
  return (
    <DataEmptyState
      title="Nenhum orçamento encontrado"
      description="Comece criando um novo orçamento para seus clientes"
      icon="file-text"
      action={{
        label: "Criar Orçamento",
        icon: <Plus size={18} />,
        onClick: onCreateNew
      }}
    />
  )
}

export default BudgetEmptyState
