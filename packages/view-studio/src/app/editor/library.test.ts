import type { Box } from '@infoschematics/domain-model/geometry'
import { describe, expect, it } from 'vitest'
import {
  createLibraryIdentityAllocator,
  instantiateLibraryTemplate,
  isOrthogonalRoute,
  isValidLibraryFlowContext,
  type LibraryContext,
  type LibraryTemplate,
  libraryTemplates
} from './library.ts'

const template = (kind: LibraryTemplate['seed']['kind']) => {
  const found = libraryTemplates.find((entry) => entry.seed.kind === kind)
  if (!found) throw new Error(`Missing ${kind} template`)
  return found
}

const context = (allocate = createLibraryIdentityAllocator()): LibraryContext => ({
  allocate,
  at: 2,
  box: { x: 320, y: 180 },
  flow: {
    family: 'request',
    source: { component: 'source-card', point: { x: 100, y: 120 }, port: 'E1' },
    target: { component: 'target-card', point: { x: 320, y: 240 }, port: 'W1' }
  },
  scope: 'inside'
})

describe('Library templates', () => {
  it('keeps built-in UI metadata separate from serialisable seed values', () => {
    expect(JSON.parse(JSON.stringify(libraryTemplates))).toEqual(libraryTemplates)
    for (const entry of libraryTemplates) {
      expect(entry.seed.value).not.toHaveProperty('key')
      expect(entry.seed.value).not.toHaveProperty('description')
    }
  })

  it('allocates fresh stable identities while avoiding those already authored', () => {
    const allocate = createLibraryIdentityAllocator({ codes: ['CRD-001'], ids: ['card-1'] })

    // The id is the code: that is the identity the model publishes, and an element that answers to two names
    // answers to neither once it is drawn.
    expect(allocate('card')).toEqual({ code: 'CRD-002', id: 'CRD-002' })
    expect(allocate('card')).toEqual({ code: 'CRD-003', id: 'CRD-003' })
  })

  it('instantiates a domain-shaped Card at the contextual box as one create operation', () => {
    const allocate = createLibraryIdentityAllocator()
    const first = instantiateLibraryTemplate(template('card'), context(allocate))
    const second = instantiateLibraryTemplate(template('card'), context(allocate))

    expect(first).toMatchObject({
      at: 2,
      operation: 'create',
      target: { geometry: 'box', kind: 'card' },
      value: {
        placement: { box: { height: 80, width: 160, x: 320, y: 180 }, ports: { east: 1, west: 1 } },
        scope: 'inside',
        scopes: ['inside']
      }
    })
    expect(first?.target.code).not.toBe(second?.target.code)
    expect(first?.target.id).not.toBe(second?.target.id)
    if (!first || !second || !('placement' in first.value) || !('placement' in second.value)) {
      throw new Error('Expected placed operations')
    }
    expect(first.value.placement).not.toBe(second.value.placement)
  })

  it('deep-copies nested Fabric values without carrying UI metadata or provenance', () => {
    const allocate = createLibraryIdentityAllocator()
    const first = instantiateLibraryTemplate(template('fabric'), context(allocate))
    const second = instantiateLibraryTemplate(template('fabric'), context(allocate))
    if (!first || !second || !('appearance' in first.value) || !('appearance' in second.value)) {
      throw new Error('Expected Fabric operations')
    }

    expect(first.value.appearance?.properties).toEqual({ emphasis: true })
    expect(first.value.placement.box).toMatchObject({ x: 320, y: 180 })
    expect(first.value.appearance?.properties).not.toBe(second.value.appearance?.properties)
    expect(first.value.placement).not.toBe(second.value.placement)
    expect(first.value).not.toHaveProperty('key')
    expect(first.value).not.toHaveProperty('metadata')
    expect(first.value).not.toHaveProperty('provenance')
    expect(JSON.stringify(first)).not.toContain('platform-fabric')
    expect(JSON.stringify(first)).not.toContain('bounded Fabric')
  })

  it('keeps the template’s own size where the context carries a box of its own', () => {
    // The panel hands over the rectangle it placed the element in, width and height included. Only its position is
    // the context's to say: a Square card spread from that box came out 240 by 120, which is the panel's size.
    const placed: Box = { height: 120, width: 240, x: 320, y: 180 }
    const square = libraryTemplates.find((entry) => entry.metadata.key === 'square-card')
    if (!square) throw new Error('Missing square-card template')
    const operation = instantiateLibraryTemplate(square, { ...context(), box: placed })
    if (!operation || !('placement' in operation.value)) throw new Error('Expected a Card operation')

    expect(operation.value.placement.box).toEqual({ height: 120, width: 120, x: 320, y: 180 })
  })

  it('names the Collection it was given, and none where the document declares none', () => {
    const joined = instantiateLibraryTemplate(template('card'), { ...context(), collection: 'core' })
    const alone = instantiateLibraryTemplate(template('card'), context())
    if (!joined || !alone) throw new Error('Expected Card operations')

    expect(joined.value).toMatchObject({ domain: 'core' })
    // Not `undefined` but absent: a Collection the document never declared cannot be read back.
    expect(alone.value).not.toHaveProperty('domain')
  })

  it('creates a valid orthogonal Flow from contextual endpoints and ports', () => {
    const operation = instantiateLibraryTemplate(template('flow'), context())
    if (!operation || !('points' in operation.value)) throw new Error('Expected Flow operation')

    expect(operation.value).toMatchObject({
      family: 'request',
      source: 'source-card',
      sourcePort: 'E1',
      target: 'target-card',
      targetPort: 'W1'
    })
    expect(operation.value.points).toEqual([
      { x: 100, y: 120 },
      { x: 320, y: 120 },
      { x: 320, y: 240 }
    ])
    expect(isOrthogonalRoute(operation.value.points)).toBe(true)
    expect(Object.isFrozen(operation)).toBe(true)
  })

  it('rejects malformed ports and non-orthogonal supplied routes before allocating', () => {
    let allocations = 0
    const invalid = context(() => {
      allocations += 1
      return { code: 'FLW-001', id: 'flow-1' }
    })
    const flow = {
      ...invalid.flow,
      points: [
        { x: 100, y: 120 },
        { x: 320, y: 240 }
      ]
    } as NonNullable<LibraryContext['flow']>
    const malformed = { ...invalid, flow: { ...flow, source: { ...flow.source, port: 'east-1' as 'E1' } } }

    expect(isValidLibraryFlowContext(flow)).toBe(false)
    expect(instantiateLibraryTemplate(template('flow'), malformed)).toBeUndefined()
    expect(allocations).toBe(0)
  })
})
