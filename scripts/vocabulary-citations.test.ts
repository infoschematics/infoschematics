import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const vocabularyPath = 'docs/reference/vocabulary.md'

const markdownFiles = async (directory: string): Promise<string[]> => {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = join(directory, entry.name)
      return entry.isDirectory() ? markdownFiles(path) : Promise.resolve(path.endsWith('.md') ? [path] : [])
    })
  )
  return nested.flat()
}

const vocabularyIds = (source: string) => [...source.matchAll(/^\| `([a-z-]+)` \|/gm)].map(([, id]) => id ?? '')

const vocabularyAnchors = (source: string) =>
  [...source.matchAll(/<span id="([a-z-]+)"><\/span>/g)].map(([, id]) => id ?? '')

const citedIds = (source: string) =>
  [...source.matchAll(/(?:\/docs\/reference\/vocabulary\/|(?:\.\.\/)*reference\/vocabulary\.md)#([a-z-]+)/g)].map(
    ([, id]) => id ?? ''
  )

describe('vocabulary citations', () => {
  it('gives every declared term one stable explicit anchor', async () => {
    const source = await readFile(vocabularyPath, 'utf8')
    const ids = vocabularyIds(source)
    const anchors = vocabularyAnchors(source)

    expect(ids.length).toBeGreaterThan(0)
    expect(new Set(ids)).toHaveLength(ids.length)
    expect(new Set(anchors)).toHaveLength(anchors.length)
    expect(new Set(anchors)).toEqual(new Set(ids))
  })

  it('resolves every vocabulary citation in repository and site documentation', async () => {
    const ids = new Set(vocabularyIds(await readFile(vocabularyPath, 'utf8')))
    const files = [...(await markdownFiles('docs')), ...(await markdownFiles('apps/site/content'))]
    let citations = 0

    for (const file of files) {
      const source = await readFile(file, 'utf8')
      for (const id of citedIds(source)) {
        citations += 1
        expect(ids, `${file} cites unknown vocabulary id ${id}`).toContain(id)
      }
    }

    expect(citations).toBeGreaterThan(10)
  })
})
