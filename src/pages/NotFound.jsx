import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Home, ArrowLeft, Search, AlertCircle, Building } from '../lib/icons'
import { supabase } from '../lib/supabase'

const NotFound = () => {
  const [companySettings, setCompanySettings] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCompanySettings()
  }, [])

  const fetchCompanySettings = async () => {
    try {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .limit(1)
        .single()

      if (error) {
        // Se não encontrar, usa fallback
        console.warn('Configurações da empresa não encontradas:', error)
        setCompanySettings({
          company_name: 'Sistema de Gestão',
          primary_color: '#2563eb',
          secondary_color: '#7c3aed',
          company_logo_url: null
        })
      } else {
        setCompanySettings(data)
      }
    } catch (error) {
      console.error('Erro ao buscar configurações:', error)
      setCompanySettings({
        company_name: 'Sistema de Gestão',
        primary_color: '#2563eb',
        secondary_color: '#7c3aed',
        company_logo_url: null
      })
    } finally {
      setLoading(false)
    }
  }

  // Aplicar cores personalizadas
  const primaryColor = companySettings?.primary_color || '#2563eb'
  const secondaryColor = companySettings?.secondary_color || '#7c3aed'
  const companyName = companySettings?.company_name || 'Sistema de Gestão'
  const logoUrl = companySettings?.company_logo_url

  // Gerar gradiente com as cores da empresa
  const gradientStyle = {
    background: `linear-gradient(135deg, ${primaryColor}10, ${secondaryColor}10)`
  }

  const buttonStyle = {
    backgroundColor: primaryColor
  }

  const iconColors = {
    blue: { backgroundColor: `${primaryColor}20`, color: primaryColor },
    green: { backgroundColor: '#10b98120', color: '#10b981' },
    purple: { backgroundColor: `${secondaryColor}20`, color: secondaryColor }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2" 
             style={{ borderColor: primaryColor }} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          
          {/* Header com logo da empresa */}
          <div 
            className="px-6 py-12 text-center"
            style={gradientStyle}
          >
            {/* Logo */}
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt={companyName}
                className="h-16 mx-auto mb-4 object-contain"
                onError={(e) => {
                  e.target.style.display = 'none'
                }}
              />
            ) : (
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-lg mb-4"
                   style={{ backgroundColor: `${primaryColor}20` }}>
                <Building size={32} style={{ color: primaryColor }} />
              </div>
            )}
            
            <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-full shadow-lg mb-4">
              <span className="text-6xl font-bold" style={{ color: primaryColor }}>404</span>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Página não encontrada
            </h1>
            
            <p className="text-gray-600 max-w-sm mx-auto">
              A página que você está procurando não existe ou foi movida.
            </p>
          </div>

          {/* Sugestões */}
          <div className="p-6">
            <div className="space-y-3 mb-6">
              <p className="text-sm font-medium text-gray-700 mb-3">
                O que você pode fazer:
              </p>
              
              <Link 
                to="/dashboard"
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
              >
                <div 
                  className="p-2 rounded-lg transition-colors group-hover:scale-110"
                  style={iconColors.blue}
                >
                  <Home size={18} style={{ color: primaryColor }} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Ir para o Dashboard</p>
                  <p className="text-xs text-gray-500">Voltar para a página inicial</p>
                </div>
              </Link>
              
              <button
                onClick={() => window.history.back()}
                className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left group"
              >
                <div 
                  className="p-2 rounded-lg transition-colors group-hover:scale-110"
                  style={iconColors.green}
                >
                  <ArrowLeft size={18} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Voltar para página anterior</p>
                  <p className="text-xs text-gray-500">Retornar de onde você veio</p>
                </div>
              </button>
              
              <Link
                to="/products"
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
              >
                <div 
                  className="p-2 rounded-lg transition-colors group-hover:scale-110"
                  style={iconColors.purple}
                >
                  <Search size={18} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Buscar produtos</p>
                  <p className="text-xs text-gray-500">Ir para a página de produtos</p>
                </div>
              </Link>
            </div>

            {/* Informações de contato da empresa */}
            {companySettings && (companySettings.email || companySettings.phone) && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Entre em contato:
                </p>
                <div className="space-y-1 text-sm text-gray-600">
                  {companySettings.email && (
                    <p>📧 {companySettings.email}</p>
                  )}
                  {companySettings.phone && (
                    <p>📞 {companySettings.phone}</p>
                  )}
                </div>
              </div>
            )}

            {/* Ajuda */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    Precisa de ajuda?
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    Se você acredita que isso é um erro, entre em contato com o suporte técnico 
                    ou tente novamente mais tarde.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer personalizado */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-center">
            <p className="text-sm font-medium text-gray-700">
              {companyName}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              © {new Date().getFullYear()} - Todos os direitos reservados
            </p>
            {companySettings?.cnpj && (
              <p className="text-xs text-gray-400 mt-1">
                CNPJ: {companySettings.cnpj}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotFound