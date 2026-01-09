
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Bookkeeping',
        short_name: 'Bookkeeping',
        description: 'Minimalist Expense Tracker',
        theme_color: '#f8fafc',
        background_color: '#f8fafc',
        display: 'standalone', // 关键：让应用像原生 App 一样全屏显示
        start_url: '.',
        icons: [
          {
            src: 'https://cdn-icons-png.flaticon.com/512/2454/2454282.png', // 临时占位图标
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  base: './', 
  build: {
    outDir: 'dist',
    sourcemap: false
  }
});
