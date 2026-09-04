import { describe, expect, it } from 'vitest'
import {
  type ArtefactFactoryContext,
  createDefaultArtefact,
  createDefaultGraphic,
  createDefaultRegion,
  createFactoryIdentityAllocator
} from './artefact-factories.ts'

const context = (overrides: Partial<ArtefactFactoryContext> = {}): ArtefactFactoryContext => ({
  allocate: createFactoryIdentityAllocator(),
  at: 1,
  box: { height: 160, width: 300, x: 40, y: 80 },
  ...overrides
})

describe('default artefact factories', () => {
  it('allocates collision-safe identities independently per kind', () => {
    const allocate = createFactoryIdentityAllocator(['region-1', 'graphic-1'])

    expect(allocate('region')).toEqual({ code: null, id: 'region-2' })
    expect(allocate('graphic')).toEqual({ code: null, id: 'graphic-2' })
    expect(allocate('region')).toEqual({ code: null, id: 'region-3' })
  })

  it('creates a valid Region with contextual placement and no provenance', () => {
    const operation = createDefaultRegion(context())

    expect(operation).toMatchObject({
      at: 1,
      operation: 'create',
      target: { code: null, geometry: 'box', kind: 'region' },
      value: {
        box: { height: 160, radius: 12, width: 300, x: 40, y: 80 },
        frame: { style: 'solid' },
        label: 'New region'
      }
    })
    expect(operation?.value).not.toHaveProperty('template')
    expect(operation?.value).not.toHaveProperty('provenance')
    expect(JSON.parse(JSON.stringify(operation))).toEqual(operation)
  })

  it('returns one committed View Model create operation for each supported kind', () => {
    for (const kind of ['region', 'graphic'] as const) {
      const operation = createDefaultArtefact(kind, context())

      expect(operation?.operation).toBe('create')
      expect(operation?.target.kind).toBe(kind)
      expect(Array.isArray(operation)).toBe(false)
      expect(Object.isFrozen(operation)).toBe(true)
    }
  })

  it('rejects an invalid placement without consuming an identity', () => {
    let allocations = 0
    const invalid = context({
      allocate: (kind) => {
        allocations += 1
        return { code: null, id: `${kind}-1` }
      },
      box: { height: 0, width: 300, x: 40, y: 80 }
    })

    expect(createDefaultGraphic(invalid)).toBeUndefined()
    expect(createDefaultRegion(invalid)).toBeUndefined()
    expect(allocations).toBe(0)
  })
})
