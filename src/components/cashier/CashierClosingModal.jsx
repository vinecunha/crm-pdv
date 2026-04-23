import React from 'react'
import { Banknote, CreditCard, QrCode, ChevronRight, AlertCircle } from '@lib/icons'
import Modal from '@components/ui/Modal'
import Button from '@components/ui/Button'
import { formatCurrency, formatDate } from '@utils/formatters'

const CashierClosingModal = ({ 
  isOpen, 
  onClose, 
  summary, 
  dateRange, 
  declaredValues, 
  setDeclaredValues, 
  onConfirm, 
  loading 
}) => {
  if (!summary) return null

  const getDifferenceColor = (diff) => {
    if (diff === 0) return 'text-green-600 dark:text-green-400'
    if (Math.abs(diff) < 10) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const totalDeclared = declaredValues.cash + declaredValues.credit_card + declaredValues.debit_card + declaredValues.pix
  const expectedTotal = summary.resumo?.total_liquido || 0
  const difference = totalDeclared - expectedTotal

  const paymentInputs = [
    { key: 'cash', label: 'Dinheiro', icon: Banknote, color: 'text-green-600 dark:text-green-400' },
    { key: 'credit_card', label: 'Cartão Crédito', icon: CreditCard, color: 'text-blue-600 dark:text-blue-400' },
    { key: 'debit_card', label: 'Cartão Débito', icon: CreditCard, color: 'text-purple-600 dark:text-purple-400' },
    { key: 'pix', label: 'PIX', icon: QrCode, color: 'text-emerald-600 dark:text-emerald-400' }
  ]

  return (
    <Modal isOpen={isOpen} onClose={() => !loading && onClose()} title="Fechamento de Caixa" size="lg" isLoading={loading}>
      <div className="space-y-6">
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 dark:text-white mb-3">Resumo do Período</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Período:</span>
              <span className="font-medium text-gray-900 dark:text-white">{formatDate(dateRange.start)} a {formatDate(dateRange.end)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Total de Vendas:</span>
              <span className="text-gray-900 dark:text-white">{formatCurrency(summary.resumo?.total_vendas || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Descontos:</span>
              <span className="text-orange-600 dark:text-orange-400">-{formatCurrency(summary.resumo?.total_descontos || 0)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
              <span className="font-semibold text-gray-900 dark:text-white">Valor Esperado:</span>
              <span className="font-bold text-green-600 dark:text-green-400">{formatCurrency(expectedTotal)}</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-medium text-gray-900 dark:text-white mb-3">Valores Declarados</h3>
          <div className="space-y-3">
            {paymentInputs.map(({ key, label, icon: Icon, color }) => (
              <div key={key} className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center gap-2">
                  <Icon size={20} className={color} />
                  <span className="text-gray-700 dark:text-gray-200">{label}</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  value={declaredValues[key]}
                  onChange={(e) => setDeclaredValues({ ...declaredValues, [key]: parseFloat(e.target.value) || 0 })}
                  className="w-40 px-3 py-1 text-right bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Observações</label>
          <textarea
            value={declaredValues.notes}
            onChange={(e) => setDeclaredValues({ ...declaredValues, notes: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 placeholder-gray-400 dark:placeholder-gray-500"
            placeholder="Informações adicionais sobre o fechamento..."
          />
        </div>

        <div className={`p-4 rounded-lg ${
          difference === 0 
            ? 'bg-green-50 dark:bg-green-900/20' 
            : Math.abs(difference) < 10 
              ? 'bg-yellow-50 dark:bg-yellow-900/20' 
              : 'bg-red-50 dark:bg-red-900/20'
        }`}>
          <div className="flex justify-between items-center">
            <div><p className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Declarado</p><p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalDeclared)}</p></div>
            <ChevronRight size={24} className="text-gray-400 dark:text-gray-500" />
            <div><p className="text-sm font-medium text-gray-700 dark:text-gray-300">Valor Esperado</p><p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(expectedTotal)}</p></div>
            <ChevronRight size={24} className="text-gray-400 dark:text-gray-500" />
            <div><p className="text-sm font-medium text-gray-700 dark:text-gray-300">Diferença</p><p className={`text-xl font-bold ${getDifferenceColor(difference)}`}>{formatCurrency(difference)}</p></div>
          </div>
          {Math.abs(difference) > 10 && (
            <div className="mt-3 flex items-center gap-2 text-sm text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 p-2 rounded">
              <AlertCircle size={16} />Atenção: Diferença significativa detectada. Verifique os valores.
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button onClick={onConfirm} loading={loading} className="flex-1">Confirmar Fechamento</Button>
        </div>
      </div>
    </Modal>
  )
}

export default CashierClosingModal
