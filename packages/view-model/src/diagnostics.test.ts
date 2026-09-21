import { formatInfoschematicIssue, parseInfoschematic } from '@infoschematics/domain-core'
import { describe, expect, it } from 'vitest'
import { drawingIsUnreadable, reviewInfoschematicDrawing } from './diagnostics.ts'

/**
 * Every rule is held to a document that breaks it and a document that does not.
 *
 * The fixtures are authored YAML rather than constructed models, because the subject of these rules is what a person
 * or an agent writes: a rule proved against a hand-built runtime object could be measuring geometry no document can
 * express. Each case asserts the rule code, the identities it names and the measurement it reports, not a count -
 * a checker that fires the right number of times for the wrong reasons is exactly the check that measures nothing.
 */

const document = (body: string) => `id: probe
title: Probe
diagram:
  bounds: 0 0 800 400
  gridSize: 10
  families:
    - id: link
      label: Links
      color: "#79c9ff"
${body}
scopes:
  - id: all
    label: All
    description: Everything
    elements: []
`

const findingsFor = (body: string) => {
  const parsed = parseInfoschematic(document(body), { pathname: 'probe.yaml' })
  if (!parsed.ok)
    throw new Error(['The fixture is not a valid document:', ...parsed.issues.map(formatInfoschematicIssue)].join('\n'))
  return reviewInfoschematicDrawing(parsed.model)
}

/** Two Cards facing each other across the view, joined by the route their ports give it. */
const wellDrawn = `  cards:
    - id: ONE
      label: One
      bounds: 40 40 160 100
      ports:
        east: 1
    - id: TWO
      label: Two
      bounds: 560 40 160 100
      ports:
        west: 1
  flows:
    - id: LINK
      family: link
      link: ONE E1 -> TWO W1`

describe('reviewInfoschematicDrawing', () => {
  it('finds nothing wrong with a drawing that reads', () => {
    expect(findingsFor(wellDrawn)).toEqual([])
  })

  it('reports two artefacts drawn on top of each other, and by how much', () => {
    const findings = findingsFor(`  cards:
    - id: ONE
      label: One
      bounds: 40 40 200 100
    - id: TWO
      label: Two
      bounds: 180 40 200 100`)

    expect(findings).toEqual([
      {
        concerns: ['ONE', 'TWO'],
        measured: { area: 6000, height: 100, width: 60 },
        reads: 'Card ONE and Card TWO overlap by 60 by 100 units.',
        repairs: [
          'Move ONE or TWO so their boxes do not intersect.',
          'Make one of the two boxes smaller.',
          'Author an Adapter, if one of the two really does hold the other.'
        ],
        rule: 'artefacts-overlap',
        severity: 'error'
      }
    ])
  })

  // An Adapter is a grip on the Card it holds, per `ADR-INFOSCHEMATICS-036`, so the one pair of boxes that is
  // supposed to overlap must not be reported - the rule would otherwise fire on every correctly authored Adapter.
  it('exempts an Adapter from overlapping the Card it holds', () => {
    expect(
      findingsFor(`  cards:
    - id: HELD
      label: Held
      bounds: 300 140 200 100
    - id: ADPT
      label: Adapter
      stereotype: Adapter
      adapts: HELD
      bounds: 280 180 240 120`)
    ).toEqual([])
  })

  it('reports an artefact drawn outside the authored view', () => {
    const findings = findingsFor(`  cards:
    - id: ONE
      label: One
      bounds: 700 40 200 100`)

    expect(findings).toEqual([
      {
        concerns: ['ONE'],
        measured: { height: 100, width: 200, x: 700, y: 40 },
        reads: 'Card ONE is not inside the authored view, so part of it is never drawn.',
        repairs: [
          'Move ONE inside the view.',
          'Widen the authored view to contain it.',
          'Remove it if it is no longer part of the drawing.'
        ],
        rule: 'artefact-outside-view',
        severity: 'error'
      }
    ])
  })

  it('reports a Point outside the authored view', () => {
    const findings = findingsFor(`  points:
    - id: PT-01
      label: Camera
      at: 900 900
      ports: 1`)

    expect(findings).toMatchObject([
      {
        concerns: ['PT-01'],
        measured: { x: 900, y: 900 },
        reads: 'Point PT-01 is outside the authored view, so it is never drawn.',
        rule: 'artefact-outside-view',
        severity: 'error'
      }
    ])
  })

  it('reports a route drawn through an artefact it neither leaves nor reaches', () => {
    const findings = findingsFor(`  cards:
    - id: ONE
      label: One
      bounds: 40 40 160 100
      ports:
        east: 1
    - id: MIDDLE
      label: Middle
      bounds: 300 40 160 100
    - id: TWO
      label: Two
      bounds: 560 40 160 100
      ports:
        west: 1
  flows:
    - id: LINK
      family: link
      link: ONE E1 -> TWO W1`)

    expect(findings).toEqual([
      {
        concerns: ['LINK', 'MIDDLE'],
        measured: { crossings: 1 },
        reads: 'Flow LINK is drawn through Card MIDDLE, which it neither leaves nor reaches.',
        repairs: [
          'Add a waypoint that takes LINK around MIDDLE.',
          'Move MIDDLE clear of the route.',
          'Choose ports for LINK on the sides that face each other.'
        ],
        rule: 'route-crosses-artefact',
        severity: 'error'
      }
    ])
  })

  // The failure this rule was raised for: the drawing stays valid and reads as though the Flow passes through its own
  // endpoint, which is the one thing a reader is certain it does not do.
  it('reports a route that runs back across the endpoint it leaves', () => {
    const findings = findingsFor(`  cards:
    - id: ONE
      label: One
      bounds: 300 40 200 100
      ports:
        east: 1
    - id: TWO
      label: Two
      bounds: 40 240 200 100
      ports:
        north: 1
  flows:
    - id: LINK
      family: link
      link: ONE E1 -> TWO N1
      waypoints: 560,90 560,20 400,20 400,290 140,290`)

    expect(findings).toMatchObject([
      {
        concerns: ['LINK', 'ONE'],
        measured: { crossings: 1 },
        reads: 'Flow LINK runs across its source ONE rather than clear of it.',
        rule: 'route-re-enters-endpoint',
        severity: 'error'
      },
      {
        concerns: ['LINK', 'TWO'],
        measured: { crossings: 2 },
        reads: 'Flow LINK runs across its target TWO rather than clear of it.',
        rule: 'route-re-enters-endpoint',
        severity: 'error'
      }
    ])
  })

  // `along` is a distance in diagram units, so this is a label pinned 180 units from the source port, which lands on
  // the Card in the middle. An observation rather than an error: the drawing is readable, the label is not.
  it('observes a Flow label falling on an artefact, and where', () => {
    const findings = findingsFor(`  cards:
    - id: ONE
      label: One
      bounds: 40 40 160 100
      ports:
        east: 1
    - id: MIDDLE
      label: Middle
      bounds: 300 40 160 100
    - id: TWO
      label: Two
      bounds: 560 40 160 100
      ports:
        west: 1
  flows:
    - id: LINK
      family: link
      link: ONE E1 -> TWO W1
      labelAt: 180`)

    expect(findings).toMatchObject([
      {
        concerns: ['LINK', 'MIDDLE'],
        measured: { along: 180, x: 380, y: 90 },
        reads: "Flow LINK's label falls on Card MIDDLE.",
        rule: 'flow-label-obstructed',
        severity: 'observation'
      },
      { rule: 'route-crosses-artefact' }
    ])
    expect(drawingIsUnreadable(findings.filter((finding) => finding.rule === 'flow-label-obstructed'))).toBe(false)
  })

  it('reports two Flows meeting one endpoint at the same port', () => {
    const findings = findingsFor(`  cards:
    - id: ONE
      label: One
      bounds: 40 40 200 100
      ports:
        east: 2
    - id: TWO
      label: Two
      bounds: 560 40 200 100
      ports:
        west: 2
  flows:
    - id: LINK
      family: link
      link: ONE E1 -> TWO W1
    - id: OTHER
      family: link
      link: ONE E1 -> TWO W2`)

    expect(findings).toMatchObject([
      {
        concerns: ['ONE', 'LINK', 'OTHER'],
        measured: { distance: 0 },
        reads: 'Flows LINK and OTHER both meet ONE at port E1.',
        rule: 'port-collision',
        severity: 'error'
      }
    ])
  })

  // Two callers ranking the same document must rank it the same way, and a repair loop that reruns the checker has to
  // see the finding it repaired leave the list rather than the list reshuffle around it.
  it('orders findings by rule and subject, and reports the same list twice', () => {
    const broken = `  cards:
    - id: ONE
      label: One
      bounds: 40 40 200 100
      ports:
        east: 1
    - id: TWO
      label: Two
      bounds: 180 40 200 100
    - id: FAR
      label: Far
      bounds: 700 40 200 100
      ports:
        west: 1
  flows:
    - id: LINK
      family: link
      link: ONE E1 -> FAR W1`

    const findings = findingsFor(broken)
    expect(findings.map((finding) => [finding.rule, ...finding.concerns].join(' '))).toEqual([
      'artefact-outside-view FAR',
      'artefacts-overlap ONE TWO',
      'route-crosses-artefact LINK TWO'
    ])
    expect(findingsFor(broken)).toEqual(findings)
  })
})

describe('drawingIsUnreadable', () => {
  it('holds the gate open for a drawing that reads, and closes it on an error', () => {
    expect(drawingIsUnreadable(findingsFor(wellDrawn))).toBe(false)
    expect(
      drawingIsUnreadable(
        findingsFor(`  cards:
    - id: ONE
      label: One
      bounds: 700 40 200 100`)
      )
    ).toBe(true)
  })
})
