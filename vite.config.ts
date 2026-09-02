import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// The package ships TypeScript source behind its exports map - hosts compile
// it in their own build. This config exists for the test suite alone.
export default defineConfig({
  plugins: [react()],
  test: {
    // Both extensions: a component test has to be .tsx, and leaving it out of
    // the pattern meant one could be written and silently never run.
      include: [
        fileURLToPath(new URL('./workspaces/*/src/**/*.test.ts', import.meta.url)),
        fileURLToPath(new URL('./workspaces/*/src/**/*.test.tsx', import.meta.url)),
        fileURLToPath(new URL('./workspaces/examples/*/src/**/*.test.ts', import.meta.url)),
        fileURLToPath(new URL('./workspaces/examples/*/src/**/*.test.tsx', import.meta.url))
      ]
  }
})
