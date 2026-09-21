import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { formatInfoschematicIssue, parseInfoschematic } from '../packages/domain-core/src/index.ts'
import { reviewInfoschematicDrawing } from '../packages/view-model/src/diagnostics.ts'
import { examplePackages, examplesRoot } from './examples.ts'

/**
 * Every published example draws something a reader can read.
 *
 * The drawing rules are only worth having if the documents this repository ships pass them: a checker that finds
 * something wrong with the showcase is either wrong about the rule or right about the document, and both are worth
 * failing a build over. This is also the only place a false positive shows up - a rule that fires on correct authored
 * geometry costs every author who runs `infoschematics check`, and no fixture written beside the rule would catch it.
 *
 * Per the repository's own rule about checks that measure nothing, this asserts its own coverage twice: that it
 * reviewed the documents it claims to have reviewed, and that the checker it is calling still reports a drawing that
 * is broken on purpose. A review that silently resolved to an empty rule set would otherwise pass every case here.
 */

/** Enough documents to be the published set rather than whatever the walk happened to resolve. */
const documentFloor = 5

const reviewedDocuments = async () => {
  const reviewed: { findings: readonly { rule: string }[]; name: string }[] = []

  for (const example of await examplePackages()) {
    for (const document of example.documents) {
      const name = `${example.directory}/${document.source}`
      const yaml = await readFile(join(examplesRoot, example.directory, document.source), 'utf8')
      const parsed = parseInfoschematic(yaml, { pathname: document.source })
      if (!parsed.ok) {
        throw new Error([`${name} is not a valid document:`, ...parsed.issues.map(formatInfoschematicIssue)].join('\n'))
      }
      reviewed.push({ findings: reviewInfoschematicDrawing(parsed.model), name })
    }
  }

  return reviewed
}

describe('published example drawings', () => {
  it('reports nothing wrong with any document the repository ships', async () => {
    const reviewed = await reviewedDocuments()

    expect(reviewed.length).toBeGreaterThanOrEqual(documentFloor)
    expect(reviewed.filter((entry) => entry.findings.length > 0)).toEqual([])
  })

  // The same walk, against a document broken on purpose. Without this the case above passes just as well when the
  // checker has stopped measuring anything at all.
  it('still reports a published document broken on purpose', async () => {
    const yaml = await readFile(join(examplesRoot, 'is-system', 'infoschematic.yaml'), 'utf8')
    // The first Card, moved far outside the view every other element still shares.
    const outside = yaml.replace(/^ {6}bounds: \d+ \d+ (\d+ \d+)$/m, '      bounds: 100000 100000 $1')
    expect(outside).not.toBe(yaml)

    const parsed = parseInfoschematic(outside, { pathname: 'is-system/infoschematic.yaml' })
    if (!parsed.ok) throw new Error(parsed.issues.map(formatInfoschematicIssue).join('\n'))

    expect(reviewInfoschematicDrawing(parsed.model).map((finding) => finding.rule)).toContain('artefact-outside-view')
  })
})
