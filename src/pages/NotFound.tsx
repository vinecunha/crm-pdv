// src/pages/NotFound.jsx
import React from 'react'
import { Link } from 'react-router-dom'
import { Home, ArrowLeft, Search, AlertCircle } from '@lib/icons'

// Configurações estáticas da empresa (fallback)
const COMPANY_CONFIG = {
  company_name: 'EveIT',
  company_logo_url: '/eveit-logo.png',
  primary_color: '#FF131E',
  secondary_color: '#FFE526',
  email: 'contato@eveit.com.br',
  phone: '(21) 97023-1259',
  address: 'Rua Geni Saraiva, 171',
  city: 'Nova Iguaçu',
  state: 'RJ',
  zip_code: '26032-661',
  domain: 'www.eveit.com.br'
}

const NotFound = () => {
  const { 
    company_name, 
    company_logo_url, 
    primary_color, 
    secondary_color,
    email,
    phone
  } = COMPANY_CONFIG

  const gradientStyle = {
    background: `linear-gradient(135deg, ${primary_color}15, ${secondary_color}15)`
  }

  const iconColors = {
    primary: { backgroundColor: `${primary_color}20`, color: primary_color },
    green: { backgroundColor: '#10b98120', color: '#10b981' },
    secondary: { backgroundColor: `${secondary_color}20`, color: secondary_color }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden">
          
          {/* Header com gradiente da marca */}
          <div 
            className="px-6 py-12 text-center"
            style={gradientStyle}
          >
            {/* Logo */}
            {company_logo_url && (
              <img 
                src={company_logo_url} 
                alt={company_name}
                className="h-16 mx-auto mb-4 object-contain"
                onError={(e) => e.target.style.display = 'none'}
              />
            )}
            
            {/* 404 */}
            <div 
              className="inline-flex items-center justify-center w-24 h-24 bg-white dark:bg-gray-800 rounded-full shadow-lg mb-4"
              style={{ border: `3px solid ${primary_color}` }}
            >
              <span className="text-6xl font-bold" style={{ color: primary_color }}>404</span>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Página não encontrada
            </h1>
            
            <p className="text-gray-600 dark:text-gray-400 max-w-sm mx-auto">
              A página que você está procurando não existe ou foi movida.
            </p>
          </div>

          {/* Ações */}
          <div className="p-6">
            <div className="space-y-3 mb-6">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                O que você pode fazer:
              </p>
              
              <Link 
                to="/dashboard"
                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors group"
              >
                <div 
                  className="p-2 rounded-lg transition-colors group-hover:scale-110"
                  style={iconColors.primary}
                >
                  <Home size={18} style={{ color: primary_color }} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">Ir para o Dashboard</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Voltar para a página inicial</p>
                </div>
              </Link>
              
              <button
                onClick={() => window.history.back()}
                className="w-full flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-left group"
              >
                <div 
                  className="p-2 rounded-lg transition-colors group-hover:scale-110"
                  style={iconColors.green}
                >
                  <ArrowLeft size={18} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">Voltar para página anterior</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Retornar de onde você veio</p>
                </div>
              </button>
              
              <Link
                to="/products"
                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors group"
              >
                <div 
                  className="p-2 rounded-lg transition-colors group-hover:scale-110"
                  style={iconColors.secondary}
                >
                  <Search size={18} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">Buscar produtos</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Ir para a página de produtos</p>
                </div>
              </Link>
            </div>

            {/* Contato */}
            {(email || phone) && (
              <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-4 mb-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Entre em contato:
                </p>
                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  {email && <p>📧 {email}</p>}
                  {phone && <p>📞 {phone}</p>}
                </div>
              </div>
            )}

            {/* Ajuda */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle size={18} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                    Precisa de ajuda?
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                    Se você acredita que isso é um erro, entre em contato com o suporte técnico 
                    ou tente novamente mais tarde.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div 
            className="px-6 py-4 text-center border-t"
            style={{ 
              backgroundColor: `${primary_color}08`,
              borderColor: `${primary_color}20`
            }}
          >
            <p className="text-sm font-medium" style={{ color: primary_color }}>
              {company_name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              © {new Date().getFullYear()} - Todos os direitos reservados
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotFound
