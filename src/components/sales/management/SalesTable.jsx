import React, { useState, useCallback, useMemo } from 'react'
import { 
  User, 
  Phone, 
  Ticket, 
  Banknote, 
  CreditCard, 
  QrCode, 
  Ban,
  CheckCircle,
  Clock,
  RefreshCw,
  Receipt,
  FileText,
  Maximize2,
  Minimize2,
  EyeOff,
  Eye
} from '../../lib/icons'
import { useTableStrategy } from '../../hooks/useTableStrategy'
import Badge from '../Badge'
import { formatCurrency, formatDateTime } from '../../utils/formatters'
import { createAction } from '../../utils/actions'

const SalesTable = ({ 
  sales, 
  onViewDetails, 
  onCancel, 
  onPrint,
  // Novas props opcionais
  onRefresh,
  onExport,
  loading = false,
  enableSearch = true,
  enableExport = true,
  enableRefresh = true,
  enableSelection = false,
  onSelectionChange,
  compact = false
}) => {
  const TableComponent = useTableStrategy(sales, 100)
  const [selectedSales, setSelectedSales] = useState([])

  // Configuração de status
  const getStatusBadge = useCallback((status) => {
    const statusConfig = {
      completed: { variant: 'success', icon: CheckCircle, text: 'Concluída' },
      cancelled: { variant: 'danger', icon: Ban, text: 'Cancelada' },
      pending: { variant: 'warning', icon: Clock, text: 'Pendente' },
      refunded: { variant: 'info', icon: RefreshCw, text: 'Reembolsada' }
    }
    const config = statusConfig[status] || statusConfig.completed
    const Icon = config.icon
    return (
      <Badge variant={config.variant}>
        <Icon size={12} />
        <span className="ml-1">{config.text}</span>
      </Badge>
    )
  }, [])

  // Configuração de método de pagamento
  const paymentMethods = useMemo(() => ({
    cash: { icon: Banknote, text: 'Dinheiro' },
    credit_card: { icon: CreditCard, text: 'Crédito' },
    debit_card: { icon: CreditCard, text: 'Débito' },
    pix: { icon: QrCode, text: 'PIX' }
  }), [])

  const getPaymentMethod = useCallback((method) => {
    return paymentMethods[method] || { icon: Banknote, text: method }
  }, [paymentMethods])

  // Colunas da tabela
  const columns = useMemo(() => [
    {
      key: 'sale_number',
      header: 'Nº Venda',
      sortable: true,
      width: '130px',
      searchable: true,
      render: (row) => (
        <div>
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            #{row.sale_number}
          </div>
          {row.coupon_code && (
            <div className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1 mt-1">
              <Ticket size={12} />
              {row.coupon_code}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'created_at',
      header: 'Data/Hora',
      sortable: true,
      width: '160px',
      searchable: false,
      render: (row) => (
        <div>
          <div className="text-sm text-gray-900 dark:text-white">
            {formatDateTime(row.created_at)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            por {row.created_by_email || 'Sistema'}
          </div>
        </div>
      )
    },
    {
      key: 'customer_name',
      header: 'Cliente',
      sortable: true,
      width: '20%',
      minWidth: '180px',
      searchable: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          <User size={14} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
          <div className="min-w-0">
            <div className="text-sm text-gray-900 dark:text-white truncate">
              {row.customer_name || 'Cliente não identificado'}
            </div>
            {row.customer_phone && (
              <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Phone size={10} />
                <span className="truncate">{row.customer_phone}</span>
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'final_amount',
      header: 'Total',
      sortable: true,
      width: '130px',
      searchable: false,
      render: (row) => (
        <div>
          <div className="text-sm font-semibold text-gray-900 dark:text-white">
            {formatCurrency(row.final_amount)}
          </div>
          {row.discount_amount > 0 && (
            <div className="text-xs text-green-600 dark:text-green-400">
              Desc: {formatCurrency(row.discount_amount)}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'payment_method',
      header: 'Pagamento',
      sortable: true,
      width: '130px',
      searchable: true,
      render: (row) => {
        const { icon: Icon, text } = getPaymentMethod(row.payment_method)
        return (
          <div className="flex items-center gap-1">
            <Icon size={16} />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {text}
            </span>
          </div>
        )
      }
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      width: '130px',
      searchable: true,
      render: (row) => getStatusBadge(row.status)
    }
  ], [getPaymentMethod, getStatusBadge])

  // Ações da tabela
  const actions = useMemo(() => [
    createAction('view', onViewDetails),
    createAction('cancel', onCancel, {
      disabled: (row) => row.status !== 'completed',
      className: (row) => row.status !== 'completed' 
        ? 'opacity-50 cursor-not-allowed' 
        : 'text-red-600 hover:text-red-700 dark:text-red-400'
    }),
    createAction('print', onPrint, {
      className: 'text-gray-600 hover:text-gray-700 dark:text-gray-400'
    }),
    // Ação adicional para comprovante (se disponível)
    ...(onViewDetails ? [{
      id: 'receipt',
      icon: Receipt,
      label: 'Comprovante',
      onClick: (row) => onViewDetails(row, { tab: 'receipt' }),
      show: (row) => row.status === 'completed',
      className: 'text-blue-600 hover:text-blue-700 dark:text-blue-400'
    }] : [])
  ], [onViewDetails, onCancel, onPrint])

  // Handler para seleção de vendas
  const handleSelectionChange = useCallback((selectedIds) => {
    setSelectedSales(selectedIds)
    onSelectionChange?.(selectedIds)
  }, [onSelectionChange])

  // Handler para refresh
  const handleRefresh = useCallback(async () => {
    if (onRefresh) {
      await onRefresh()
    }
  }, [onRefresh])

  // Handler para exportação
  const handleExport = useCallback(() => {
    if (onExport) {
      onExport(selectedSales.length > 0 ? selectedSales : null)
    }
  }, [onExport, selectedSales])

  // Configuração de busca
  const searchFields = useMemo(() => 
    columns
      .filter(col => col.searchable)
      .map(col => col.key)
  , [columns])

  // Nome do arquivo de exportação
  const exportFilename = useMemo(() => {
    const date = new Date().toISOString().split('T')[0]
    return `vendas-${date}.csv`
  }, [])

  return (
    <div className="space-y-2">
      {/* Barra de ações em massa (quando há itens selecionados) */}
      {enableSelection && selectedSales.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText size={18} className="text-blue-600 dark:text-blue-400" />
            <span className="text-sm text-blue-700 dark:text-blue-300">
              {selectedSales.length} {selectedSales.length === 1 ? 'venda selecionada' : 'vendas selecionadas'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {onPrint && (
              <button
                onClick={() => {
                  const selectedItems = sales.filter(s => selectedSales.includes(s.id))
                  onPrint(selectedItems)
                }}
                className="px-3 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Imprimir selecionados
              </button>
            )}
            {onExport && (
              <button
                onClick={handleExport}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Exportar selecionados
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tabela principal */}
      <TableComponent
        // Props básicas (mantidas)
        columns={columns}
        data={sales}
        actions={actions}
        onRowClick={onViewDetails}
        emptyMessage="Nenhuma venda encontrada"
        striped
        hover
        showTotalItems
        
        // Novas funcionalidades (opcionais)
        id="tabela-vendas"
        searchable={enableSearch}
        searchPlaceholder="Buscar por número, cliente, status..."
        searchFields={searchFields}
        exportable={enableExport}
        exportFilename={exportFilename}
        refreshable={enableRefresh && !!onRefresh}
        onRefresh={handleRefresh}
        loading={loading}
        loadingRows={5}
        selectable={enableSelection}
        onSelectionChange={handleSelectionChange}
        compact={compact}
        stickyHeader={true}
        itemsPerPageOptions={[10, 20, 50, 100]}
        defaultItemsPerPage={20}
      />

      {/* Resumo rápido (opcional) */}
      {!loading && sales.length > 0 && (
        <div className="flex justify-end gap-4 px-2 text-xs text-gray-500 dark:text-gray-400">
          <span>
            Total de vendas: <strong className="text-gray-700 dark:text-gray-300">{sales.length}</strong>
          </span>
          <span>
            Valor total: <strong className="text-gray-700 dark:text-gray-300">
              {formatCurrency(sales.reduce((sum, s) => sum + (s.final_amount || 0), 0))}
            </strong>
          </span>
        </div>
      )}
    </div>
  )
}

export default SalesTable