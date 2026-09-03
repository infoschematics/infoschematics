import { describe, expect, it } from 'vitest'
import {
  createDefaultArtefact,
  createDefaultGraphic,
  createDefaultLane,
  createDefaultZone,
  createFactoryIdentityAllocator,
  type ArtefactFactoryContext,
} from './artefact-factories.ts'

const context = (overrides: Partial<ArtefactFactoryContext> = {}): ArtefactFactoryContext => ({
  allocate: createFactoryIdentityAllocator(),
  at: 1,
  box: { height: 160, width: 300, x: 40, y: 80 },
  lane: { height: 160, id: 'lane-owner', y: 80 },
  ...overrides,
})

describe('default artefact factories', () => {
  it('allocates collision-safe identities independently per kind', () => {
    const allocate = createFactoryIdentityAllocator(['lane-1', 'graphic-1'])

    expect(allocate('lane')).toEqual({ code: null, id: 'lane-2' })
    expect(allocate('zone')).toEqual({ code: null, id: 'zone-1' })
    expect(allocate('graphic')).toEqual({ code: null, id: 'graphic-2' })
  })

  it('creates a valid Lane with contextual placement and no provenance', () => {
    const operation = createDefaultLane(context())

    expect(operation).toMatchObject({
      at: 1,
      operation: 'create',
      target: { code: null, geometry: 'lane', kind: 'lane' },
      value: {
        height: 160,
        panel: { height: 160, radius: 12, width: 300, x: 40, y: 80 },
        y: 80,
        zones: [],
      },
    })
    expect(operation?.value).not.toHaveProperty('template')
    expect(operation?.value).not.toHaveProperty('provenance')
  })

  it('requires a Lane owner and creates a Zone inside that owner', () => {
    expect(createDefaultZone(context({ lane: undefined }))).toBeUndefined()

    const operation = createDefaultZone(context())
    expect(operation).toMatchObject({
      operation: 'create',
      target: { geometry: 'zone', kind: 'zone', laneId: 'lane-owner' },
      value: { fill: '#1f2937', width: 300, x: 40 },
    })
  })

  it('creates a placed Graphic with serialisable defaults', () => {
    const operation = createDefaultGraphic(context())

    expect(operation).toMatchObject({
      operation: 'create',
      target: { geometry: 'box', kind: 'graphic' },
      value: {
        placement: { height: 160, width: 300, x: 40, y: 80 },
        properties: {},
        renderer: 'note',
      },
    })
    expect(JSON.parse(JSON.stringify(operation))).toEqual(operation)
  })

  it('returns one committed View Model create operation for each supported kind', () => {
    for (const kind of ['lane', 'zone', 'graphic'] as const) {
      const operation = createDefaultArtefact(kind, context())
      expect(operation?.operation).toBe('create')
      expect(operation?.target.kind).toBe(kind)
      expect(Array.isArray(operation)).toBe(false)
      expect(Object.isFrozen(operation)).toBe(true)
    }
  })

  it('rejects invalid placement without consuming an identity', () => {
    let allocations = 0
    const invalid = context({
      allocate: (kind) => {
        allocations += 1
        return { code: null, id: `${kind}-1` }
      },
      box: { height: 0, width: 300, x: 40, y: 80 },
    })

    expect(createDefaultGraphic(invalid)).toBeUndefined()
    expect(allocations).toBe(0)
  })
})
