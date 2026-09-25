/**
 * A rendered file that themes itself, proved by a browser rather than by reading the markup.
 *
 * `--mode system` writes the palettes into the document and lets whatever displays it choose. Which declaration
 * wins is decided by `(prefers-color-scheme)` and by the cascade together, so a case that read the embedded
 * stylesheet would be asserting the rule it hoped applied. Asking the page for a preference and reading back what
 * the drawing resolved is the only evidence that the file works where it is going.
 */
import { afterEach, expect, test } from 'vitest'
import { commands } from 'vitest/browser'
import { render } from 'vitest-browser-react'
import { StaticInfoschematic } from '../StaticInfoschematic.tsx'
import { schemeSpecimen } from './specimens.ts'

const backdropOf = (container: HTMLElement) => {
  const backdrop = container.querySelector('.infoschematic-backdrop')
  if (!backdrop) throw new Error('the rendering has no backdrop')
  return getComputedStyle(backdrop).fill
}

/* One browser context serves this whole file, so a preference outlives the case that asked for it. */
afterEach(async () => {
  await commands.emulateColourScheme('no-preference')
})

test('a deferring rendering paints itself in the mode the page prefers', async () => {
  const { container } = await render(
    <StaticInfoschematic
      input={schemeSpecimen}
      label="Colour scheme example"
      options={{ mode: 'system' }}
      resourceIdPrefix="scheme-system-case"
    />
  )

  /* Written as the colours a reader would see rather than read back from the manifest: Site consumes the published
     packages and does not reach into the view model, and the manifest's own suite already holds the palettes. */
  await commands.emulateColourScheme('light')
  expect(backdropOf(container)).toBe('rgb(255, 255, 255)')

  await commands.emulateColourScheme('dark')
  expect(backdropOf(container)).toBe('rgb(22, 27, 32)')
})

test('a rendering given a mode keeps it whatever the page prefers', async () => {
  const { container } = await render(
    <StaticInfoschematic
      input={schemeSpecimen}
      label="Light colour scheme example"
      options={{ mode: 'light' }}
      resourceIdPrefix="scheme-light-case"
    />
  )

  // The point of a resolved rendering: the colour is in the file, so a reader's preference has nothing to act on.
  await commands.emulateColourScheme('dark')
  expect(backdropOf(container)).toBe('rgb(255, 255, 255)')
  await commands.emulateColourScheme('light')
  expect(backdropOf(container)).toBe('rgb(255, 255, 255)')
})
