import { useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { checkCompanyExists } from '@utils/companyCheck'
import { logger } from '@utils/logger'

// Rotas que não devem disparar o check (setup e login já tratam a si mesmos)
const SKIP_CHECK_PATHS = ['/setup', '/login', '/404']

const CompanySetupCheck = () => {
  const navigate = useNavigate()
  const location = useLocation()
  // Executar apenas uma vez por mount — não re-executar a cada pathname change
  const checked = useRef(false)

  useEffect(() => {
    // Já verificou → não repetir
    if (checked.current) return

    // Não verificar em rotas que gerenciam o próprio estado
    if (SKIP_CHECK_PATHS.includes(location.pathname)) {
      checked.current = true
      return
    }

    checked.current = true

    const checkCompany = async () => {
      try {
        const { exists, redirectTo } = await checkCompanyExists()

        // Só redireciona para /setup se company não existe
        // Em todos os outros casos, deixa o AuthProvider e as rotas decidirem
        if (!exists) {
          navigate('/setup', { replace: true })
        }
        // Se exists=true, não faz nada — AuthProvider e ProtectedRoute
        // cuidam de redirecionar para /login ou /dashboard conforme necessário
      } catch (error) {
        logger.error('Erro no CompanySetupCheck:', error)
        // Em caso de erro, não redireciona — deixa o app tentar normalmente
      }
    }

    checkCompany()
  }, []) // Dependência vazia: roda APENAS uma vez ao montar

  // Não renderiza nada — não bloqueia a UI com SplashScreen
  return null
}

export default CompanySetupCheck
