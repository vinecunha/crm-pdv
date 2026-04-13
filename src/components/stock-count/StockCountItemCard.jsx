import React from 'react'
import { Package, CheckCircle, AlertTriangle } from 'lucide-react'

const StockCountItemCard = ({ item, onClick }) => {
  const isCounted = item.counted_quantity !== null
  const hasDifference = isCounted && item.counted_quantity !== item.system_quantity

  return (
    <div
      className={`bg-white rounded-lg border p-4 cursor-pointer transition-all hover:shadow-md
        ${isCounted ? 'border-l-4 ' + (hasDifference ? 'border-l-orange-500' : 'border-l-green-500') : 'border-gray-200'}
      `}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <Package size={18} className="text-gray-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h4 className="font-medium text-gray-900 truncate">{item.product?.name}</h4>
              <p className="text-xs text-gray-500">{item.product?.code || 'Sem código'}</p>
            </div>
            {isCounted && (
              hasDifference ? (
                <AlertTriangle size={16} className="text-orange-500 flex-shrink-0" />
              ) : (
                <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
              )
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3">
            <div>
              <p className="text-xs text-gray-500">Sistema</p>
              <p className="font-medium">{item.system_quantity} {item.product?.unit}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Contado</p>
              <p className={`font-medium ${hasDifference ? 'text-orange-600' : 'text-green-600'}`}>
                {isCounted ? `${item.counted_quantity} ${item.product?.unit}` : (
                  <span className="text-gray-400 text-sm">Pendente</span>
                )}
              </p>
            </div>
          </div>

          {hasDifference && (
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className={`px-2 py-0.5 rounded-full font-medium
                ${item.difference > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
              `}>
                {item.difference > 0 ? '+' : ''}{item.difference}
              </span>
              <span className="text-gray-500">
                Diferença de {Math.abs(item.difference)} {item.product?.unit}
              </span>
            </div>
          )}

          {item.notes && (
            <p className="mt-2 text-xs text-gray-500 italic line-clamp-1">{item.notes}</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default StockCountItemCard