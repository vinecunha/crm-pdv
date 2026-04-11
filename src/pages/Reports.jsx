import React, { useState, useEffect } from 'react'
import {
  BarChart3, ShoppingCart, Package, Users, Store,
  FileSpreadsheet, RefreshCw, Printer, UserCheck
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Button from '../components/ui/Button'
import FeedbackMessage from '../components/ui/FeedbackMessage'
import DataLoadingSkeleton from '../components/ui/DataLoadingSkeleton'
import useSystemLogs from '../hooks/useSystemLogs'
import TabButton from '../components/reports/TabButton'
import DateRangeFilter from '../components/reports/DateRangeFilter'
import SalesReport from '../components/reports/SalesReport'
import OperatorPerformance from '../components/reports/OperatorPerformance'

// Lazy load para relatórios menos usados
const ProductsReport = React.lazy(() => import('../components/reports/ProductsReport'))
const CustomersReport = React.lazy(() => import('../components/reports/CustomersReport'))
const StockReport = React.lazy(() => import('../components/reports/StockReport'))

const Reports = () => {
  const { profile } = useAuth()
  const { logAction, logError } = useSystemLogs()
  
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('sales')
  const [dateRange, setDateRange] = useState('month')
  const [customDateRange, setCustomDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })
  const [feedback, setFeedback] = useState({ show: false, type: 'success', message: '' })
  
  const [categoryFilter, setCategoryFilter] = useState('')
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('')

  useEffect(() => {
    logAction({
      action: 'VIEW',
      entityType: 'report',
      details: { component: 'Reports', user_role: profile?.role }
    })
    setLoading(false)
  }, [])

  const showFeedback = (type, message) => {
    setFeedback({ show: true, type, message })
    setTimeout(() => setFeedback({ show: false, type: 'success', message: '' }), 4000)
  }

  const handleExport = (format = 'csv') => {
    showFeedback('info', `Exportando relatório em ${format.toUpperCase()}...`)
    logAction({ action: 'EXPORT', entityType: 'report', details: { format, tab: activeTab } })
  }

  const handleRefresh = () => {
    window.location.reload()
  }

  const tabs = [
    { id: 'sales', label: 'Vendas', icon: ShoppingCart },
    { id: 'operators', label: 'Operadores', icon: UserCheck },
    { id: 'products', label: 'Produtos', icon: Package },
    { id: 'customers', label: 'Clientes', icon: Users },
    { id: 'stock', label: 'Estoque', icon: Store }
  ]

  if (loading) {
    return <DataLoadingSkeleton type="cards" rows={4} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 className="text-blue-600" />
                Relatórios e Análises
              </h1>
              <p className="text-gray-600 mt-1">
                Visualize e analise os dados do seu negócio
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => window.print()} icon={Printer}>
                Imprimir
              </Button>
              <Button variant="outline" onClick={() => handleExport('csv')} icon={FileSpreadsheet}>
                Exportar
              </Button>
              <Button onClick={handleRefresh} icon={RefreshCw}>
                Atualizar
              </Button>
            </div>
          </div>
        </div>

        {feedback.show && (
          <div className="mb-4">
            <FeedbackMessage
              type={feedback.type}
              message={feedback.message}
              onClose={() => setFeedback({ show: false })}
            />
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex flex-wrap gap-1">
            {tabs.map(tab => (
              <TabButton
                key={tab.id}
                active={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                icon={tab.icon}
              >
                {tab.label}
              </TabButton>
            ))}
          </nav>
        </div>

        {/* Filtros de Data */}
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

        {/* Conteúdo da Tab */}
        <div className="space-y-6">
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
            <React.Suspense fallback={<DataLoadingSkeleton type="cards" rows={3} />}>
              <ProductsReport
                dateRange={dateRange}
                customDateRange={customDateRange}
              />
            </React.Suspense>
          )}

          {activeTab === 'customers' && (
            <React.Suspense fallback={<DataLoadingSkeleton type="cards" rows={3} />}>
              <CustomersReport
                dateRange={dateRange}
                customDateRange={customDateRange}
              />
            </React.Suspense>
          )}

          {activeTab === 'stock' && (
            <React.Suspense fallback={<DataLoadingSkeleton type="cards" rows={3} />}>
              <StockReport categoryFilter={categoryFilter} />
            </React.Suspense>
          )}
        </div>
      </div>
    </div>
  )
}

export default Reports