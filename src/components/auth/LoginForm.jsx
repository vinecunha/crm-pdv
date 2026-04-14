import React from 'react'
import { User, Lock, LogIn, Clock } from '../../utils/icons'

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
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg transition-all"
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
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg transition-all"
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
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || isBlocked}
        className="w-full text-white font-medium py-2.5 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:shadow-lg"
        style={{
          backgroundColor: primaryColor,
          '--tw-shadow-color': `${primaryColor}40`
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