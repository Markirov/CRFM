import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor':    ['react', 'react-dom', 'react-router-dom'],
          'firebase-app':    ['firebase/app', 'firebase/analytics'],
          'firebase-store':  ['firebase/firestore'],
          'firebase-auth':   ['firebase/auth'],
          'icons':           ['lucide-react'],
          'd3':              ['d3-delaunay'],
        },
      },
    },
  },
});
