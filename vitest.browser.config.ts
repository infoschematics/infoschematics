import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  define: {
    __BUILD_DATE__: JSON.stringify(new Date().toISOString().slice(0, 10))
  },
  optimizeDeps: {
    noDiscovery: true,
    include: ['vitest-browser-react', '@infoschematics/domain-core > yaml', '@infoschematics/domain-core > zod']
  },
  plugins: [react()],
  resolve: {
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
    include: [fileURLToPath(new URL('./packages/*/src/**/*.browser.test.tsx', import.meta.url))]
  }
})
