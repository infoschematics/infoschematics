import type { CardConfig } from '@infoschematics/domain-model/card'
import type { FabricConfig } from '@infoschematics/domain-model/fabric'
import type { FlowConfig } from '@infoschematics/domain-model/flow'
import type { Box, Point } from '@infoschematics/domain-model/geometry'
import type { PointConfig } from '@infoschematics/domain-model/point'
import type { PortCounts, PortId } from '@infoschematics/domain-model/ports'
import {
  type ArtefactKind,
  type CreateArtefactOperation,
  createArtefactOperation,
  defineArtefactSelection
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

/**
 * A Point seed carries no extent.
 *
 * `PointConfig` is a label, a code, a Scope and a coordinate, so a template has nothing to seed but the label and the
 * ports the Point offers. Where a box seed states a default `width` and `height` for placement to act on, a coordinate
 * seed *is* its placement: `LibraryContext.box` supplies the position directly.
 */
export type PointTemplateSeed = Readonly<{
  kind: 'point'
  value: Readonly<Pick<PointConfig, 'label'> & { ports?: PortCounts }>
}>

export type LibraryTemplate = Readonly<{
  metadata: LibraryTemplateMetadata
  seed: CardTemplateSeed | FabricTemplateSeed | FlowTemplateSeed | PointTemplateSeed
}>

export const libraryTemplates: readonly LibraryTemplate[] = Object.freeze([
  {
    metadata: {
      description: 'A service-shaped Card with ports on both horizontal sides.',
      key: 'service-card',
      label: 'Service card'
    },
    seed: {
      kind: 'card',
      value: {
        detail: 'A service boundary',
        label: 'New service',
        placement: { box: { height: 80, width: 160 }, ports: { east: 1, west: 1 } },
        services: ['service']
      }
    }
  },
  {
    metadata: {
      description: 'A square Card, for grid and matrix compositions rather than a landscape row.',
      key: 'square-card',
      label: 'Square card'
    },
    seed: {
      kind: 'card',
      value: {
        detail: 'A square boundary',
        label: 'New node',
        placement: { box: { height: 120, width: 120 }, ports: { east: 1, north: 1, south: 1, west: 1 } },
        services: ['service']
      }
    }
  },
  {
    metadata: {
      description: 'A bounded Fabric for infrastructure or platform detail.',
      key: 'platform-fabric',
      label: 'Platform fabric'
    },
    seed: {
      kind: 'fabric',
      value: {
        appearance: {
          caption: 'Platform',
          properties: { emphasis: true },
          renderer: 'fabric'
        },
        detail: 'A platform boundary',
        label: 'New platform',
        placement: { box: { height: 140, width: 240 }, ports: { east: 1, west: 1 } }
      }
    }
  },
  {
    metadata: {
      description: 'A directed orthogonal Flow between the selected endpoints.',
      key: 'directed-flow',
      label: 'Directed flow'
    },
    seed: { kind: 'flow', value: { bidirectional: false, dashed: false } }
  },
  {
    metadata: {
      description: 'A coordinate a Flow can enter or leave the Diagram by, with one port on each side.',
      key: 'entry-point',
      label: 'Entry point'
    },
    seed: {
      kind: 'point',
      value: { label: 'New point', ports: { east: 1, north: 1, south: 1, west: 1 } }
    }
  }
])

export type LibraryIdentity = Readonly<{ code: string; id: string }>
export type LibraryIdentityAllocator = (
  kind: Extract<ArtefactKind, 'card' | 'fabric' | 'flow' | 'point'>
) => LibraryIdentity

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
  /*
   * The Collection the new element joins, where the document declares one.
   *
   * A Scope and a Collection are different questions - which sittings show an element, and which group it belongs
   * to - and a Card that answered the first for both named a Collection the document had never declared, which is
   * a document that cannot be read back. Absent where there is nothing to join.
   */
  collection?: string
  flow?: LibraryFlowContext
  scope: string
}>

export type LibraryCreateOperation =
  | CreateArtefactOperation<'card'>
  | CreateArtefactOperation<'fabric'>
  | CreateArtefactOperation<'flow'>
  | CreateArtefactOperation<'point'>

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

/*
 * The template's own size, at the context's position.
 *
 * The position is all the context has to say about the box: it arrives as a placement rectangle whose width and
 * height are the panel's own, and spreading the whole of it drew a Square card 240 wide and 120 high - the size the
 * panel would have used, under the name of the template that promised a square.
 */
const placedBox = (size: Readonly<Pick<Box, 'height' | 'width'>>, at: Readonly<Pick<Box, 'x' | 'y'>>): Box => ({
  ...size,
  x: at.x,
  y: at.y
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
    isOrthogonalRoute(points) &&
    samePoint(points[0] as Point, context.source.point) &&
    samePoint(points.at(-1) as Point, context.target.point)
  )
}

const validIdentity = (identity: LibraryIdentity) => identity.code.trim() !== '' && identity.id.trim() !== ''

/** Materialises one domain-shaped value and its single committed View Model create operation. */
export const instantiateLibraryTemplate = (
  template: LibraryTemplate,
  context: LibraryContext
): LibraryCreateOperation | undefined => {
  if (!Number.isFinite(context.at) || !Number.isFinite(context.box.x) || !Number.isFinite(context.box.y))
    return undefined
  if (template.seed.kind === 'flow' ? !isValidLibraryFlowContext(context.flow) : !context.scope.trim()) return undefined
  /* Stated over the two box kinds rather than as "not a flow": a Point is not a flow either, and it has no box for
     this guard to read. Naming them keeps the box path's width and height guarantee exactly as strict as it was. */
  if (
    (template.seed.kind === 'card' || template.seed.kind === 'fabric') &&
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
      targetPort: flow.target.port
    }
    const target = defineArtefactSelection({ code: identity.code, geometry: 'route', id: identity.id, kind: 'flow' })
    return createArtefactOperation(target, value, context.at)
  }

  if (template.seed.kind === 'point') {
    const seed = copy(template.seed.value)
    const value: PointConfig = {
      ...seed,
      ...identity,
      point: { x: context.box.x, y: context.box.y },
      scopes: [context.scope]
    }
    const target = defineArtefactSelection({ code: identity.code, geometry: 'point', id: identity.id, kind: 'point' })
    return createArtefactOperation(target, value, context.at)
  }

  if (template.seed.kind === 'card') {
    const seed = copy(template.seed.value)
    const value: CardConfig = {
      ...seed,
      ...identity,
      ...(context.collection ? { domain: context.collection } : {}),
      placement: { ...seed.placement, box: placedBox(seed.placement.box, context.box) },
      scope: context.scope,
      scopes: [context.scope]
    }
    const target = defineArtefactSelection({ code: identity.code, geometry: 'box', id: identity.id, kind: 'card' })
    return createArtefactOperation(target, value, context.at)
  }

  const seed = copy(template.seed.value)
  const value: FabricConfig = {
    ...seed,
    ...identity,
    placement: { ...seed.placement, box: placedBox(seed.placement.box, context.box) },
    scope: context.scope,
    scopes: [context.scope]
  }
  const target = defineArtefactSelection({ code: identity.code, geometry: 'box', id: identity.id, kind: 'fabric' })
  return createArtefactOperation(target, value, context.at)
}

export const createLibraryIdentityAllocator = (
  used: Readonly<{ codes?: Iterable<string>; ids?: Iterable<string> }> = {}
): LibraryIdentityAllocator => {
  const codes = new Set(used.codes)
  const ids = new Set(used.ids)
  let sequence = 0
  const prefix = { card: 'CRD', fabric: 'FAB', flow: 'FLW', point: 'PNT' } as const

  return (kind) => {
    let identity: LibraryIdentity
    do {
      sequence += 1
      /*
       * One identity rather than two.
       *
       * Past the authored document a coded element is known by its code: the model reads the established `id` as
       * an alias and publishes the code in its place, so an element given an `id` of its own is drawn under one
       * name while the operation that made it still names another. Nothing that matches a selection against that
       * operation could then find it, which is why a Card added from the Library could be selected and not moved,
       * resized, or read in the properties.
       */
      const code = `${prefix[kind]}-${String(sequence).padStart(3, '0')}`
      identity = { code, id: code }
    } while (codes.has(identity.code) || ids.has(identity.id))
    codes.add(identity.code)
    ids.add(identity.id)
    return Object.freeze(identity)
  }
}
