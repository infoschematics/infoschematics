import { formatInfoschematicIssue, parseInfoschematic } from '@infoschematics/domain-core'
import { describe, expect, it } from 'vitest'
import {
  drawingIsUnreadable,
  promisesAreBroken,
  reviewInfoschematicDrawing,
  reviewInfoschematicPromises
} from './diagnostics.ts'

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

  // An Adapter is a grip on the Card it holds, per `ADR-INFOSCHEMATICS-032`, so the one pair of boxes that is
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

  // `along` is a fraction of the route's length, so this is a label pinned at its midpoint, which lands on the Card
  // in the middle. An observation rather than an error: the drawing is readable, the label is not.
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
      labelAt: 0.5`)

    expect(findings).toMatchObject([
      {
        concerns: ['LINK', 'MIDDLE'],
        measured: { along: 0.5, x: 380, y: 90 },
        reads: "Flow LINK's label falls on Card MIDDLE.",
        rule: 'flow-label-obstructed',
        severity: 'observation'
      },
      { rule: 'route-crosses-artefact' }
    ])
    expect(drawingIsUnreadable(findings.filter((finding) => finding.rule === 'flow-label-obstructed'))).toBe(false)
  })

  /*
   * The confusion this rule exists for, and the confusion it must not invent. `INFOSCHEMATICS-TOOL-120` found the
   * checker reading `labelAt` as a distance while both renderers read it as a fraction, so both directions are held
   * here: a distance written into a fraction is reported with the fraction that would have meant it, and the
   * fractions four published documents author are reported as nothing at all.
   */
  it('observes a Flow label placed beyond the route, and says what the fraction would have been', () => {
    const findings = findingsFor(`  cards:
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
      link: ONE E1 -> TWO W1
      labelAt: 180`)

    expect(findings).toMatchObject([
      {
        concerns: ['LINK'],
        measured: { along: 180, length: 360, suggested: 0.5 },
        reads: "Flow LINK's label is placed at 180 along a route measured in fractions, so it is drawn at its target.",
        rule: 'flow-label-off-route',
        severity: 'observation'
      }
    ])
    expect(drawingIsUnreadable(findings)).toBe(false)
  })

  it('reports nothing about a Flow label placed at a fraction of its route', () => {
    const findings = findingsFor(`  cards:
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
      link: ONE E1 -> TWO W1
      labelAt: 0.5`)

    expect(findings).toEqual([])
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

/**
 * A promise is proved against a document that keeps it and the same document with one edit that breaks it.
 *
 * The edit is deliberately a single removed Flow rather than four separate fixtures, because that is how a promise
 * actually breaks: nobody sets out to violate a declaration, they delete one line and take four readings with it. A
 * suite that broke each rule in its own hand-built document would never show that.
 */
const defaultFlows = `  flows:
    - id: F1
      link: IN E1 -> ONE W1
    - id: F2
      link: ONE E1 -> TWO W1
    - id: F3
      link: TWO E1 -> OUT W1`

const pipeline = (promises: string, flows = defaultFlows) => `id: promise-probe
title: Promise probe
diagram:
  bounds: 0 0 900 300
  gridSize: 10
  points:
    - id: IN
      label: In
      at: 40 150
      ports: 1
    - id: OUT
      label: Out
      at: 860 150
      ports: 1
  cards:
    - id: ONE
      label: One
      bounds: 200 100 160 100
      ports: 1
    - id: TWO
      label: Two
      bounds: 540 100 160 100
      ports: 1
${flows}
scopes:
  - id: EDGE
    label: Edge
    description: Where the document meets the world
    elements:
      - IN
      - OUT
${promises}`

/** One promise of every kind, so each rule is exercised by a document a person could plausibly have written. */
const everyKind = `promises:
  - id: PROMISE-ORIGIN
    kind: origin
    label: Every reading begins at the edge
    allowed:
      - EDGE
  - id: PROMISE-TERMINUS
    kind: terminus
    label: Every reading ends at the edge
    allowed:
      - EDGE
  - id: PROMISE-RELATIONSHIP
    kind: relationship
    label: One speaks to Two directly
    from:
      - ONE
    to:
      - TWO
  - id: PROMISE-PATH
    kind: path
    label: The document stays traceable end to end
    from:
      - IN
    to:
      - OUT
`

const modelOf = (source: string) => {
  const parsed = parseInfoschematic(source, { pathname: 'promise-probe.yaml' })
  if (!parsed.ok)
    throw new Error(['The fixture is not a valid document:', ...parsed.issues.map(formatInfoschematicIssue)].join('\n'))
  return parsed.model
}

const promiseFindingsFor = (source: string) => reviewInfoschematicPromises(modelOf(source))
const named = (source: string) =>
  promiseFindingsFor(source).map((finding) => [finding.rule, ...finding.concerns].join(' '))

describe('reviewInfoschematicPromises', () => {
  it('reports nothing about a document that keeps every promise it makes', () => {
    expect(promiseFindingsFor(pipeline(everyKind))).toEqual([])
    expect(promisesAreBroken(promiseFindingsFor(pipeline(everyKind)))).toBe(false)
  })

  it('leaves a document that declares nothing exactly as valid as it was', () => {
    const silent = pipeline('')
    expect(modelOf(silent).promises).toEqual([])
    expect(promiseFindingsFor(silent)).toEqual([])
    expect(promisesAreBroken(promiseFindingsFor(silent))).toBe(false)
    expect(reviewInfoschematicDrawing(modelOf(silent))).toEqual(
      reviewInfoschematicDrawing(modelOf(pipeline(everyKind)))
    )
  })

  it('names the promise that broke when one Flow is removed', () => {
    const severed = pipeline(
      everyKind,
      `  flows:
    - id: F1
      link: IN E1 -> ONE W1
    - id: F3
      link: TWO E1 -> OUT W1`
    )
    expect(named(severed)).toEqual([
      'promise-origin-not-allowed PROMISE-ORIGIN TWO',
      'promise-path-broken PROMISE-PATH IN OUT',
      'promise-relationship-missing PROMISE-RELATIONSHIP ONE TWO',
      'promise-terminus-not-allowed PROMISE-TERMINUS ONE'
    ])
    expect(promiseFindingsFor(severed).map((finding) => finding.measured)).toEqual([
      { allowed: 2, leaving: 1 },
      { ends: 1, reached: 2, starts: 1 },
      { ends: 1, reversed: 0, starts: 1 },
      { allowed: 2, arriving: 1 }
    ])
    expect(promiseFindingsFor(severed).every((finding) => finding.severity === 'error')).toBe(true)
    expect(promisesAreBroken(promiseFindingsFor(severed))).toBe(true)
    expect(named(severed)).toEqual(named(severed))
  })

  it('counts a required relationship drawn the other way rather than calling it absent', () => {
    const reversed = pipeline(
      everyKind,
      `  flows:
    - id: F1
      link: IN E1 -> ONE W1
    - id: F2
      link: TWO W1 -> ONE E1
    - id: F3
      link: TWO E1 -> OUT W1`
    )
    const finding = promiseFindingsFor(reversed).find((entry) => entry.rule === 'promise-relationship-missing')
    expect(finding?.measured).toEqual({ ends: 1, reversed: 1, starts: 1 })
    expect(finding?.reads).toContain('runs the other way')
    expect(finding?.repairs).toContain('Turn a Flow already drawn between them the way PROMISE-RELATIONSHIP reads.')
  })

  it('reads a bidirectional Flow in both directions when tracing a path', () => {
    const both = pipeline(
      `promises:
  - id: PROMISE-BACK
    kind: path
    label: The archive can be traced back to the source
    from:
      - OUT
    to:
      - IN
`,
      `  flows:
    - id: F1
      link: IN E1 <-> ONE W1
    - id: F2
      link: ONE E1 <-> TWO W1
    - id: F3
      link: TWO E1 <-> OUT W1`
    )
    expect(promiseFindingsFor(both)).toEqual([])
  })

  it('treats an artefact no Flow touches as neither an origin nor a terminus', () => {
    const aside = `id: promise-probe
title: Promise probe
diagram:
  bounds: 0 0 900 300
  gridSize: 10
  points:
    - id: IN
      label: In
      at: 40 150
      ports: 1
    - id: OUT
      label: Out
      at: 860 150
      ports: 1
  cards:
    - id: LEGEND
      label: Legend
      bounds: 200 20 160 60
  flows:
    - id: F1
      link: IN E1 -> OUT W1
promises:
  - id: PROMISE-ORIGIN
    kind: origin
    label: Readings begin at the inlet
    allowed:
      - IN
  - id: PROMISE-TERMINUS
    kind: terminus
    label: Readings end at the outlet
    allowed:
      - OUT
`
    expect(promiseFindingsFor(aside)).toEqual([])
  })

  it('terminates on a document that describes a cycle', () => {
    const circular = pipeline(
      `promises:
  - id: PROMISE-PATH
    kind: path
    label: The loop reaches the outlet
    from:
      - ONE
    to:
      - OUT
`,
      `  flows:
    - id: F1
      link: ONE E1 -> TWO W1
    - id: F2
      link: TWO S1 -> ONE N1
    - id: F3
      link: TWO E1 -> OUT W1`
    )
    expect(promiseFindingsFor(circular)).toEqual([])
  })

  it('resolves a promise written over a Scope to the artefacts the Scope covers', () => {
    const scoped = pipeline(
      `promises:
  - id: PROMISE-EDGE
    kind: path
    label: The edge reaches itself through the middle
    from:
      - EDGE
    to:
      - TWO
`
    )
    expect(promiseFindingsFor(scoped)).toEqual([])
  })
})
