import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/patients': 'http://localhost:8000',
      '/vapi': 'http://localhost:8000',
    },
  },
})
