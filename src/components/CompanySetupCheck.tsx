import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { checkCompanyExists } from '@utils/companyCheck'
import SplashScreen from '@components/ui/SplashScreen'
import { logger } from '@utils/logger'

const CompanySetupCheck = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const checkCompany = async () => {
      try {
        const { redirectTo } = await checkCompanyExists()
        
        // Se já estiver na página correta, não redireciona
        if (location.pathname === redirectTo) {
          setChecking(false)
          return
        }

        // Redireciona para a página apropriada
        navigate(redirectTo, { replace: true })
      } catch (error) {
        logger.error('Erro no CompanySetupCheck:', error)
        setChecking(false)
      }
    }

    checkCompany()
  }, [navigate, location.pathname])

  if (checking) {
    return <SplashScreen fullScreen message="Verificando configurações..." />
  }

  return null
}

export default CompanySetupCheck
