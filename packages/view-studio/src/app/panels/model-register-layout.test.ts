import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

describe('Model register layout', () => {
  it('uses one stable, non-wrapping identity column', async () => {
    const styles = await readFile(new URL('../../styles.css', import.meta.url), 'utf8')

    expect(styles).toContain('grid-template-columns: 72px minmax(0, 1fr);')
    expect(styles).toContain('text-overflow: ellipsis;')
    expect(styles).toContain('white-space: nowrap;')
  })
})
