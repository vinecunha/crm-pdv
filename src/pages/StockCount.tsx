import React, { useState, useMemo } from 'react'
import { ClipboardList } from '@lib/icons'
import { useUI } from '@contexts/UIContext'
import PageHeader from '@components/ui/PageHeader'
import { useStockSessions } from '@hooks/stock/useStockSessions'
import { useStockProducts, useSessionItems } from '@hooks/stock/useStockProducts'
import { useStockCount } from '@hooks/stock/useStockCount'
import { useStockModals } from '@hooks/stock/useStockModals'
import useStockCountShortcuts from '@hooks/stock/useStockCountShortcuts'
import ShortcutFeedback from '@components/ui/ShortcutFeedback'
import DataLoadingSkeleton from '@components/ui/DataLoadingSkeleton'

import StockCountSessionsView from '@components/stock-count/StockCountSessionsView'
import StockCountCountingView from '@components/stock-count/StockCountCountingView'
import NewSessionModal from '@components/stock-count/NewSessionModal'
import ProductSearchModal from '@components/stock-count/ProductSearchModal'
import CountItemModal from '@components/stock-count/CountItemModal'
import FinishSessionModal from '@components/stock-count/FinishSessionModal'
import ShortcutsHelpModal from '@components/ui/ShortcutsHelpModal'
import SessionDetailsModal from '@components/stock-count/SessionDetailsModal'

const StockCount = () => {
  const [viewMode, setViewMode] = useState('sessions')
  const [activeSession, setActiveSession] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilters, setActiveFilters] = useState({})
  const [sessionForm, setSessionForm] = useState({ name: '', description: '', type: 'partial' })
  const [formErrors, setFormErrors] = useState({})
  const [productSearchTerm, setProductSearchTerm] = useState('')
  const [countForm, setCountForm] = useState({ counted_quantity: '', status: 'counted', notes: '' })
  const [selectedItem, setSelectedItem] = useState(null)
  const [shortcuts, setShortcuts] = useState([])
  const [shortcutFeedback, setShortcutFeedback] = useState(null)
  const searchInputRef = React.useRef(null)

  const {
    sessions,
    isLoading,
    error,
    createSession,
    cancelSession,
    finishSession,
    createSessionMutation,
    cancelSessionMutation,
    finishSessionMutation
  } = useStockSessions()

  const { products, isLoadingProducts } = useStockProducts()
  const sessionItemsData = useSessionItems(activeSession?.id)
  const { addAllProducts, addProduct, updateItem, updateItemLoading } = useStockCount(activeSession?.id)

  const {
    modals,
    openNewSession,
    closeNewSession,
    openProductSearch,
    closeProductSearch,
    openFinish,
    closeFinish,
    openCount,
    closeCount,
    openDetails,
    closeDetails,
    openShortcuts,
    closeShortcuts,
    showSessionDetails,
    setShowSessionDetails
  } = useStockModals()

  const { showShortcutsHelp } = modals

  const stats = useMemo(() => {
    const items = sessionItemsData.items || []
    return {
      totalItems: items.length,
      countedItems: items.filter(i => i.counted_quantity !== null).length,
      differences: items.filter(i => i.status === 'diverged').length
    }
  }, [sessionItemsData.items])

  const filteredItems = useMemo(() => {
    let items = sessionItemsData.items || []
    if (activeFilters.pending) items = items.filter(i => i.status === 'pending')
    if (activeFilters.counted) items = items.filter(i => i.counted_quantity !== null)
    if (activeFilters.diverged) items = items.filter(i => i.status === 'diverged')
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      items = items.filter(i => 
        i.product?.name?.toLowerCase().includes(term) ||
        i.product?.code?.toLowerCase().includes(term)
      )
    }
    return items
  }, [sessionItemsData.items, activeFilters, searchTerm])

  const currentFilteredIndex = useMemo(() => {
    if (!selectedItem) return -1
    return filteredItems.findIndex(i => i.id === selectedItem.id)
  }, [selectedItem, filteredItems])

  const { showFeedback } = useUI()

  const startCounting = (session) => {
    setActiveSession(session)
    setViewMode('counting')
  }

  const handleCreateSession = () => {
    if (!sessionForm.name.trim()) {
      setFormErrors({ name: 'Nome é obrigatório' })
      return
    }
    createSession(sessionForm, {
      onSuccess: () => {
        closeNewSession()
        setSessionForm({ name: '', description: '', type: 'partial' })
        showFeedback('success', 'Sessão criada!')
      },
      onError: (err) => showFeedback('error', err.message)
    })
  }

  const handleAddProduct = (product) => {
    addProduct(product, {
      onSuccess: () => {
        closeProductSearch()
        showFeedback('success', 'Produto adicionado!')
      },
      onError: (err) => showFeedback('error', err.message)
    })
  }

  const handleCountItem = () => {
    if (!countForm.counted_quantity) {
      setFormErrors({ counted_quantity: 'Quantidade é obrigatória' })
      return
    }
    const qty = parseInt(countForm.counted_quantity)
    const systemQty = selectedItem?.system_quantity || 0
    const newStatus = qty === systemQty ? 'counted' : 'diverged'
    
    updateItem({
      itemId: selectedItem.id,
      countData: {
        counted_quantity: qty,
        status: newStatus,
        notes: countForm.notes || null
      }
    }, {
      onSuccess: () => {
        closeCount()
        setCountForm({ counted_quantity: '', status: 'counted', notes: '' })
        setSelectedItem(null)
        showFeedback('success', 'Item contado!')
      },
      onError: (err) => showFeedback('error', err.message)
    })
  }

  const handleFinishSession = () => {
    finishSession(
      { session: activeSession, sessionItems: sessionItemsData.items, stats },
      {
        onSuccess: () => {
          closeFinish()
          setActiveSession(null)
          setViewMode('sessions')
          showFeedback('success', 'Sessão finalizada!')
        },
        onError: (err) => showFeedback('error', err.message)
      }
    )
  }

  const handleCancelSession = () => {
    cancelSession(activeSession.id, {
      onSuccess: () => {
        closeFinish()
        setActiveSession(null)
        setViewMode('sessions')
        showFeedback('success', 'Sessão cancelada')
      },
      onError: (err) => showFeedback('error', err.message)
    })
  }

  const handleOpenCountModal = (item) => {
    setSelectedItem(item)
    setCountForm({
      counted_quantity: item.counted_quantity?.toString() || '',
      status: item.status || 'counted',
      notes: item.notes || ''
    })
    openCount()
  }

  const handleViewDetails = (session) => {
    setShowSessionDetails(session)
    openDetails()
  }

  const handleNextItem = () => {
    const nextIndex = currentFilteredIndex + 1
    if (nextIndex < filteredItems.length) {
      handleOpenCountModal(filteredItems[nextIndex])
    }
  }

  const handlePreviousItem = () => {
    const prevIndex = currentFilteredIndex - 1
    if (prevIndex >= 0) {
      handleOpenCountModal(filteredItems[prevIndex])
    }
  }

  React.useEffect(() => {
    return () => {
      setActiveSession(null)
      setViewMode('sessions')
    }
  }, [])

  if (isLoading) return <DataLoadingSkeleton />

  return (
    <div className="p-6">
      <PageHeader
        title="Contagem de Estoque"
        icon={ClipboardList}
      />

      {shortcutFeedback && (
        <ShortcutFeedback
          shortcut={shortcutFeedback}
          onClose={() => setShortcutFeedback(null)}
        />
      )}

      {viewMode === 'sessions' ? (
        <StockCountSessionsView
          sessions={sessions}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          activeFilters={activeFilters}
          setActiveFilters={setActiveFilters}
          onStartCounting={startCounting}
          onViewDetails={handleViewDetails}
          onNewSession={openNewSession}
        />
      ) : (
        <StockCountCountingView
          items={sessionItemsData.items}
          stats={stats}
          activeFilters={activeFilters}
          setActiveFilters={setActiveFilters}
          onItemClick={handleOpenCountModal}
          onAddProduct={openProductSearch}
          onFinish={openFinish}
          isFinishingDisabled={stats.countedItems === 0}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          searchInputRef={searchInputRef}
        />
      )}

      <NewSessionModal
        isOpen={modals.isNewSessionModalOpen}
        onClose={() => {
          closeNewSession()
          setFormErrors({})
        }}
        form={sessionForm}
        setForm={setSessionForm}
        errors={formErrors}
        onSubmit={handleCreateSession}
        isSubmitting={createSessionMutation.isPending}
      />

      <ProductSearchModal
        isOpen={modals.isProductSearchModalOpen}
        onClose={() => {
          closeProductSearch()
          setProductSearchTerm('')
        }}
        products={products}
        sessionItems={sessionItemsData.items}
        onAddProduct={handleAddProduct}
        searchTerm={productSearchTerm}
        setSearchTerm={setProductSearchTerm}
      />

      <CountItemModal
        isOpen={modals.isCountModalOpen}
        onClose={() => {
          closeCount()
          setSelectedItem(null)
          setFormErrors({})
        }}
        selectedItem={selectedItem}
        form={countForm}
        setForm={setCountForm}
        errors={formErrors}
        onSubmit={handleCountItem}
        isSubmitting={updateItemLoading}
        onNext={handleNextItem}
        onPrevious={handlePreviousItem}
        hasNext={currentFilteredIndex < filteredItems.length - 1}
        hasPrevious={currentFilteredIndex > 0}
        currentIndex={currentFilteredIndex}
        totalItems={filteredItems.length}
      />

      <FinishSessionModal
        isOpen={modals.isFinishModalOpen}
        onClose={closeFinish}
        stats={stats}
        onFinish={handleFinishSession}
        onCancel={handleCancelSession}
        isSubmitting={finishSessionMutation.isPending || cancelSessionMutation.isPending}
      />

      <ShortcutsHelpModal
        isOpen={showShortcutsHelp}
        onClose={closeShortcuts}
        shortcuts={shortcuts}
      />

      <SessionDetailsModal
        isOpen={modals.showDetailsModal}
        onClose={() => {
          closeDetails()
          setShowSessionDetails(null)
        }}
        session={showSessionDetails}
        items={[]}
        isLoading={false}
      />
    </div>
  )
}

export default StockCount