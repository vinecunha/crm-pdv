// components/budget/BudgetListView.jsx
const BudgetListView = ({
  budgets,
  loading,
  viewMode,
  columns,
  actions,
  onViewDetails,
  onApprove,
  onReject,
  onRefresh,
  onCreateNew,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onViewModeChange
}) => (
  <>
    <BudgetFilters
      searchTerm={searchTerm}
      onSearchChange={onSearchChange}
      statusFilter={statusFilter}
      onStatusChange={onStatusFilterChange}
      viewMode={viewMode}
      onViewModeChange={onViewModeChange}
    />
    
    {loading && <DataLoadingSkeleton />}
    
    {!loading && budgets.length === 0 && (
      <BudgetEmptyState onCreateNew={onCreateNew} />
    )}
    
    {!loading && budgets.length > 0 && (
      <BudgetContent
        budgets={budgets}
        viewMode={viewMode}
        columns={columns}
        actions={actions}
        onViewDetails={onViewDetails}
        onRefresh={onRefresh}
      />
    )}
  </>
)