// hooks/useCompany.js
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export const useCompany = () => {
  const [company, setCompany] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Função que está faltando no seu erro
  const getCompanyColor = (type = 'primary') => {
    if (type === 'primary') {
      return company?.primary_color || '#2563eb'
    }
    return company?.secondary_color || '#7c3aed'
  }

  const fetchCompanySettings = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .limit(1)
        .single()
      
      if (error) throw error
      
      setCompany(data)
      
      // Aplicar cores no CSS global
      if (data?.primary_color) {
        document.documentElement.style.setProperty('--primary-color', data.primary_color)
      }
      if (data?.secondary_color) {
        document.documentElement.style.setProperty('--secondary-color', data.secondary_color)
      }
      
    } catch (err) {
      console.error('Erro ao buscar configurações da empresa:', err)
      setError(err.message)
      // Fallback para valores padrão
      setCompany({
        company_name: 'Brasalino Pollo',
        primary_color: '#FF131E',
        secondary_color: '#FFE526'
      })
    } finally {
      setLoading(false)
    }
  }

  const updateCompanySettings = async (settings) => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('company_settings')
        .update({
          ...settings,
          updated_at: new Date().toISOString()
        })
        .eq('id', company.id)
        .select()
        .single()
      
      if (error) throw error
      
      setCompany(data)
      return { success: true, data }
      
    } catch (err) {
      console.error('Erro ao atualizar configurações:', err)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCompanySettings()
  }, [])

  return {
    company,
    loading,
    error,
    getCompanyColor,  // <-- ESTAVA FALTANDO ESTA LINHA
    updateCompanySettings,
    fetchCompanySettings
  }
}