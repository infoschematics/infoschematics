import {
  defineInfoschematic,
  infoschematicDocumentModel,
  infoschematicModelOf,
  parseInfoschematicDocument,
  serialiseInfoschematicYaml
} from '@infoschematics/domain-core'
import type { InfoschematicConfig, Sequence } from '@infoschematics/domain-model'
import type { ArtefactDraftOperation } from '@infoschematics/view-model/artefact-draft'
import {
  type ArtefactSelection,
  type ArtefactValueByKind,
  createArtefactOperation,
  defineArtefactSelection
} from '@infoschematics/view-model/editable'
import { createInfoschematicRuntime } from '@infoschematics/view-model/runtime'
import { describe, expect, it } from 'vitest'
import { replaceArtefactPropertiesOperation } from './artefact-operations.ts'
import {
  applyStudioDocumentOperations,
  isStudioDocumentAcknowledgement,
  projectStudioDocumentOperations
} from './document-operations.ts'

const config = defineInfoschematic({
  title: 'Document operations',
  infoschematic: {
    cards: [
      {
        code: 'CARD-01',
        detail: 'Card one',
        id: 'card-one',
        label: 'Card one',
        placement: { box: { height: 40, width: 80, x: 10, y: 10 } },
        scope: 'scope',
        scopes: ['scope']
      },
      {
        code: 'CARD-02',
        detail: 'Card two',
        id: 'card-two',
        label: 'Card two',
        placement: { box: { height: 40, width: 80, x: 160, y: 10 } },
        scope: 'scope',
        scopes: ['scope']
      }
    ],
    fabrics: [
      {
        code: 'FABRIC-01',
        detail: 'Fabric',
        id: 'fabric-one',
        label: 'Fabric',
        placement: { box: { height: 50, width: 100, x: 80, y: 100 } },
        scope: 'scope',
        scopes: ['scope']
      }
    ],
    flowFamilies: [{ color: '#123456', description: 'Family', id: 'family', label: 'Family', prefix: 'FLOW' }],
    flows: [
      {
        code: 'FLOW-01',
        family: 'family',
        id: 'flow-one',
        points: [
          { x: 90, y: 30 },
          { x: 125, y: 30 },
          { x: 160, y: 30 }
        ],
        source: 'card-one',
        sourcePort: 'E1',
        target: 'card-two',
        targetPort: 'W1'
      },
      {
        code: 'FLOW-02',
        family: 'family',
        id: 'flow-two',
        points: [
          { x: 280, y: 150 },
          { x: 200, y: 150 },
          { x: 200, y: 50 }
        ],
        source: 'point-one',
        sourcePort: 'N1',
        target: 'card-two',
        targetPort: 'S1'
      }
    ],
    graphics: [
      {
        id: 'graphic-one',
        placement: { height: 20, width: 30, x: 20, y: 70 },
        properties: { opacity: 0.5 },
        renderer: 'graphic-special',
        scopes: ['scope']
      }
    ],
    points: [
      {
        code: 'POINT-01',
        id: 'point-one',
        label: 'Point one',
        point: { x: 280, y: 150 },
        ports: { north: 1 },
        scopes: ['scope']
      }
    ],
    regions: [
      {
        box: { height: 180, radius: 4, width: 300, x: 0, y: 0 },
        fill: '#ffffff',
        frame: { style: 'solid' },
        id: 'region-one',
        label: 'Region'
      }
    ],
    scopes: [
      {
        color: '#123456',
        description: 'Scope',
        fill: '#eeeeee',
        id: 'scope',
        label: 'Scope',
        prefix: 'SCOPE'
      }
    ],
    viewBox: { height: 200, width: 320, x: 0, y: 0 }
  }
})

const selections = {
  card: defineArtefactSelection({ code: 'CARD-01', geometry: 'box', id: 'card-one', kind: 'card' }),
  cardTwo: defineArtefactSelection({ code: 'CARD-02', geometry: 'box', id: 'card-two', kind: 'card' }),
  fabric: defineArtefactSelection({ code: 'FABRIC-01', geometry: 'box', id: 'fabric-one', kind: 'fabric' }),
  flow: defineArtefactSelection({ code: 'FLOW-01', geometry: 'route', id: 'flow-one', kind: 'flow' }),
  graphic: defineArtefactSelection({ code: null, geometry: 'box', id: 'graphic-one', kind: 'graphic' }),
  point: defineArtefactSelection({ code: 'POINT-01', geometry: 'point', id: 'point-one', kind: 'point' }),
  region: defineArtefactSelection({ code: null, geometry: 'box', id: 'region-one', kind: 'region' })
} as const

const documentFor = (value: InfoschematicConfig = config) => {
  const parsed = parseInfoschematicDocument(serialiseInfoschematicYaml(infoschematicModelOf(value)))
  if (!parsed.ok) throw new Error('fixture should parse')
  return parsed.document
}

const replacement = <K extends keyof typeof selections>(
  kind: K,
  patch: Parameters<typeof replaceArtefactPropertiesOperation>[3]
) => {
  const operation = replaceArtefactPropertiesOperation(config, [], selections[kind], patch)
  if (!operation) throw new Error(`fixture ${kind} replacement should be valid`)
  return operation
}

describe('Studio document operations', () => {
  it('projects property operations for every current artefact kind', () => {
    const operations: readonly ArtefactDraftOperation[] = [
      replacement('region', { kind: 'region', value: { fill: '#eeeeee' } }),
      replacement('fabric', { kind: 'fabric', value: { detail: 'Changed fabric' } }),
      replacement('card', { kind: 'card', value: { detail: 'Changed card' } }),
      replacement('flow', { kind: 'flow', value: { dashed: true } }),
      replacement('graphic', { kind: 'graphic', value: { properties: { opacity: 1 } } })
    ]
    const result = applyStudioDocumentOperations(documentFor(), config, operations)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.model.diagram.regions[0]?.appearance?.fill).toBe('#eeeeee')
    expect(result.model.diagram.fabrics[0]?.description).toBe('Changed fabric')
    expect(result.model.diagram.cards[0]?.description).toBe('Changed card')
    expect(result.model.diagram.flows[0]?.appearance?.line).toBe('dashed')
    expect(result.model.diagram.overlays[0]?.properties?.opacity).toBe(1)
    expect(result.changedElements).toEqual(['CARD-01', 'FABRIC-01', 'FLOW-01', 'graphic-one', 'region-one'])
  })

  it('converts transient create and reorder indices to stable anchors', () => {
    const value = {
      code: 'CARD-03',
      detail: 'Card three',
      id: 'card-three',
      label: 'Card three',
      placement: { box: { height: 40, width: 80, x: 260, y: 10 } },
      scope: 'scope',
      scopes: ['scope']
    } satisfies ArtefactValueByKind['card']
    const target = defineArtefactSelection({ code: 'CARD-03', geometry: 'box', id: 'card-three', kind: 'card' })
    const created = createArtefactOperation(target, value, 1)
    if (!created) throw new Error('fixture creation should be valid')

    const projection = projectStudioDocumentOperations(documentFor(), config, [created])
    expect(projection.ok).toBe(true)
    if (!projection.ok) return
    expect(projection.edit.operations[0]).toMatchObject({ before: 'CARD-02', op: 'add' })
    expect(JSON.stringify(projection.edit)).not.toMatch(/"at"|"from"|"to"/)
    const applied = applyStudioDocumentOperations(documentFor(), config, [created])
    expect(applied.ok).toBe(true)
    if (applied.ok) {
      expect(applied.model.diagram.cards.map((card) => card.id)).toEqual(['CARD-01', 'CARD-03', 'CARD-02'])
      expect(applied.model.scopes[0]?.elements).toContain('CARD-03')
    }

    const reordered: ArtefactDraftOperation = {
      from: 0,
      operation: 'reorder',
      target: selections.card,
      to: 1
    }
    const reorderProjection = projectStudioDocumentOperations(documentFor(), config, [reordered])
    expect(reorderProjection.ok).toBe(true)
    if (reorderProjection.ok)
      expect(reorderProjection.edit.operations[0]).toMatchObject({ after: 'CARD-02', op: 'move' })
  })

  it('projects geometry and removals with collateral scope membership', () => {
    const moved: ArtefactDraftOperation = {
      geometry: { box: { height: 40, width: 80, x: 40, y: 30 }, role: 'box' },
      operation: 'move',
      target: selections.card
    }
    const movedResult = applyStudioDocumentOperations(documentFor(), config, [moved])
    expect(movedResult.ok).toBe(true)
    if (movedResult.ok) expect(movedResult.model.diagram.cards[0]?.bounds).toMatchObject({ x: 40, y: 30 })

    const resized: ArtefactDraftOperation = {
      geometry: { box: { height: 90, width: 180, x: 80, y: 100 }, role: 'box' },
      operation: 'resize',
      target: selections.fabric
    }
    const resizedResult = applyStudioDocumentOperations(documentFor(), config, [resized])
    expect(resizedResult.ok).toBe(true)
    if (resizedResult.ok) {
      expect(resizedResult.model.diagram.fabrics[0]?.bounds).toMatchObject({ height: 90, width: 180 })
    }

    const removed: ArtefactDraftOperation = { operation: 'remove', target: selections.graphic }
    const removedResult = applyStudioDocumentOperations(documentFor(), config, [removed])
    expect(removedResult.ok).toBe(true)
    if (!removedResult.ok) return
    expect(removedResult.model.diagram.overlays).toEqual([])
    expect(removedResult.model.scopes[0]?.elements).not.toContain('graphic-one')
  })

  it('names the authored Point entry for a move and carries its Flows on a removal', () => {
    const moved: ArtefactDraftOperation = {
      geometry: { at: { x: 300, y: 160 }, role: 'point' },
      operation: 'move',
      target: selections.point
    }
    const projection = projectStudioDocumentOperations(documentFor(), config, [moved])
    expect(projection.ok).toBe(true)
    if (!projection.ok) return
    /*
     * The authored `points:` entry carries the compact pair the document was written with, and the Flow anchored on
     * the Point is written too. A route with a waypoint cannot reproject from the coordinate the way a port-only
     * route does: leaving its waypoint where it was puts a diagonal run in the document - `COMPOSE-002` - so the
     * repair the draft already made has to reach `flows:` as well.
     */
    expect(projection.edit.operations).toEqual([
      {
        op: 'replace',
        path: [{ field: 'diagram' }, { field: 'points' }, { id: 'POINT-01' }, { field: 'at' }],
        value: '300 160'
      },
      {
        op: 'replace',
        path: [{ field: 'diagram' }, { field: 'flows' }, { id: 'FLOW-02' }, { field: 'waypoints' }],
        value: '200,160'
      }
    ])

    const movedResult = applyStudioDocumentOperations(documentFor(), config, [moved])
    expect(movedResult.ok).toBe(true)
    if (!movedResult.ok) return
    expect(movedResult.model.diagram.points[0]?.at).toEqual({ x: 300, y: 160 })
    // The Flow is listed because the move genuinely rewrote its route, not only the Point's coordinate.
    expect(movedResult.changedElements).toEqual(['FLOW-02', 'POINT-01'])
    // The authored form survives: a coordinate goes back as the compact pair a Producer wrote, not as a mapping.
    expect(movedResult.source).toContain('at: 300 160')

    const removed: ArtefactDraftOperation = { operation: 'remove', target: selections.point }
    const removedResult = applyStudioDocumentOperations(documentFor(), config, [removed])
    expect(removedResult.ok).toBe(true)
    if (!removedResult.ok) return
    expect(removedResult.model.diagram.points).toEqual([])
    expect(removedResult.model.diagram.flows.map((flow) => flow.id)).toEqual(['FLOW-01'])
    expect(removedResult.model.scopes[0]?.elements).not.toContain('POINT-01')
  })

  it('edits compact Flow fields without discarding comments inside the Flow', () => {
    const source = serialiseInfoschematicYaml(infoschematicModelOf(config))
      .replace(/(link: [^\n]+)/, '$1 # retained link comment')
      .replace(/(waypoints: [^\n]+)/, '$1 # retained waypoint comment')
    const parsed = parseInfoschematicDocument(source)
    if (!parsed.ok) throw new Error('fixture should parse')
    const operation = replacement('flow', {
      kind: 'flow',
      value: {
        points: [
          { x: 90, y: 30 },
          { x: 120, y: 60 },
          { x: 80, y: 125 }
        ],
        target: 'fabric-one',
        targetPort: 'W1'
      }
    })

    const projection = projectStudioDocumentOperations(parsed.document, config, [operation])
    expect(projection.ok).toBe(true)
    if (!projection.ok) return
    expect(projection.edit.operations.map((edit) => edit.path.at(-1))).toEqual([
      { field: 'link' },
      { field: 'waypoints' }
    ])

    const result = applyStudioDocumentOperations(parsed.document, config, [operation])
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.source).toContain('link: CARD-01 E1 -> FABRIC-01 W1 # retained link comment')
    expect(result.source).toContain('waypoints: 120,60 # retained waypoint comment')
  })

  it('carries the routes a move repaired into the document, not only the member it named', () => {
    /*
     * `COMPOSE-002`: a Card carries the ends of every Flow attached to it, and the draft repairs those routes as it
     * moves. Projecting only the named member wrote the Card's new box beside the route's old waypoints, so the
     * document the edit emitted held a diagonal run and `ROUTE-001` threw out of runtime construction - inside the
     * host's own `useMemo`, taking the page with it. `FLOW-02` arrives at `CARD-02`'s south port through a waypoint,
     * which is the shape the port-only construction never sees.
     */
    const moved: ArtefactDraftOperation = {
      geometry: { box: { height: 40, width: 80, x: 220, y: 10 }, role: 'box' },
      operation: 'move',
      target: selections.cardTwo
    }

    const projection = projectStudioDocumentOperations(documentFor(), config, [moved])
    expect(projection.ok).toBe(true)
    if (!projection.ok) return
    /*
     * `FLOW-01` is absent deliberately. It is authored by its ports alone, so the runtime derives it through
     * `routeBetweenPorts` on every build and already follows the port that moved; writing the bend the draft
     * derived would freeze a derived route into the document as though it had been drawn by hand.
     */
    expect(projection.edit.operations.map((edit) => edit.path.slice(1))).toEqual([
      [{ field: 'cards' }, { id: 'CARD-02' }, { field: 'bounds' }],
      [{ field: 'flows' }, { id: 'FLOW-02' }, { field: 'waypoints' }]
    ])

    const changed = applyStudioDocumentOperations(documentFor(), config, [moved])
    expect(changed.ok).toBe(true)
    if (!changed.ok) return

    const accepted = parseInfoschematicDocument(changed.source)
    if (!accepted.ok) throw new Error('emitted source should parse')
    const runtime = createInfoschematicRuntime(infoschematicDocumentModel(accepted.document))
    const route = runtime.infoschematicFlows.find((flow) => flow.code === 'FLOW-02')
    expect(route?.d).toMatch(/^M-?\d+ -?\d+( [HV]-?\d+)+$/)
    // The waypoint moved with the port rather than being left behind at the Card's old edge.
    expect(route?.points).toEqual([
      { x: 280, y: 150 },
      { x: 260, y: 150 },
      { x: 260, y: 50 }
    ])
  })

  it('treats the exact emitted document as host acknowledgement', () => {
    const moved: ArtefactDraftOperation = {
      geometry: { box: { height: 40, width: 80, x: 40, y: 30 }, role: 'box' },
      operation: 'move',
      target: selections.card
    }
    const original = documentFor()
    const changed = applyStudioDocumentOperations(original, config, [moved])
    expect(changed.ok).toBe(true)
    if (!changed.ok) return
    const accepted = parseInfoschematicDocument(changed.source)
    if (!accepted.ok) throw new Error('emitted source should parse')

    expect(isStudioDocumentAcknowledgement(original, changed.source)).toBe(false)
    expect(isStudioDocumentAcknowledgement(accepted.document, changed.source)).toBe(true)
  })

  it('projects canonical Sequence edits by stable ids without replacing the presentation tree', () => {
    const originalModel = infoschematicModelOf(config)
    const originalSequence: Sequence = {
      description: 'Presentation description',
      id: 'SEQUENCE',
      label: 'Sequence',
      presentation: { callouts: true, display: 'expanded', timed: false },
      scenes: [
        {
          callout: { body: 'Retained narration' },
          focus: { elements: ['CARD-01'] },
          id: 'SCENE-01',
          label: 'First scene'
        }
      ]
    }
    const source = serialiseInfoschematicYaml({ ...originalModel, sequences: [originalSequence] })
      .replace(
        'description: Presentation description',
        'description: Presentation description # retained sequence comment'
      )
      .replace('body: Retained narration', 'body: Retained narration # retained callout comment')
    const parsed = parseInfoschematicDocument(source)
    if (!parsed.ok) throw new Error('Sequence fixture should parse')
    const changedSequence: Sequence = {
      ...originalSequence,
      label: 'Edited Sequence',
      scenes: [
        { id: 'SCENE-02', label: 'Inserted scene' },
        ...originalSequence.scenes.map((scene) => ({
          ...scene,
          focus: { elements: ['CARD-01', 'FLOW-01'] },
          label: 'Edited scene'
        }))
      ]
    }

    const projection = projectStudioDocumentOperations(parsed.document, config, [], [changedSequence])
    expect(projection.ok).toBe(true)
    if (!projection.ok) return
    const result = applyStudioDocumentOperations(parsed.document, config, [], [changedSequence])
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.model.sequences[0]?.label).toBe('Edited Sequence')
    expect(result.model.sequences[0]?.scenes.map(({ id }) => id)).toEqual(['SCENE-02', 'SCENE-01'])
    expect(result.model.sequences[0]?.scenes[1]?.focus?.elements).toEqual(['CARD-01', 'FLOW-01'])
    expect(result.source).toContain('description: Presentation description # retained sequence comment')
    expect(result.source).toContain('body: Retained narration # retained callout comment')
    expect(
      projection.edit.operations.every((operation) => {
        const first = operation.path[0]
        return first && 'field' in first && first.field === 'sequences'
      })
    ).toBe(true)

    const stable = applyStudioDocumentOperations(result.document, config, [], [changedSequence])
    expect(stable.ok).toBe(true)
    if (stable.ok) expect(stable.source).toBe(result.source)
  })

  it('rejects stale Studio operations instead of emitting an invalid edit', () => {
    const missing: ArtefactSelection = { code: 'MISSING', geometry: 'box', id: 'missing', kind: 'card' }
    const projection = projectStudioDocumentOperations(documentFor(), config, [
      { operation: 'remove', target: missing }
    ])
    expect(projection).toEqual({ ok: false, reason: 'missing-target' })
  })
})
