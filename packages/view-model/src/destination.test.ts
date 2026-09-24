import { defineInfoschematic } from '@infoschematics/domain-core'
import { describe, expect, it } from 'vitest'
import {
  arrivalAnnouncement,
  artefactDestination,
  type DestinationDocument,
  resolveDestination,
  scopeDestination
} from './destination.ts'
import { createInfoschematicRuntime } from './runtime.ts'

const runtime = createInfoschematicRuntime(
  defineInfoschematic({
    title: 'Addressed document',
    infoschematic: {
      scopes: [
        { color: '#6699cc', description: 'Inside', fill: '#112233', id: 'inside', label: 'Inside', prefix: 'IN' },
        { color: '#cc9966', description: 'Edge', fill: '#332211', id: 'edge', label: 'Edge', prefix: 'ED' }
      ],
      flowFamilies: [{ color: '#79c9ff', description: 'A request', id: 'request', label: 'Request', prefix: 'REQ' }],
      regions: [{ box: { height: 300, width: 300, x: 20, y: 20 }, id: 'REG-01', label: 'Inputs' }],
      cards: [
        {
          code: 'IN-01',
          detail: 'The source',
          id: 'source',
          label: 'Source',
          placement: { box: { height: 80, width: 160, x: 100, y: 100 }, ports: { east: 1 } },
          scope: 'inside',
          scopes: ['inside']
        },
        {
          code: 'ED-01',
          detail: 'The target',
          id: 'target',
          label: 'Target',
          placement: { box: { height: 80, width: 160, x: 500, y: 100 }, ports: { west: 1 } },
          scope: 'edge',
          scopes: ['edge']
        }
      ],
      flows: [
        {
          code: 'REQ-01',
          family: 'request',
          id: 'request-flow',
          points: [
            { x: 260, y: 140 },
            { x: 500, y: 140 }
          ],
          source: 'source',
          sourcePort: 'E1',
          target: 'target',
          targetPort: 'W1'
        }
      ],
      points: [{ code: 'PT-01', id: 'PT-01', label: 'Edge point', point: { x: 700, y: 300 }, scopes: ['edge'] }],
      viewBox: { height: 500, width: 900, x: 0, y: 0 }
    }
  })
)

describe('resolving a destination over an artefact code', () => {
  it('centres on the Card the code names and selects exactly it', () => {
    const resolution = resolveDestination(runtime, artefactDestination('ED-01'))

    expect(resolution.outcome).toBe('resolved')
    if (resolution.outcome !== 'resolved') return

    expect(resolution.extent).toEqual({ height: 80, width: 160, x: 500, y: 100 })
    expect(resolution.centre).toEqual({ x: 580, y: 140 })
    expect(resolution.label).toBe('Target')
    expect(resolution.selection).toEqual([{ code: 'ED-01', geometry: 'box', id: 'ED-01', kind: 'card' }])
  })

  it('reaches a Region by its id, a Flow by its code, and a Point by its own coordinate', () => {
    const region = resolveDestination(runtime, artefactDestination('REG-01'))
    expect(region.outcome === 'resolved' && region.selection[0]).toEqual({
      code: null,
      geometry: 'box',
      id: 'REG-01',
      kind: 'region'
    })

    const flow = resolveDestination(runtime, artefactDestination('REQ-01'))
    expect(flow.outcome === 'resolved' && flow.extent).toEqual({ height: 0, width: 240, x: 260, y: 140 })
    expect(flow.outcome === 'resolved' && flow.selection[0]?.geometry).toBe('route')

    /* A Point is a coordinate rather than an extent, so its box has no size: how far around a Point is worth
       showing is a question about a surface, and this function does not have one. */
    const point = resolveDestination(runtime, artefactDestination('PT-01'))
    expect(point.outcome === 'resolved' && point.extent).toEqual({ height: 0, width: 0, x: 700, y: 300 })
    expect(point.outcome === 'resolved' && point.centre).toEqual({ x: 700, y: 300 })
  })

  it('answers from the document alone, so the same address resolves identically every time', () => {
    const first = resolveDestination(runtime, artefactDestination('IN-01'))
    const second = resolveDestination(runtime, artefactDestination('IN-01'))
    expect(first).toEqual(second)
  })
})

describe('resolving a destination over a Scope id', () => {
  it('unions the members it names and selects them in authored order', () => {
    /* `edge` carries the target Card and the Point, so the extent has to cover both: a Scope destination that
       resolved to its first member only would look right for every single-element Scope and wrong for the rest. */
    const resolution = resolveDestination(runtime, scopeDestination('edge'))

    expect(resolution.outcome).toBe('resolved')
    if (resolution.outcome !== 'resolved') return

    expect(runtime.infoschematicScopes.find((scope) => scope.id === 'edge')?.elements).toEqual(['ED-01', 'PT-01'])
    expect(resolution.extent).toEqual({ height: 200, width: 200, x: 500, y: 100 })
    expect(resolution.label).toBe('Edge')
    expect(resolution.selection.map((artefact) => artefact.id)).toEqual(['ED-01', 'PT-01'])
    /* The anchor is the element the author put first, per `ADR-INFOSCHEMATICS-025`. */
    expect(resolution.selection[0]?.kind).toBe('card')
  })
})

describe('what an assistive reader is told', () => {
  it('names what was arrived at, counts a group, and says the document did not change', () => {
    const card = resolveDestination(runtime, artefactDestination('ED-01'))
    expect(card.outcome === 'resolved' && arrivalAnnouncement(card)).toBe(
      'Moved to Target, now selected. The document has not changed.'
    )

    const scope = resolveDestination(runtime, scopeDestination('edge'))
    expect(scope.outcome === 'resolved' && arrivalAnnouncement(scope)).toBe(
      'Moved to Edge, 2 elements now selected. The document has not changed.'
    )
  })
})

describe('an address that leads nowhere', () => {
  it('refuses rather than throwing, and says which kind of name failed', () => {
    const artefact = resolveDestination(runtime, artefactDestination('CARD-99'))
    expect(artefact).toEqual({
      destination: { code: 'CARD-99', kind: 'artefact' },
      message: 'No artefact in this Infoschematic is coded CARD-99.',
      outcome: 'refused',
      reason: 'unknown-artefact'
    })

    const scope = resolveDestination(runtime, scopeDestination('nowhere'))
    expect(scope.outcome === 'refused' && scope.reason).toBe('unknown-scope')
  })

  it('refuses a Scope whose members have all gone, and an artefact that was never placed', () => {
    /* Both cases are built as document shapes rather than authored, because a valid document cannot express
       either: they are what a document becomes after an edit, which is exactly when an old link breaks. */
    const emptied: DestinationDocument = {
      ...runtime,
      infoschematicScopes: [
        { color: '#000000', elements: ['GONE-01'], fill: '#ffffff', id: 'hollow', label: 'Hollow', prefix: 'GONE' }
      ]
    }
    const scope = resolveDestination(emptied, scopeDestination('hollow'))
    expect(scope.outcome === 'refused' && scope.reason).toBe('empty-scope')
    expect(scope.outcome === 'refused' && scope.message).toBe('Scope hollow names no artefact that is placed in it.')

    const unrouted: DestinationDocument = {
      ...runtime,
      infoschematicFlows: [{ ...runtime.infoschematicFlows[0], points: [] }]
    }
    const flow = resolveDestination(unrouted, artefactDestination('REQ-01'))
    expect(flow.outcome === 'refused' && flow.reason).toBe('unplaced-artefact')
  })

  it('never throws for any address, including an empty one', () => {
    for (const address of ['', ' ', 'IN-01 ', 'in-01', 'REG-01']) {
      expect(() => resolveDestination(runtime, artefactDestination(address))).not.toThrow()
      expect(() => resolveDestination(runtime, scopeDestination(address))).not.toThrow()
    }
    /* Codes are compared exactly: a near miss is a refusal rather than a guess, because arriving somewhere the
       author did not name is worse than not arriving. */
    expect(resolveDestination(runtime, artefactDestination('in-01')).outcome).toBe('refused')
  })
})
