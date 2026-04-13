import React from 'react'
import Button from '../ui/Button'
import { Check } from 'lucide-react'

const StockCountProgressBar = ({ stats, onFinish, disabled }) => {
  return (
    <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-sm text-gray-500">Progresso</p>
            <p className="text-2xl font-bold text-gray-900">{stats.progress}%</p>
          </div>
          <div className="h-10 w-px bg-gray-200"></div>
          <div>
            <p className="text-sm text-gray-500">Itens Contados</p>
            <p className="text-xl font-semibold">
              {stats.countedItems}/{stats.totalItems}
            </p>
          </div>
          <div className="h-10 w-px bg-gray-200"></div>
          <div>
            <p className="text-sm text-gray-500">Divergências</p>
            <p className={`text-xl font-semibold ${stats.differences > 0 ? 'text-orange-600' : 'text-green-600'}`}>
              {stats.differences}
            </p>
          </div>
        </div>

        <Button
          variant="success"
          onClick={onFinish}
          disabled={disabled}
        >
          <Check size={16} className="mr-1" />
          Finalizar Balanço
        </Button>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className="bg-blue-600 h-2.5 rounded-full transition-all"
          style={{ width: `${stats.progress}%` }}
        />
      </div>
    </div>
  )
}

export default StockCountProgressBar