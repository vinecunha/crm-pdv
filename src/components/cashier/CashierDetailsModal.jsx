import React from 'react'
import { Printer } from 'lucide-react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters'

const CashierDetailsModal = ({ isOpen, onClose, closing, users }) => {
  if (!closing) return null

  const getDifferenceColor = (diff) => {
    if (diff === 0) return 'text-green-600'
    if (Math.abs(diff) < 10) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Detalhes do Fechamento - ${closing.closing_date ? formatDate(closing.closing_date) : ''}`} size="xl">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-3 rounded"><p className="text-xs text-gray-500">Data do Fechamento</p><p className="font-medium">{formatDateTime(closing.closed_at)}</p></div>
          <div className="bg-gray-50 p-3 rounded"><p className="text-xs text-gray-500">Fechado por</p><p className="font-medium">{users.find(u => u.id === closing.closed_by)?.full_name || 'Sistema'}</p></div>
        </div>

        <div className="border-t pt-4">
          <h3 className="font-medium text-gray-900 mb-3">Resumo do Período</h3>
          <div className="grid grid-cols-2 gap-3">
            <div><p className="text-xs text-gray-500">Total de Vendas</p><p className="font-semibold">{formatCurrency(closing.total_sales)}</p></div>
            <div><p className="text-xs text-gray-500">Descontos</p><p className="font-semibold text-orange-600">-{formatCurrency(closing.total_discounts)}</p></div>
            <div><p className="text-xs text-gray-500">Cancelamentos</p><p className="font-semibold text-red-600">{formatCurrency(closing.total_cancellations)}</p></div>
            <div><p className="text-xs text-gray-500">Valor Esperado</p><p className="font-semibold text-green-600">{formatCurrency(closing.expected_total)}</p></div>
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="font-medium text-gray-900 mb-3">Valores Declarados</h3>
          <div className="space-y-2">
            <div className="flex justify-between"><span>Dinheiro</span><span className="font-medium">{formatCurrency(closing.total_cash)}</span></div>
            <div className="flex justify-between"><span>Cartões</span><span className="font-medium">{formatCurrency(closing.total_card)}</span></div>
            <div className="flex justify-between"><span>PIX</span><span className="font-medium">{formatCurrency(closing.total_pix)}</span></div>
            <div className="flex justify-between pt-2 border-t"><span className="font-semibold">Total Declarado</span><span className="font-bold">{formatCurrency(closing.declared_total)}</span></div>
            <div className="flex justify-between"><span className="font-semibold">Diferença</span><span className={`font-bold ${getDifferenceColor(closing.difference)}`}>{formatCurrency(closing.difference)}</span></div>
          </div>
        </div>

        {closing.notes && (
          <div className="border-t pt-4"><h3 className="font-medium text-gray-900 mb-2">Observações</h3><p className="text-gray-600 text-sm">{closing.notes}</p></div>
        )}

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onClose} className="flex-1">Fechar</Button>
          <Button onClick={() => window.print()} className="flex-1"><Printer size={16} className="mr-2" />Imprimir</Button>
        </div>
      </div>
    </Modal>
  )
}

export default CashierDetailsModal