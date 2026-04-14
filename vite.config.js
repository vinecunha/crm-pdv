import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https: blob:",
        "font-src 'self' data:",
        "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'"
      ].join('; '),
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Bibliotecas que mudam pouco (cache mais duradouro)
          vendor: ['react', 'react-dom', 'react-router-dom'],
          
          // UI e ícones
          ui: ['lucide-react'],
          
          // Data fetching
          data: ['@tanstack/react-query', '@supabase/supabase-js'],
          
          // Charts (só para relatórios)
          charts: ['chart.js', 'react-chartjs-2'],
          
          // Virtualização (tabelas grandes)
          virtual: ['@tanstack/react-virtual'],
        }
      }
    },
    chunkSizeWarningLimit: 500
  }
})