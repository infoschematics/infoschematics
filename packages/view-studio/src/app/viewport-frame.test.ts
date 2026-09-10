import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

describe('Studio diagram frame', () => {
  it('centres the contained Canvas frame inside the resizable panel', async () => {
    const styles = await readFile(new URL('../styles.css', import.meta.url), 'utf8')

    expect(styles).toContain('place-items: center;')
    expect(styles).toContain('.infoschematic-frame {')
    expect(styles).toContain('background: color-mix(in srgb, #081725 72%, #000);')
  })
})
