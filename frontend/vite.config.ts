import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 版號、更新紀錄：repo 根目錄的 VERSION、CHANGELOG.md（見 RELEASING.md）
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const version = readFileSync(path.join(root, 'VERSION'), 'utf8').trim()
const buildSha = (): string => {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA.slice(0, 7)
  try {
    return execSync('git rev-parse --short HEAD', { cwd: root }).toString().trim()
  } catch {
    return ''
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // 後台側欄的版號、更新紀錄頁用
  define: {
    __APP_VERSION__: JSON.stringify(version),
    __BUILD_SHA__: JSON.stringify(buildSha()),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString().slice(0, 10)),
  },
  server: {
    // CHANGELOG.md 在 frontend 外面（repo 根目錄），開發伺服器要允許讀
    fs: { allow: [root] },
    // 本機開發：API 交給 `npm run dev:api`（wrangler dev，預設 8787）
    proxy: {
      '/api': 'http://localhost:8787',
      '/openapi.json': 'http://localhost:8787',
      '/api-docs': 'http://localhost:8787',
      // 出機照片（R2）
      '/media': 'http://localhost:8787',
    },
  },
})
