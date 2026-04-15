import React, { useState } from 'react'
import { HelpCircle, X } from '../../lib/icons'

const legendItems = [
  // ✅ Scores A (Recência Alta - comprou recentemente)
  { score: 'A1', label: 'VIP / Campeão', color: 'bg-green-100 text-green-800 border-green-300', description: 'Compra recente, frequente e alto valor' },
  { score: 'A2', label: 'Leal', color: 'bg-green-50 text-green-700 border-green-200', description: 'Compra bem e com frequência' },
  { score: 'A3', label: 'Novo Promissor', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', description: 'Comprou recentemente, mas ainda é novo' }, // ✅ Adicionado
  
  // ✅ Scores B (Recência Média - comprou há um tempo)
  { score: 'B1', label: 'Potencial', color: 'bg-blue-100 text-blue-800 border-blue-300', description: 'Comprou recentemente, mas poucas vezes' },
  { score: 'B2', label: 'Em Atenção', color: 'bg-blue-50 text-blue-700 border-blue-200', description: 'Costumava comprar, mas está sumindo' },
  { score: 'B3', label: 'Ocasional', color: 'bg-sky-50 text-sky-700 border-sky-200', description: 'Compra esporadicamente' }, // ✅ Adicionado
  
  // ✅ Scores C (Recência Baixa - não compra há muito tempo)
  { score: 'C1', label: 'Em Risco', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', description: 'Já gastou bem, mas não compra há muito tempo' },
  { score: 'C2', label: 'Quase Perdido', color: 'bg-orange-100 text-orange-800 border-orange-300', description: 'Sumiu, mas já foi bom cliente' }, // ✅ Adicionado
  { score: 'C3', label: 'Inativo / Perdido', color: 'bg-red-100 text-red-800 border-red-300', description: 'Comprou pouco e nunca mais voltou' },
]

const RFVLegend = () => {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="relative inline-block">
      {/* Botão que abre/fecha a legenda */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        title="O que significa RFV?"
      >
        <HelpCircle size={14} className="text-gray-500" />
        <span>Legenda RFV</span>
      </button>

      {/* Painel da Legenda */}
      {isExpanded && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Segmentação RFV</h3>
              <button onClick={() => setIsExpanded(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={14} className="text-gray-400" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              <strong>R</strong>ecência • <strong>F</strong>requência • <strong>V</strong>alor
            </p>
            <div className="space-y-2">
              {legendItems.map(item => (
                <div key={item.score} className="flex items-start gap-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${item.color} w-12 text-center`}>
                    {item.score}
                  </span>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-900">{item.label}</span>
                    <p className="text-xs text-gray-500">{item.description}</p>
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