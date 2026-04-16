import React from 'react'

const LoginFooter = ({ companyName, cnpj }) => {
  return (
    <div className="mt-6 text-center">
      <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{companyName}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        © {new Date().getFullYear()} - Todos os direitos reservados
      </p>
      {cnpj && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">CNPJ: {cnpj}</p>
      )}
    </div>
  )
}

export default LoginFooter