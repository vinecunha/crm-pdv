// components/ProtectedRoute.jsx
import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@contexts/AuthContext.jsx'

const ProtectedRoute = ({ children, requiredPermission }) => {
  const { profile, loading, permissions, isAuthenticated } = useAuth()

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Carregando...</p>
        </div>
      </div>
    )
  }

  // Se não estiver autenticado, redirecionar para login
  if (!isAuthenticated || !profile) {
    return <Navigate to="/login" replace />
  }

  // Se precisar de permissão específica e usuário não tem
  if (requiredPermission && !permissions[requiredPermission]) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="bg-red-100 dark:bg-red-900/30 rounded-full p-4 inline-block mb-4">
            <svg className="w-12 h-12 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">Acesso Negado</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Você não tem permissão para acessar esta página.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Permissão necessária: {requiredPermission}
          </p>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="mt-4 px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
          >
            Voltar para o Dashboard
          </button>
        </div>
      </div>
    )
  }

  // Se tudo estiver ok, renderizar o conteúdo
  return children
}

export default ProtectedRoute
