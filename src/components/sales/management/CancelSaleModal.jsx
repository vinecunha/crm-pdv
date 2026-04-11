import React from 'react'
import { AlertCircle } from 'lucide-react'
import Modal from '../../ui/Modal'
import Button from '../../ui/Button'
import { formatCurrency } from '../../../utils/formatters'

const CancelSaleModal = ({ 
  isOpen, 
  onClose, 
  sale, 
  cancelReason, 
  setCancelReason, 
  cancelNotes, 
  setCancelNotes, 
  onConfirm, 
  isSubmitting 
}) => {
  if (!sale) return null

  const reasons = [
    { value: 'Cliente desistiu', label: 'Cliente desistiu da compra' },
    { value: 'Produto indisponível', label: 'Produto indisponível' },
    { value: 'Erro no valor', label: 'Erro no valor da venda' },
    { value: 'Erro no produto', label: 'Produto errado adicionado' },
    { value: 'Troca/Devolução', label: 'Troca/Devolução' },
    { value: 'Outros', label: 'Outros' }
  ]

  return (
    <Modal isOpen={isOpen} onClose={() => !isSubmitting && onClose()} title="Cancelar Venda" size="md" isLoading={isSubmitting}>
      <div className="space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-yellow-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800">Atenção! Esta ação não poderá ser desfeita.</p>
              <p className="text-xs text-yellow-700 mt-1">
                Venda #{sale.sale_number} no valor de {formatCurrency(sale.final_amount)}
              </p>
              <p className="text-xs text-yellow-700">Cliente: {sale.customer_name || 'Não identificado'}</p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Motivo do cancelamento *</label>
          <select value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" required>
            <option value="">Selecione um motivo</option>
            {reasons.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Observações (opcional)</label>
          <textarea value={cancelNotes} onChange={(e) => setCancelNotes(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" placeholder="Informações adicionais..." />
        </div>

        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-600"><strong>O que acontece após o cancelamento?</strong></p>
          <ul className="text-xs text-gray-500 mt-2 space-y-1 list-disc list-inside">
            <li>Os produtos voltam ao estoque</li>
            <li>O cupom é liberado para novo uso (se aplicável)</li>
            <li>O total de compras do cliente é atualizado</li>
            <li>A venda fica registrada como cancelada no histórico</li>
          </ul>
        </div>

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting} className="flex-1">Voltar</Button>
          <Button variant="danger" onClick={onConfirm} loading={isSubmitting} className="flex-1">Confirmar Cancelamento</Button>
        </div>
      </div>
    </Modal>
  )
}

export default CancelSaleModal