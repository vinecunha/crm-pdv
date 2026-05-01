// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const isProduction = process.env.NODE_ENV === 'production'

export default defineConfig({
  plugins: [
    react({
      fastRefresh: true,
      exclude: /node_modules/,
    })
  ],
  
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
    
    // ✅ Configuração específica para integração
    isolate: true,
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true  // ✅ Rodar um teste por vez
      }
    },
    
    // ✅ Limitar concorrência
    maxConcurrency: 1,
    
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/**', 'src/test/**']
    }
  },
   // ============= HEADERS DE SEGURANÇA =============
   // NOTE: CSP should be configured on the production web server (nginx, Cloudflare, etc.)
   // Vite dev server is for development only - these headers are for testing purposes
   server: {
     host: true,
     port: 5173,
     strictPort: false,
     
     headers: {
       'X-Content-Type-Options': 'nosniff',
       'X-Frame-Options': 'DENY',
       'Referrer-Policy': 'strict-origin-when-cross-origin',
     },
    
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173,
      overlay: true
    },
    
    watch: {
      ignored: ['**/node_modules/**', '**/.git/**', '**/dist/**']
    }
  },
  
  // ============= BUILD OTIMIZADO =============
  build: {
    sourcemap: !isProduction,
    
    rollupOptions: {
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        unknownGlobalSideEffects: false
      },
      
      output: {
        // ✅ CORRIGIDO: Apenas agrupar vendors, NÃO agrupar código da aplicação
        manualChunks(id) {
          // Apenas node_modules
          if (id.includes('node_modules')) {
            // React e ecossistema
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react'
            }
            // Supabase
            if (id.includes('@supabase')) {
              return 'vendor-supabase'
            }
            // React Query
            if (id.includes('@tanstack/react-query')) {
              return 'vendor-query'
            }
            // Chart.js
            if (id.includes('chart.js') || id.includes('react-chartjs-2')) {
              return 'vendor-charts'
            }
            // Outras libs
            if (id.includes('dompurify') || id.includes('browser-image-compression') || id.includes('lodash')) {
              return 'vendor-utils'
            }
            // Restante das dependências
            return 'vendor'
          }
        },
        
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    
    minify: 'esbuild',
    
    chunkSizeWarningLimit: 500,
    cssCodeSplit: true,
    target: 'es2020',
    assetsInlineLimit: 4096,
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
    ]
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
      '@contexts': '/src/contexts',
      '@services': '/src/services',
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