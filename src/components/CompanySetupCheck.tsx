import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { fetchCompanySettings } from '@services/system/companyService'
import SplashScreen from '@components/ui/SplashScreen'

const CompanySetupCheck = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let cancelled = false
    const check = async () => {
      const settings = await fetchCompanySettings()
      if (cancelled) return
      setChecking(false)
      if (!settings && !['/setup', '/login'].includes(location.pathname)) {
        navigate('/setup', { replace: true })
      }
    }
    check()
    return () => { cancelled = true }
  }, [navigate, location.pathname])

  if (checking) {
    return <SplashScreen fullScreen message="Verificando configurações..." />
  }

  return null
}

export default CompanySetupCheck
