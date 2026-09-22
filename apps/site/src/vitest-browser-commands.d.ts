/**
 * The test-facing signature of the browser commands `scripts/vitest-workspace.ts` registers.
 *
 * `commands` is typed from an interface Vitest owns, so a command the runner provides is invisible to a case until
 * that interface is widened. The command itself is defined once for every browser suite; this declares it for this
 * workspace, because a repository-wide declaration would have to live in `scripts/`, which no package may reach
 * into. It is a copy of View Canvas's for that reason, not because the commands differ.
 */
import type {} from 'vitest/internal/browser'

declare module 'vitest/internal/browser' {
  interface BrowserCommands {
    /** Make the page answer `(prefers-color-scheme)` with this preference, or express none. */
    emulateColourScheme: (scheme: 'dark' | 'light' | 'no-preference') => Promise<void>
    /** Put the page under, or back out of, `(prefers-reduced-motion: reduce)`. */
    emulateReducedMotion: (reduce: boolean) => Promise<void>
  }
}
