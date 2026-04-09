import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { CompanyProvider } from './contexts/CompanyContext'
import ErrorBoundaryWithCompany from './components/ErrorBoundaryWithCompany'
import SectionErrorBoundary from './components/SectionErrorBoundary'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Sales from './pages/Sales'
import SalesList from './pages/SalesList'
import Coupons from './pages/Coupons'
import CashierClosing from './pages/CashierClosing'
import StockCount from './pages/StockCount'
import Products from './pages/Products'
import Logs from './pages/Logs'
import Customers from './pages/Customers'
import CustomerCommunication from './pages/CustomerCommunication'
import Reports from './pages/Reports'
import Users from './pages/Users'
import Settings from './pages/Settings'
import PrivateLayout from './layouts/PrivateLayout'

function App() {
  return (
    <ErrorBoundaryWithCompany>
      <Router>
        <AuthProvider>
          <CompanyProvider>
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
              
              {/* Redirecionamentos */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </CompanyProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundaryWithCompany>
  )
}

export default App