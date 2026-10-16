import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // 本機開發：API 交給 `npm run dev:api`（wrangler dev，預設 8787）
    proxy: {
      '/api': 'http://localhost:8787',
      '/openapi.json': 'http://localhost:8787',
      '/api-docs': 'http://localhost:8787',
    },
  },
})
