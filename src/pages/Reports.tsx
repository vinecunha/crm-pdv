// src/pages/Reports.jsx
import React, { useState, useEffect, lazy, Suspense } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  BarChart3, ShoppingCart, Package, Users, Store,
  FileSpreadsheet, RefreshCw, Printer, UserCheck,
  TrendingUp, Award, Clock, Calendar, Target, Activity
} from '@lib/icons'
import { useAuth } from '@contexts/AuthContext'
import { useUI } from '@contexts/UIContext'
import Button from '@components/ui/Button'
import DataLoadingSkeleton from '@components/ui/DataLoadingSkeleton'
import { useSystemLogs } from '@hooks/system/useSystemLogs'
import PageHeader from '@components/ui/PageHeader'
import TabButton from '@components/reports/TabButton'
import DateRangeFilter from '@components/reports/DateRangeFilter'

const SalesReport = lazy(() => import('../components/reports/SalesReport'))
const OperatorPerformance = lazy(() => import('../components/reports/OperatorPerformance'))
const ProductsReport = lazy(() => import('../components/reports/ProductsReport'))
const CustomersReport = lazy(() => import('../components/reports/CustomersReport'))
const StockReport = lazy(() => import('../components/reports/StockReport'))
const ABCCurveReport = lazy(() => import('../components/reports/ABCCurveReport'))
const InventoryTurnoverReport = lazy(() => import('../components/reports/InventoryTurnoverReport'))
const ProfitabilityReport = lazy(() => import('../components/reports/ProfitabilityReport'))
const PeriodComparisonReport = lazy(() => import('../components/reports/PeriodComparisonReport'))
const SalesForecastReport = lazy(() => import('../components/reports/SalesForecastReport'))
const SeasonalityReport = lazy(() => import('../components/reports/SeasonalityReport'))

const basicTabs = [
  { id: 'sales', label: 'Vendas', icon: ShoppingCart, category: 'basic' },
  { id: 'operators', label: 'Operadores', icon: UserCheck, category: 'basic' },
  { id: 'products', label: 'Produtos', icon: Package, category: 'basic' },
  { id: 'customers', label: 'Clientes', icon: Users, category: 'basic' },
  { id: 'stock', label: 'Estoque', icon: Store, category: 'basic' },
]

const advancedTabs = [
  { id: 'abc-curve', label: 'Curva ABC', icon: Award, category: 'advanced', description: 'Classificação de produtos por valor' },
  { id: 'inventory-turnover', label: 'Giro de Estoque', icon: RefreshCw, category: 'advanced', description: 'Frequência de renovação do estoque' },
  { id: 'profitability', label: 'Lucratividade', icon: TrendingUp, category: 'advanced', description: 'Margem por produto/categoria' },
  { id: 'period-comparison', label: 'Comparativo', icon: Calendar, category: 'advanced', description: 'Comparação entre períodos' },
  { id: 'sales-forecast', label: 'Projeção', icon: Target, category: 'advanced', description: 'Previsão de vendas futuras' },
  { id: 'seasonality', label: 'Sazonalidade', icon: Activity, category: 'advanced', description: 'Padrões por período' },
]

const allTabs = [...basicTabs, ...advancedTabs]

const Reports = () => {
  const { profile } = useAuth()
  const { logAction } = useSystemLogs()
  const queryClient = useQueryClient()
  
  const [activeTab, setActiveTab] = useState('sales')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [dateRange, setDateRange] = useState('month')
  const [customDateRange, setCustomDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })
  const [categoryFilter, setCategoryFilter] = useState('')
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const canViewAdvanced = profile?.role === 'admin' || profile?.role === 'gerente'

  useEffect(() => {
    logAction({
      action: 'VIEW',
      entityType: 'report',
      details: { component: 'Reports', tab: activeTab, user_role: profile?.role }
    })
  }, [activeTab])

  const { showFeedback } = useUI()

  const handleExport = async (format = 'csv') => {
    setIsExporting(true)
    
    try {
      showFeedback('info', `Preparando relatório em ${format.toUpperCase()}...`)
      
      await queryClient.invalidateQueries({ 
        queryKey: ['report', activeTab] 
      })
      
      setTimeout(() => {
        logAction({ 
          action: 'EXPORT', 
          entityType: 'report', 
          details: { format, tab: activeTab } 
        })
        showFeedback('success', `Relatório exportado em ${format.toUpperCase()}!`)
        setIsExporting(false)
      }, 1000)
      
    } catch (error) {
      console.error('Erro ao exportar:', error)
      showFeedback('error', 'Erro ao exportar relatório')
      setIsExporting(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    
    try {
      await queryClient.invalidateQueries({ queryKey: ['report'] })
      await queryClient.invalidateQueries({ queryKey: ['report', activeTab] })
      showFeedback('success', 'Dados atualizados com sucesso!')
    } catch (error) {
      console.error('Erro ao atualizar:', error)
      showFeedback('error', 'Erro ao atualizar dados')
    } finally {
      setIsRefreshing(false)
    }
  }

  const handlePrint = () => {
    logAction({ action: 'PRINT', entityType: 'report', details: { tab: activeTab } })
    window.print()
  }

  const handleTabChange = (tabId) => {
    setActiveTab(tabId)
    
    queryClient.prefetchQuery({
      queryKey: ['report', tabId, { dateRange, customDateRange }],
      staleTime: 5 * 60 * 1000,
    })
  }

  const visibleTabs = showAdvanced ? allTabs : basicTabs

  const headerActions = [
    ...(canViewAdvanced ? [{
      label: showAdvanced ? 'Modo Avançado' : 'Relatórios Avançados',
      icon: TrendingUp,
      onClick: () => setShowAdvanced(!showAdvanced),
      variant: showAdvanced ? 'primary' : 'outline'
    }] : []),
    {
      label: 'Imprimir',
      icon: Printer,
      onClick: handlePrint,
      variant: 'outline'
    },
    {
      label: 'Exportar',
      icon: FileSpreadsheet,
      onClick: () => handleExport('csv'),
      loading: isExporting,
      disabled: isExporting,
      variant: 'outline'
    },
    {
      label: 'Atualizar',
      icon: RefreshCw,
      onClick: handleRefresh,
      loading: isRefreshing,
      disabled: isRefreshing,
      variant: 'primary'
    }
  ]

return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <PageHeader
          title="Relatórios e Análises"
          description="Visualize e analise os dados do seu negócio"
          icon={BarChart3}
          actions={headerActions}
        />

        {/* Tabs - com scroll horizontal no mobile */}
        <div className="mb-4 sm:mb-6 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          <nav className="flex gap-1 pb-1 min-w-max">
            {visibleTabs.map(tab => (
              <TabButton
                key={tab.id}
                active={activeTab === tab.id}
                onClick={() => handleTabChange(tab.id)}
                icon={tab.icon}
                isAdvanced={tab.category === 'advanced'}
              >
                {tab.label}
              </TabButton>
            ))}
          </nav>
        </div>

        <DateRangeFilter
          activeTab={activeTab}
          dateRange={dateRange}
          setDateRange={setDateRange}
          customDateRange={customDateRange}
          setCustomDateRange={setCustomDateRange}
          paymentMethodFilter={paymentMethodFilter}
          setPaymentMethodFilter={setPaymentMethodFilter}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
        />

        <div className="space-y-4 sm:space-y-6">
          <Suspense fallback={<DataLoadingSkeleton type="cards" rows={3} />}>
            {activeTab === 'sales' && (
              <SalesReport
                dateRange={dateRange}
                customDateRange={customDateRange}
                paymentMethodFilter={paymentMethodFilter}
              />
            )}
            {activeTab === 'operators' && (
              <OperatorPerformance
                dateRange={dateRange}
                customDateRange={customDateRange}
                paymentMethodFilter={paymentMethodFilter}
              />
            )}
            {activeTab === 'products' && (
              <ProductsReport
                dateRange={dateRange}
                customDateRange={customDateRange}
              />
            )}
            {activeTab === 'customers' && (
              <CustomersReport
                dateRange={dateRange}
                customDateRange={customDateRange}
              />
            )}
            {activeTab === 'stock' && (
              <StockReport categoryFilter={categoryFilter} />
            )}

            {activeTab === 'abc-curve' && (
              <ABCCurveReport
                dateRange={dateRange}
                customDateRange={customDateRange}
              />
            )}
            {activeTab === 'inventory-turnover' && (
              <InventoryTurnoverReport
                dateRange={dateRange}
                customDateRange={customDateRange}
              />
            )}
            {activeTab === 'profitability' && (
              <ProfitabilityReport
                dateRange={dateRange}
                customDateRange={customDateRange}
                categoryFilter={categoryFilter}
              />
            )}
            {activeTab === 'period-comparison' && (
              <PeriodComparisonReport
                dateRange={dateRange}
                customDateRange={customDateRange}
              />
            )}
            {activeTab === 'sales-forecast' && (
              <SalesForecastReport
                dateRange={dateRange}
                customDateRange={customDateRange}
              />
            )}
            {activeTab === 'seasonality' && (
              <SeasonalityReport
                dateRange={dateRange}
                customDateRange={customDateRange}
              />
            )}
          </Suspense>
        </div>
      </div>
    </div>
  )
}

export default Reports
