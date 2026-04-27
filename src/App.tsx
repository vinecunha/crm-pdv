import React, { Suspense, lazy } from 'react'
import { ThemeProvider } from './contexts/ThemeContext'
import { UIProvider, useUI } from './contexts/UIContext'
import FeedbackMessage from '@components/ui/FeedbackMessage'
import './index.css'
import { BrowserRouter as Router } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { CompanyProvider } from './contexts/CompanyContext'
import ErrorBoundaryWithCompany from '@components/ErrorBoundaryWithCompany'
import DynamicHead from '@components/DynamicHead'
import PrefetchRoute from '@components/PrefetchRoute' 
import { queryClient } from '@lib/react-query'
import CacheDebugger from '@components/ui/CacheDebugger'
import NetworkStatus from '@components/ui/NetworkStatus'
import PendingSalesIndicator from '@components/sales/pdv/PendingSalesIndicator'
import PerformanceDebugger from '@components/ui/PerformanceDebugger'
import { useNotificationTriggers } from '@hooks/system/useNotificationTriggers'
import AppRoutes from './routes'

const SplashScreen = lazy(() => import(
  /* webpackChunkName: "layout" */
  '@components/ui/SplashScreen'
))

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
    <SplashScreen message="Carregando..." size="lg" />
  </div>
)

const NotificationTriggersWrapper = () => {
  useNotificationTriggers()
  return null
}

const GlobalFeedback = () => {
  const { feedback, hideFeedback } = useUI()
  if (!feedback.show) return null
  return (
    <FeedbackMessage
      type={feedback.type}
      message={feedback.message}
      onClose={hideFeedback}
      position="absolute-bottom"
    />
  )
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
                <UIProvider>
                  <Suspense fallback={<PageLoader />}>
                    <PrefetchRoute>
                      <AppRoutes />
                    </PrefetchRoute>
                  </Suspense>
                  <GlobalFeedback />
                </UIProvider>
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