import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const isProduction = process.env.NODE_ENV === 'production'

export default defineConfig({
  plugins: [
    react({
      // Fast Refresh otimizado
      fastRefresh: true,
      // Excluir arquivos desnecessários do processamento
      exclude: /node_modules/,
    })
  ],
  
  // ============= HEADERS DE SEGURANÇA =============
  server: {
    host: true,
    port: 5173,
    strictPort: false,
    
    // Headers apenas para desenvolvimento
    headers: isProduction ? {} : {
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co http://localhost:* ws://localhost:*",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https: blob:",
        "font-src 'self' data:",
        "connect-src 'self' http://localhost:* ws://localhost:* wss://localhost:* https://*.supabase.co wss://*.supabase.co https://api.ipify.org",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'"
      ].join('; '),
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    },
    
    // Configuração do HMR
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173,
      overlay: true
    },
    
    // Watch com menos arquivos
    watch: {
      ignored: ['**/node_modules/**', '**/.git/**', '**/dist/**']
    }
  },
  
  // ============= BUILD OTIMIZADO =============
  build: {
    // Source maps apenas em dev
    sourcemap: !isProduction,
    
    rollupOptions: {
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false,
        unknownGlobalSideEffects: false
      },
      
      output: {
        manualChunks(id) {
          // Chunk automático baseado no caminho
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react'
            }
            if (id.includes('@supabase')) {
              return 'vendor-supabase'
            }
            if (id.includes('@tanstack/react-query')) {
              return 'vendor-query'
            }
            if (id.includes('chart.js') || id.includes('react-chartjs')) {
              return 'vendor-charts'
            }
            if (id.includes('dompurify') || id.includes('browser-image-compression')) {
              return 'vendor-utils'
            }
            return 'vendor'
          }
          
          // Chunks da aplicação
          if (id.includes('/src/components/')) {
            return 'components'
          }
          if (id.includes('/src/pages/')) {
            return 'pages'
          }
          if (id.includes('/src/hooks/')) {
            return 'hooks'
          }
        },
        
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: isProduction,
        drop_debugger: isProduction,
        pure_funcs: isProduction ? ['console.log', 'console.info', 'console.debug'] : [],
        passes: 2,
        unsafe: isProduction,
        unsafe_math: isProduction,
        unsafe_methods: isProduction,
        unsafe_proto: isProduction,
        unsafe_regexp: isProduction,
        collapse_vars: true,
        reduce_vars: true,
        hoist_funs: true,
        hoist_vars: true,
        dead_code: true,
        unused: true,
      },
      mangle: {
        properties: isProduction ? {
          regex: /^_/,
        } : false
      },
      format: {
        comments: false,
        ascii_only: isProduction,
      }
    },
    
    chunkSizeWarningLimit: 500,
    cssCodeSplit: true,
    target: 'es2020',
    
    // Compressão de assets
    assetsInlineLimit: 4096, // 4kb
  },
  
  // ============= OTIMIZAÇÃO DE DEPENDÊNCIAS =============
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      '@supabase/supabase-js',
      'chart.js',
      'react-chartjs-2',
      'dompurify',
      'browser-image-compression'
    ],
    exclude: [],
    esbuildOptions: {
      target: 'es2020',
      treeShaking: true,
    },
    // Forçar otimização mesmo com erros
    force: false
  },
  
  // ============= ESBUILD =============
  esbuild: {
    target: 'es2020',
    treeShaking: true,
    legalComments: 'none',
    minifyIdentifiers: isProduction,
    minifySyntax: isProduction,
    minifyWhitespace: isProduction,
    // Suporte a JSX
    jsxInject: `import React from 'react'`,
  },
  
  // ============= RESOLVE =============
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@pages': '/src/pages',
      '@hooks': '/src/hooks',
      '@utils': '/src/utils',
      '@lib': '/src/lib',
    }
  },
  
  // ============= CSS =============
  css: {
    devSourcemap: !isProduction,
    modules: {
      localsConvention: 'camelCase',
      generateScopedName: isProduction ? '[hash:base64:8]' : '[name]__[local]__[hash:base64:5]'
    },
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/variables.scss";`
      }
    }
  }
})