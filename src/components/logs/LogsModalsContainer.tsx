// src/components/logs/LogsModalsContainer.jsx
import React from 'react'
import LogDetailsModal from '@components/logs/LogDetailsModal'
import RestoreConfirmModal from '@components/logs/RestoreConfirmModal'

const LogsModalsContainer = ({
  selectedLog,
  onCloseLogDetails,
  getActionLabel,
  showRestoreModal,
  onCloseRestoreModal,
  selectedRecord,
  onConfirmRestore,
  isRestoring
}) => {
  return (
    <>
      <LogDetailsModal 
        isOpen={!!selectedLog} 
        onClose={onCloseLogDetails} 
        log={selectedLog} 
        getActionLabel={getActionLabel} 
      />

      <RestoreConfirmModal 
        isOpen={showRestoreModal} 
        onClose={onCloseRestoreModal} 
        record={selectedRecord} 
        onConfirm={onConfirmRestore} 
        isLoading={isRestoring} 
      />
    </>
  )
}

export default LogsModalsContainer
