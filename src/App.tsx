import React, { Suspense, lazy } from 'react'
import { ThemeProvider } from './contexts/ThemeContext'
import './index.css'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { CompanyProvider } from './contexts/CompanyContext'
import ErrorBoundaryWithCompany from '@components/ErrorBoundaryWithCompany'
import SectionErrorBoundary from '@components/SectionErrorBoundary'
import ProtectedRoute from '@components/ProtectedRoute'
import SplashScreen from '@components/ui/SplashScreen'
import DynamicHead from '@components/DynamicHead'
import PrefetchRoute from '@components/PrefetchRoute' 
import { queryClient } from '@lib/react-query'
import CacheDebugger from '@components/ui/CacheDebugger'
import NetworkStatus from '@components/ui/NetworkStatus'
import PendingSalesIndicator from '@components/sales/pdv/PendingSalesIndicator'
import PerformanceDebugger from '@components/ui/PerformanceDebugger'
import { useNotificationTriggers } from '@hooks/system/useNotificationTriggers'

// ============= Code Splitting Avançado =============
// Agrupando por módulos para melhor caching

// Módulo Dashboard (páginas principais)
const Dashboard = lazy(() => import(
  /* webpackChunkName: "dashboard" */
  /* webpackPrefetch: true */
  './pages/Dashboard'
))

// To-do-List
const TaskBoard = lazy(() => import(
  /* webpackChunkName: "dashboard" */
  './pages/TaskBoard'
))

// Detalhes do Vendedor (agrupado com dashboard)
const SellerDetail = lazy(() => import(
  /* webpackChunkName: "dashboard" */
  './pages/SellerDetail'
))

// Módulo PDV (tudo relacionado a vendas)
const Sales = lazy(() => import(
  /* webpackChunkName: "pdv" */
  /* webpackPrefetch: true */
  './pages/Sales'
))

// Módulo Gestão de Vendas
const SalesList = lazy(() => import(
  /* webpackChunkName: "pdv" */
  './pages/SalesList'
))

//Módulo Fechamento de Caixa
const CashierClosing = lazy(() => import(
  /* webpackChunkName: "pdv" */
  './pages/CashierClosing.jsx'
))

// Módulo Budget (orçamento)
const Budgets = lazy(() => import(
  /* webpackChunkName: "pdv" */
  './pages/Budgets'
))

// Módulo Produtos (gestão de estoque)
const Products = lazy(() => import(
  /* webpackChunkName: "products" */
  /* webpackPrefetch: true */
  './pages/Products'
))
const StockCount = lazy(() => import(
  /* webpackChunkName: "products" */
  './pages/StockCount'
))

// Módulo Clientes
const Customers = lazy(() => import(
  /* webpackChunkName: "customers" */
  /* webpackPrefetch: true */
  './pages/Customers'
))
const CustomerCommunication = lazy(() => import(
  /* webpackChunkName: "customers" */
  './pages/CustomerCommunication'
))

// Módulo Cupons
const Coupons = lazy(() => import(
  /* webpackChunkName: "coupons" */
  './pages/Coupons'
))

// Módulo Relatórios (mais pesado - carrega sob demanda)
const Reports = lazy(() => import(
  /* webpackChunkName: "reports" */
  './pages/Reports'
))

// Módulo Administrativo
const Users = lazy(() => import(
  /* webpackChunkName: "admin" */
  './pages/Users'
))
const Logs = lazy(() => import(
  /* webpackChunkName: "admin" */
  './pages/Logs'
))
const Settings = lazy(() => import(
  /* webpackChunkName: "admin" */
  './pages/Settings'
))

// Módulo Auth/Perfil
const Login = lazy(() => import(
  /* webpackChunkName: "auth" */
  './pages/Login'
))
const Profile = lazy(() => import(
  /* webpackChunkName: "auth" */
  './pages/Profile'
))

// Layout e 404
const PrivateLayout = lazy(() => import(
  /* webpackChunkName: "layout" */
  './layouts/PrivateLayout'
))
const NotFound = lazy(() => import(
  /* webpackChunkName: "layout" */
  './pages/NotFound'
))

const CommissionsAdmin = lazy(() => import(
  /* webpackChunkName: "commissions" */
  './components/commissions/CommissionsAdmin'
))

// Componente de loading com delay mínimo para evitar flicker
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
    <SplashScreen message="Carregando..." size="lg" />
  </div>
)

const NotificationTriggersWrapper = () => {
  useNotificationTriggers()
  return null
}

function App() {

  const isDevelopment = import.meta.env.DEV
  
  return (
    <ErrorBoundaryWithCompany>
      <QueryClientProvider client={queryClient}>
        <Router>
          <AuthProvider>
            <CompanyProvider>
              <ThemeProvider> 
              <DynamicHead />
              <NotificationTriggersWrapper />
              <Suspense fallback={<PageLoader />}>
                <PrefetchRoute>
                  <Routes>
                    {/* Rota pública */}
                    <Route path="/login" element={<Login />} />
                    
                    {/* Rotas protegidas */}
                    <Route path="/dashboard" element={
                      <ProtectedRoute requiredPermission="canViewDashboard">
                        <PrivateLayout>
                          <SectionErrorBoundary title="Erro no Dashboard">
                            <Dashboard />
                          </SectionErrorBoundary>
                        </PrivateLayout>
                      </ProtectedRoute>
                    } />

                    {/* Rota para TaskBoard */}
                    <Route path="/tasks" element={
                      <ProtectedRoute>
                        <PrivateLayout>
                          <TaskBoard />
                        </PrivateLayout>
                      </ProtectedRoute>
                    } />
                    
                    {/* Rota de detalhes do vendedor */}
                    <Route path="/sellers/:sellerId" element={
                      <ProtectedRoute requiredPermission="canViewDashboard">
                        <PrivateLayout>
                          <SectionErrorBoundary title="Erro nos detalhes do vendedor">
                            <SellerDetail />
                          </SectionErrorBoundary>
                        </PrivateLayout>
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/sales" element={
                      <ProtectedRoute requiredPermission="canViewSales">
                        <PrivateLayout>
                          <SectionErrorBoundary title="Erro no PDV">
                            <Sales />
                          </SectionErrorBoundary>
                        </PrivateLayout>
                      </ProtectedRoute>
                    } />

                    <Route path="/budgets" element={
                      <ProtectedRoute requiredPermission="canViewSales">
                        <PrivateLayout>
                          <SectionErrorBoundary title="Erro no Orçamento">
                            <Budgets />
                          </SectionErrorBoundary>
                        </PrivateLayout>
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/sales-list" element={
                      <ProtectedRoute requiredPermission="canViewSales">
                        <PrivateLayout>
                          <SectionErrorBoundary title="Erro na Gestão de Vendas">
                            <SalesList />
                          </SectionErrorBoundary>
                        </PrivateLayout>
                      </ProtectedRoute>
                    } />

                    <Route path="/cashier" element={
                      <ProtectedRoute requiredPermission="canViewSales">
                        <PrivateLayout>
                          <SectionErrorBoundary title="Erro no Fechamento de Caixa">
                            <CashierClosing />
                          </SectionErrorBoundary>
                        </PrivateLayout>
                      </ProtectedRoute>
                    } />

                    <Route path="/coupons" element={
                      <ProtectedRoute requiredPermission="canViewCoupons">
                        <PrivateLayout>
                          <SectionErrorBoundary title="Erro na página de Cupons">
                            <Coupons />
                          </SectionErrorBoundary>
                        </PrivateLayout>
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/stock-count" element={
                      <ProtectedRoute requiredPermission="canManageStock">
                        <PrivateLayout>
                          <SectionErrorBoundary title="Erro na página de Balanço">
                            <StockCount />
                          </SectionErrorBoundary>
                        </PrivateLayout>
                      </ProtectedRoute>
                    } />

                    <Route path="/products" element={
                      <ProtectedRoute requiredPermission="canViewProducts">
                        <PrivateLayout>
                          <SectionErrorBoundary title="Erro na página de Produtos">
                            <Products />
                          </SectionErrorBoundary>
                        </PrivateLayout>
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/customers" element={
                      <ProtectedRoute requiredPermission="canViewCustomers">
                        <PrivateLayout>
                          <SectionErrorBoundary title="Erro na página de Clientes">
                            <Customers />
                          </SectionErrorBoundary>
                        </PrivateLayout>
                      </ProtectedRoute>
                    } />

                    <Route path="/customers/:id/communication" element={
                      <ProtectedRoute requiredPermission="canViewCustomers">
                        <PrivateLayout>
                          <SectionErrorBoundary title="Erro na página de Comunicação com Clientes">
                            <CustomerCommunication />
                          </SectionErrorBoundary>
                        </PrivateLayout>
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/reports" element={
                      <ProtectedRoute requiredPermission="canViewReports">
                        <PrivateLayout>
                          <SectionErrorBoundary title="Erro nos Relatórios">
                            <Reports />
                          </SectionErrorBoundary>
                        </PrivateLayout>
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/users" element={
                      <ProtectedRoute requiredPermission="canViewUsers">
                        <PrivateLayout>
                          <SectionErrorBoundary title="Erro na página de Usuários">
                            <Users />
                          </SectionErrorBoundary>
                        </PrivateLayout>
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/logs" element={
                      <ProtectedRoute requiredPermission="canViewLogs">
                        <PrivateLayout>
                          <SectionErrorBoundary title="Erro nos Logs do Sistema">
                            <Logs />
                          </SectionErrorBoundary>
                        </PrivateLayout>
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/settings" element={
                      <ProtectedRoute requiredPermission="canViewSettings">
                        <PrivateLayout>
                          <SectionErrorBoundary title="Erro nas Configurações">
                            <Settings />
                          </SectionErrorBoundary>
                        </PrivateLayout>
                      </ProtectedRoute>
                    } />

                    <Route path="/profile" element={
                      <ProtectedRoute>
                        <PrivateLayout>
                          <SectionErrorBoundary title="Erro no Perfil">
                            <Profile />
                          </SectionErrorBoundary>
                        </PrivateLayout>
                      </ProtectedRoute>
                    } />

                    <Route path="/commissions/admin" element={
                      <ProtectedRoute requiredPermission="canViewCommissions">
                        <PrivateLayout>
                          <SectionErrorBoundary title="Erro nas Comissões">
                          <CommissionsAdmin />
                          </SectionErrorBoundary>
                        </PrivateLayout>
                      </ProtectedRoute>
                    } />
                    
                    {/* Redirecionamentos */}
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    
                    {/* Página 404 */}
                    <Route path="/404" element={<NotFound />} />
                    <Route path="*" element={<Navigate to="/404" replace />} />
                  </Routes>
                </PrefetchRoute>
              </Suspense>
               <PendingSalesIndicator />
              </ThemeProvider>
            </CompanyProvider>
          </AuthProvider>
        </Router>
        {isDevelopment && <CacheDebugger />}
        {isDevelopment && <NetworkStatus />}
        {isDevelopment && <PerformanceDebugger />}
      </QueryClientProvider>
    </ErrorBoundaryWithCompany>
  )
}

export default App
