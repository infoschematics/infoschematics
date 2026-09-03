import type { CardConfig } from '@infoschematics/domain-model/card'
import type { FabricConfig } from '@infoschematics/domain-model/fabric'
import type { FlowConfig } from '@infoschematics/domain-model/flow'
import type { Box, Point } from '@infoschematics/domain-model/geometry'
import type { PortCounts, PortId } from '@infoschematics/domain-model/ports'
import {
  createArtefactOperation,
  defineArtefactSelection,
  type ArtefactKind,
  type CreateArtefactOperation,
} from '@infoschematics/view-model/editable'

export type LibraryTemplateMetadata = Readonly<{
  description: string
  key: string
  label: string
}>

type BoxSize = Readonly<Pick<Box, 'height' | 'width'>>

export type CardTemplateSeed = Readonly<{
  kind: 'card'
  value: Readonly<
    Pick<CardConfig, 'detail' | 'label'> & {
      conformsTo?: readonly string[]
      placement: Readonly<{ box: BoxSize; ports?: PortCounts }>
      services?: readonly string[]
    }
  >
}>

export type FabricTemplateSeed = Readonly<{
  kind: 'fabric'
  value: Readonly<
    Pick<FabricConfig, 'detail' | 'label'> & {
      appearance?: FabricConfig['appearance']
      placement: Readonly<{ box: BoxSize; ports?: PortCounts }>
    }
  >
}>

export type FlowTemplateSeed = Readonly<{
  kind: 'flow'
  value: Readonly<Pick<FlowConfig, 'bidirectional' | 'dashed' | 'operation'>>
}>

export type LibraryTemplate = Readonly<{
  metadata: LibraryTemplateMetadata
  seed: CardTemplateSeed | FabricTemplateSeed | FlowTemplateSeed
}>

export const libraryTemplates: readonly LibraryTemplate[] = Object.freeze([
  {
    metadata: {
      description: 'A service-shaped Card with ports on both horizontal sides.',
      key: 'service-card',
      label: 'Service card',
    },
    seed: {
      kind: 'card',
      value: {
        detail: 'A service boundary',
        label: 'New service',
        placement: { box: { height: 80, width: 160 }, ports: { east: 1, west: 1 } },
        services: ['service'],
      },
    },
  },
  {
    metadata: {
      description: 'A bounded Fabric for infrastructure or platform detail.',
      key: 'platform-fabric',
      label: 'Platform fabric',
    },
    seed: {
      kind: 'fabric',
      value: {
        appearance: {
          caption: 'Platform',
          properties: { emphasis: true },
          renderer: 'fabric',
        },
        detail: 'A platform boundary',
        label: 'New platform',
        placement: { box: { height: 140, width: 240 }, ports: { east: 1, west: 1 } },
      },
    },
  },
  {
    metadata: {
      description: 'A directed orthogonal Flow between the selected endpoints.',
      key: 'directed-flow',
      label: 'Directed flow',
    },
    seed: { kind: 'flow', value: { bidirectional: false, dashed: false } },
  },
])

export type LibraryIdentity = Readonly<{ code: string; id: string }>
export type LibraryIdentityAllocator = (kind: Extract<ArtefactKind, 'card' | 'fabric' | 'flow'>) => LibraryIdentity

export type LibraryEndpoint = Readonly<{
  component: string
  point: Point
  port: PortId
}>

export type LibraryFlowContext = Readonly<{
  family: string
  points?: readonly Point[]
  source: LibraryEndpoint
  target: LibraryEndpoint
}>

export type LibraryContext = Readonly<{
  allocate: LibraryIdentityAllocator
  at: number
  box: Readonly<Pick<Box, 'x' | 'y'>>
  flow?: LibraryFlowContext
  scope: string
}>

export type LibraryCreateOperation =
  | CreateArtefactOperation<'card'>
  | CreateArtefactOperation<'fabric'>
  | CreateArtefactOperation<'flow'>

const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const finitePoint = (point: Point) => Number.isFinite(point.x) && Number.isFinite(point.y)
const samePoint = (left: Point, right: Point) => left.x === right.x && left.y === right.y
const validPort = (port: string): port is PortId => /^[NESW][1-9]\d*$/.test(port)

export const isOrthogonalRoute = (points: readonly Point[]): boolean =>
  points.length >= 2 &&
  points.every(finitePoint) &&
  points.slice(1).every((point, index) => {
    const previous = points[index] as Point
    return !samePoint(point, previous) && (point.x === previous.x || point.y === previous.y)
  })

const routeFor = (context: LibraryFlowContext): readonly Point[] => {
  if (context.points) return copy(context.points)
  const source = copy(context.source.point)
  const target = copy(context.target.point)
  return source.x === target.x || source.y === target.y
    ? [source, target]
    : [source, { x: target.x, y: source.y }, target]
}

export const isValidLibraryFlowContext = (context: LibraryFlowContext | undefined): context is LibraryFlowContext => {
  if (
    !context ||
    !context.family.trim() ||
    !context.source.component.trim() ||
    !context.target.component.trim() ||
    !validPort(context.source.port) ||
    !validPort(context.target.port) ||
    !finitePoint(context.source.point) ||
    !finitePoint(context.target.point) ||
    samePoint(context.source.point, context.target.point) ||
    (context.source.component === context.target.component && context.source.port === context.target.port)
  ) {
    return false
  }
  const points = routeFor(context)
  return (
    isOrthogonalRoute(points) && samePoint(points[0] as Point, context.source.point) && samePoint(points.at(-1) as Point, context.target.point)
  )
}

const validIdentity = (identity: LibraryIdentity) => identity.code.trim() !== '' && identity.id.trim() !== ''

/** Materialises one domain-shaped value and its single committed View Model create operation. */
export const instantiateLibraryTemplate = (
  template: LibraryTemplate,
  context: LibraryContext,
): LibraryCreateOperation | undefined => {
  if (!Number.isFinite(context.at) || !Number.isFinite(context.box.x) || !Number.isFinite(context.box.y)) return undefined
  if (template.seed.kind === 'flow' ? !isValidLibraryFlowContext(context.flow) : !context.scope.trim()) return undefined
  if (
    template.seed.kind !== 'flow' &&
    (!Number.isFinite(template.seed.value.placement.box.width) ||
      template.seed.value.placement.box.width <= 0 ||
      !Number.isFinite(template.seed.value.placement.box.height) ||
      template.seed.value.placement.box.height <= 0)
  ) {
    return undefined
  }
  const identity = copy(context.allocate(template.seed.kind))
  if (!validIdentity(identity)) return undefined

  if (template.seed.kind === 'flow') {
    const flow = context.flow as LibraryFlowContext
    const value: FlowConfig = {
      ...copy(template.seed.value),
      ...identity,
      family: flow.family,
      points: routeFor(flow),
      source: flow.source.component,
      sourcePort: flow.source.port,
      target: flow.target.component,
      targetPort: flow.target.port,
    }
    const target = defineArtefactSelection({ code: identity.code, geometry: 'route', id: identity.id, kind: 'flow' })
    return createArtefactOperation(target, value, context.at)
  }

  if (template.seed.kind === 'card') {
    const seed = copy(template.seed.value)
    const value: CardConfig = {
      ...seed,
      ...identity,
      placement: { ...seed.placement, box: { ...seed.placement.box, ...copy(context.box) } },
      scope: context.scope,
      scopes: [context.scope],
    }
    const target = defineArtefactSelection({ code: identity.code, geometry: 'box', id: identity.id, kind: 'card' })
    return createArtefactOperation(target, value, context.at)
  }

  const seed = copy(template.seed.value)
  const value: FabricConfig = {
    ...seed,
    ...identity,
    placement: { ...seed.placement, box: { ...seed.placement.box, ...copy(context.box) } },
    scope: context.scope,
    scopes: [context.scope],
  }
  const target = defineArtefactSelection({ code: identity.code, geometry: 'box', id: identity.id, kind: 'fabric' })
  return createArtefactOperation(target, value, context.at)
}

export const createLibraryIdentityAllocator = (
  used: Readonly<{ codes?: Iterable<string>; ids?: Iterable<string> }> = {},
): LibraryIdentityAllocator => {
  const codes = new Set(used.codes)
  const ids = new Set(used.ids)
  let sequence = 0
  const prefix = { card: 'CRD', fabric: 'FAB', flow: 'FLW' } as const

  return (kind) => {
    let identity: LibraryIdentity
    do {
      sequence += 1
      identity = { code: `${prefix[kind]}-${String(sequence).padStart(3, '0')}`, id: `${kind}-${sequence}` }
    } while (codes.has(identity.code) || ids.has(identity.id))
    codes.add(identity.code)
    ids.add(identity.id)
    return Object.freeze(identity)
  }
}
