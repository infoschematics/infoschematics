import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineBrowserCommand, playwright } from '@vitest/browser-playwright'
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

/**
 * Reduced motion, asked of the page rather than of the stylesheet.
 *
 * Media emulation belongs to the Playwright page, which lives in the runner rather than in the browser, so a case
 * cannot reach it directly. This command is the bridge: `commands.emulateReducedMotion(true)` before a render, and
 * the page answers `(prefers-reduced-motion: reduce)` for real. It is per case rather than per suite deliberately.
 * A `contextOptions` setting here would put every browser case in the repository under reduced motion, which would
 * quietly change what the rest of them measure — most of them measure a treatment that animates.
 *
 * A case that turns it on owns turning it off again: one context serves a whole file, so the setting outlives the
 * case that made it.
 */
const emulateReducedMotion = defineBrowserCommand<[boolean]>(async ({ page }, reduce) => {
  await page.emulateMedia({ reducedMotion: reduce ? 'reduce' : 'no-preference' })
})

/** The browser suite for one workspace, for the four that render into a real page. */
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
        commands: { emulateReducedMotion },
        enabled: true,
        headless: true,
        instances: [{ browser: 'chromium' }],
        provider: playwright(),
        screenshotFailures: false
      },
      include: [within(workspace, './src/**/*.browser.test.tsx')]
    }
  })
