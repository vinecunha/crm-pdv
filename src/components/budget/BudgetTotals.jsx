const BudgetTotals = ({ budget }) => (
  <div className="border-t dark:border-gray-700 pt-3 space-y-1">
    <TotalRow label="Subtotal" value={budget.total_amount} />
    {budget.discount_amount > 0 && (
      <DiscountRow 
        label={`Desconto ${budget.coupon_code ? `(${budget.coupon_code})` : ''}`}
        value={budget.discount_amount}
      />
    )}
    <TotalRow label="Total" value={budget.final_amount} highlight />
  </div>
)