import React from 'react'
import Modal from '@components/ui/Modal'
import BudgetDetailsHeader from '@components/budget/BudgetDetailsModal/BudgetDetailsHeader'
import BudgetStatusInfo from '@components/budget/BudgetDetailsModal/BudgetStatusInfo'
import BudgetItemsList from '@components/budget/BudgetDetailsModal/BudgetItemsList'
import BudgetTotals from '@components/budget/BudgetDetailsModal/BudgetTotals'
import BudgetDetailsActions from '@components/budget/BudgetDetailsModal/BudgetDetailsActions'

const BudgetDetailsModal = ({ 
  isOpen, 
  onClose, 
  budget, 
  items = [],
  onApprove,
  onReject,
  onConvert
}) => {
  if (!budget) return null
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Orçamento #${budget.budget_number || ''}`}
      size="lg"
    >
      <div className="space-y-4">
        <BudgetDetailsHeader budget={budget} />
        <BudgetStatusInfo budget={budget} />
        
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">
            ITENS
          </p>
          <BudgetItemsList items={items} />
        </div>
        
        <BudgetTotals budget={budget} />
      </div>
      
      <BudgetDetailsActions
        budget={budget}
        onClose={onClose}
        onApprove={onApprove}
        onReject={onReject}
        onConvert={onConvert}
      />
    </Modal>
  )
}

export default BudgetDetailsModal
