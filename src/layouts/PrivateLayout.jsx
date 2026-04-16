import React, { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import ThemeToggle from '../components/ui/ThemeToggle'

const PrivateLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('sidebar') === 'true'
  })

  useEffect(() => {
    localStorage.setItem('sidebar', collapsed)
  }, [collapsed])

  return (
    <div className="min-h-screen bg-gray-50"> 
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <Header collapsed={collapsed} />
      <div className={`transition-all duration-300 ${collapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        {children}
      </div>
    </div>
  )
}

export default PrivateLayout