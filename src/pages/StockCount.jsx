// pages/StockCount.jsx
import React, { useState, useEffect, useCallback } from 'react'
import {
  ClipboardList, Plus, Search, CheckCircle, XCircle,
  AlertTriangle, Save, RotateCcw, ChevronRight, Calculator,
  Package, Barcode, Hash, Calendar, User, Filter,
  TrendingUp, TrendingDown, Equal, FileText, Eye, Edit2,
  Trash2, Clock, Check, X, ArrowRight, RefreshCw
} from 'lucide-react'
import DataCards from '../components/ui/DataCards'
import DataFilters from '../components/ui/DataFilters'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import FormInput from '../components/forms/FormInput'
import FeedbackMessage from '../components/ui/FeedbackMessage'
import DataLoadingSkeleton from '../components/ui/DataLoadingSkeleton'
import DataEmptyState from '../components/ui/DataEmptyState'
import Badge from '../components/Badge'
import { supabase } from '../lib/supabase'
import useSystemLogs from '../hooks/useSystemLogs'
import { useAuth } from '../contexts/AuthContext'

const StockCount = () => {
  const { profile } = useAuth()
  const { logCreate, logUpdate, logDelete, logError, logAction } = useSystemLogs()

  // Estados principais
  const [countSessions, setCountSessions] = useState([])
  const [activeSession, setActiveSession] = useState(null)
  const [sessionItems, setSessionItems] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilters, setActiveFilters] = useState({})

  // Estados de UI
  const [viewMode, setViewMode] = useState('sessions') // 'sessions', 'counting', 'review'
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState(false)
  const [isProductSearchModalOpen, setIsProductSearchModalOpen] = useState(false)
  const [isFinishModalOpen, setIsFinishModalOpen] = useState(false)
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [productSearchResults, setProductSearchResults] = useState([])
  const [productSearchTerm, setProductSearchTerm] = useState('')

  // Formulários
  const [sessionForm, setSessionForm] = useState({
    name: '',
    description: '',
    location: '',
    responsible: profile?.full_name || profile?.email || ''
  })

  const [countForm, setCountForm] = useState({
    counted_quantity: '',
    notes: ''
  })

  const [adjustmentForm, setAdjustmentForm] = useState({
    new_quantity: '',
    reason: '',
    notes: ''
  })

  const [formErrors, setFormErrors] = useState({})
  const [feedback, setFeedback] = useState({ show: false, type: 'success', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Estatísticas da sessão ativa
  const [sessionStats, setSessionStats] = useState({
    totalItems: 0,
    countedItems: 0,
    differences: 0,
    progress: 0
  })

  // Log de acesso
  useEffect(() => {
    logAction({
      action: 'VIEW',
      entityType: 'stock_count',
      details: {
        component: 'StockCount',
        user_role: profile?.role,
        user_email: profile?.email
      }
    })
  }, [])

  // Carregar sessões e produtos
  useEffect(() => {
    fetchCountSessions()
    fetchProducts()
  }, [])

  // Atualizar estatísticas quando os itens mudam
  useEffect(() => {
    if (activeSession && sessionItems.length > 0) {
      calculateSessionStats()
    }
  }, [sessionItems])

  const fetchCountSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('stock_count_sessions')
        .select(`
          *,
          items:stock_count_items(count)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      setCountSessions(data || [])
    } catch (error) {
      console.error('Erro ao carregar sessões:', error)
      showFeedback('error', 'Erro ao carregar balanços')
    }
  }

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (error) throw error

      setProducts(data || [])
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSessionItems = async (sessionId) => {
    try {
      const { data, error } = await supabase
        .from('stock_count_items')
        .select(`
          *,
          product:products(*)
        `)
        .eq('count_session_id', sessionId)
        .order('created_at', { ascending: true })

      if (error) throw error

      setSessionItems(data || [])
      return data
    } catch (error) {
      console.error('Erro ao carregar itens:', error)
      return []
    }
  }

  const calculateSessionStats = useCallback(() => {
    const total = sessionItems.length
    const counted = sessionItems.filter(item => item.counted_quantity !== null).length
    const differences = sessionItems.filter(item =>
      item.counted_quantity !== null && item.counted_quantity !== item.system_quantity
    ).length
    const progress = total > 0 ? Math.round((counted / total) * 100) : 0

    setSessionStats({ totalItems: total, countedItems: counted, differences, progress })
  }, [sessionItems])

  const showFeedback = (type, message) => {
    setFeedback({ show: true, type, message })
    setTimeout(() => setFeedback({ show: false, type: 'success', message: '' }), 4000)
  }

  // Criar nova sessão de balanço
  const handleCreateSession = async () => {
    if (!sessionForm.name.trim()) {
      setFormErrors({ name: 'Nome do balanço é obrigatório' })
      return
    }

    setIsSubmitting(true)
    try {
      const sessionData = {
        name: sessionForm.name,
        description: sessionForm.description || null,
        location: sessionForm.location || null,
        responsible: sessionForm.responsible,
        status: 'in_progress',
        created_by: profile?.id,
        started_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('stock_count_sessions')
        .insert([sessionData])
        .select()
        .single()

      if (error) throw error

      await logCreate('stock_count_session', data.id, {
        name: data.name,
        created_by: profile?.email
      })

      showFeedback('success', 'Balanço iniciado com sucesso!')
      setIsNewSessionModalOpen(false)
      setSessionForm({ name: '', description: '', location: '', responsible: profile?.full_name || profile?.email || '' })

      await fetchCountSessions()
    } catch (error) {
      console.error('Erro ao criar sessão:', error)
      showFeedback('error', 'Erro ao iniciar balanço')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Iniciar contagem
  const startCounting = async (session) => {
    setLoading(true)
    try {
      const items = await fetchSessionItems(session.id)

      // Se não houver itens, adicionar todos os produtos ativos automaticamente
      if (items.length === 0) {
        await addAllProductsToSession(session.id)
        const newItems = await fetchSessionItems(session.id)
        setSessionItems(newItems)
      }

      setActiveSession(session)
      setViewMode('counting')

      await logAction({
        action: 'START_COUNT',
        entityType: 'stock_count_session',
        entityId: session.id,
        details: { session_name: session.name }
      })
    } catch (error) {
      showFeedback('error', 'Erro ao iniciar contagem')
    } finally {
      setLoading(false)
    }
  }

  // Adicionar todos os produtos ativos à sessão
  const addAllProductsToSession = async (sessionId) => {
    const itemsToAdd = products.map(product => ({
      count_session_id: sessionId,
      product_id: product.id,
      system_quantity: product.stock_quantity || 0,
      system_cost: product.cost_price || 0,
      counted_quantity: null,
      status: 'pending'
    }))

    const { error } = await supabase
      .from('stock_count_items')
      .insert(itemsToAdd)

    if (error) throw error
  }

  // Adicionar produto específico à sessão
  const addProductToSession = async (product) => {
    try {
      const existingItem = sessionItems.find(item => item.product_id === product.id)

      if (existingItem) {
        showFeedback('info', 'Produto já está na lista de contagem')
        return
      }

      const { data, error } = await supabase
        .from('stock_count_items')
        .insert([{
          count_session_id: activeSession.id,
          product_id: product.id,
          system_quantity: product.stock_quantity || 0,
          system_cost: product.cost_price || 0,
          counted_quantity: null,
          status: 'pending'
        }])
        .select(`
          *,
          product:products(*)
        `)
        .single()

      if (error) throw error

      setSessionItems(prev => [...prev, data])
      showFeedback('success', 'Produto adicionado à contagem')

    } catch (error) {
      console.error('Erro ao adicionar produto:', error)
      showFeedback('error', 'Erro ao adicionar produto')
    }
  }

  const handleCountItem = async () => {
    if (!selectedItem) return

    const quantity = parseFloat(countForm.counted_quantity)
    if (isNaN(quantity) || quantity < 0) {
      setFormErrors({ counted_quantity: 'Quantidade inválida' })
      return
    }

    setIsSubmitting(true)
    try {
      const difference = quantity - selectedItem.system_quantity
      // Usar diferença com tolerância para números decimais
      const hasDifference = Math.abs(difference) > 0.001
      const status = hasDifference ? 'diverged' : 'matched'

      console.log('📊 Registrando contagem:', {
        produto: selectedItem.product?.name,
        sistema: selectedItem.system_quantity,
        contado: quantity,
        diferenca: difference,
        status: status
      })

      const updateData = {
        counted_quantity: quantity,
        difference: difference,
        notes: countForm.notes || null,
        status: status,
        counted_by: profile?.id,
        counted_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('stock_count_items')
        .update(updateData)
        .eq('id', selectedItem.id)
        .select(`
          *,
          product:products(*)
        `)
        .single()

      if (error) throw error

      console.log('✅ Item atualizado:', {
        id: data.id,
        status: data.status,
        difference: data.difference
      })

      await logAction({
        action: 'COUNT_ITEM',
        entityType: 'stock_count_item',
        entityId: selectedItem.id,
        details: {
          product: selectedItem.product?.name,
          system_qty: selectedItem.system_quantity,
          counted_qty: quantity,
          difference: difference,
          status: status
        }
      })

      // Atualizar lista local
      setSessionItems(prev => prev.map(item =>
        item.id === selectedItem.id ? data : item
      ))

      showFeedback('success', hasDifference 
        ? `Contagem registrada! Diferença de ${difference > 0 ? '+' : ''}${difference}`
        : 'Contagem registrada! Quantidade confere.'
      )
      
      setIsAdjustmentModalOpen(false)
      setSelectedItem(null)
      setCountForm({ counted_quantity: '', notes: '' })

    } catch (error) {
      console.error('❌ Erro ao registrar contagem:', error)
      showFeedback('error', 'Erro ao registrar contagem: ' + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

    const handleFinishSession = async () => {
    setIsSubmitting(true)
    try {
        const divergedItems = sessionItems.filter(item => item.status === 'diverged')
        const adjustments = []

        console.log('📊 Finalizando balanço...', {
        sessionId: activeSession.id,
        divergedItems: divergedItems.length
        })

        // Aplicar ajustes de estoque para itens divergentes
        for (const item of divergedItems) {
        if (!item.product) {
            console.warn('⚠️ Produto não encontrado para o item:', item)
            continue
        }

        const adjustmentQuantity = item.counted_quantity - item.system_quantity
        
        console.log(`📝 Ajustando produto ${item.product.name}:`, {
            produto_id: item.product_id,
            quantidade_anterior: item.system_quantity,
            quantidade_nova: item.counted_quantity,
            ajuste: adjustmentQuantity
        })

        try {
            // Criar movimento de ajuste - usando os nomes corretos das colunas
            const movementData = {
            product_id: item.product_id,
            movement_type: 'ADJUSTMENT',
            quantity: adjustmentQuantity,
            quantity_before: item.system_quantity,      // Coluna correta
            quantity_after: item.counted_quantity,       // Coluna correta
            reason: `Balanço #${activeSession.name} - Ajuste de estoque`,
            reference_type: 'stock_count',
            reference_id: activeSession.id,              // UUID da sessão
            created_by: profile?.id
            }

            console.log('📦 Criando movimento:', movementData)

            const { data: movement, error: movementError } = await supabase
            .from('stock_movements')
            .insert([movementData])
            .select()
            .single()

            if (movementError) {
            console.error('❌ Erro ao criar movimento:', movementError)
            throw movementError
            }

            console.log('✅ Movimento criado:', movement)

            // Atualizar estoque do produto
            const { error: updateError } = await supabase
            .from('products')
            .update({
                stock_quantity: item.counted_quantity,
                updated_by: profile?.id,
                updated_at: new Date().toISOString()
            })
            .eq('id', item.product_id)

            if (updateError) {
            console.error('❌ Erro ao atualizar estoque:', updateError)
            throw updateError
            }

            console.log(`✅ Estoque do produto ${item.product.name} atualizado para ${item.counted_quantity}`)

            adjustments.push({
            item_id: item.id,
            movement_id: movement?.id || null,
            adjustment: adjustmentQuantity
            })

        } catch (itemError) {
            console.error(`❌ Erro ao processar item ${item.product?.name}:`, itemError)
            // Continua processando outros itens mesmo se um falhar
        }
        }

        // Atualizar status da sessão
        const sessionUpdateData = {
        status: 'completed',
        completed_at: new Date().toISOString(),
        completed_by: profile?.id,
        total_items: sessionItems.length,
        counted_items: sessionStats.countedItems,
        diverged_items: sessionStats.differences,
        adjustments: adjustments
        }

        console.log('📊 Atualizando sessão:', sessionUpdateData)

        const { error: sessionError } = await supabase
        .from('stock_count_sessions')
        .update(sessionUpdateData)
        .eq('id', activeSession.id)

        if (sessionError) {
        console.error('❌ Erro ao atualizar sessão:', sessionError)
        throw sessionError
        }

        await logAction({
        action: 'FINISH_COUNT',
        entityType: 'stock_count_session',
        entityId: activeSession.id,
        details: {
            session_name: activeSession.name,
            total_items: sessionItems.length,
            diverged_items: sessionStats.differences,
            adjustments_applied: adjustments.length,
            adjusted_products: divergedItems.map(i => i.product?.name)
        }
        })

        showFeedback('success', `Balanço finalizado! ${adjustments.length} produtos ajustados.`)
        setViewMode('sessions')
        setActiveSession(null)
        setSessionItems([])
        setIsFinishModalOpen(false)

        await fetchCountSessions()
        await fetchProducts()

    } catch (error) {
        console.error('❌ Erro ao finalizar balanço:', error)
        
        // Tentar identificar o erro específico
        let errorMessage = 'Erro ao finalizar balanço'
        
        if (error.message?.includes('foreign key')) {
        errorMessage = 'Erro de referência: Verifique se todos os produtos existem'
        } else if (error.message?.includes('permission')) {
        errorMessage = 'Erro de permissão: Você não tem autorização para esta operação'
        } else if (error.message?.includes('duplicate')) {
        errorMessage = 'Erro de duplicidade: Já existe um registro similar'
        } else if (error.message) {
        errorMessage = error.message
        }
        
        showFeedback('error', errorMessage)
        
        await logError('stock_count_session', error, {
        action: 'finish_count',
        session_id: activeSession?.id,
        session_name: activeSession?.name
        })
    } finally {
        setIsSubmitting(false)
    }
    }

  // Cancelar balanço
  const handleCancelSession = async () => {
    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from('stock_count_sessions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancelled_by: profile?.id
        })
        .eq('id', activeSession.id)

      if (error) throw error

      await logAction({
        action: 'CANCEL_COUNT',
        entityType: 'stock_count_session',
        entityId: activeSession.id,
        details: { session_name: activeSession.name }
      })

      showFeedback('info', 'Balanço cancelado')
      setViewMode('sessions')
      setActiveSession(null)
      setSessionItems([])

      await fetchCountSessions()
    } catch (error) {
      showFeedback('error', 'Erro ao cancelar balanço')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Buscar produtos para adicionar
  const searchProducts = async () => {
    if (!productSearchTerm.trim()) {
      setProductSearchResults([])
      return
    }

    const search = productSearchTerm.toLowerCase()
    const results = products.filter(p =>
      p.name?.toLowerCase().includes(search) ||
      p.code?.toLowerCase().includes(search) ||
      p.barcode?.toLowerCase().includes(search)
    ).slice(0, 10)

    setProductSearchResults(results)
  }

  // Renderizar card de sessão
  const renderSessionCard = (session) => {
    const statusConfig = {
      in_progress: { label: 'Em Andamento', color: 'warning', icon: Clock },
      completed: { label: 'Concluído', color: 'success', icon: CheckCircle },
      cancelled: { label: 'Cancelado', color: 'danger', icon: XCircle }
    }
    const config = statusConfig[session.status] || statusConfig.in_progress
    const StatusIcon = config.icon

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <ClipboardList size={20} className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{session.name}</h3>
              <p className="text-xs text-gray-500">#{session.id}</p>
            </div>
          </div>
          <Badge variant={config.color}>
            <StatusIcon size={12} className="mr-1" />
            {config.label}
          </Badge>
        </div>

        {session.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{session.description}</p>
        )}

        <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
          <div>
            <p className="text-gray-500">Local</p>
            <p className="font-medium">{session.location || 'Geral'}</p>
          </div>
          <div>
            <p className="text-gray-500">Responsável</p>
            <p className="font-medium truncate">{session.responsible}</p>
          </div>
          <div>
            <p className="text-gray-500">Início</p>
            <p className="font-medium">
              {new Date(session.created_at).toLocaleDateString('pt-BR')}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Itens</p>
            <p className="font-medium">{session.items?.[0]?.count || 0}</p>
          </div>
        </div>

        {session.status === 'completed' && (
          <div className="mb-3 p-2 bg-green-50 rounded-lg">
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Divergências:</span>
              <span className="font-medium text-orange-600">{session.diverged_items || 0}</span>
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span className="text-gray-600">Concluído em:</span>
              <span className="font-medium">
                {new Date(session.completed_at).toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-3 border-t">
          {session.status === 'in_progress' ? (
            <>
              <Button
                size="sm"
                variant="primary"
                fullWidth
                onClick={() => startCounting(session)}
              >
                Continuar
                <ArrowRight size={14} />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {/* Ver detalhes */}}
              >
                <Eye size={14} />
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="outline"
              fullWidth
              onClick={() => {/* Ver relatório */}}
            >
              <FileText size={14} />
              Ver Relatório
            </Button>
          )}
        </div>
      </div>
    )
  }

  // Renderizar card de item na contagem
  const renderCountItemCard = (item) => {
    const isCounted = item.counted_quantity !== null
    const hasDifference = isCounted && item.counted_quantity !== item.system_quantity

    return (
      <div
        className={`bg-white rounded-lg border p-4 cursor-pointer transition-all hover:shadow-md
          ${isCounted ? 'border-l-4 ' + (hasDifference ? 'border-l-orange-500' : 'border-l-green-500') : 'border-gray-200'}
        `}
        onClick={() => {
          setSelectedItem(item)
          setCountForm({
            counted_quantity: item.counted_quantity?.toString() || '',
            notes: item.notes || ''
          })
          setIsAdjustmentModalOpen(true)
        }}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Package size={18} className="text-gray-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h4 className="font-medium text-gray-900 truncate">{item.product?.name}</h4>
                <p className="text-xs text-gray-500">{item.product?.code || 'Sem código'}</p>
              </div>
              {isCounted && (
                hasDifference ? (
                  <AlertTriangle size={16} className="text-orange-500 flex-shrink-0" />
                ) : (
                  <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                )
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3">
              <div>
                <p className="text-xs text-gray-500">Sistema</p>
                <p className="font-medium">{item.system_quantity} {item.product?.unit}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Contado</p>
                <p className={`font-medium ${hasDifference ? 'text-orange-600' : 'text-green-600'}`}>
                  {isCounted ? `${item.counted_quantity} ${item.product?.unit}` : (
                    <span className="text-gray-400 text-sm">Pendente</span>
                  )}
                </p>
              </div>
            </div>

            {hasDifference && (
              <div className="mt-2 flex items-center gap-2 text-xs">
                <span className={`px-2 py-0.5 rounded-full font-medium
                  ${item.difference > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
                `}>
                  {item.difference > 0 ? '+' : ''}{item.difference}
                </span>
                <span className="text-gray-500">
                  Diferença de {Math.abs(item.difference)} {item.product?.unit}
                </span>
              </div>
            )}

            {item.notes && (
              <p className="mt-2 text-xs text-gray-500 italic line-clamp-1">{item.notes}</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Loading state
  if (loading) {
    return <DataLoadingSkeleton type="cards" rows={6} cardsPerRow={3} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <ClipboardList className="text-blue-600" />
                Balanço de Estoque
              </h1>
              <p className="text-gray-600 mt-1">
                {viewMode === 'sessions'
                  ? 'Gerencie e realize balanços periódicos do estoque'
                  : `Contagem: ${activeSession?.name}`
                }
              </p>
            </div>

            {viewMode === 'sessions' ? (
              <Button onClick={() => setIsNewSessionModalOpen(true)} icon={Plus}>
                Novo Balanço
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsProductSearchModalOpen(true)}
                  icon={Plus}
                >
                  Adicionar Produto
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setViewMode('sessions')}
                >
                  <RotateCcw size={16} className="mr-1" />
                  Voltar
                </Button>
              </div>
            )}
          </div>
        </div>

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

        {/* Modo Sessões */}
        {viewMode === 'sessions' && (
          <>
            {countSessions.length === 0 ? (
              <DataEmptyState
                title="Nenhum balanço realizado"
                description="Inicie seu primeiro balanço de estoque para conferir e ajustar as quantidades."
                icon="clipboard"
                action={{
                  label: "Iniciar Balanço",
                  icon: <Plus size={18} />,
                  onClick: () => setIsNewSessionModalOpen(true)
                }}
              />
            ) : (
              <>
                <div className="mb-6">
                  <DataFilters
                    searchPlaceholder="Buscar balanços..."
                    searchValue={searchTerm}
                    onSearchChange={setSearchTerm}
                    filters={[
                      {
                        key: 'status',
                        label: 'Status',
                        type: 'select',
                        options: [
                          { value: 'in_progress', label: 'Em Andamento' },
                          { value: 'completed', label: 'Concluídos' },
                          { value: 'cancelled', label: 'Cancelados' }
                        ]
                      }
                    ]}
                    onFilterChange={setActiveFilters}
                  />
                </div>

                <DataCards
                  data={countSessions.filter(s => {
                    if (searchTerm) {
                      return s.name.toLowerCase().includes(searchTerm.toLowerCase())
                    }
                    if (activeFilters.status) {
                      return s.status === activeFilters.status
                    }
                    return true
                  })}
                  renderCard={renderSessionCard}
                  keyExtractor={(item) => item.id}
                  columns={3}
                  gap={4}
                />
              </>
            )}
          </>
        )}

        {/* Modo Contagem */}
        {viewMode === 'counting' && activeSession && (
          <>
            {/* Barra de Progresso */}
            <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Progresso</p>
                    <p className="text-2xl font-bold text-gray-900">{sessionStats.progress}%</p>
                  </div>
                  <div className="h-10 w-px bg-gray-200"></div>
                  <div>
                    <p className="text-sm text-gray-500">Itens Contados</p>
                    <p className="text-xl font-semibold">
                      {sessionStats.countedItems}/{sessionStats.totalItems}
                    </p>
                  </div>
                  <div className="h-10 w-px bg-gray-200"></div>
                  <div>
                    <p className="text-sm text-gray-500">Divergências</p>
                    <p className={`text-xl font-semibold ${sessionStats.differences > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                      {sessionStats.differences}
                    </p>
                  </div>
                </div>

                <Button
                  variant="success"
                  onClick={() => setIsFinishModalOpen(true)}
                  disabled={sessionStats.countedItems === 0}
                >
                  <Check size={16} className="mr-1" />
                  Finalizar Balanço
                </Button>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all"
                  style={{ width: `${sessionStats.progress}%` }}
                />
              </div>
            </div>

            {/* Filtros da Contagem */}
            <div className="mb-4 flex gap-2">
              <Button
                variant={!activeFilters.status ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setActiveFilters({})}
              >
                Todos
              </Button>
              <Button
                variant={activeFilters.status === 'pending' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setActiveFilters({ status: 'pending' })}
              >
                Pendentes
              </Button>
              <Button
                variant={activeFilters.status === 'diverged' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setActiveFilters({ status: 'diverged' })}
              >
                Divergentes
              </Button>
              <Button
                variant={activeFilters.status === 'matched' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setActiveFilters({ status: 'matched' })}
              >
                Conferidos
              </Button>
            </div>

            {/* Cards de Contagem */}
            {sessionItems.length === 0 ? (
              <DataEmptyState
                title="Nenhum produto na lista"
                description="Adicione produtos para iniciar a contagem"
                action={{
                  label: "Adicionar Produtos",
                  icon: <Plus size={18} />,
                  onClick: () => setIsProductSearchModalOpen(true)
                }}
              />
            ) : (
              <DataCards
                data={sessionItems.filter(item => {
                  if (activeFilters.status === 'pending') return item.counted_quantity === null
                  if (activeFilters.status === 'diverged') return item.status === 'diverged'
                  if (activeFilters.status === 'matched') return item.status === 'matched'
                  return true
                })}
                renderCard={renderCountItemCard}
                keyExtractor={(item) => item.id}
                columns={3}
                gap={3}
              />
            )}
          </>
        )}

        {/* Modal Nova Sessão */}
        <Modal
          isOpen={isNewSessionModalOpen}
          onClose={() => setIsNewSessionModalOpen(false)}
          title="Iniciar Novo Balanço"
          size="md"
        >
          <div className="space-y-4">
            <FormInput
              label="Nome do Balanço"
              name="name"
              value={sessionForm.name}
              onChange={(e) => setSessionForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Balanço Mensal - Março 2024"
              required
              error={formErrors.name}
              icon={ClipboardList}
            />

            <FormInput
              label="Descrição"
              name="description"
              value={sessionForm.description}
              onChange={(e) => setSessionForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Detalhes sobre este balanço"
            />

            <FormInput
              label="Local"
              name="location"
              value={sessionForm.location}
              onChange={(e) => setSessionForm(prev => ({ ...prev, location: e.target.value }))}
              placeholder="Ex: Depósito Principal, Loja, etc."
            />

            <FormInput
              label="Responsável"
              name="responsible"
              value={sessionForm.responsible}
              onChange={(e) => setSessionForm(prev => ({ ...prev, responsible: e.target.value }))}
              placeholder="Nome do responsável"
              icon={User}
            />

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Importante:</strong> Todos os produtos ativos serão incluídos automaticamente na contagem.
                Você poderá adicionar ou remover itens durante o balanço.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsNewSessionModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateSession} loading={isSubmitting}>
              Iniciar Balanço
            </Button>
          </div>
        </Modal>

        {/* Modal Buscar Produtos */}
        <Modal
          isOpen={isProductSearchModalOpen}
          onClose={() => {
            setIsProductSearchModalOpen(false)
            setProductSearchTerm('')
            setProductSearchResults([])
          }}
          title="Adicionar Produto à Contagem"
          size="lg"
        >
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Buscar por nome, código ou código de barras..."
                value={productSearchTerm}
                onChange={(e) => {
                  setProductSearchTerm(e.target.value)
                  searchProducts()
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>

            <div className="max-h-96 overflow-y-auto">
              {productSearchResults.length === 0 && productSearchTerm ? (
                <p className="text-center text-gray-500 py-8">Nenhum produto encontrado</p>
              ) : productSearchResults.length > 0 ? (
                <div className="space-y-2">
                  {productSearchResults.map(product => {
                    const alreadyAdded = sessionItems.some(item => item.product_id === product.id)
                    return (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Package size={20} className="text-gray-400" />
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-xs text-gray-500">
                              {product.code} | Estoque: {product.stock_quantity} {product.unit}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant={alreadyAdded ? 'outline' : 'primary'}
                          disabled={alreadyAdded}
                          onClick={() => addProductToSession(product)}
                        >
                          {alreadyAdded ? 'Já Adicionado' : 'Adicionar'}
                        </Button>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">Digite para buscar produtos</p>
              )}
            </div>
          </div>
        </Modal>

        {/* Modal Registrar Contagem */}
        <Modal
          isOpen={isAdjustmentModalOpen}
          onClose={() => {
            setIsAdjustmentModalOpen(false)
            setSelectedItem(null)
            setFormErrors({})
          }}
          title={`Contar: ${selectedItem?.product?.name}`}
          size="md"
        >
          {selectedItem && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Código</p>
                    <p className="font-mono">{selectedItem.product?.code || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Unidade</p>
                    <p>{selectedItem.product?.unit}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Estoque no Sistema</p>
                    <p className="text-lg font-semibold">{selectedItem.system_quantity}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Último Custo</p>
                    <p className="text-green-600">
                      R$ {selectedItem.system_cost?.toFixed(2) || '0,00'}
                    </p>
                  </div>
                </div>
              </div>

              <FormInput
                label="Quantidade Contada"
                name="counted_quantity"
                type="number"
                step="0.01"
                value={countForm.counted_quantity}
                onChange={(e) => {
                  setCountForm(prev => ({ ...prev, counted_quantity: e.target.value }))
                  if (formErrors.counted_quantity) {
                    setFormErrors({})
                  }
                }}
                placeholder={`Quantidade em ${selectedItem.product?.unit}`}
                required
                error={formErrors.counted_quantity}
                icon={Calculator}
                autoFocus
              />

              <FormInput
                label="Observações"
                name="notes"
                value={countForm.notes}
                onChange={(e) => setCountForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Ex: Produto avariado, vencido, etc."
              />

              {countForm.counted_quantity && (
                <div className={`p-3 rounded-lg ${
                  parseFloat(countForm.counted_quantity) === selectedItem.system_quantity
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-orange-50 border border-orange-200'
                }`}>
                  <p className="text-sm">
                    {parseFloat(countForm.counted_quantity) === selectedItem.system_quantity ? (
                      <span className="text-green-700 flex items-center gap-2">
                        <CheckCircle size={16} />
                        Quantidade confere com o sistema
                      </span>
                    ) : (
                      <span className="text-orange-700 flex items-center gap-2">
                        <AlertTriangle size={16} />
                        Divergência de {
                          parseFloat(countForm.counted_quantity) - selectedItem.system_quantity
                        } unidades
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setIsAdjustmentModalOpen(false)
                setSelectedItem(null)
                setFormErrors({})
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleCountItem} loading={isSubmitting}>
              Registrar Contagem
            </Button>
          </div>
        </Modal>

        {/* Modal Confirmar Finalização */}
        <Modal
          isOpen={isFinishModalOpen}
          onClose={() => setIsFinishModalOpen(false)}
          title="Finalizar Balanço"
          size="md"
        >
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium mb-3">Resumo do Balanço</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total de Itens:</span>
                  <span className="font-medium">{sessionStats.totalItems}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Itens Contados:</span>
                  <span className="font-medium text-green-600">{sessionStats.countedItems}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Itens Pendentes:</span>
                  <span className="font-medium text-orange-600">
                    {sessionStats.totalItems - sessionStats.countedItems}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-gray-600">Divergências Encontradas:</span>
                  <span className={`font-medium ${sessionStats.differences > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                    {sessionStats.differences}
                  </span>
                </div>
              </div>
            </div>

            {sessionStats.countedItems < sessionStats.totalItems && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800 flex items-center gap-2">
                  <AlertTriangle size={16} />
                  Existem {sessionStats.totalItems - sessionStats.countedItems} itens não contados.
                  Estes itens manterão o estoque atual do sistema.
                </p>
              </div>
            )}

            {sessionStats.differences > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Ajustes serão aplicados:</strong> O estoque será atualizado
                  com as quantidades contadas para os itens com divergência.
                </p>
              </div>
            )}

            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">
                <strong>Atenção:</strong> Esta ação não pode ser desfeita.
                O estoque será atualizado com base nesta contagem.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsFinishModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleCancelSession} disabled={isSubmitting}>
              Cancelar Balanço
            </Button>
            <Button variant="success" onClick={handleFinishSession} loading={isSubmitting}>
              Finalizar e Aplicar Ajustes
            </Button>
          </div>
        </Modal>
      </div>
    </div>
  )
}

export default StockCount