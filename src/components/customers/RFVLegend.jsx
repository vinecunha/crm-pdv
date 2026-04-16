import React, { useState } from 'react'
import { HelpCircle, X } from '../../lib/icons'

const legendItems = [
  // ✅ Scores A (Recência Alta - comprou recentemente)
  { score: 'A1', label: 'VIP / Campeão', color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700', description: 'Compra recente, frequente e alto valor' },
  { score: 'A2', label: 'Leal', color: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800', description: 'Compra bem e com frequência' },
  { score: 'A3', label: 'Novo Promissor', color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800', description: 'Comprou recentemente, mas ainda é novo' },
  
  // ✅ Scores B (Recência Média - comprou há um tempo)
  { score: 'B1', label: 'Potencial', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700', description: 'Comprou recentemente, mas poucas vezes' },
  { score: 'B2', label: 'Em Atenção', color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800', description: 'Costumava comprar, mas está sumindo' },
  { score: 'B3', label: 'Ocasional', color: 'bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800', description: 'Compra esporadicamente' },
  
  // ✅ Scores C (Recência Baixa - não compra há muito tempo)
  { score: 'C1', label: 'Em Risco', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700', description: 'Já gastou bem, mas não compra há muito tempo' },
  { score: 'C2', label: 'Quase Perdido', color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-700', description: 'Sumiu, mas já foi bom cliente' },
  { score: 'C3', label: 'Inativo / Perdido', color: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700', description: 'Comprou pouco e nunca mais voltou' },
]

const RFVLegend = () => {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="relative inline-block">
      {/* Botão que abre/fecha a legenda */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        title="O que significa RFV?"
      >
        <HelpCircle size={14} className="text-gray-500 dark:text-gray-400" />
        <span className="text-gray-700 dark:text-gray-200">Legenda RFV</span>
      </button>

      {/* Painel da Legenda */}
      {isExpanded && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 dark:text-white">Segmentação RFV</h3>
              <button onClick={() => setIsExpanded(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                <X size={14} className="text-gray-400 dark:text-gray-500" />
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              <strong className="dark:text-white">R</strong>ecência • <strong className="dark:text-white">F</strong>requência • <strong className="dark:text-white">V</strong>alor
            </p>
            <div className="space-y-2">
              {legendItems.map(item => (
                <div key={item.score} className="flex items-start gap-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${item.color} w-12 text-center`}>
                    {item.score}
                  </span>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{item.label}</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RFVLegend