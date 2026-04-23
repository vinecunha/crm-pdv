import React, { useState, useEffect } from 'react'
import { supabase } from '@lib/supabase'
import ErrorBoundary from '@components/ErrorBoundary'

const ErrorBoundaryWithCompany = ({ children }) => {
  const [companySettings, setCompanySettings] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCompanySettings = async () => {
      try {
        const { data, error } = await supabase
          .from('company_settings')
          .select('*')
          .limit(1)
          .single()
        
        if (!error && data) {
          setCompanySettings(data)
        }
      } catch (error) {
        console.error('Erro ao buscar configurações da empresa:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCompanySettings()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400" />
      </div>
    )
  }

  return (
    <ErrorBoundary companySettings={companySettings}>
      {children}
    </ErrorBoundary>
  )
}

export default ErrorBoundaryWithCompany
