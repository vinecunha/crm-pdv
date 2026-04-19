const CustomerInfoCard = ({ customer }) => (
  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 sm:p-4">
    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-2">CLIENTE</p>
    <div className="flex items-center gap-3">
      <CustomerAvatar name={customer?.name} />
      <CustomerDetails customer={customer} />
    </div>
  </div>
)