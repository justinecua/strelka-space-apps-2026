import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base './' makes file paths relative, so the same build works on a website and inside the desktop app.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
})
