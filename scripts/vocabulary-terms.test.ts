import { readFile } from 'node:fs/promises'

import { describe, expect, it } from 'vitest'

import { appearanceOptionKeys, appearanceOptions } from '../packages/domain-model/src/option-catalogue.ts'

/**
 * The catalogue cites the product's vocabulary by id. Nothing in TypeScript can
 * check that a cited id is still in the glossary, so the check lives here: a
 * term reworded or retired in the reference fails the build rather than leaving
 * the code quietly pointing at a concept the documentation no longer has.
 */
const vocabulary = 'docs/reference/vocabulary.md'

const declaredIds = async (): Promise<readonly string[]> => {
  const source = await readFile(vocabulary, 'utf8')
  return [...source.matchAll(/^\| `([a-z-]+)` \|/gm)].map(([, id]) => id ?? '')
}

describe('vocabulary terms', () => {
  it('declares a unique id for every glossary term', async () => {
    const ids = await declaredIds()

    expect(ids.length).toBeGreaterThan(0)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('resolves every term the option catalogue cites', async () => {
    const ids = new Set(await declaredIds())
    const cited = appearanceOptionKeys.map((key) => appearanceOptions[key].term)

    expect(cited.length).toBe(appearanceOptionKeys.length)
    for (const term of new Set(cited)) expect(ids).toContain(term)
  })
})
