import React, { Suspense, lazy, ReactNode } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/auth/ProtectedRoute'
import SectionErrorBoundary from './components/error/SectionErrorBoundary'
import Login from './pages/Login'
import NotFound from './pages/NotFound'

const Dashboard = lazy(() => import(/* webpackChunkName: "dashboard" */ './pages/Dashboard'))
const TaskBoard = lazy(() => import(/* webpackChunkName: "dashboard" */ './pages/TaskBoard'))
const SellerDetail = lazy(() => import(/* webpackChunkName: "dashboard" */ './pages/SellerDetail'))
const Sales = lazy(() => import(/* webpackChunkName: "pdv" */ './pages/Sales'))
const SalesList = lazy(() => import(/* webpackChunkName: "pdv" */ './pages/SalesList'))
const CashierClosing = lazy(() => import(/* webpackChunkName: "pdv" */ './pages/CashierClosing'))
const Budgets = lazy(() => import(/* webpackChunkName: "pdv" */ './pages/Budgets'))
const Products = lazy(() => import(/* webpackChunkName: "products" */ './pages/Products'))
const StockCount = lazy(() => import(/* webpackChunkName: "products" */ './pages/StockCount'))
const Customers = lazy(() => import(/* webpackChunkName: "customers" */ './pages/Customers'))
const CustomerCommunication = lazy(() => import(/* webpackChunkName: "customers" */ './pages/CustomerCommunication'))
const Coupons = lazy(() => import(/* webpackChunkName: "coupons" */ './pages/Coupons'))
const Reports = lazy(() => import(/* webpackChunkName: "reports" */ './pages/Reports'))
const Users = lazy(() => import(/* webpackChunkName: "admin" */ './pages/Users'))
const Logs = lazy(() => import(/* webpackChunkName: "admin" */ './pages/Logs'))
const Settings = lazy(() => import(/* webpackChunkName: "admin" */ './pages/Settings'))
const Profile = lazy(() => import(/* webpackChunkName: "auth" */ './pages/Profile'))
const RolePermissions = lazy(() => import(/* webpackChunkName: "admin" */ './pages/RolePermissions'))
const CommissionsAdmin = lazy(() => import(/* webpackChunkName: "commissions" */ './components/commissions/CommissionsAdmin'))
const PrivateLayout = lazy(() => import(/* webpackChunkName: "layout" */ './layouts/PrivateLayout'))
const SplashScreen = lazy(() => import(/* webpackChunkName: "layout" */ './components/ui/SplashScreen'))

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
    <SplashScreen message="Carregando..." size="lg" />
  </div>
)

interface RouteConfig {
  path: string
  component: React.ComponentType
  permission?: string
  useLayout?: boolean
  sectionErrorTitle?: string
  isExact?: boolean
  redirect?: string
}

const routes: RouteConfig[] = [
  { path: '/login', component: Login, isExact: true },
  { path: '/', redirect: '/dashboard' },
  { path: '/404', component: NotFound, isExact: true },
  
  { path: '/dashboard', component: Dashboard, permission: 'canViewDashboard', useLayout: true, sectionErrorTitle: 'Erro no Dashboard' },
  { path: '/tasks', component: TaskBoard, permission: 'canViewTasks', useLayout: true },
  { path: '/sellers/:sellerId', component: SellerDetail, permission: 'canViewDashboard', useLayout: true, sectionErrorTitle: 'Erro nos detalhes do vendedor' },
  { path: '/sales', component: Sales, permission: 'canViewSales', useLayout: true, sectionErrorTitle: 'Erro no PDV' },
  { path: '/budgets', component: Budgets, permission: 'canViewSales', useLayout: true, sectionErrorTitle: 'Erro no Orçamento' },
  { path: '/sales-list', component: SalesList, permission: 'canViewSales', useLayout: true, sectionErrorTitle: 'Erro na Gestão de Vendas' },
  { path: '/cashier', component: CashierClosing, permission: 'canViewSales', useLayout: true, sectionErrorTitle: 'Erro no Fechamento de Caixa' },
  { path: '/coupons', component: Coupons, permission: 'canViewCoupons', useLayout: true, sectionErrorTitle: 'Erro na página de Cupons' },
  { path: '/stock-count', component: StockCount, permission: 'canManageStock', useLayout: true, sectionErrorTitle: 'Erro na página de Balanço' },
  { path: '/products', component: Products, permission: 'canViewProducts', useLayout: true, sectionErrorTitle: 'Erro na página de Produtos' },
  { path: '/customers', component: Customers, permission: 'canViewCustomers', useLayout: true, sectionErrorTitle: 'Erro na página de Clientes' },
  { path: '/customers/:id/communication', component: CustomerCommunication, permission: 'canViewCustomers', useLayout: true, sectionErrorTitle: 'Erro na Comunicação' },
  { path: '/reports', component: Reports, permission: 'canViewReports', useLayout: true, sectionErrorTitle: 'Erro nos Relatórios' },
  { path: '/users', component: Users, permission: 'canViewUsers', useLayout: true, sectionErrorTitle: 'Erro na página de Usuários' },
  { path: '/logs', component: Logs, permission: 'canViewLogs', useLayout: true, sectionErrorTitle: 'Erro nos Logs' },
  { path: '/settings', component: Settings, permission: 'canViewSettings', useLayout: true, sectionErrorTitle: 'Erro nas Configurações' },
  { path: '/settings/profile', component: Profile, useLayout: true, sectionErrorTitle: 'Erro no Perfil' },
  { path: '/settings/roles', component: RolePermissions, permission: 'canViewSettings', useLayout: true, sectionErrorTitle: 'Erro em Papéis' },
  { path: '/customer-communication', component: CustomerCommunication, permission: 'canViewCustomers', useLayout: true, sectionErrorTitle: 'Erro na Comunicação' },
  { path: '/commissions/admin', component: CommissionsAdmin, permission: 'canViewCommissions', useLayout: true, sectionErrorTitle: 'Erro nas Comissões' },
]

const createRouteElement = (config: RouteConfig) => {
  const { component: Component, permission, useLayout, sectionErrorTitle, isExact, redirect } = config

  if (redirect) {
    return <Navigate to={redirect} replace />
  }

  if (isExact) {
    return <Component />
  }

  const content = sectionErrorTitle ? (
    <SectionErrorBoundary title={sectionErrorTitle}>
      <Component />
    </SectionErrorBoundary>
  ) : (
    <Component />
  )

  const page = useLayout ? (
    <PrivateLayout>
      {content}
    </PrivateLayout>
  ) : content

  return permission ? (
    <ProtectedRoute requiredPermission={permission}>
      {page}
    </ProtectedRoute>
  ) : page
}

const AppRoutes = () => (
  <Suspense fallback={<PageLoader />}>
    <Routes>
      {routes.map((config, index) => (
        <Route
          key={config.path + index}
          path={config.path}
          element={createRouteElement(config)}
        />
      ))}
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  </Suspense>
)

export default AppRoutes