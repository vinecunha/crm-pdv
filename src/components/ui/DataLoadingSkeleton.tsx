import React from 'react'

const DataLoadingSkeleton = ({ 
  type = 'table',
  rows = 5,
  columns = 4,
  cardsPerRow = 3,
  className = ""
}) => {
  if (type === 'cards') {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${cardsPerRow} gap-4 ${className}`}>
        {Array(rows).fill().map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 animate-pulse">
            <div className="flex justify-between mb-3">
              <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-24"></div>
              <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-16"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden animate-pulse ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50 dark:bg-black/50">
            <tr>
              {Array(columns).fill().map((_, i) => (
                <th key={i} className="px-6 py-3">
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-20"></div>
                </th>
              ))}
              <th className="px-6 py-3">
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-16"></div>
              </th>
            </tr>
          </thead>
          <tbody>
            {Array(rows).fill().map((_, i) => (
              <tr key={i} className="border-t border-gray-200 dark:border-gray-700">
                {Array(columns).fill().map((_, j) => (
                  <td key={j} className="px-6 py-4">
                    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
                  </td>
                ))}
                <td className="px-6 py-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-16"></div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default DataLoadingSkeleton
