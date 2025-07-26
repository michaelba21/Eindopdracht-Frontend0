import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    "process.env": {},
  },
  server: {
    proxy: {
      '/proxy': {
        target: 'https://api.ambeedata.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/proxy/, ''),
      }
    }
  }
})
