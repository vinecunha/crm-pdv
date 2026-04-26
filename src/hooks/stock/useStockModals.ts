import { useState, useCallback } from 'react'

export const useStockModals = () => {
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState(false)
  const [isProductSearchModalOpen, setIsProductSearchModalOpen] = useState(false)
  const [isFinishModalOpen, setIsFinishModalOpen] = useState(false)
  const [isCountModalOpen, setIsCountModalOpen] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false)
  const [showSessionDetails, setShowSessionDetails] = useState(null)

  const openNewSession = useCallback(() => setIsNewSessionModalOpen(true), [])
  const closeNewSession = useCallback(() => setIsNewSessionModalOpen(false), [])

  const openProductSearch = useCallback(() => setIsProductSearchModalOpen(true), [])
  const closeProductSearch = useCallback(() => setIsProductSearchModalOpen(false), [])

  const openFinish = useCallback(() => setIsFinishModalOpen(true), [])
  const closeFinish = useCallback(() => setIsFinishModalOpen(false), [])

  const openCount = useCallback(() => setIsCountModalOpen(true), [])
  const closeCount = useCallback(() => setIsCountModalOpen(false), [])

  const openDetails = useCallback(() => setShowDetailsModal(true), [])
  const closeDetails = useCallback(() => setShowDetailsModal(false), [])

  const openShortcuts = useCallback(() => setShowShortcutsHelp(true), [])
  const closeShortcuts = useCallback(() => setShowShortcutsHelp(false), [])

  return {
    modals: {
      isNewSessionModalOpen,
      isProductSearchModalOpen,
      isFinishModalOpen,
      isCountModalOpen,
      showDetailsModal,
      showShortcutsHelp
    },
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
  }
}