import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Sistema de Agendamiento',
        short_name: 'Agendamiento',
        description: 'App de reservas y citas',
        // CAMBIO: Color oscuro para que la barra de estado del celular se vea integrada
        theme_color: '#0f172a', 
        background_color: '#0f172a',
        display: 'standalone', // <--- ESTO OCULTA LA BARRA DE NAVEGACIÓN
        orientation: 'portrait', // Opcional: Bloquea la rotación si lo deseas
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
          // Recomendado: Icono enmascarable para Android modernos
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
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
});