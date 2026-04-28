// src/pages/SellerDetail.jsx
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useParams } from 'react-router-dom'
import { useAuth } from '@contexts/AuthContext'
import { useSellerData } from '@/hooks/sellers/useSellerData'
import { useGoals } from '@/hooks/sellers/useGoals'
import { useCommissions } from '@hooks/commissions/useCommissions'
import DataLoadingSkeleton from '@components/ui/DataLoadingSkeleton'
import SectionErrorBoundary from '@components/error/SectionErrorBoundary'
import Button from '@components/ui/Button'
import SellerHeader from '@components/sellers/SellerHeader'
import SellerMetricsCards from '@components/sellers/SellerMetricsCards'
import SellerGoalsSection from '@components/sellers/SellerGoalsSection'
import SellerAchievements from '@components/sellers/SellerAchievements'
import SellerTopProducts from '@components/sellers/SellerTopProducts'
import SellerEvolutionChart from '@components/sellers/SellerEvolutionChart'
import SellerCommissions from '@components/sellers/SellerCommissions'
import UserCommissionRules from '@components/commissions/UserCommissionRules'
import GoalSettings from '@components/goals/GoalSettings'
import { exportSellerReport } from '@utils/exportReport'

const SellerDetail = () => {
  const { sellerId } = useParams()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [showGoalSettings, setShowGoalSettings] = useState(false)
  const [showCommissionRules, setShowCommissionRules] = useState(false)
  
  // ✅ TODOS OS HOOKS AQUI NO TOPO
  const { data, isLoading, error } = useSellerData(sellerId, profile?.role, profile?.id)
  const { goals, saveGoals, isSaving } = useGoals(sellerId)
  const { data: commissionsData, isLoading: commissionsLoading } = useCommissions(sellerId)
  
  // Verificar permissão para editar metas
  const canEditGoals = profile?.role === 'admin' || profile?.role === 'gerente'
  
  const handleSaveGoals = async (newGoals) => {
    await saveGoals({ 
      goals: newGoals, 
      createdBy: profile?.id 
    })
  }
  
  const handleExportReport = () => {
    if (data) {
      exportSellerReport(data, goals)
    }
  }
  
  if (isLoading) return <DataLoadingSkeleton type="detail" />
  
  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Erro ao carregar dados
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error?.message || 'Vendedor não encontrado'}
          </p>
          <Button onClick={() => window.history.back()}>Voltar</Button>
        </div>
      </div>
    )
  }
  
  const { profile: seller, metrics, topProducts, dailyPerformance, customersServed } = data
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* ✅ SellerHeader sem extraActions duplicado */}
        <SellerHeader
          seller={seller}
          canEditGoals={canEditGoals}
          onConfigureGoals={() => setShowGoalSettings(true)}
          onExportReport={handleExportReport}
          onConfigureCommissionRules={() => setShowCommissionRules(true)}
          showCommissionRulesButton={canEditGoals}
        />
        
        <SectionErrorBoundary title="Erro nas métricas">
          <SellerMetricsCards 
            metrics={metrics} 
            customersCount={customersServed.length}
          />
        </SectionErrorBoundary>
        
        <SectionErrorBoundary title="Erro no gráfico de evolução">
          <div className="mb-6">
            <SellerEvolutionChart dailyPerformance={dailyPerformance} />
          </div>
        </SectionErrorBoundary>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <SectionErrorBoundary title="Erro nas metas">
            <SellerGoalsSection
              metrics={metrics}
              goals={goals}
              canEditGoals={canEditGoals}
              onEditGoals={() => setShowGoalSettings(true)}
            />
          </SectionErrorBoundary>
          
          <SectionErrorBoundary title="Erro nas conquistas">
            <SellerAchievements metrics={metrics} />
          </SectionErrorBoundary>
        </div>
        
        {/* Seção de Comissões */}
        <SectionErrorBoundary title="Erro nas comissões">
          <div className="mb-6">
            <SellerCommissions 
              commissions={commissionsData} 
              isLoading={commissionsLoading} 
            />
          </div>
        </SectionErrorBoundary>
        
        {/* Produtos Mais Vendidos */}
        <SectionErrorBoundary title="Erro nos produtos">
          <SellerTopProducts products={topProducts} />
        </SectionErrorBoundary>
      </div>
      
      <GoalSettings
        isOpen={showGoalSettings}
        onClose={() => setShowGoalSettings(false)}
        currentGoals={goals}
        onSave={handleSaveGoals}
        isSaving={isSaving}
        userName={seller.full_name || seller.email}
      />
      
      {/* Modal de Regras de Comissão */}
      <UserCommissionRules
        isOpen={showCommissionRules}
        onClose={() => setShowCommissionRules(false)}
        userId={sellerId}
        userName={seller.full_name || seller.email}
      />
    </div>
  )
}

export default SellerDetail
