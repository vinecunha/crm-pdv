// src/components/sellers/SellerHeader.jsx
import React from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '@components/ui/Button'
import PageHeader from '@components/ui/PageHeader'
import { ArrowLeft, Settings, Download, User, Award } from '@lib/icons'
import { formatDate } from '@utils/formatters'

const SellerHeader = ({ 
  seller, 
  canEditGoals, 
  onConfigureGoals, 
  onExportReport,
  onConfigureCommissionRules,
  showCommissionRulesButton 
}) => {
  const navigate = useNavigate()
  
  const headerActions = [
    ...(canEditGoals ? [{
      label: 'Configurar Metas',
      icon: Settings,
      onClick: onConfigureGoals,
      variant: 'outline'
    }] : []),
    ...(showCommissionRulesButton && canEditGoals ? [{
      label: 'Regras de Comissão',
      icon: Award,
      onClick: onConfigureCommissionRules,
      variant: 'outline'
    }] : []),
    {
      label: 'Exportar',
      icon: Download,
      onClick: onExportReport,
      variant: 'outline'
    }
  ]
  
  return (
    <>
      <Button variant="outline" onClick={() => navigate(-1)} icon={ArrowLeft} className="mb-4">
        Voltar
      </Button>
      
      <PageHeader
        title="Perfil do Vendedor"
        description={`${seller.full_name || 'Vendedor'} • ${seller.email} • Desde ${formatDate(seller.created_at)}`}
        icon={User}
        actions={headerActions}
      />

      {/* Informações do Vendedor */}
      <div className="my-4 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
              {seller.full_name?.charAt(0) || seller.email?.charAt(0) || 'V'}
            </div>
            {seller.status === 'active' && (
              <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {seller.full_name || 'Vendedor'}
              </h2>
              <span className={`text-xs px-2 py-1 rounded-full ${
                seller.role === 'operador' 
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
              }`}>
                {seller.role}
              </span>
            </div>
            <p className="text-gray-500 dark:text-gray-400">{seller.email}</p>
            <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
              <span>📧 {seller.email}</span>
              <span>📅 Desde {formatDate(seller.created_at)}</span>
              {seller.last_login && (
                <span>🕐 Último acesso: {formatDate(seller.last_login)}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default SellerHeader
