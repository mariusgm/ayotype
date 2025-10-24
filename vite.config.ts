import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// Root Vite config for AyoType monorepo
// Builds both landing page and EmojiFusion app

export default defineConfig({
  plugins: [react()],
  root: '.',
  publicDir: 'public', // Enable public directory for static files like ads.txt

  server: {
    host: "127.0.0.1",
    port: 3000,
    proxy: {
      // Proxy API calls to local API server during development
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
        secure: false
      }
    }
  },

  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    minify: 'esbuild',

    rollupOptions: {
      input: {
        // Landing page inputs
        'landing/index': resolve(__dirname, 'apps/landing/index.html'),
        'landing/contact': resolve(__dirname, 'apps/landing/contact.html'),
        'landing/combo-archive': resolve(__dirname, 'apps/landing/combo-archive.html'),

        // EmojiFusion app input
        'emojifusion/index': resolve(__dirname, 'apps/emojifusion/index.html'),
      },

      output: {
        // Organize outputs by app
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name.startsWith('landing/')) {
            return 'landing/assets/[name]-[hash].js'
          }
          if (chunkInfo.name.startsWith('emojifusion/')) {
            return 'emojifusion/assets/[name]-[hash].js'
          }
          return 'assets/[name]-[hash].js'
        },
        chunkFileNames: (chunkInfo) => {
          // Group chunks by the app they belong to
          const facadeModuleId = chunkInfo.facadeModuleId || ''
          if (facadeModuleId.includes('/apps/landing/')) {
            return 'landing/assets/[name]-[hash].js'
          }
          if (facadeModuleId.includes('/apps/emojifusion/')) {
            return 'emojifusion/assets/[name]-[hash].js'
          }
          return 'shared/assets/[name]-[hash].js'
        },
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name || ''
          // Route assets to their respective app directories
          if (name.includes('landing') || assetInfo.names?.some(n => n.includes('/apps/landing/'))) {
            return 'landing/assets/[name]-[hash][extname]'
          }
          if (name.includes('emojifusion') || assetInfo.names?.some(n => n.includes('/apps/emojifusion/'))) {
            return 'emojifusion/assets/[name]-[hash][extname]'
          }
          return 'assets/[name]-[hash][extname]'
        }
      }
    }
  },

  resolve: {
    alias: {
      '@': resolve(__dirname, './apps'),
      '@shared': resolve(__dirname, './shared'),
      '@landing': resolve(__dirname, './apps/landing'),
      '@emojifusion': resolve(__dirname, './apps/emojifusion')
    }
  }
})
