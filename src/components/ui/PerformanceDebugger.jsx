import React, { useState } from 'react'
import { Activity, Trash2, RefreshCw } from 'lucide-react'
import { perfMonitor } from '../../lib/performance'
import Button from './Button'

const PerformanceDebugger = () => {
  if (import.meta.env.PROD) return null

  const [report, setReport] = useState(null)

  const loadReport = () => {
    setReport(perfMonitor.getReport())
  }

  const clearMetrics = () => {
    perfMonitor.clearMetrics()
    setReport(null)
  }

  // Só mostrar em desenvolvimento
  if (import.meta.env.PROD) return null

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={loadReport}
        className="p-2 bg-gray-800 text-white rounded-full shadow-lg hover:bg-gray-700"
        title="Performance Monitor"
      >
        <Activity size={20} />
      </button>

      {report && (
        <div className="absolute bottom-12 right-0 w-80 bg-white rounded-lg shadow-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Performance</h3>
            <div className="flex gap-1">
              <button onClick={loadReport} className="p-1 hover:bg-gray-100 rounded">
                <RefreshCw size={14} />
              </button>
              <button onClick={clearMetrics} className="p-1 hover:bg-red-50 rounded">
                <Trash2 size={14} className="text-red-500" />
              </button>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Métricas coletadas:</span>
              <span className="font-medium">{report.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Page Load médio:</span>
              <span className={`font-medium ${report.avgPageLoad > 2000 ? 'text-red-600' : 'text-green-600'}`}>
                {report.avgPageLoad.toFixed(0)}ms
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Query média:</span>
              <span className={`font-medium ${report.avgQueryDuration > 500 ? 'text-yellow-600' : 'text-green-600'}`}>
                {report.avgQueryDuration.toFixed(0)}ms
              </span>
            </div>
            
            {report.slowQueries.length > 0 && (
              <div className="mt-3 pt-3 border-t">
                <p className="text-xs text-gray-500 mb-2">Queries lentas detectadas:</p>
                {report.slowQueries.slice(0, 3).map((q, i) => (
                  <div key={i} className="text-xs text-red-600">
                    {q.metadata?.queryKey}: {q.value}ms
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default PerformanceDebugger