// src/components/cashier/CashierModalsContainer.jsx
import React from 'react'
import CashierClosingModal from './CashierClosingModal'
import CashierHistoryModal from './CashierHistoryModal'
import CashierDetailsModal from './CashierDetailsModal'

const CashierModalsContainer = ({
  // Closing Modal
  showClosingModal,
  setShowClosingModal,
  summary,
  dateRange,
  declaredValues,
  setDeclaredValues,
  onConfirmClosing,
  isClosingPending,
  
  // History Modal
  showHistoryModal,
  setShowHistoryModal,
  history,
  users,
  onViewDetails,
  onPrint,
  
  // Details Modal
  showDetailsModal,
  setShowDetailsModal,
  selectedClosing
}) => {
  return (
    <>
      <CashierClosingModal
        isOpen={showClosingModal}
        onClose={() => !isClosingPending && setShowClosingModal(false)}
        summary={summary}
        dateRange={dateRange}
        declaredValues={declaredValues}
        setDeclaredValues={setDeclaredValues}
        onConfirm={onConfirmClosing}
        loading={isClosingPending}
      />

      <CashierHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        history={history}
        users={users}
        onViewDetails={onViewDetails}
        onPrint={onPrint}
      />

      <CashierDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        closing={selectedClosing}
        users={users}
      />
    </>
  )
}

export default CashierModalsContainer
