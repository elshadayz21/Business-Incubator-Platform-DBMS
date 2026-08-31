import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const isVercel = process.env.VERCEL === '1'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: isVercel ? '/' : '/admin/',
  build: {
    outDir: isVercel ? 'dist' : '../public/admin',
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
      '/v1': 'http://localhost:3000',
      '/brand': 'http://localhost:3000',
    },
  },
})