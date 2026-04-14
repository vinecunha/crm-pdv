import React from 'react'
import { Download } from 'lucide-react'
import Button from '../ui/Button'
import DataFilters from '../ui/DataFilters'

const LogFilters = ({ 
  searchTerm, 
  setSearchTerm, 
  filters, 
  setFilters, 
  onExport, 
  exporting, 
  logsLength 
}) => {
  const filterConfigs = [
    {
      key: 'action',
      label: 'Ação',
      type: 'select',
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
      type: 'select',
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
      type: 'select',
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
        <div className="flex-1">
          <DataFilters
            searchPlaceholder="Buscar por usuário, ação ou entidade..."
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            filters={filterConfigs}
            onFilterChange={setFilters}
            showFilters={true}
            searchDebounceDelay={500} // ✅ Maior delay para logs
            className="space-y-0"
          />
        </div>

        <Button 
          onClick={onExport} 
          disabled={exporting || logsLength === 0} 
          variant="outline" 
          icon={Download}
        >
          Exportar
        </Button>
      </div>
    </div>
  )
}

export default LogFilters