// src/components/GlobalSearch/GlobalSearchInput.tsx
import React from 'react'
import { Search, X, Loader2 } from '@lib/icons'

interface GlobalSearchInputProps {
  value: string
  onChange: (value: string) => void
  onClear: () => void
  onClose: () => void
  onKeyDown: (e: React.KeyboardEvent) => void
  isLoading: boolean
  inputRef: React.RefObject<HTMLInputElement>
}

export const GlobalSearchInput: React.FC<GlobalSearchInputProps> = ({
  value,
  onChange,
  onClear,
  onClose,
  onKeyDown,
  isLoading,
  inputRef
}) => {
  return (
    <div className="flex items-center gap-3 p-4 border-b border-gray-100 dark:border-gray-700">
      {isLoading ? (
        <Loader2 size={20} className="text-blue-500 animate-spin flex-shrink-0" />
      ) : (
        <Search size={20} className="text-gray-400 flex-shrink-0" />
      )}
      
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Buscar produtos, clientes, vendas..."
        className="flex-1 bg-transparent text-gray-900 dark:text-white 
          placeholder-gray-400 dark:placeholder-gray-500 outline-none text-sm"
        autoComplete="off"
      />
      
      {value && (
        <button
          onClick={onClear}
          className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Limpar busca"
        >
          <X size={16} className="text-gray-400" />
        </button>
      )}
      
      <button
        onClick={onClose}
        className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-label="Fechar busca"
      >
        <X size={20} className="text-gray-400" />
      </button>
    </div>
  )
}