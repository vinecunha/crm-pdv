import React, { createContext, useContext } from 'react'
import { useCompany } from '../hooks/useCompany'

const CompanyContext = createContext(null)

export const useCompanyContext = () => {
  const context = useContext(CompanyContext)
  if (!context) {
    throw new Error('useCompanyContext must be used within CompanyProvider')
  }
  return context
}

export const CompanyProvider = ({ children }) => {
  const companyData = useCompany()
  
  return (
    <CompanyContext.Provider value={companyData}>
      {children}
    </CompanyContext.Provider>
  )
}