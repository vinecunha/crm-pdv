import React, { useState } from 'react'
import { useReactQuery } from '../../hooks/useReactQuery'
import { getCacheStats, clearPersistedCache } from '../../lib/react-query'
import Button from './Button'
import Modal from './Modal'
import { Database, Trash2, RefreshCw } from '../../lib/icons'

const CacheDebugger = () => {
  const { getCacheSize, clearCache } = useReactQuery()
  const [showModal, setShowModal] = useState(false)
  const [stats, setStats] = useState({ size: 0, entries: 0 })

  const loadStats = () => {
    const cacheStats = getCacheStats()
    const memorySize = getCacheSize()
    setStats({
      ...cacheStats,
      memoryEntries: memorySize
    })
  }

  const handleClearCache = () => {
    clearCache()
    loadStats()
  }

  const handleOpen = () => {
    loadStats()
    setShowModal(true)
  }

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Só mostrar em desenvolvimento
  if (process.env.NODE_ENV !== 'development') return null

  return (
    <>
      <button
        onClick={handleOpen}
        className="fixed bottom-4 right-14 z-50 p-2 bg-gray-800 text-white rounded-full shadow-lg hover:bg-gray-700"
        title="Cache Debugger"
      >
        <Database size={20} />
      </button>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="React Query Cache Debugger"
        size="md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-xs text-blue-600">Cache em Memória</p>
              <p className="text-2xl font-bold text-blue-700">{stats.memoryEntries || 0}</p>
              <p className="text-xs text-blue-500">queries ativas</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-xs text-green-600">Cache Persistido</p>
              <p className="text-2xl font-bold text-green-700">{stats.entries || 0}</p>
              <p className="text-xs text-green-500">entradas</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-600 mb-1">Tamanho do Cache</p>
            <p className="text-xl font-semibold text-gray-800">{formatBytes(stats.size || 0)}</p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-800 mb-2">
              <strong>⚠️ Atenção:</strong> Limpar o cache irá recarregar todos os dados do servidor.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={loadStats} icon={RefreshCw}>
            Atualizar
          </Button>
          <Button variant="danger" onClick={handleClearCache} icon={Trash2}>
            Limpar Cache
          </Button>
          <Button variant="outline" onClick={() => setShowModal(false)}>
            Fechar
          </Button>
        </div>
      </Modal>
    </>
  )
}

export default CacheDebugger