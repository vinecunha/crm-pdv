import React, { useState } from 'react'
import { Activity, Trash2, RefreshCw } from '@lib/icons'
import { perfMonitor } from '@lib/performance'
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

  if (import.meta.env.PROD) return null

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={loadReport}
        className="p-2 bg-gray-800 text-white rounded-full shadow-lg hover:bg-gray-700 dark:bg-gray-800 dark:hover:bg-gray-600"
        title="Performance Monitor"
      >
        <Activity size={20} />
      </button>

      {report && (
        <div className="absolute bottom-12 right-0 w-80 bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-white">Performance</h3>
            <div className="flex gap-1">
              <button onClick={loadReport} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                <RefreshCw size={14} className="text-gray-600 dark:text-gray-400" />
              </button>
              <button onClick={clearMetrics} className="p-1 hover:bg-red-50 dark:hover:bg-red-900/30 rounded">
                <Trash2 size={14} className="text-red-500 dark:text-red-400" />
              </button>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Métricas coletadas:</span>
              <span className="font-medium dark:text-white">{report.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Page Load médio:</span>
              <span className={`font-medium ${report.avgPageLoad > 2000 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                {report.avgPageLoad.toFixed(0)}ms
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Query média:</span>
              <span className={`font-medium ${report.avgQueryDuration > 500 ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}`}>
                {report.avgQueryDuration.toFixed(0)}ms
              </span>
            </div>
            
            {report.slowQueries.length > 0 && (
              <div className="mt-3 pt-3 border-t dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Queries lentas detectadas:</p>
                {report.slowQueries.slice(0, 3).map((q, i) => (
                  <div key={i} className="text-xs text-red-600 dark:text-red-400">
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