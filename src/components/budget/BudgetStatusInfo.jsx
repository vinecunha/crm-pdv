const BudgetStatusInfo = ({ budget }) => {
  if (budget.status === 'approved') return <ApprovalInfo budget={budget} />
  if (budget.status === 'rejected') return <RejectionInfo budget={budget} />
  if (budget.status === 'converted') return <ConversionInfo budget={budget} />
  return null
}