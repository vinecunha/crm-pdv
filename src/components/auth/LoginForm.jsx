import React, { useState } from 'react'
import { Mail, Lock, LogIn, Clock, Eye, EyeOff } from '@lib/icons'

const LoginForm = ({ 
  email, 
  setEmail, 
  password, 
  setPassword, 
  onSubmit, 
  loading, 
  isBlocked, 
  primaryColor, 
  secondaryColor 
}) => {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
          Email
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg transition-all focus:outline-none"
            style={{
              '--tw-ring-color': `${primaryColor}20`
            }}
            onFocus={(e) => {
              e.target.style.borderColor = primaryColor
              e.target.style.boxShadow = `0 0 0 2px ${primaryColor}20`
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#d1d5db'
              e.target.style.boxShadow = 'none'
            }}
            placeholder="seu@email.com"
            required
            disabled={isBlocked || loading}
            autoComplete="email"
            autoFocus
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
          Senha
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-10 pr-12 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg transition-all focus:outline-none"
            onFocus={(e) => {
              e.target.style.borderColor = primaryColor
              e.target.style.boxShadow = `0 0 0 2px ${primaryColor}20`
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#d1d5db'
              e.target.style.boxShadow = 'none'
            }}
            placeholder="••••••••"
            required
            disabled={isBlocked || loading}
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors focus:outline-none"
            tabIndex={-1}
            title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || isBlocked}
        className="w-full text-white font-medium py-2.5 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:shadow-lg"
        style={{
          backgroundColor: primaryColor,
        }}
        onMouseEnter={(e) => e.target.style.backgroundColor = secondaryColor}
        onMouseLeave={(e) => e.target.style.backgroundColor = primaryColor}
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            Entrando...
          </>
        ) : isBlocked ? (
          <>
            <Clock size={18} />
            Bloqueado
          </>
        ) : (
          <>
            <LogIn size={18} />
            Entrar
          </>
        )}
      </button>
    </form>
  )
}

export default LoginForm