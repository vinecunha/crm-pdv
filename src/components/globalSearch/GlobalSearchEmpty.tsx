// src/components/GlobalSearch/GlobalSearchEmpty.tsx
import React from 'react'
import { Search, Loader2 } from '@lib/icons'

interface GlobalSearchEmptyProps {
  isLoading: boolean
  hasQuery: boolean
  isEmpty: boolean
}

export const GlobalSearchEmpty: React.FC<GlobalSearchEmptyProps> = ({
  isLoading,
  hasQuery,
  isEmpty
}) => {
  if (isLoading) {
    return (
      <div className="p-8 text-center text-gray-400">
        <Loader2 size={24} className="mx-auto mb-2 animate-spin" />
        <p className="text-sm">Buscando...</p>
      </div>
    )
  }

  if (isEmpty) {
    return (
      <div className="p-8 text-center text-gray-400 dark:text-gray-500">
        <Search size={40} className="mx-auto mb-3 opacity-50" />
        <p className="text-sm">Nenhum resultado encontrado</p>
        <p className="text-xs mt-1">Tente outros termos de busca</p>
      </div>
    )
  }

  if (!hasQuery) {
    return (
      <div className="p-8 text-center text-gray-400 dark:text-gray-500">
        <Search size={40} className="mx-auto mb-3 opacity-50" />
        <p className="text-sm">Digite pelo menos 2 caracteres para buscar</p>
        <p className="text-xs mt-1">
          Busque por produtos, clientes, vendas, orçamentos e mais
        </p>
      </div>
    )
  }

  return null
}