import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // 1. IMPORTANTE: Asegura que la app sepa que está en la raíz
  base: '/', 

  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Sistema de Agendamiento',
        short_name: 'Agendamiento',
        description: 'App de reservas y citas',
        theme_color: '#0f172a', // Tu color oscuro
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        
        // 2. IMPORTANTE: Definir dónde arranca la app en Android
        start_url: '/',
        scope: '/',
        
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      'react-native': 'react-native-web',
    },
  },
  build: {
    // 3. SOLUCIÓN ADVERTENCIA VERCEL: Aumentar el límite a 1600kb (o lo que necesites)
    chunkSizeWarningLimit: 1600,
    
    rollupOptions: {
      output: {
        // Opcional: Esto ayuda a separar librerías grandes en archivos distintos
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
});