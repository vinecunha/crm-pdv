import React from 'react'
import { Building } from 'lucide-react'

const LoginHeader = ({ companyName, logoUrl, primaryColor }) => {
  return (
    <div className="text-center mb-8">
      {logoUrl ? (
        <img 
          src={logoUrl} 
          alt={companyName}
          className="h-20 mx-auto mb-4 object-contain"
          onError={(e) => {
            e.target.style.display = 'none'
            const fallback = document.createElement('div')
            fallback.className = 'inline-flex items-center justify-center w-20 h-20 rounded-full mb-4'
            fallback.style.backgroundColor = `${primaryColor}20`
            e.target.parentNode.appendChild(fallback)
          }}
        />
      ) : (
        <div 
          className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4"
          style={{ backgroundColor: `${primaryColor}20` }}
        >
          <Building size={40} style={{ color: primaryColor }} />
        </div>
      )}
      
      <h2 
        className="text-3xl font-bold"
        style={{ color: primaryColor }}
      >
        {companyName}
      </h2>
      <p className="text-gray-600 mt-2">Faça login para acessar o sistema</p>
    </div>
  )
}

export default LoginHeader