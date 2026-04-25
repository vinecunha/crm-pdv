import React, { useMemo, useCallback, useState } from 'react'
import { 
  Copy, 
  Globe, 
  Users, 
  Percent, 
  DollarSign, 
  Gift, 
  Edit, 
  Trash2, 
  UserPlus, 
  Power,
  Tag,
  Calendar,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Maximize2,
  Minimize2,
  EyeOff,
  Eye
} from '@lib/icons'
import DataTable from '@components/ui/DataTable'
import Badge from '@components/Badge'
import { formatCurrency, formatDate } from '@utils/formatters'

const CouponTable = ({ 
  coupons = [],
  onEdit, 
  onManageCustomers, 
  onToggleStatus, 
  onDelete, 
  onCopyCode,
  onSendCampaign,
  
  // Novas props opcionais
  onRefresh,
  onExport,
  loading = false,
  enableSearch = true,
  enableExport = true,
  enableRefresh = true,
  enableSelection = false,
  onSelectionChange,
  compact = false,
  showSummary = true
}) => {
  const [selectedCoupons, setSelectedCoupons] = useState([])
  const safeCoupons = Array.isArray(coupons) ? coupons : []

  // Status badge
  const getStatusBadge = useCallback((isActive, isExpired = false) => {
    if (!isActive) {
      return (
        <Badge variant="danger">
          <Power size={10} className="mr-1" />
          Inativo
        </Badge>
      )
    }
    if (isExpired) {
      return (
        <Badge variant="warning">
          <AlertCircle size={10} className="mr-1" />
          Expirado
        </Badge>
      )
    }
    return (
      <Badge variant="success">
        <CheckCircle size={10} className="mr-1" />
        Ativo
      </Badge>
    )
  }, [])

  // Type badge
  const getTypeBadge = useCallback((type) => (
    <Badge variant={type === 'percent' ? 'info' : 'purple'}>
      {type === 'percent' ? (
        <><Percent size={12} className="mr-1" /> Percentual</>
      ) : (
        <><DollarSign size={12} className="mr-1" /> Valor Fixo</>
      )}
    </Badge>
  ), [])

  // Colunas da tabela
  const columns = useMemo(() => [
    {
      key: 'code',
      header: 'Código',
      sortable: true,
      searchable: true,
      width: '80px',
      render: (row) => (
        <div className="flex items-center gap-1 group">
          <span className="font-mono font-bold text-blue-600 dark:text-blue-400 truncate text-sm">
            {row?.code || '-'}
          </span>
          <button
            onClick={(e) => { 
              e.stopPropagation()
              onCopyCode?.(row?.code)
            }}
            className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
            title="Copiar código"
          >
            <Copy size={12} className="text-gray-400 dark:text-gray-500" />
          </button>
        </div>
      )
    },
    {
      key: 'name',
      header: 'Nome',
      sortable: true,
      searchable: true,
      maxWidth: '80px',
      render: (row) => (
        <div className="min-w-0">
          <div className="font-medium text-gray-900 dark:text-white truncate text-sm">
            {row?.name || '-'}
          </div>
          {row?.description && (
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {row.description}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'discount_value',
      header: 'Desconto',
      sortable: true,
      width: '100px',
      render: (row) => {
        if (!row) return <span>-</span>
        return (
          <div>
            <div className="font-semibold text-green-600 dark:text-green-400 truncate text-sm">
              {row.discount_type === 'percent' 
                ? `${row.discount_value || 0}%` 
                : formatCurrency(row.discount_value || 0)}
            </div>
            {(row.min_purchase > 0) && (
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-1">
                <DollarSign size={10} />
                Mín: {formatCurrency(row.min_purchase)}
              </div>
            )}
            {row.max_discount > 0 && row.discount_type === 'percent' && (
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                Máx: {formatCurrency(row.max_discount)}
              </div>
            )}
          </div>
        )
      }
    },
    {
      key: 'discount_type',
      header: 'Tipo',
      sortable: true,
      width: '130px',
      render: (row) => {
        if (!row) return <span>-</span>
        return (
          <div className="space-y-1">
            {getTypeBadge(row.discount_type)}
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              {row.is_global ? (
                <Globe size={10} className="flex-shrink-0" />
              ) : (
                <Users size={10} className="flex-shrink-0" />
              )}
              <span className="truncate">{row.is_global ? 'Global' : 'Restrito'}</span>
            </div>
          </div>
        )
      }
    },
    {
      key: 'usage',
      header: 'Uso',
      sortable: true,
      width: '100px',
      render: (row) => {
        if (!row) return <span>-</span>
        const usagePercent = row.usage_limit 
          ? ((row.used_count || 0) / row.usage_limit) * 100 
          : 0
        const isNearLimit = usagePercent >= 80
        const isAtLimit = usagePercent >= 100
        
        return (
          <div>
            <div className="flex items-center gap-1">
              <Tag size={12} className="text-gray-400" />
              <span className={`text-sm font-medium ${
                isAtLimit ? 'text-red-600 dark:text-red-400' :
                isNearLimit ? 'text-orange-600 dark:text-orange-400' :
                'text-gray-700 dark:text-gray-300'
              }`}>
                {row.used_count || 0}
                {row.usage_limit && `/${row.usage_limit}`}
              </span>
            </div>
            {row.usage_limit && (
              <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full mt-1">
                <div 
                  className={`h-full rounded-full transition-all ${
                    isAtLimit ? 'bg-red-500' :
                    isNearLimit ? 'bg-orange-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(usagePercent, 100)}%` }}
                />
              </div>
            )}
          </div>
        )
      }
    },
    {
      key: 'valid_to',
      header: 'Validade',
      sortable: true,
      width: '140px',
      render: (row) => {
        if (!row) return <span>-</span>
        const isExpired = row.valid_to && new Date(row.valid_to) < new Date()
        const daysLeft = row.valid_to 
          ? Math.ceil((new Date(row.valid_to) - new Date()) / (1000 * 60 * 60 * 24))
          : null
        
        return (
          <div className="min-w-0">
            {row.valid_from && row.valid_to ? (
              <div className="text-xs space-y-0.5">
                <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                  <Calendar size={10} />
                  <span className="truncate">{formatDate(row.valid_from)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar size={10} className={
                    isExpired ? 'text-red-500' : 
                    daysLeft <= 7 ? 'text-orange-500' : 
                    'text-gray-400'
                  } />
                  <span className={`truncate ${
                    isExpired ? 'text-red-500 dark:text-red-400' :
                    daysLeft <= 7 ? 'text-orange-500 dark:text-orange-400' :
                    'text-gray-900 dark:text-white'
                  }`}>
                    {formatDate(row.valid_to)}
                  </span>
                </div>
                {!isExpired && daysLeft !== null && daysLeft <= 7 && (
                  <div className="text-orange-500 dark:text-orange-400 text-xs">
                    {daysLeft === 0 ? 'Expira hoje' : `${daysLeft} dia${daysLeft > 1 ? 's' : ''}`}
                  </div>
                )}
              </div>
            ) : (
              <span className="text-xs text-gray-500 dark:text-gray-400">Indeterminado</span>
            )}
          </div>
        )
      }
    },
    {
      key: 'is_active',
      header: 'Status',
      sortable: true,
      width: '100px',
      render: (row) => {
        if (!row) return <span>-</span>
        const isExpired = row.valid_to && new Date(row.valid_to) < new Date()
        return getStatusBadge(row.is_active, isExpired)
      }
    }
  ], [getTypeBadge, getStatusBadge, onCopyCode])

  // Ações da tabela
  const actions = useMemo(() => [
    {
      id: 'campaign',
      label: 'Campanha',
      icon: Gift, 
      onClick: onSendCampaign,
      show: (row) => row?.is_active === true && (!row?.valid_to || new Date(row.valid_to) >= new Date()),
      className: 'text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/30'
    },
    {
      id: 'edit',
      label: 'Editar',
      icon: Edit, 
      onClick: onEdit,
      className: 'text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30'
    },
    {
      id: 'customers',
      label: 'Clientes',
      icon: UserPlus, 
      onClick: onManageCustomers,
      disabled: (row) => row?.is_global === true,
      className: 'text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/30'
    },
    {
      id: 'toggle', 
      label: (row) => row?.is_active ? 'Desativar' : 'Ativar',
      icon: Power, 
      onClick: onToggleStatus,
      className: (row) => row?.is_active 
        ? 'text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/30' 
        : 'text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/30'
    },
    {
      id: 'delete', 
      label: 'Excluir',
      icon: Trash2,
      onClick: (row) => onDelete(row),
      className: 'text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30'
    }
  ], [onSendCampaign, onEdit, onManageCustomers, onToggleStatus, onDelete])

  // Campos para busca
  const searchFields = useMemo(() => 
    columns
      .filter(col => col.searchable)
      .map(col => col.key)
  , [columns])

  // Estatísticas dos cupons
  const stats = useMemo(() => {
    if (!safeCoupons.length) return null
    
    const active = safeCoupons.filter(c => c.is_active).length
    const expired = safeCoupons.filter(c => c.valid_to && new Date(c.valid_to) < new Date()).length
    const global = safeCoupons.filter(c => c.is_global).length
    const nearLimit = safeCoupons.filter(c => 
      c.usage_limit && ((c.used_count || 0) / c.usage_limit) >= 0.8
    ).length
    
    return { active, expired, global, nearLimit, total: safeCoupons.length }
  }, [safeCoupons])

  // Handler para seleção
  const handleSelectionChange = useCallback((selectedIds) => {
    setSelectedCoupons(selectedIds)
    onSelectionChange?.(selectedIds)
  }, [onSelectionChange])

  // Handler para refresh
  const handleRefresh = useCallback(async () => {
    if (onRefresh) {
      await onRefresh()
    }
  }, [onRefresh])

  // Nome do arquivo de exportação
  const exportFilename = useMemo(() => {
    const date = new Date().toISOString().split('T')[0]
    return `cupons-${date}.csv`
  }, [])

  return (
    <div className="space-y-3">
      {/* Tabela principal */}
      <div className="overflow-x-auto">
        <div style={{ minWidth: compact ? '750px' : '850px' }}>
          <DataTable
            // Props básicas (mantidas)
            columns={columns}
            data={safeCoupons}
            actions={actions}
            onRowClick={onEdit}
            emptyMessage="Nenhum cupom encontrado"
            striped
            hover
            pagination
            itemsPerPageOptions={[10, 20, 50, 100]}
            defaultItemsPerPage={20}
            showTotalItems
            
            // Novas funcionalidades (opcionais)
            id="tabela-cupons"
            // searchable={enableSearch}
            // searchPlaceholder="Buscar por código, nome, tipo..."
            // searchFields={searchFields}
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
          />
        </div>
      </div>

      {/* Ações em massa (quando há seleção) */}
      {enableSelection && selectedCoupons.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {selectedCoupons.length} cupon{selectedCoupons.length > 1 ? 's' : ''} selecionado{selectedCoupons.length > 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-2">
            {onToggleStatus && (
              <button
                onClick={() => {
                  selectedCoupons.forEach(id => {
                    const coupon = safeCoupons.find(c => c.id === id)
                    if (coupon) onToggleStatus(coupon)
                  })
                }}
                className="px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                Alternar status
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => {
                  if (confirm(`Excluir ${selectedCoupons.length} cupon(s)?`)) {
                    selectedCoupons.forEach(id => {
                      const coupon = safeCoupons.find(c => c.id === id)
                      if (coupon) onDelete(coupon)
                    })
                  }
                }}
                className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Excluir selecionados
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default CouponTable
