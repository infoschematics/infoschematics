import { rm, writeFile } from 'node:fs/promises'

import { afterEach, describe, expect, it } from 'vitest'

import { buildOrder, inputFingerprints } from './build-packages.ts'
import { workspacePackages } from './workspace-sources.ts'

/**
 * Change detection fails silently in one direction only. A fingerprint that moves too often costs a rebuild; one that
 * does not move when it should serves stale `dist` to every consumer and reports success. These tests check the
 * second direction with real edits, because a mapping that is nearly right skips exactly the package that changed.
 *
 * Domain Core rather than View Model: `dependency-boundaries.test.ts` writes its own control file into View Model's
 * source, and two suites editing one package would read as each other's change. Every assertion here also names the
 * packages it cares about rather than expecting the whole set to hold still, for the same reason.
 */
const control = 'packages/domain-core/src/fingerprint-control.tmp.ts'
const testControl = 'packages/domain-core/src/fingerprint-control.tmp.test.ts'

const moved = async (before: ReadonlyMap<string, string>) => {
  const after = await inputFingerprints()
  return [...after].filter(([name, fingerprint]) => before.get(name) !== fingerprint).map(([name]) => name)
}

afterEach(async () => {
  await rm(control, { force: true })
  await rm(testControl, { force: true })
})

describe('package build order', () => {
  it('places every package in exactly one level, after everything it depends on', () => {
    const levels = buildOrder()
    const placed = levels.flat()

    expect(placed.map(({ name }) => name).sort()).toEqual(
      workspacePackages()
        .map(({ name }) => name)
        .sort()
    )

    const levelOf = new Map(levels.flatMap((level, index) => level.map(({ name }) => [name, index] as const)))
    for (const { dependencies, name } of placed) {
      for (const dependency of dependencies) {
        expect(levelOf.get(dependency), `${name} builds before ${dependency}`).toBeLessThan(levelOf.get(name) as number)
      }
    }
  })
})

describe('package build fingerprints', () => {
  it('moves for an edited package and for everything downstream of it', async () => {
    const before = await inputFingerprints()
    await writeFile(control, 'export const control = true\n')

    const changed = await moved(before)

    expect(changed).toContain('@infoschematics/domain-core')
    // Several hops downstream: a fingerprint folding in only direct dependencies would leave this one matching.
    expect(changed).toContain('@infoschematics/view-studio')
    // Upstream of the edit, so its output cannot have changed and rebuilding it would be waste.
    expect(changed).not.toContain('@infoschematics/domain-model')
  })

  it('holds still for a test file, which the build configuration excludes from the program', async () => {
    const before = await inputFingerprints()
    await writeFile(testControl, 'export const control = true\n')

    expect(await moved(before)).not.toContain('@infoschematics/domain-core')
  })
})
