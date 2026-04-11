// components/logs/LogFilters.jsx
import React, { useState } from 'react'
import { Search, Filter, X, Download } from 'lucide-react'
import Button from '../ui/Button'

const LogFilters = ({ searchTerm, setSearchTerm, filters, setFilters, onExport, exporting, logsLength }) => {
  const [showFilters, setShowFilters] = useState(false)
  const hasActiveFilters = Object.values(filters).some(v => v)

  const clearFilters = () => {
    setFilters({})
  }

  const filterConfigs = [
    {
      key: 'action',
      label: 'Ação',
      options: [
        { value: '', label: 'Todas' },
        { value: 'CREATE', label: 'Criação' },
        { value: 'UPDATE', label: 'Atualização' },
        { value: 'DELETE', label: 'Exclusão' },
        { value: 'LOGIN_SUCCESS', label: 'Login' },
        { value: 'LOGIN_FAILED', label: 'Login Falhou' },
        { value: 'LOGOUT', label: 'Logout' },
        { value: 'VIEW', label: 'Visualização' },
        { value: 'ERROR', label: 'Erro' }
      ]
    },
    {
      key: 'entity_type',
      label: 'Entidade',
      options: [
        { value: '', label: 'Todas' },
        { value: 'user', label: 'Usuário' },
        { value: 'product', label: 'Produto' },
        { value: 'customer', label: 'Cliente' },
        { value: 'sale', label: 'Venda' },
        { value: 'report', label: 'Relatório' }
      ]
    },
    {
      key: 'user_role',
      label: 'Papel',
      options: [
        { value: '', label: 'Todos' },
        { value: 'admin', label: 'Administrador' },
        { value: 'gerente', label: 'Gerente' },
        { value: 'operador', label: 'Operador' }
      ]
    }
  ]

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[250px] relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por usuário, ação ou entidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)} icon={Filter}>
          Filtros {hasActiveFilters && '•'}
        </Button>

        {hasActiveFilters && (
          <button onClick={clearFilters} className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1">
            <X size={14} /> Limpar
          </button>
        )}

        <Button onClick={onExport} disabled={exporting || logsLength === 0} variant="outline" icon={Download}>
          Exportar
        </Button>
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-100">
          {filterConfigs.map(filter => (
            <select
              key={filter.key}
              value={filters[filter.key] || ''}
              onChange={(e) => setFilters({ ...filters, [filter.key]: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              {filter.options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          ))}
          <div className="flex gap-2">
            <input
              type="date"
              value={filters.date_from || ''}
              onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="Data inicial"
            />
            <input
              type="date"
              value={filters.date_to || ''}
              onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="Data final"
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default LogFilters 