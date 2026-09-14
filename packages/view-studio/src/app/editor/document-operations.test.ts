import {
  defineInfoschematic,
  infoschematicModelOf,
  parseInfoschematicDocument,
  serialiseInfoschematicYaml
} from '@infoschematics/domain-core'
import type { InfoschematicConfig } from '@infoschematics/domain-model'
import type { ArtefactDraftOperation } from '@infoschematics/view-model/artefact-draft'
import {
  type ArtefactSelection,
  type ArtefactValueByKind,
  createArtefactOperation,
  defineArtefactSelection
} from '@infoschematics/view-model/editable'
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
  fabric: defineArtefactSelection({ code: 'FABRIC-01', geometry: 'box', id: 'fabric-one', kind: 'fabric' }),
  flow: defineArtefactSelection({ code: 'FLOW-01', geometry: 'route', id: 'flow-one', kind: 'flow' }),
  graphic: defineArtefactSelection({ code: null, geometry: 'box', id: 'graphic-one', kind: 'graphic' }),
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

  it('rejects stale Studio operations instead of emitting an invalid edit', () => {
    const missing: ArtefactSelection = { code: 'MISSING', geometry: 'box', id: 'missing', kind: 'card' }
    const projection = projectStudioDocumentOperations(documentFor(), config, [
      { operation: 'remove', target: missing }
    ])
    expect(projection).toEqual({ ok: false, reason: 'missing-target' })
  })
})
