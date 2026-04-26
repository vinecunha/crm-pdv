import React from 'react'
import Button from '@components/ui/Button'
import { Printer, CheckCircle, XCircle, Check } from '@lib/icons'
import { BUDGET_STATUS } from '@utils/budgetConstants.jsx'

const BudgetDetailsActions = ({ 
  budget, 
  onClose, 
  onApprove, 
  onReject, 
  onConvert 
}) => {
  const handleApprove = () => {
    onClose()
    onApprove(budget)
  }
  
  const handleReject = () => {
    onClose()
    onReject(budget)
  }
  
  return (
    <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-4 sm:mt-6 pt-4 border-t dark:border-gray-700">
      <Button
        variant="outline"
        onClick={onClose}
        className="order-3 sm:order-1 w-full sm:w-auto"
      >
        Fechar
      </Button>
      
      <Button
        variant="outline"
        onClick={() => window.print()}
        className="order-2 w-full sm:w-auto"
      >
        <Printer size={16} className="mr-1" />
        Imprimir
      </Button>
      
      {budget.status === BUDGET_STATUS.PENDING && (
        <>
          <Button
            variant="success"
            onClick={handleApprove}
            className="order-1 sm:order-3 w-full sm:w-auto"
          >
            <CheckCircle size={16} className="mr-1" />
            Aprovar
          </Button>
          <Button
            variant="danger"
            onClick={handleReject}
            className="order-1 sm:order-4 w-full sm:w-auto"
          >
            <XCircle size={16} className="mr-1" />
            Rejeitar
          </Button>
        </>
      )}
      
      {budget.status === BUDGET_STATUS.APPROVED && (
        <Button
          variant="success"
          onClick={onConvert}
          className="order-1 sm:order-3 w-full sm:w-auto"
        >
          <Check size={16} className="mr-1" />
          Converter em Venda
        </Button>
      )}
    </div>
  )
}

export default BudgetDetailsActions
