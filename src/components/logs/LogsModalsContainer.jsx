// src/components/logs/LogsModalsContainer.jsx
import React from 'react'
import LogDetailsModal from './LogDetailsModal'
import RestoreConfirmModal from './RestoreConfirmModal'

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