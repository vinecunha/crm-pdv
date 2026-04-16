import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import ThemeInitializer from '../components/ThemeInitializer'

const PrivateLayout = ({ children }) => {
  const { profile } = useAuth()
  
  // Prioridade: perfil do usuário > localStorage > false
  const [collapsed, setCollapsed] = useState(() => {
    const savedState = localStorage.getItem('sidebar')
    return savedState !== null ? savedState === 'true' : (profile?.sidebar_collapsed || false)
  })

  // Sincronizar com o perfil quando carregar
  useEffect(() => {
    if (profile?.sidebar_collapsed !== undefined) {
      setCollapsed(profile.sidebar_collapsed)
    }
  }, [profile?.sidebar_collapsed])

  // Salvar no localStorage como cache
  useEffect(() => {
    localStorage.setItem('sidebar', collapsed)
  }, [collapsed])

  return (
    <>
      <ThemeInitializer />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
        <Header collapsed={collapsed} />
        <div className={`transition-all duration-300 ${collapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
          <main className="p-4">
            {children}
          </main>
        </div>
      </div>
    </>
  )
}

export default PrivateLayout