import React, { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { CompanyProvider } from './contexts/CompanyContext'
import ErrorBoundaryWithCompany from './components/ErrorBoundaryWithCompany'
import SectionErrorBoundary from './components/SectionErrorBoundary'
import ProtectedRoute from './components/ProtectedRoute'
import SplashScreen from './components/ui/SplashScreen'
import DynamicHead from './components/DynamicHead'

// Lazy load das páginas - Cada página será carregada sob demanda
const Login = lazy(() => import('./pages/Login'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Sales = lazy(() => import('./pages/Sales'))
const SalesList = lazy(() => import('./pages/SalesList'))
const Coupons = lazy(() => import('./pages/Coupons'))
const CashierClosing = lazy(() => import('./pages/CashierClosing'))
const StockCount = lazy(() => import('./pages/StockCount'))
const Products = lazy(() => import('./pages/Products'))
const Logs = lazy(() => import('./pages/Logs'))
const Customers = lazy(() => import('./pages/Customers'))
const CustomerCommunication = lazy(() => import('./pages/CustomerCommunication'))
const Reports = lazy(() => import('./pages/Reports'))
const Users = lazy(() => import('./pages/Users'))
const Profile = lazy(() => import('./pages/Profile'))
const Settings = lazy(() => import('./pages/Settings'))
const PrivateLayout = lazy(() => import('./layouts/PrivateLayout'))

// Página 404
const NotFound = lazy(() => import('./pages/NotFound'))

// Componente de loading com delay mínimo para evitar flicker
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <SplashScreen message="Carregando..." size="lg" />
  </div>
)

function App() {
  return (
    <ErrorBoundaryWithCompany>
      <Router>
        <AuthProvider>
          <CompanyProvider>
            <DynamicHead />
            <Suspense fallback={<PageLoader />}>
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
                
                <Route path="/sales" element={
                  <ProtectedRoute requiredPermission="canViewSales">
                    <PrivateLayout>
                      <SectionErrorBoundary title="Erro no PDV">
                        <Sales />
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
                
                {/* Redirecionamentos */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                
                {/* Página 404 */}
                <Route path="/404" element={<NotFound />} />
                <Route path="*" element={<Navigate to="/404" replace />} />
              </Routes>
            </Suspense>
          </CompanyProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundaryWithCompany>
  )
}

export default App