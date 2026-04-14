import React from 'react'
import { ShoppingCart } from '../../lib/icons'
import { formatCurrency, formatDateTime } from '../../utils/formatters'

const RecentPurchases = ({ purchases }) => {
  if (!purchases || purchases.length === 0) return null

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <ShoppingCart size={20} className="text-blue-600" />
        Últimas Compras
      </h2>

      <div className="space-y-2">
        {purchases.map(purchase => (
          <div key={purchase.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium">Venda #{purchase.sale_number}</p>
              <p className="text-xs text-gray-500">{formatDateTime(purchase.created_at)}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-green-600">{formatCurrency(purchase.final_amount)}</p>
              <p className="text-xs text-gray-500">{purchase.payment_method}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default RecentPurchases