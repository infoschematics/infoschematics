/**
 * The test-facing signature of the browser commands `scripts/vitest-workspace.ts` registers.
 *
 * `commands` is typed from an interface Vitest owns, so a command the runner provides is invisible to a case until
 * that interface is widened. The command itself is defined once for every browser suite; this declares it for the
 * one workspace that calls it, because a repository-wide declaration would have to live in `scripts/`, which no
 * package may reach into. Another workspace that starts asking a page about reduced motion copies this file.
 */
import type {} from 'vitest/internal/browser'

declare module 'vitest/internal/browser' {
  interface BrowserCommands {
    /** Put the page under, or back out of, `(prefers-reduced-motion: reduce)`. */
    emulateReducedMotion: (reduce: boolean) => Promise<void>
  }
}
