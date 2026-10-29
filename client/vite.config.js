import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In development the React app runs on :5173 and forwards /api to Express on :4000,
// so cookies stay same-origin exactly like in production.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
