import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

const stylesheet = async (pathname: string) => readFile(new URL(pathname, import.meta.url), 'utf8')

describe('Studio diagram frame', () => {
  it('centres the contained Canvas frame inside the resizable panel, from the stylesheet that owns the container', async () => {
    const canvas = await stylesheet('../../../view-canvas/src/styles.css')

    expect(canvas).toContain('place-items: center;')
    // Two tokens, not the colours they happen to generate today: Studio's copy wrote the literal, which is how a
    // backdrop change would have reached the diagram everywhere except the editor. The mix settles toward the chrome
    // the container sits in rather than toward black, which in the light scheme is the difference between a frame and
    // a mid-grey slab.
    expect(canvas).toContain(
      'background: color-mix(in srgb, var(--infoschematic-canvas-paint-backdrop) 72%, var(--infoschematic-chrome-paint-page));'
    )
  })

  it('takes the frame and its container from the Canvas stylesheet it imports, rather than copies of its own', async () => {
    const canvas = await stylesheet('../../../view-canvas/src/styles.css')
    const studio = await stylesheet('../styles.css')

    expect(canvas).toContain('.infoschematic-frame {')
    expect(studio).not.toContain('.infoschematic-frame {')
    // Anchored to the start of a line: Studio does scope its own rules to `.infoschematic-panel > .infoschematic`,
    // and a bare substring match cannot tell that apart from redeclaring the container itself.
    expect(canvas).toMatch(/^\.infoschematic \{$/m)
    expect(studio).not.toMatch(/^\.infoschematic[\s,{]/m)
  })
})
