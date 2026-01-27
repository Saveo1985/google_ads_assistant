import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Increase chunk size warning limit to prevent warnings from failing builds in strict CI
    chunkSizeWarningLimit: 1600,
  }
})
