import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

describe('Model register layout', () => {
  it('uses one stable, non-wrapping identity column for groups and entries', async () => {
    const styles = await readFile(new URL('../../styles.css', import.meta.url), 'utf8')

    expect(styles.match(/grid-template-columns: 72px minmax\(0, 1fr\);/g)).toHaveLength(2)
    expect(styles).toContain('.register-group-identity {')
    expect(styles).toContain('.register-group-label {')
    expect(styles).toContain('text-overflow: ellipsis;')
    expect(styles).toContain('white-space: nowrap;')
  })
})
