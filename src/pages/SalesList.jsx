// pages/SalesList.jsx - VERSÃO COMPLETA CORRIGIDA
import React, { useState, useEffect } from 'react'
import { 
  Eye, Ban, Printer, Calendar, DollarSign, User, 
  Package, CheckCircle, AlertCircle, Clock, RefreshCw,
  CreditCard, Banknote, QrCode, Ticket, Phone, FileText
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import FeedbackMessage from '../components/ui/FeedbackMessage'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import DataLoadingSkeleton from '../components/ui/DataLoadingSkeleton'
import DataTable from '../components/ui/DataTable'
import DataFilters from '../components/ui/DataFilters'
import useSystemLogs from '../hooks/useSystemLogs'
import useLogger from '../hooks/useLogger'

const SalesList = () => {
  const { profile } = useAuth()
  const { logAction, logError } = useSystemLogs()
  const { logComponentAction, logComponentError } = useLogger('SalesList')
  
  // Estados
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({})
  
  // Modais
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [selectedSale, setSelectedSale] = useState(null)
  const [saleItems, setSaleItems] = useState([])
  const [cancelReason, setCancelReason] = useState('')
  const [cancelNotes, setCancelNotes] = useState('')
  
  // Feedback
  const [feedback, setFeedback] = useState({ show: false, type: 'success', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Log de acesso à página
  useEffect(() => {
    logComponentAction('ACCESS_PAGE', null, {
      page: 'sales_list',
      user_email: profile?.email,
      user_role: profile?.role
    })
    
    fetchSales()
  }, [])

  useEffect(() => {
    fetchSales()
  }, [searchTerm, filters])

  const showFeedback = (type, message) => {
    setFeedback({ show: true, type, message })
    setTimeout(() => setFeedback({ show: false, type: 'success', message: '' }), 3000)
  }

  const fetchSales = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('sales')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (searchTerm.trim()) {
        query = query.or(`sale_number.ilike.%${searchTerm}%,customer_name.ilike.%${searchTerm}%,customer_phone.ilike.%${searchTerm}%`)
      }
      
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }
      
      if (filters.start_date) {
        query = query.gte('created_at', filters.start_date)
      }
      if (filters.end_date) {
        query = query.lte('created_at', filters.end_date)
      }
      
      if (filters.payment_method && filters.payment_method !== 'all') {
        query = query.eq('payment_method', filters.payment_method)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      
      setSales(data || [])
      
      await logComponentAction('FETCH_SALES', null, {
        count: data?.length || 0,
        filters: { searchTerm, ...filters }
      })
      
    } catch (error) {
      console.error('Erro ao carregar vendas:', error)
      await logComponentError(error, {
        action: 'fetch_sales',
        searchTerm,
        filters
      })
      showFeedback('error', 'Erro ao carregar vendas')
    } finally {
      setLoading(false)
    }
  }

  const viewSaleDetails = async (sale) => {
    setSelectedSale(sale)
    setShowDetailsModal(true)
    
    try {
      const { data, error } = await supabase
        .from('sale_items')
        .select('*')
        .eq('sale_id', sale.id)
        .order('created_at', { ascending: true })
      
      if (error) throw error
      
      setSaleItems(data || [])
      
      await logComponentAction('VIEW_SALE_DETAILS', sale.id, {
        sale_number: sale.sale_number,
        sale_status: sale.status,
        total_amount: sale.final_amount,
        items_count: data?.length || 0
      })
      
    } catch (error) {
      console.error('Erro ao carregar itens da venda:', error)
      await logComponentError(error, {
        action: 'view_sale_details',
        sale_id: sale.id,
        sale_number: sale.sale_number
      })
      showFeedback('error', 'Erro ao carregar detalhes da venda')
    }
  }

    const cancelSale = async () => {
    if (!cancelReason) {
        showFeedback('error', 'Selecione um motivo para o cancelamento')
        return
    }
    
    setIsSubmitting(true)
    
    try {
        console.log('=== INICIANDO CANCELAMENTO ===')
        console.log('Sale ID:', selectedSale.id)
        console.log('Sale Number:', selectedSale.sale_number)
        
        // Buscar itens da venda
        let items = saleItems
        if (items.length === 0) {
        const { data, error: itemsError } = await supabase
            .from('sale_items')
            .select('*')
            .eq('sale_id', selectedSale.id)
        
        if (itemsError) throw itemsError
        items = data || []
        setSaleItems(items)
        }
        
        console.log(`Items encontrados: ${items.length}`)
        
        // 1. ATUALIZAR STATUS DA VENDA - Usando service_role (via edge function ou RPC)
        const now = new Date()
        
        // Opção 1: Chamar uma Edge Function (recomendado)
        const { data: rpcResult, error: rpcError } = await supabase
        .rpc('cancel_sale', {
            p_sale_number: selectedSale.sale_number,
            p_cancelled_by: profile?.id,
            p_cancellation_reason: cancelReason,
            p_cancellation_notes: cancelNotes || null
        })
        
        if (rpcError) {
        console.error('Erro no RPC:', rpcError)
        
        // Opção 2: Tentar update com header apikey (fallback)
        const { error: updateError } = await supabase
            .from('sales')
            .update({
            status: 'cancelled',
            cancelled_at: now.toISOString(),
            cancelled_by: profile?.id,
            cancellation_reason: cancelReason,
            cancellation_notes: cancelNotes || null,
            updated_at: now.toISOString()
            })
            .eq('sale_number', selectedSale.sale_number)
        
        if (updateError) {
            console.error('Erro no update direto:', updateError)
            throw new Error(`Erro ao atualizar venda: ${updateError.message}`)
        }
        } else {
        console.log('✅ RPC executado com sucesso:', rpcResult)
        }
        
        // Aguardar um pouco para o banco processar
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // VERIFICAR SE A VENDA FOI ATUALIZADA
        const { data: verifySale, error: verifyError } = await supabase
        .from('sales')
        .select('status, cancelled_at, cancellation_reason')
        .eq('sale_number', selectedSale.sale_number)
        .maybeSingle()
        
        if (verifyError) {
        console.error('Erro ao verificar venda:', verifyError)
        } else if (!verifySale) {
        console.error('Venda não encontrada após atualização!')
        throw new Error(`Venda ${selectedSale.sale_number} não encontrada após atualização`)
        } else {
        console.log('✅ Venda verificada após atualização:', verifySale)
        console.log('Novo status:', verifySale.status)
        
        if (verifySale.status !== 'cancelled') {
            console.warn('⚠️ ATENÇÃO: Status não mudou para cancelled! Tentando método alternativo...')
            
            // Tentativa 3: Update usando ID em vez de sale_number
            const { error: updateByIdError } = await supabase
            .from('sales')
            .update({
                status: 'cancelled',
                cancelled_at: now.toISOString(),
                cancelled_by: profile?.id,
                cancellation_reason: cancelReason,
                cancellation_notes: cancelNotes || null,
                updated_at: now.toISOString()
            })
            .eq('id', selectedSale.id)
            
            if (updateByIdError) {
            console.error('Erro no update por ID:', updateByIdError)
            throw new Error(`Não foi possível cancelar a venda: ${updateByIdError.message}`)
            }
            
            // Verificar novamente
            const { data: finalVerify } = await supabase
            .from('sales')
            .select('status')
            .eq('id', selectedSale.id)
            .maybeSingle()
            
            if (finalVerify?.status !== 'cancelled') {
            throw new Error('Não foi possível alterar o status da venda. Verifique as permissões.')
            }
        }
        }
        
        // 2. RESTAURAR ESTOQUE DOS PRODUTOS
        let restoredCount = 0
        for (const item of items) {
        const { data: product, error: productError } = await supabase
            .from('products')
            .select('stock_quantity, name')
            .eq('id', item.product_id)
            .single()
        
        if (productError) {
            console.error(`Erro ao buscar produto ${item.product_id}:`, productError)
            continue
        }
        
        const newStock = (product.stock_quantity || 0) + item.quantity
        
        const { error: updateStockError } = await supabase
            .from('products')
            .update({ 
            stock_quantity: newStock,
            updated_at: now.toISOString()
            })
            .eq('id', item.product_id)
        
        if (updateStockError) {
            console.error(`Erro ao atualizar estoque do produto ${item.product_id}:`, updateStockError)
        } else {
            restoredCount++
            console.log(`✅ Estoque restaurado: ${product.name} | +${item.quantity} = ${newStock}`)
        }
        }
        
        console.log(`Estoque restaurado para ${restoredCount} de ${items.length} produtos`)
        
        // 3. DEVOLVER CUPOM SE TIVER
        let couponRestored = false
        if (selectedSale.coupon_code) {
        const { data: coupon, error: couponError } = await supabase
            .from('coupons')
            .select('*')
            .eq('code', selectedSale.coupon_code)
            .maybeSingle()
        
        if (!couponError && coupon) {
            const newUsedCount = Math.max(0, (coupon.used_count || 0) - 1)
            const { error: updateCouponError } = await supabase
            .from('coupons')
            .update({ 
                used_count: newUsedCount,
                updated_at: now.toISOString()
            })
            .eq('id', coupon.id)
            
            if (updateCouponError) {
            console.error('Erro ao devolver cupom:', updateCouponError)
            } else {
            couponRestored = true
            console.log(`✅ Cupom ${selectedSale.coupon_code} devolvido (usos restantes: ${newUsedCount})`)
            }
        }
        }
        
        // 4. ATUALIZAR TOTAL DE COMPRAS DO CLIENTE
        let customerTotalUpdated = false
        if (selectedSale.customer_id) {
        const { data: customer, error: customerError } = await supabase
            .from('customers')
            .select('total_purchases, name')
            .eq('id', selectedSale.customer_id)
            .maybeSingle()
        
        if (!customerError && customer) {
            const currentTotal = customer.total_purchases || 0
            const newTotal = Math.max(0, currentTotal - (selectedSale.final_amount || 0))
            const { error: updateCustomerError } = await supabase
            .from('customers')
            .update({ 
                total_purchases: newTotal,
                updated_at: now.toISOString()
            })
            .eq('id', selectedSale.customer_id)
            
            if (updateCustomerError) {
            console.error('Erro ao atualizar total do cliente:', updateCustomerError)
            } else {
            customerTotalUpdated = true
            console.log(`✅ Total do cliente ${customer.name} atualizado: R$ ${currentTotal} -> R$ ${newTotal}`)
            }
        }
        }
        
        // 5. VERIFICAÇÃO FINAL
        const { data: finalCheck, error: finalError } = await supabase
        .from('sales')
        .select('status, cancelled_at, cancellation_reason')
        .eq('sale_number', selectedSale.sale_number)
        .maybeSingle()
        
        if (!finalError && finalCheck) {
        console.log('=== VERIFICAÇÃO FINAL ===')
        console.log('Status final:', finalCheck.status)
        console.log('Cancelado em:', finalCheck.cancelled_at)
        console.log('Motivo:', finalCheck.cancellation_reason)
        
        if (finalCheck.status === 'cancelled') {
            console.log('✅ CANCELAMENTO CONFIRMADO COM SUCESSO!')
        } else {
            console.warn('⚠️ ATENÇÃO: Status final não é cancelled!')
            throw new Error('Não foi possível cancelar a venda. Verifique as permissões no banco de dados.')
        }
        }
        
        // 6. LOGS
        await logComponentAction('CANCEL_SALE', selectedSale.id, {
        sale_number: selectedSale.sale_number,
        reason: cancelReason,
        notes: cancelNotes,
        original_amount: selectedSale.final_amount,
        original_status: selectedSale.status,
        items_restored: restoredCount,
        coupon_restored: couponRestored,
        customer_total_updated: customerTotalUpdated
        })
        
        await logAction({
        action: 'CANCEL_SALE',
        entityType: 'sale',
        entityId: selectedSale.id,
        details: {
            sale_number: selectedSale.sale_number,
            reason: cancelReason,
            notes: cancelNotes,
            original_amount: selectedSale.final_amount,
            cancelled_by: profile?.email,
            items_restored: restoredCount
        },
        severity: 'WARNING'
        })
        
        showFeedback('success', `Venda ${selectedSale.sale_number} cancelada com sucesso!`)
        
        // Fechar modais
        setShowCancelModal(false)
        setShowDetailsModal(false)
        setSelectedSale(null)
        setCancelReason('')
        setCancelNotes('')
        setSaleItems([])
        
        // Recarregar lista de vendas
        await fetchSales()
        
    } catch (error) {
        console.error('=== ERRO NO CANCELAMENTO ===')
        console.error('Mensagem:', error.message)
        
        await logComponentError(error, {
        action: 'cancel_sale',
        sale_id: selectedSale?.id,
        sale_number: selectedSale?.sale_number,
        reason: cancelReason
        })
        
        showFeedback('error', `Erro ao cancelar venda: ${error.message}`)
    } finally {
        setIsSubmitting(false)
    }
    }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0)
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleString('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short'
    })
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: { color: 'green', icon: CheckCircle, text: 'Concluída' },
      cancelled: { color: 'red', icon: Ban, text: 'Cancelada' },
      pending: { color: 'yellow', icon: Clock, text: 'Pendente' },
      refunded: { color: 'orange', icon: RefreshCw, text: 'Reembolsada' }
    }
    
    const config = statusConfig[status] || statusConfig.completed
    const Icon = config.icon
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-${config.color}-100 text-${config.color}-800`}>
        <Icon size={12} />
        {config.text}
      </span>
    )
  }

  const getPaymentMethodIcon = (method) => {
    const icons = {
      cash: Banknote,
      credit_card: CreditCard,
      debit_card: CreditCard,
      pix: QrCode
    }
    const Icon = icons[method] || Banknote
    return <Icon size={16} />
  }

  const getPaymentMethodText = (method) => {
    const texts = {
      cash: 'Dinheiro',
      credit_card: 'Cartão Crédito',
      debit_card: 'Cartão Débito',
      pix: 'PIX'
    }
    return texts[method] || method
  }

  // Configuração das colunas da tabela
  const columns = [
    {
      key: 'sale_number',
      header: 'Nº Venda',
      sortable: true,
      render: (row) => (
        <div>
          <div className="text-sm font-medium text-gray-900">#{row.sale_number}</div>
          {row.coupon_code && (
            <div className="text-xs text-green-600 flex items-center gap-1 mt-1">
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
      render: (row) => (
        <div>
          <div className="text-sm text-gray-900">{formatDate(row.created_at)}</div>
          <div className="text-xs text-gray-500">
            por {row.created_by_email || 'Sistema'}
          </div>
        </div>
      )
    },
    {
      key: 'customer_name',
      header: 'Cliente',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          <User size={14} className="text-gray-400" />
          <div>
            <div className="text-sm text-gray-900">
              {row.customer_name || 'Cliente não identificado'}
            </div>
            {row.customer_phone && (
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <Phone size={10} />
                {row.customer_phone}
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
      render: (row) => (
        <div>
          <div className="text-sm font-semibold text-gray-900">
            {formatCurrency(row.final_amount)}
          </div>
          {row.discount_amount > 0 && (
            <div className="text-xs text-green-600">
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
      render: (row) => (
        <div className="flex items-center gap-1">
          {getPaymentMethodIcon(row.payment_method)}
          <span className="text-sm text-gray-700">
            {getPaymentMethodText(row.payment_method)}
          </span>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row) => getStatusBadge(row.status)
    }
  ]

  // Ações da tabela
  const actions = [
    {
      label: 'Ver detalhes',
      icon: <Eye size={18} />,
      className: 'text-blue-600 hover:text-blue-800 hover:bg-blue-50',
      onClick: (row) => viewSaleDetails(row)
    },
    {
      label: 'Cancelar venda',
      icon: <Ban size={18} />,
      className: 'text-red-600 hover:text-red-800 hover:bg-red-50',
      onClick: (row) => {
        setSelectedSale(row)
        setShowCancelModal(true)
        
        logComponentAction('OPEN_CANCEL_MODAL', row.id, {
          sale_number: row.sale_number,
          sale_status: row.status,
          sale_amount: row.final_amount
        })
      },
      disabled: (row) => row.status !== 'completed'
    },
    {
      label: 'Imprimir',
      icon: <Printer size={18} />,
      className: 'text-gray-600 hover:text-gray-800 hover:bg-gray-100',
      onClick: (row) => {
        logComponentAction('PRINT_SALE', row.id, {
          sale_number: row.sale_number
        })
        showFeedback('info', 'Funcionalidade de impressão em desenvolvimento')
      }
    }
  ]

  // Configuração dos filtros
  const filterConfig = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'all', label: 'Todos' },
        { value: 'completed', label: 'Concluídas' },
        { value: 'cancelled', label: 'Canceladas' },
        { value: 'pending', label: 'Pendentes' }
      ]
    },
    {
      key: 'payment_method',
      label: 'Forma de Pagamento',
      type: 'select',
      options: [
        { value: 'all', label: 'Todos' },
        { value: 'cash', label: 'Dinheiro' },
        { value: 'credit_card', label: 'Cartão Crédito' },
        { value: 'debit_card', label: 'Cartão Débito' },
        { value: 'pix', label: 'PIX' }
      ]
    },
    {
      key: 'start_date',
      label: 'Data inicial',
      type: 'date'
    },
    {
      key: 'end_date',
      label: 'Data final',
      type: 'date'
    }
  ]

  // Resumo das vendas
  const getSalesSummary = () => {
    const completedSales = sales.filter(s => s.status === 'completed')
    const cancelledSales = sales.filter(s => s.status === 'cancelled')
    const totalAmount = completedSales.reduce((sum, s) => sum + s.final_amount, 0)
    const totalDiscount = completedSales.reduce((sum, s) => sum + (s.discount_amount || 0), 0)
    
    return { 
      totalAmount, 
      totalDiscount, 
      completedCount: completedSales.length,
      cancelledCount: cancelledSales.length,
      totalCount: sales.length
    }
  }

  const summary = getSalesSummary()

  if (loading && sales.length === 0) {
    return <DataLoadingSkeleton />
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Feedback */}
        {feedback.show && (
          <div className="mb-4">
            <FeedbackMessage
              type={feedback.type}
              message={feedback.message}
              onClose={() => setFeedback({ show: false, type: 'success', message: '' })}
            />
          </div>
        )}

        {/* Cabeçalho */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Vendas</h1>
          <p className="text-gray-600 mt-1">Visualize, cancele e gerencie todas as vendas realizadas</p>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total de Vendas</p>
                <p className="text-2xl font-bold text-gray-900">{summary.totalCount}</p>
                <p className="text-xs text-green-600 mt-1">
                  {summary.completedCount} concluídas
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <FileText size={24} className="text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Faturamento Total</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalAmount)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Em {summary.completedCount} vendas
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign size={24} className="text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Descontos Concedidos</p>
                <p className="text-2xl font-bold text-purple-600">{formatCurrency(summary.totalDiscount)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Média: {formatCurrency(summary.totalDiscount / (summary.completedCount || 1))}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Ticket size={24} className="text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Cancelamentos</p>
                <p className="text-2xl font-bold text-red-600">{summary.cancelledCount}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {((summary.cancelledCount / summary.totalCount) * 100 || 0).toFixed(1)}% do total
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Ban size={24} className="text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filtros e Tabela */}
        <div className="space-y-4">
          <DataFilters
            searchPlaceholder="Buscar por nº venda, cliente ou telefone..."
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            filters={filterConfig}
            onFilterChange={setFilters}
            showFilters={true}
          />
          
          <DataTable
            columns={columns}
            data={sales}
            actions={actions}
            onRowClick={viewSaleDetails}
            emptyMessage="Nenhuma venda encontrada"
            striped={true}
            hover={true}
            pagination={true}
            itemsPerPageOptions={[20, 50, 100]}
            defaultItemsPerPage={20}
            showTotalItems={true}
          />
        </div>

        {/* Modal de Detalhes da Venda */}
        <Modal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false)
            logComponentAction('CLOSE_DETAILS_MODAL', selectedSale?.id, {
              sale_number: selectedSale?.sale_number
            })
          }}
          title={`Detalhes da Venda #${selectedSale?.sale_number || ''}`}
          size="lg"
        >
          {selectedSale && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500">Data da venda</p>
                  <p className="text-sm font-medium">{formatDate(selectedSale.created_at)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Forma de pagamento</p>
                  <p className="text-sm font-medium flex items-center gap-1">
                    {getPaymentMethodIcon(selectedSale.payment_method)}
                    {getPaymentMethodText(selectedSale.payment_method)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <div>{getStatusBadge(selectedSale.status)}</div>
                </div>
                {selectedSale.coupon_code && (
                  <div>
                    <p className="text-xs text-gray-500">Cupom aplicado</p>
                    <p className="text-sm font-medium text-green-600 flex items-center gap-1">
                      <Ticket size={14} />
                      {selectedSale.coupon_code}
                    </p>
                  </div>
                )}
                {selectedSale.cancelled_at && (
                  <>
                    <div>
                      <p className="text-xs text-gray-500">Cancelado em</p>
                      <p className="text-sm font-medium">{formatDate(selectedSale.cancelled_at)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Motivo do cancelamento</p>
                      <p className="text-sm font-medium">{selectedSale.cancellation_reason}</p>
                    </div>
                  </>
                )}
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Cliente</h3>
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">
                        {selectedSale.customer_name || 'Cliente não identificado'}
                      </p>
                      {selectedSale.customer_phone && (
                        <p className="text-xs text-blue-600">{selectedSale.customer_phone}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Itens da Venda</h3>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {saleItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{item.product_name}</p>
                        <p className="text-xs text-gray-500">
                          {formatCurrency(item.unit_price)} x {item.quantity}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        {formatCurrency(item.total_price)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span>{formatCurrency(selectedSale.total_amount)}</span>
                </div>
                {selectedSale.discount_amount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Desconto</span>
                    <span>- {formatCurrency(selectedSale.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total</span>
                  <span className="text-green-600">{formatCurrency(selectedSale.final_amount)}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowDetailsModal(false)} className="flex-1">
                  Fechar
                </Button>
                {selectedSale.status === 'completed' && (
                  <Button 
                    variant="danger" 
                    onClick={() => {
                      setShowDetailsModal(false)
                      setShowCancelModal(true)
                    }}
                    className="flex-1"
                  >
                    Cancelar Venda
                  </Button>
                )}
                <Button onClick={() => {
                  logComponentAction('PRINT_SALE_DETAILS', selectedSale.id, {
                    sale_number: selectedSale.sale_number
                  })
                  window.print()
                }} className="flex-1">
                  <Printer size={16} className="mr-2" />
                  Imprimir
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Modal de Cancelamento */}
        <Modal
          isOpen={showCancelModal}
          onClose={() => {
            if (!isSubmitting) {
              setShowCancelModal(false)
              logComponentAction('CLOSE_CANCEL_MODAL', selectedSale?.id, {
                sale_number: selectedSale?.sale_number
              })
            }
          }}
          title="Cancelar Venda"
          size="md"
          isLoading={isSubmitting}
        >
          {selectedSale && (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle size={20} className="text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">
                      Atenção! Esta ação não poderá ser desfeita.
                    </p>
                    <p className="text-xs text-yellow-700 mt-1">
                      Venda #{selectedSale.sale_number} no valor de {formatCurrency(selectedSale.final_amount)}
                    </p>
                    <p className="text-xs text-yellow-700">
                      Cliente: {selectedSale.customer_name || 'Não identificado'}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo do cancelamento *
                </label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  required
                >
                  <option value="">Selecione um motivo</option>
                  <option value="Cliente desistiu">Cliente desistiu da compra</option>
                  <option value="Produto indisponível">Produto indisponível</option>
                  <option value="Erro no valor">Erro no valor da venda</option>
                  <option value="Erro no produto">Produto errado adicionado</option>
                  <option value="Troca/Devolução">Troca/Devolução</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações (opcional)
                </label>
                <textarea
                  value={cancelNotes}
                  onChange={(e) => setCancelNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  placeholder="Informações adicionais sobre o cancelamento..."
                />
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-600">
                  <strong>O que acontece após o cancelamento?</strong>
                </p>
                <ul className="text-xs text-gray-500 mt-2 space-y-1 list-disc list-inside">
                  <li>Os produtos voltam ao estoque</li>
                  <li>O cupom é liberado para novo uso (se aplicável)</li>
                  <li>O total de compras do cliente é atualizado</li>
                  <li>A venda fica registrada como cancelada no histórico</li>
                </ul>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowCancelModal(false)}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  Voltar
                </Button>
                <Button
                  variant="danger"
                  onClick={cancelSale}
                  loading={isSubmitting}
                  className="flex-1"
                >
                  Confirmar Cancelamento
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  )
}

export default SalesList