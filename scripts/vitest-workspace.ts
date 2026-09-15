import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig, type ViteUserConfig } from 'vitest/config'
import { workspaceSourceAliases } from './workspace-sources.ts'

/**
 * The shared shape of every workspace's test configuration.
 *
 * Each workspace runs its own suite so the orchestrator can cache it independently, which means twelve configurations
 * that must agree about resolution. They agree by being generated here: a workspace that quietly resolved a sibling
 * through its published `dist` while its neighbours read source would test a different repository from the rest.
 */
const shared = () => ({
  // Mirrors the apps/site build stamp, so its components render under whichever workspace's run reaches them.
  define: { __BUILD_DATE__: JSON.stringify(new Date().toISOString().slice(0, 10)) },
  plugins: [react()],
  resolve: { alias: workspaceSourceAliases() }
})

const within = (workspace: string, pattern: string) => fileURLToPath(new URL(pattern, workspace))

/**
 * The node suite for one workspace.
 *
 * Pass `import.meta.url` from the workspace's own `vitest.config.ts`; every glob is then anchored to that file rather
 * than to the working directory the run happens to start in.
 */
export const workspaceTests = (workspace: string): ViteUserConfig =>
  defineConfig({
    ...shared(),
    test: {
      // Both extensions: a component test has to be .tsx, and leaving it out of the pattern meant one could be
      // written and silently never run.
      exclude: [within(workspace, './src/**/*.browser.test.{ts,tsx}')],
      include: [within(workspace, './src/**/*.test.ts'), within(workspace, './src/**/*.test.tsx')]
    }
  })

/** The browser suite for one workspace, for the three that render into a real page. */
export const workspaceBrowserTests = (workspace: string): ViteUserConfig =>
  defineConfig({
    ...shared(),
    optimizeDeps: {
      // Every @infoschematics package resolves to its own source here, so its dependencies are discovered from that
      // source rather than pre-bundled through the package.
      include: ['vitest-browser-react']
    },
    resolve: { ...shared().resolve, dedupe: ['react', 'react-dom'] },
    test: {
      browser: {
        enabled: true,
        headless: true,
        instances: [{ browser: 'chromium' }],
        provider: playwright(),
        screenshotFailures: false
      },
      include: [within(workspace, './src/**/*.browser.test.tsx')]
    }
  })
