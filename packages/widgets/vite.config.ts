import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        'parcel-map': resolve(__dirname, 'src/parcel-map/index.tsx'),
        'deal-dashboard': resolve(__dirname, 'src/deal-dashboard/index.tsx'),
        'market-report': resolve(__dirname, 'src/market-report/index.tsx'),
        'screening-results': resolve(__dirname, 'src/screening-results/index.tsx'),
      },
      output: {
        dir: 'dist',
        entryFileNames: '[name]/index.js',
        chunkFileNames: 'shared/[name]-[hash].js',
        assetFileNames: '[name]/[name][extname]',
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'chart.js'],
  },
});
