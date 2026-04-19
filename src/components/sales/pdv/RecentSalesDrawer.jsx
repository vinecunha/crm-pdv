import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { History, X, Printer, Eye } from '../../../lib/icons'
import { formatCurrency, formatDate } from '../../../utils/formatters'
import Badge from '../../Badge'
import Button from '../../ui/Button'
import * as saleService from '../../../services/saleService'

const RecentSalesDrawer = () => {
  const [isOpen, setIsOpen] = useState(false)
  
  const { data: recentSales = [], refetch } = useQuery({
    queryKey: ['recent-sales'],
    queryFn: () => saleService.fetchRecentSales(10),
    enabled: isOpen,
    refetchInterval: isOpen ? 30000 : false,
  })
  
  const getStatusBadge = (status) => {
    const configs = {
      completed: { label: 'Concluída', variant: 'success' },
      pending: { label: 'Pendente', variant: 'warning' },
      cancelled: { label: 'Cancelada', variant: 'danger' }
    }
    const config = configs[status] || { label: status, variant: 'secondary' }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }
  
  return (
    <>
      {/* Botão de abrir */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed right-0 top-1/3 -translate-y-1/2 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-l-lg shadow-lg z-30 transition-colors"
        title="Vendas recentes"
      >
        <History size={20} />
        {recentSales.length > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {recentSales.length}
          </span>
        )}
      </button>
      
      {/* Drawer */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Conteúdo */}
          <div className="fixed right-0 top-0 bottom-0 w-96 bg-white dark:bg-gray-900 shadow-2xl z-50 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <History size={20} />
                Vendas Recentes
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Lista de vendas */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {recentSales.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  Nenhuma venda recente
                </p>
              ) : (
                recentSales.map((sale) => (
                  <div 
                    key={sale.id}
                    className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          #{sale.sale_number}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {sale.customer_name || 'Cliente não identificado'}
                        </p>
                      </div>
                      {getStatusBadge(sale.status)}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                        {formatCurrency(sale.final_amount)}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(sale.created_at)}
                      </span>
                    </div>
                    
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        icon={Eye}
                        onClick={() => {/* Visualizar detalhes */}}
                      >
                        Detalhes
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        icon={Printer}
                        onClick={() => {/* Imprimir recibo */}}
                      >
                        Recibo
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                fullWidth
                onClick={() => refetch()}
              >
                Atualizar
              </Button>
            </div>
          </div>
        </>
      )}
    </>
  )
}

export default RecentSalesDrawer