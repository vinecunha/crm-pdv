import React, { useState, useEffect } from 'react'
import { supabase } from '@lib/supabase'
import { AlertCircle, RefreshCw, Home, Bug, ChevronLeft } from '@lib/icons'
import { logger } from '@utils/logger' 
import { useCompany } from '@/hooks/system/useCompany'

const CIRCUIT_BREAKER_WINDOW = 60000
const CIRCUIT_BREAKER_THRESHOLD = 10
const CIRCUIT_BREAKER_COOLDOWN = 300000

let errorLogState = {
  errors: [] as number[],
  circuitOpen: false,
  circuitOpensAt: 0
}

// Modern functional ErrorBoundary using hooks
export function ErrorBoundary({ children, fallback }: { children: React.ReactNode, fallback?: React.ReactNode }) {
  const [hasError, setHasError] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [errorInfo, setErrorInfo] = useState<{ componentStack?: string } | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const { company } = useCompany()
  
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setHasError(true)
      setError(new Error(event.message))
      logErrorToSupabase(new Error(event.message), { componentStack: event.error?.stack })
    }
    
    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [])
  
  const logErrorToSupabase = async (error: Error, errorInfo: any) => {
    const now = Date.now()
    
    if (errorLogState.circuitOpen) {
      if (now - errorLogState.circuitOpensAt > CIRCUIT_BREAKER_COOLDOWN) {
        errorLogState.circuitOpen = false
        errorLogState.errors = []
      } else {
        return
      }
    }
    
    errorLogState.errors = errorLogState.errors.filter(t => now - t < CIRCUIT_BREAKER_WINDOW)
    errorLogState.errors.push(now)
    
    if (errorLogState.errors.length > CIRCUIT_BREAKER_THRESHOLD) {
      errorLogState.circuitOpen = true
      errorLogState.circuitOpensAt = now
      logger.warn('Circuit breaker aberto: muitos erros de logging')
      return
    }
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      
      let userRole = null
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        userRole = profile?.role
      }
      
      await supabase
        .from('system_logs')
        .insert({
          user_id: user?.id || null,
          user_email: user?.email || null,
          user_role: userRole || null,
          action: 'ERROR',
          entity_type: 'frontend',
          details: {
            error: {
              message: error?.message || 'Erro desconhecido',
              stack: error?.stack,
              name: error?.name
            },
            componentStack: errorInfo?.componentStack,
            url: window.location.href,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
          }
        })
      
      logger.log('Erro registrado no Supabase')
    } catch (logError) {
      logger.error('Erro ao registrar erro no Supabase:', logError)
    }
  }
  
  const handleRefresh = () => {
    window.location.reload()
  }
  
  const handleGoBack = () => {
    window.history.back()
  }
  
  const handleGoHome = () => {
    window.location.href = '/dashboard'
  }
  
  const toggleDetails = () => {
    setShowDetails(prev => !prev)
  }
  
  if (!hasError) {
    return children
  }
  
  // Usar configurações da empresa dinamicamente
  const companyName = company?.company_name || 'Sistema de Gestão'
  const primaryColor = company?.primary_color || '#2563eb'
  const logoSrc = company?.company_logo_url || null
  
  if (fallback) {
    return fallback
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Card de erro */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden">
          {/* Header com logo */}
          <div 
            className="px-6 py-8 text-center"
            style={{ background: `linear-gradient(135deg, ${primaryColor}15, ${primaryColor}05)` }}
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
              <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Ops! Algo deu errado
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              O sistema encontrou um erro inesperado. Nossa equipe já foi notificada.
            </p>
          </div>
          
          {/* Corpo */}
          <div className="p-6">
            {/* Mensagem de erro amigável */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <Bug className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                    Erro: {error?.message || 'Erro desconhecido'}
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                    Por favor, tente recarregar a página ou volte para o início.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Botões de ação */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <button
                onClick={handleRefresh}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Recarregar página
              </button>
              <button
                onClick={handleGoBack}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 dark:bg-gray-800 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Voltar
              </button>
              <button
                onClick={handleGoHome}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 dark:bg-green-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
              >
                <Home className="w-4 h-4" />
                Ir para o início
              </button>
            </div>
            
            {/* Detalhes técnicos (opcional) */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <button
                onClick={toggleDetails}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors flex items-center gap-1"
              >
                <Bug className="w-3 h-3" />
                {showDetails ? 'Ocultar detalhes técnicos' : 'Ver detalhes técnicos'}
              </button>
              
              {showDetails && (
                <div className="mt-3 p-3 bg-gray-900 dark:bg-black rounded-lg overflow-auto">
                  <p className="text-xs text-red-400 mb-2">
                    {error?.toString()}
                  </p>
                  <details className="text-xs text-gray-400">
                    <summary className="cursor-pointer mb-2">Stack trace</summary>
                    <pre className="whitespace-pre-wrap font-mono text-xs">
                      {errorInfo?.componentStack}
                    </pre>
                  </details>
                </div>
              )}
            </div>
          </div>
          
          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-black border-t border-gray-200 dark:border-gray-700 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {companyName} - Sistema de Gestão Integrada
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Se o problema persistir, entre em contato com o suporte.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

