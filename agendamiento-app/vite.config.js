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
        theme_color: '#ffffff', // Placeholder until dynamic theme is implemented
        background_color: '#ffffff',
        display: 'standalone', // Feels like a native app
        icons: [
          {
            src: 'pwa-192x192.png', // Ensure this image exists in public/
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      // 1. Redirects 'react-native' imports to 'react-native-web'
      // This solves the "Flow is not supported" error
      'react-native': 'react-native-web',
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      // 2. Helps esbuild handle JS files that use JSX syntax
      // Common in the React Native ecosystem
      loader: {
        '.js': 'jsx',
      },
    },
  },
});