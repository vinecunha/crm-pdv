import React from 'react'
import { Eye, Printer } from 'lucide-react'
import Modal from '../ui/Modal'
import DataTable from '../ui/DataTable'
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters'

const CashierHistoryModal = ({ isOpen, onClose, history, users, onViewDetails, onPrint }) => {
  const getDifferenceColor = (diff) => {
    if (diff === 0) return 'text-green-600'
    if (Math.abs(diff) < 10) return 'text-yellow-600'
    return 'text-red-600'
  }

  const columns = [
    { key: 'closing_date', header: 'Data', sortable: true, render: (row) => formatDate(row.closing_date) },
    { key: 'expected_total', header: 'Esperado', render: (row) => formatCurrency(row.expected_total) },
    { key: 'declared_total', header: 'Declarado', render: (row) => formatCurrency(row.declared_total) },
    { key: 'difference', header: 'Diferença', render: (row) => <span className={`font-semibold ${getDifferenceColor(row.difference)}`}>{formatCurrency(row.difference)}</span> },
    { key: 'closed_by', header: 'Fechado por', render: (row) => users.find(u => u.id === row.closed_by)?.full_name || 'Sistema' },
    { key: 'closed_at', header: 'Data/Hora', render: (row) => formatDateTime(row.closed_at) }
  ]

  const actions = [
    { label: 'Ver detalhes', icon: <Eye size={18} />, className: 'text-blue-600 hover:text-blue-800', onClick: onViewDetails },
    { label: 'Imprimir', icon: <Printer size={18} />, className: 'text-gray-600 hover:text-gray-800', onClick: onPrint }
  ]

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Histórico de Fechamentos" size="xl">
      <DataTable columns={columns} data={history} actions={actions} emptyMessage="Nenhum fechamento encontrado" striped hover pagination itemsPerPageOptions={[20, 50, 100]} defaultItemsPerPage={20} />
    </Modal>
  )
}

export default CashierHistoryModal