import React from 'react'
import { Eye, Printer } from '@lib/icons'
import Modal from '@components/ui/Modal'
import DataTable from '@components/ui/DataTable'
import { formatCurrency, formatDate, formatDateTime } from '@utils/formatters'

const CashierHistoryModal = ({ isOpen, onClose, history, users, onViewDetails, onPrint }) => {
  const getDifferenceColor = (diff) => {
    if (diff === 0) return 'text-green-600 dark:text-green-400'
    if (Math.abs(diff) < 10) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
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
    { 
      id: 'details',
      label: 'Ver detalhes', 
      icon: Eye,  // ✅ Componente, não elemento JSX
      className: 'text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300', 
      onClick: onViewDetails 
    },
    { 
      id: 'print',
      label: 'Imprimir', 
      icon: Printer,  // ✅ Componente, não elemento JSX
      className: 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200', 
      onClick: onPrint 
    }
  ]

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Histórico de Fechamentos" size="xl">
      <DataTable 
        columns={columns} 
        data={history} 
        actions={actions} 
        emptyMessage="Nenhum fechamento encontrado" 
        striped 
        hover 
        pagination 
        itemsPerPageOptions={[20, 50, 100]} 
        defaultItemsPerPage={20} 
      />
    </Modal>
  )
}

export default CashierHistoryModal
