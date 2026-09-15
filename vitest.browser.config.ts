import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'
import { workspaceSourceAliases } from './scripts/workspace-sources.ts'

export default defineConfig({
  define: {
    __BUILD_DATE__: JSON.stringify(new Date().toISOString().slice(0, 10))
  },
  optimizeDeps: {
    // Domain Core resolves to its own source here, so its dependencies are discovered from that source rather
    // than pre-bundled through the package.
    include: ['vitest-browser-react']
  },
  plugins: [react()],
  resolve: {
    alias: workspaceSourceAliases(),
    dedupe: ['react', 'react-dom']
  },
  test: {
    browser: {
      enabled: true,
      headless: true,
      instances: [{ browser: 'chromium' }],
      provider: playwright(),
      screenshotFailures: false
    },
    include: [
      fileURLToPath(new URL('./packages/*/src/**/*.browser.test.tsx', import.meta.url)),
      fileURLToPath(new URL('./apps/site/src/**/*.browser.test.tsx', import.meta.url))
    ]
  }
})
