import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

import { assess } from './unused.ts'

/**
 * The verdict `scripts/unused.ts` reaches, exercised against reports this repository does not currently produce.
 *
 * The sanctioned hints exist to keep one cross-tool contract — `GEN-1`'s shared exclusions — from being undone by a
 * tool that cannot see it. So the cases that matter most are the ones where the sanction stops meaning anything: the
 * hint disappears, or it comes back worded differently. Both have to fail, or the command becomes a way of not looking.
 */

const clean = [
  'Configuration hints (2)',
  '.claude/skills    knip.json  Remove from ignore',
  '.agents/skills    knip.json  Remove from ignore'
].join('\n')

describe('the unused-code report', () => {
  it('passes a report whose only hints are the sanctioned exclusions', () => {
    expect(assess(clean, 0)).toEqual([])
  })

  it('fails when a sanctioned exclusion stops being reported', () => {
    const reasons = assess('Configuration hints (1)\n.claude/skills    knip.json  Remove from ignore', 0)
    expect(reasons).toHaveLength(1)
    expect(reasons[0]).toContain('.agents/skills')
  })

  it('fails when the hint is reworded, rather than matching it loosely', () => {
    const reasons = assess(clean.replace('Remove from ignore', 'Unused ignore entry'), 0)
    expect(reasons.length).toBeGreaterThan(0)
  })

  it('fails on a hint nobody sanctioned', () => {
    const reasons = assess(`${clean}\ndocs    knip.json  Remove from ignore`, 0)
    expect(reasons).toEqual(['unsanctioned configuration hint: docs    knip.json  Remove from ignore'])
  })

  it('fails on an issue knip found, and says what it was', () => {
    const reasons = assess(`Unused files (1)\nscripts/orphan.ts\n${clean}`, 1)
    expect(reasons).toEqual(['unused files: scripts/orphan.ts'])
  })

  it('fails a non-zero exit it cannot otherwise explain', () => {
    expect(assess(clean, 2)).toEqual(['knip exited 2 without reporting anything'])
  })
})

describe('the exclusions the sanction stands for', () => {
  it('still names paths knip.json ignores', async () => {
    const configuration = await readFile(new URL('../knip.json', import.meta.url), 'utf8')
    const ignored = (JSON.parse(configuration) as { ignore?: readonly string[] }).ignore ?? []
    expect(ignored).toContain('.claude/skills')
    expect(ignored).toContain('.agents/skills')
  })
})
