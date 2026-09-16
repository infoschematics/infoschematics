import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

const stylesheet = async (pathname: string) => readFile(new URL(pathname, import.meta.url), 'utf8')

describe('Studio diagram frame', () => {
  it('centres the contained Canvas frame inside the resizable panel', async () => {
    const studio = await stylesheet('../styles.css')

    expect(studio).toContain('place-items: center;')
    expect(studio).toContain('background: color-mix(in srgb, #081725 72%, #000);')
  })

  it('takes the frame itself from the Canvas stylesheet it imports, rather than a copy of its own', async () => {
    const canvas = await stylesheet('../../../view-canvas/src/styles.css')
    const studio = await stylesheet('../styles.css')

    expect(canvas).toContain('.infoschematic-frame {')
    expect(studio).not.toContain('.infoschematic-frame {')
  })
})
