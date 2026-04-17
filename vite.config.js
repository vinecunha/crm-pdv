// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  
  // ============= HEADERS DE SEGURANÇA =============
  server: {
    host: true,
    headers: {
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https: blob:", 
        "font-src 'self' data:",
        "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.ipify.org",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'"
      ].join('; '),
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      'Cross-Origin-Resource-Policy': 'cross-origin',
    }
  },
  
  // ============= BUILD COM TREE SHAKING OTIMIZADO =============
  build: {
    rollupOptions: {
      // Tree shaking agressivo
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false,
        unknownGlobalSideEffects: false
      },
      
      output: {
        // Agrupamento manual de chunks
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['./src/lib/icons.js'],
          data: ['@tanstack/react-query', '@supabase/supabase-js'],
          charts: ['chart.js', 'react-chartjs-2'],
          virtual: ['@tanstack/react-virtual'],
          utils: ['dompurify', 'browser-image-compression'],
        },
        
        // Nomeação para melhor caching
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    
    // Minificação agressiva com Terser
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'],
        passes: 2,
        unsafe: true,
        unsafe_math: true,
        unsafe_methods: true,
        unsafe_proto: true,
        unsafe_regexp: true,
        unsafe_undefined: true,
        collapse_vars: true,
        reduce_vars: true,
        hoist_funs: true,
        hoist_vars: true,
        keep_fargs: false,
        keep_fnames: false,
        dead_code: true,
        unused: true,
      },
      mangle: {
        properties: {
          regex: /^_/,
          reserved: ['__proto__', 'constructor', 'prototype']
        }
      },
      format: {
        comments: false,
        ascii_only: true,
      }
    },
    
    chunkSizeWarningLimit: 500,
    sourcemap: false,
    cssCodeSplit: true,
    target: 'es2020',
  },
  
  // ============= OTIMIZAÇÃO DE DEPENDÊNCIAS =============
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      '@supabase/supabase-js',
      './src/lib/icons.js',
      'chart.js',
      'react-chartjs-2',
      'dompurify',
      'browser-image-compression'
    ],
    esbuildOptions: {
      target: 'es2020',
      treeShaking: true,
    }
  },
  
  // ============= ESBUILD =============
  esbuild: {
    target: 'es2020',
    treeShaking: true,
    legalComments: 'none',
    minifyIdentifiers: true,
    minifySyntax: true,
    minifyWhitespace: true,
  }
})