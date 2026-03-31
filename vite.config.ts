import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['eugenio-moira-lowell.ngrok-free.dev'] // allow all ngrok subdomains
  }
})