import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import { workspaceSourceAliases } from './scripts/workspace-sources.ts'

// The repository-level suite. Every workspace runs its own tests from its own configuration; what is left here are
// the checks that span workspaces and therefore belong to none of them — vocabulary, dependency boundaries, visual
// treatment parity, the generators, and the command-line conventions the scripts share.
export default defineConfig({
  // Mirrors the apps/site build stamp so its components render under the shared test run.
  define: {
    __BUILD_DATE__: JSON.stringify(new Date().toISOString().slice(0, 10))
  },
  plugins: [react()],
  resolve: {
    alias: workspaceSourceAliases()
  },
  test: {
    // Both extensions: a component test has to be .tsx, and leaving it out of
    // the pattern meant one could be written and silently never run.
    exclude: [fileURLToPath(new URL('./**/*.browser.test.{ts,tsx}', import.meta.url))],
    include: [fileURLToPath(new URL('./scripts/**/*.test.ts', import.meta.url))]
  }
})
