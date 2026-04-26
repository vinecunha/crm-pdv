import React from 'react'
import Modal from '@components/ui/Modal'
import BudgetDetailsHeader from './BudgetDetailsHeader'
import BudgetStatusInfo from './BudgetStatusInfo'
import BudgetItemsList from './BudgetItemsList'
import BudgetTotals from './BudgetTotals'
import BudgetDetailsActions from './BudgetDetailsActions'

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
