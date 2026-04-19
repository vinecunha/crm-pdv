import React from 'react'
import { CheckCircle, XCircle, Check } from '../../../lib/icons'
import { formatDate } from '../../../utils/formatters'
import { BUDGET_STATUS } from '../../../utils/budgetUtils'
import StatusBadge from '../shared/StatusBadge'

const BudgetStatusInfo = ({ budget }) => {
  return (
    <>
      <div className="grid grid-cols-3 gap-2 sm:gap-3 text-xs sm:text-sm">
        <div>
          <p className="text-gray-500 dark:text-gray-400">Data de Criação</p>
          <p className="font-medium dark:text-white">
            {formatDate(budget.created_at)}
          </p>
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-400">Válido até</p>
          <p className={`font-medium ${
            new Date(budget.valid_until) < new Date() && budget.status === BUDGET_STATUS.PENDING
              ? 'text-red-600 dark:text-red-400'
              : 'dark:text-white'
          }`}>
            {formatDate(budget.valid_until)}
          </p>
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-400">Status</p>
          <StatusBadge status={budget.status} />
        </div>
      </div>

      {(budget.status === BUDGET_STATUS.APPROVED || budget.status === BUDGET_STATUS.REJECTED) && (
        <div className={`rounded-lg p-3 sm:p-4 border ${
          budget.status === BUDGET_STATUS.APPROVED
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
        }`}>
          <p className={`text-xs font-medium mb-2 sm:mb-3 flex items-center gap-1 ${
            budget.status === BUDGET_STATUS.APPROVED
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
          }`}>
            {budget.status === BUDGET_STATUS.APPROVED ? <CheckCircle size={14} /> : <XCircle size={14} />}
            {budget.status === BUDGET_STATUS.APPROVED ? 'INFORMAÇÕES DE APROVAÇÃO' : 'INFORMAÇÕES DE REJEIÇÃO'}
          </p>
          <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-xs">
                {budget.status === BUDGET_STATUS.APPROVED ? 'Aprovado por' : 'Rejeitado por'}
              </p>
              <p className="font-medium text-gray-900 dark:text-white">
                {budget.approved_by_user?.full_name ||
                 budget.approved_by_user?.email || 'Sistema'}
              </p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-xs">
                {budget.status === BUDGET_STATUS.APPROVED ? 'Data de aprovação' : 'Data de rejeição'}
              </p>
              <p className="font-medium text-gray-900 dark:text-white">
                {budget.approved_at ? formatDate(budget.approved_at) : '-'}
              </p>
            </div>
          </div>
        </div>
      )}

      {budget.status === BUDGET_STATUS.CONVERTED && (
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 sm:p-4 border border-purple-200 dark:border-purple-800">
          <p className="text-xs text-purple-600 dark:text-purple-400 font-medium mb-2 sm:mb-3 flex items-center gap-1">
            <Check size={14} />
            INFORMAÇÕES DE CONVERSÃO
          </p>
          <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-xs">Convertido para venda</p>
              <p className="font-medium text-gray-900 dark:text-white">
                #{budget.converted_sale_id || '-'}
              </p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-xs">Data de conversão</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {formatDate(budget.updated_at)}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500 dark:text-gray-400 border-t dark:border-gray-700 pt-2 sm:pt-3">
        <p>
          Orçamento criado por: {
            budget.created_by_user?.full_name ||
            budget.created_by_user?.email ||
            'Sistema'
          }
        </p>
      </div>

      {budget.notes && (
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-2 sm:p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Observações</p>
          <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
            {budget.notes}
          </p>
        </div>
      )}
    </>
  )
}

export default BudgetStatusInfo