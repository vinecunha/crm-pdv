import { useEffect } from 'react'
import { useCompany } from '../hooks/useCompany'

const DynamicHead = () => {
  const { company, loading } = useCompany()

  useEffect(() => {
    if (loading || !company) return

    // Atualizar título
    const title = company.company_name 
      ? `${company.company_name} - Sistema de Gestão`
      : 'Brasalino Pollo - Sistema de Gestão'
    
    document.title = title

    // Atualizar meta tags
    updateMetaTag('description', `Sistema de gestão integrada ${company.company_name}`)
    updateMetaTag('author', company.company_name)
    updateMetaTag('theme-color', company.primary_color || '#2563eb')

    // Atualizar favicon se existir
    if (company.favicon || company.company_logo_url) {
      updateFavicon(company.favicon || company.company_logo_url)
    }

  }, [company, loading])

  const updateMetaTag = (name, content) => {
    if (!content) return
    
    let meta = document.querySelector(`meta[name="${name}"]`)
    if (!meta) {
      meta = document.createElement('meta')
      meta.setAttribute('name', name)
      document.head.appendChild(meta)
    }
    meta.setAttribute('content', content)
  }

  const updateFavicon = (url) => {
    // Atualizar todos os tipos de favicon
    const selectors = [
      'link[rel="icon"]',
      'link[rel="shortcut icon"]',
      'link[rel="apple-touch-icon"]'
    ]

    selectors.forEach(selector => {
      const link = document.querySelector(selector)
      if (link) {
        link.href = url
      }
    })
  }

  return null 
}

export default DynamicHead