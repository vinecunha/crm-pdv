// src/components/LoginFooter.tsx
import React from 'react'

interface LoginFooterProps {
  companyName: string
  cnpj?: string | null
}

const LoginFooter: React.FC<LoginFooterProps> = ({ companyName, cnpj }) => {
  const currentYear = new Date().getFullYear()

  return (
    <div className="mt-6 text-center">
      <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
        {companyName}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        © {currentYear} - Todos os direitos reservados
      </p>
      {cnpj && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          CNPJ: {cnpj}
        </p>
      )}
    </div>
  )
}

export default LoginFooter