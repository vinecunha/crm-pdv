import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  ClipboardList, Plus, RotateCcw, Keyboard
} from 'lucide-react'
import Button from '../components/ui/Button'
import FeedbackMessage from '../components/ui/FeedbackMessage'
import DataLoadingSkeleton from '../components/ui/DataLoadingSkeleton'
import { supabase } from '../lib/supabase'
import useSystemLogs from '../hooks/useSystemLogs'
import { useAuth } from '../contexts/AuthContext.jsx'
import useStockCountShortcuts from '../hooks/useStockCountShortcuts'
import ShortcutFeedback from '../components/ui/ShortcutFeedback'

// Componentes modularizados
import StockCountSessionsView from '../components/stock-count/StockCountSessionsView'
import StockCountCountingView from '../components/stock-count/StockCountCountingView'
import NewSessionModal from '../components/stock-count/NewSessionModal'
import ProductSearchModal from '../components/stock-count/ProductSearchModal'
import CountItemModal from '../components/stock-count/CountItemModal'
import FinishSessionModal from '../components/stock-count/FinishSessionModal'
import ShortcutsHelpModal from '../components/ui/ShortcutsHelpModal'

const StockCount = () => {
  const { profile } = useAuth()
  const { logCreate, logAction, logError } = useSystemLogs()

  // Estados principais
  const [countSessions, setCountSessions] = useState([])
  const [activeSession, setActiveSession] = useState(null)
  const [sessionItems, setSessionItems] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilters, setActiveFilters] = useState({})

  // Estados de UI
  const [viewMode, setViewMode] = useState('sessions')
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState(false)
  const [isProductSearchModalOpen, setIsProductSearchModalOpen] = useState(false)
  const [isFinishModalOpen, setIsFinishModalOpen] = useState(false)
  const [isCountModalOpen, setIsCountModalOpen] = useState(false)
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [selectedItemIndex, setSelectedItemIndex] = useState(-1)
  const [productSearchTerm, setProductSearchTerm] = useState('')
  const [shortcutFeedback, setShortcutFeedback] = useState(null)

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

  const searchInputRef = useRef(null)

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

  // ========== HANDLERS PARA ATALHOS ==========

  const handleFocusSearch = useCallback(() => {
    searchInputRef.current?.focus()
  }, [])

  const handleClearSearch = useCallback(() => {
    setSearchTerm('')
    setActiveFilters({})
  }, [])

  const handleBack = useCallback(() => {
    setViewMode('sessions')
    setActiveSession(null)
    setSessionItems([])
  }, [])

  const handleRefreshSessions = useCallback(async () => {
    await fetchCountSessions()
    showFeedback('info', 'Lista atualizada')
  }, [])

  const handleNextItem = useCallback(() => {
    if (!isCountModalOpen) {
      // Se modal não está aberto, abrir o primeiro item pendente
      const pendingItems = sessionItems.filter(item => item.counted_quantity === null)
      if (pendingItems.length > 0) {
        handleOpenCountModal(pendingItems[0], 0)
      }
      return
    }

    // Navegar para próximo item
    const filteredItems = getFilteredItems()
    const currentFilteredIndex = filteredItems.findIndex(item => item.id === selectedItem?.id)
    
    if (currentFilteredIndex < filteredItems.length - 1) {
      const nextItem = filteredItems[currentFilteredIndex + 1]
      const originalIndex = sessionItems.findIndex(item => item.id === nextItem.id)
      handleOpenCountModal(nextItem, originalIndex)
    }
  }, [isCountModalOpen, selectedItem, sessionItems, activeFilters])

  const handlePreviousItem = useCallback(() => {
    if (!isCountModalOpen) return

    const filteredItems = getFilteredItems()
    const currentFilteredIndex = filteredItems.findIndex(item => item.id === selectedItem?.id)
    
    if (currentFilteredIndex > 0) {
      const prevItem = filteredItems[currentFilteredIndex - 1]
      const originalIndex = sessionItems.findIndex(item => item.id === prevItem.id)
      handleOpenCountModal(prevItem, originalIndex)
    }
  }, [isCountModalOpen, selectedItem, sessionItems, activeFilters])

  const handleCountItemShortcut = useCallback(() => {
    if (isCountModalOpen && selectedItem) {
      const quantity = parseFloat(countForm.counted_quantity)
      if (!isNaN(quantity) && quantity >= 0) {
        handleCountItem()
      }
    }
  }, [isCountModalOpen, selectedItem, countForm])

  const handleSkipItem = useCallback(() => {
    if (isCountModalOpen) {
      handleNextItem()
    }
  }, [isCountModalOpen, handleNextItem])

  const handleShortcutFeedback = useCallback((shortcut) => {
    setShortcutFeedback(shortcut)
  }, [])

  const getFilteredItems = useCallback(() => {
    return sessionItems.filter(item => {
      if (activeFilters.status === 'pending') return item.counted_quantity === null
      if (activeFilters.status === 'diverged') return item.status === 'diverged'
      if (activeFilters.status === 'matched') return item.status === 'matched'
      return true
    })
  }, [sessionItems, activeFilters])

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
        .eq('id', activeSession?.id)

      if (error) throw error

      await logAction({
        action: 'CANCEL_COUNT',
        entityType: 'stock_count_session',
        entityId: activeSession?.id,
        details: { session_name: activeSession?.name }
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

  // Hook de atalhos
  const { shortcuts } = useStockCountShortcuts({
    onFocusSearch: handleFocusSearch,
    onClearSearch: handleClearSearch,
    onBack: handleBack,
    onNewSession: () => setIsNewSessionModalOpen(true),
    onRefreshSessions: handleRefreshSessions,
    onNextItem: handleNextItem,
    onPreviousItem: handlePreviousItem,
    onCountItem: handleCountItemShortcut,
    onSkipItem: handleSkipItem,
    onAddProduct: () => setIsProductSearchModalOpen(true),
    onFinishSession: () => sessionStats.countedItems > 0 && setIsFinishModalOpen(true),
    onCancelSession: handleCancelSession,
    onOpenHelp: () => setShowShortcutsHelp(true),
    onShortcutFeedback: handleShortcutFeedback,
    enabled: !isNewSessionModalOpen && !isProductSearchModalOpen && !isFinishModalOpen && !showShortcutsHelp,
    viewMode,
    hasSelectedItem: isCountModalOpen && !!selectedItem
  })

  // Handlers
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

  const startCounting = async (session) => {
    setLoading(true)
    try {
      const items = await fetchSessionItems(session.id)

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

  const handleAddProduct = async (product) => {
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
      setIsProductSearchModalOpen(false)

    } catch (error) {
      console.error('Erro ao adicionar produto:', error)
      showFeedback('error', 'Erro ao adicionar produto')
    }
  }

  const handleOpenCountModal = (item, index = null) => {
    setSelectedItem(item)
    setSelectedItemIndex(index !== null ? index : sessionItems.findIndex(i => i.id === item.id))
    setCountForm({
      counted_quantity: item.counted_quantity?.toString() || '',
      notes: item.notes || ''
    })
    setIsCountModalOpen(true)
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
      const hasDifference = Math.abs(difference) > 0.001
      const status = hasDifference ? 'diverged' : 'matched'

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

      setSessionItems(prev => prev.map(item =>
        item.id === selectedItem.id ? data : item
      ))

      showFeedback('success', hasDifference
        ? `Contagem registrada! Diferença de ${difference > 0 ? '+' : ''}${difference}`
        : 'Contagem registrada! Quantidade confere.'
      )

      // Navegar automaticamente para o próximo item pendente
      const pendingItems = sessionItems.filter(item => 
        item.id !== selectedItem.id && item.counted_quantity === null
      )
      
      if (pendingItems.length > 0) {
        const nextPending = pendingItems[0]
        const nextIndex = sessionItems.findIndex(item => item.id === nextPending.id)
        handleOpenCountModal(nextPending, nextIndex)
      } else {
        setIsCountModalOpen(false)
        setSelectedItem(null)
        setCountForm({ counted_quantity: '', notes: '' })
        setFormErrors({})
      }

    } catch (error) {
      console.error('Erro ao registrar contagem:', error)
      showFeedback('error', 'Erro ao registrar contagem: ' + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFinishSession = async () => {
    setIsSubmitting(true)
    try {
      const divergedItems = sessionItems.filter(item => item.status === 'diverged')

      for (const item of divergedItems) {
        if (!item.product) continue

        const adjustmentQuantity = item.counted_quantity - item.system_quantity

        const movementData = {
          product_id: item.product_id,
          movement_type: 'ADJUSTMENT',
          quantity: adjustmentQuantity,
          quantity_before: item.system_quantity,
          quantity_after: item.counted_quantity,
          reason: `Balanço #${activeSession.name} - Ajuste de estoque`,
          reference_type: 'stock_count',
          reference_id: activeSession.id,
          created_by: profile?.id
        }

        const { error: movementError } = await supabase
          .from('stock_movements')
          .insert([movementData])

        if (movementError) throw movementError

        const { error: updateError } = await supabase
          .from('products')
          .update({
            stock_quantity: item.counted_quantity,
            updated_by: profile?.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.product_id)

        if (updateError) throw updateError
      }

      const { error: sessionError } = await supabase
        .from('stock_count_sessions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          completed_by: profile?.id,
          total_items: sessionItems.length,
          counted_items: sessionStats.countedItems,
          diverged_items: sessionStats.differences
        })
        .eq('id', activeSession.id)

      if (sessionError) throw sessionError

      await logAction({
        action: 'FINISH_COUNT',
        entityType: 'stock_count_session',
        entityId: activeSession.id,
        details: {
          session_name: activeSession.name,
          total_items: sessionItems.length,
          diverged_items: sessionStats.differences
        }
      })

      showFeedback('success', `Balanço finalizado! ${divergedItems.length} produtos ajustados.`)
      setViewMode('sessions')
      setActiveSession(null)
      setSessionItems([])
      setIsFinishModalOpen(false)

      await fetchCountSessions()
      await fetchProducts()

    } catch (error) {
      console.error('Erro ao finalizar balanço:', error)
      showFeedback('error', error.message || 'Erro ao finalizar balanço')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleViewDetails = (session) => {
    console.log('Ver detalhes da sessão:', session.id)
  }

  if (loading) {
    return <DataLoadingSkeleton type="cards" rows={6} cardsPerRow={3} />
  }

  const filteredItems = getFilteredItems()
  const currentFilteredIndex = filteredItems.findIndex(item => item.id === selectedItem?.id)

  return (
    <div className="min-h-screen bg-gray-50">
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

        {/* Feedback de atalho */}
        {shortcutFeedback && (
          <ShortcutFeedback
            shortcut={shortcutFeedback}
            onHide={() => setShortcutFeedback(null)}
          />
        )}

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

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowShortcutsHelp(true)}
                shortcut={{ key: 'F1', description: 'Atalhos' }}
                icon={Keyboard}
              >
                Atalhos (F1)
              </Button>

              {viewMode === 'sessions' ? (
                <Button 
                  onClick={() => setIsNewSessionModalOpen(true)} 
                  icon={Plus}
                  shortcut={{ key: 'n', ctrl: true, description: 'Novo' }}
                >
                  Novo Balanço
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsProductSearchModalOpen(true)}
                    icon={Plus}
                    shortcut={{ key: 'a', ctrl: true, description: 'Adicionar' }}
                  >
                    Adicionar Produto
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    shortcut={{ key: 'b', alt: true, description: 'Voltar' }}
                  >
                    <RotateCcw size={16} className="mr-1" />
                    Voltar
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Conteúdo Principal */}
        {viewMode === 'sessions' ? (
          <StockCountSessionsView
            sessions={countSessions}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            activeFilters={activeFilters}
            setActiveFilters={setActiveFilters}
            onStartCounting={startCounting}
            onViewDetails={handleViewDetails}
            onNewSession={() => setIsNewSessionModalOpen(true)}
          />
        ) : (
          <StockCountCountingView
            items={sessionItems}
            stats={sessionStats}
            activeFilters={activeFilters}
            setActiveFilters={setActiveFilters}
            onItemClick={(item, index) => handleOpenCountModal(item, index)}
            onAddProduct={() => setIsProductSearchModalOpen(true)}
            onFinish={() => setIsFinishModalOpen(true)}
            isFinishingDisabled={sessionStats.countedItems === 0}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            searchInputRef={searchInputRef}
          />
        )}

        {/* Modals */}
        <NewSessionModal
          isOpen={isNewSessionModalOpen}
          onClose={() => {
            setIsNewSessionModalOpen(false)
            setFormErrors({})
          }}
          form={sessionForm}
          setForm={setSessionForm}
          errors={formErrors}
          onSubmit={handleCreateSession}
          isSubmitting={isSubmitting}
        />

        <ProductSearchModal
          isOpen={isProductSearchModalOpen}
          onClose={() => {
            setIsProductSearchModalOpen(false)
            setProductSearchTerm('')
          }}
          products={products}
          sessionItems={sessionItems}
          onAddProduct={handleAddProduct}
          searchTerm={productSearchTerm}
          setSearchTerm={setProductSearchTerm}
        />

        <CountItemModal
          isOpen={isCountModalOpen}
          onClose={() => {
            setIsCountModalOpen(false)
            setSelectedItem(null)
            setFormErrors({})
          }}
          selectedItem={selectedItem}
          form={countForm}
          setForm={setCountForm}
          errors={formErrors}
          onSubmit={handleCountItem}
          isSubmitting={isSubmitting}
          onNext={handleNextItem}
          onPrevious={handlePreviousItem}
          hasNext={currentFilteredIndex < filteredItems.length - 1}
          hasPrevious={currentFilteredIndex > 0}
          currentIndex={currentFilteredIndex}
          totalItems={filteredItems.length}
        />

        <FinishSessionModal
          isOpen={isFinishModalOpen}
          onClose={() => setIsFinishModalOpen(false)}
          stats={sessionStats}
          onFinish={handleFinishSession}
          onCancel={handleCancelSession}
          isSubmitting={isSubmitting}
        />

        {/* Modal de Atalhos */}
        <ShortcutsHelpModal
          isOpen={showShortcutsHelp}
          onClose={() => setShowShortcutsHelp(false)}
          shortcuts={shortcuts}
        />
      </div>
    </div>
  )
}

export default StockCount