import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useCompany } from '@hooks/system/useCompany'
import SplashScreen from '@components/ui/SplashScreen'

const CompanySetupCheck = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { company, loading } = useCompany()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (loading) return // Ainda carregando
    
    let cancelled = false
    const check = () => {
      if (cancelled) return
      setChecking(false)
      if (!company && !['/setup', '/login'].includes(location.pathname)) {
        navigate('/setup', { replace: true })
      }
    }
    check()
    return () => { cancelled = true }
  }, [company, loading, navigate, location.pathname])

  if (checking || loading) {
    return <SplashScreen fullScreen message="Verificando configurações..." />
  }

  return null
}

export default CompanySetupCheck
