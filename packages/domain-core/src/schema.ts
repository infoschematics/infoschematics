import type { Box, Point as Coordinate } from '@infoschematics/domain-model/geometry'
import type {
  Collection,
  Point as DiagramPoint,
  Fabric,
  Family,
  Flow,
  Infoschematic,
  JsonValue,
  VisualIdentity
} from '@infoschematics/domain-model/model'
import type { PortCounts, PortId } from '@infoschematics/domain-model/ports'
import { z } from 'zod'

/**
 * Runtime mirror of the canonical, dependency-free Infoschematic contract.
 *
 * Authored objects are strict so a misspelt key fails visibly instead of being dropped and changing the rendered result.
 * Compact authored values are decoded here; consumers only receive the structured canonical contract.
 */

const number = z.number()
const numericParts = (value: string): number[] => value.trim().split(/\s+/u).map(Number)
const numericText = (counts: readonly number[], label: string) =>
  z.string().refine((value) => {
    const parts = numericParts(value)
    return counts.includes(parts.length) && parts.every(Number.isFinite)
  }, `Expected ${label}.`)

const coordinateObject = z.strictObject({ x: number, y: number })
const coordinateText = numericText([2], 'two finite numbers: x y').transform((value): Coordinate => {
  const [x = 0, y = 0] = numericParts(value)
  return { x, y }
})
const coordinate = z.union([coordinateObject, coordinateText])

const boxObject = z.strictObject({ x: number, y: number, width: number, height: number })
const boxText = numericText([4], 'four finite numbers: x y width height').transform((value): Box => {
  const [x = 0, y = 0, width = 0, height = 0] = numericParts(value)
  return { x, y, width, height }
})
const box = z.union([boxObject, boxText])

const identifiers = z.array(z.string()).readonly()

const jsonValue: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([z.null(), z.boolean(), number, z.string(), z.array(jsonValue).readonly(), z.record(z.string(), jsonValue)])
)

const properties = z.record(z.string(), jsonValue).readonly()

const visualIdentity = z.strictObject({
  color: z.string().optional(),
  fill: z.string().optional(),
  icon: z.string().optional()
})

const portCountsObject = z.strictObject({
  north: number.optional(),
  east: number.optional(),
  south: number.optional(),
  west: number.optional()
})
const portCountsText = numericText([1, 2, 3, 4], 'one to four finite port counts').transform((value): PortCounts => {
  const values = numericParts(value)
  if (values.length === 1) {
    const [all = 0] = values
    return { north: all, east: all, south: all, west: all }
  }
  if (values.length === 2) {
    const [vertical = 0, horizontal = 0] = values
    return { north: vertical, east: horizontal, south: vertical, west: horizontal }
  }
  if (values.length === 3) {
    const [north = 0, horizontal = 0, south = 0] = values
    return { north, east: horizontal, south, west: horizontal }
  }
  const [north = 0, east = 0, south = 0, west = 0] = values
  return { north, east, south, west }
})
const portCountsScalar = number.transform((all): PortCounts => ({ north: all, east: all, south: all, west: all }))
const portCounts = z.union([portCountsObject, portCountsText, portCountsScalar])

const portId = z.templateLiteral([z.enum(['N', 'E', 'S', 'W']), number])
const endpoint = z.strictObject({ element: z.string(), port: portId })

const pointsText = z
  .string()
  .refine(
    (value) =>
      value.trim().length > 0 &&
      value
        .trim()
        .split(/\s+/u)
        .every((pair) => {
          const values = pair.split(',').map(Number)
          return values.length === 2 && values.every(Number.isFinite)
        }),
    'Expected SVG points syntax: x,y x,y.'
  )
  .transform((value): readonly Coordinate[] =>
    value
      .trim()
      .split(/\s+/u)
      .map((pair) => {
        const [x = 0, y = 0] = pair.split(',').map(Number)
        return { x, y }
      })
  )
const waypoints = z.union([pointsText, z.array(coordinate).readonly()])

const appearance = z.strictObject({
  surface: z.enum(['neutral', 'blueprint']).optional(),
  grid: z.enum(['none', 'major', 'major-plus-minor', 'dots']).optional(),
  card: z
    .strictObject({
      compact: z.boolean().optional(),
      identity: z.boolean().optional(),
      stereotype: z.boolean().optional(),
      description: z.boolean().optional()
    })
    .optional()
})

const identityFields = {
  color: z.string().optional(),
  fill: z.string().optional(),
  icon: z.string().optional()
}

const rejectMixedIdentity = (
  value: { appearance?: unknown; color?: unknown; fill?: unknown; icon?: unknown },
  context: z.core.$RefinementCtx<unknown>
) => {
  if (value.appearance !== undefined && [value.color, value.fill, value.icon].some((entry) => entry !== undefined)) {
    context.addIssue({ code: 'custom', message: 'Use appearance or unwrapped appearance fields, not both.' })
  }
}

const identityFrom = (value: { color?: string; fill?: string; icon?: string }): VisualIdentity | undefined => {
  const identity: VisualIdentity = {
    ...(value.color !== undefined ? { color: value.color } : {}),
    ...(value.fill !== undefined ? { fill: value.fill } : {}),
    ...(value.icon !== undefined ? { icon: value.icon } : {})
  }
  return Object.keys(identity).length > 0 ? identity : undefined
}

const collection = z
  .strictObject({
    id: z.string(),
    label: z.string(),
    description: z.string().optional(),
    appearance: visualIdentity.optional(),
    ...identityFields
  })
  .superRefine(rejectMixedIdentity)
  .transform(({ appearance: wrapped, color, fill, icon, ...value }): Collection => {
    const unwrapped = identityFrom({ color, fill, icon })
    return wrapped || unwrapped ? { ...value, appearance: wrapped ?? unwrapped } : value
  })

const familyAppearance = visualIdentity.extend({ line: z.enum(['solid', 'dashed']).optional() })
const family = z
  .strictObject({
    id: z.string(),
    label: z.string(),
    description: z.string().optional(),
    appearance: familyAppearance.optional(),
    ...identityFields,
    line: z.enum(['solid', 'dashed']).optional()
  })
  .superRefine((value, context) => {
    rejectMixedIdentity(value, context)
    if (value.appearance !== undefined && value.line !== undefined) {
      context.addIssue({ code: 'custom', message: 'Use appearance or unwrapped appearance fields, not both.' })
    }
  })
  .transform(({ appearance: wrapped, color, fill, icon, line, ...value }): Family => {
    const identity = identityFrom({ color, fill, icon })
    const unwrapped =
      identity || line !== undefined ? { ...identity, ...(line !== undefined ? { line } : {}) } : undefined
    return wrapped || unwrapped ? { ...value, appearance: wrapped ?? unwrapped } : value
  })

const elementSet = z.strictObject({
  id: z.string(),
  label: z.string(),
  description: z.string().optional(),
  elements: identifiers
})

const region = z.strictObject({
  id: z.string(),
  label: z.string(),
  bounds: box,
  appearance: z
    .strictObject({
      fill: z.string().optional(),
      cornerRadius: number.optional(),
      frame: z.strictObject({ style: z.enum(['solid', 'dashed', 'dotted']), opacity: number.optional() }).optional(),
      label: z
        .strictObject({
          placement: z
            .enum([
              'none',
              'north-west',
              'north',
              'north-east',
              'west',
              'center',
              'east',
              'south-west',
              'south',
              'south-east'
            ])
            .optional(),
          mount: z.enum(['boundary', 'internal']).optional(),
          offset: number.optional()
        })
        .optional()
    })
    .optional()
})

const card = z
  .strictObject({
    id: z.string(),
    label: z.string(),
    description: z.string().optional(),
    stereotype: z.string().optional(),
    collection: z.string().optional(),
    adapts: z.string().optional(),
    wraps: z.string().optional(),
    bounds: box,
    ports: portCounts.optional(),
    interfaces: identifiers.optional(),
    provides: identifiers.optional()
  })
  .superRefine((value, context) => {
    if (value.adapts !== undefined && value.wraps !== undefined) {
      context.addIssue({ code: 'custom', message: 'A Card cannot both adapt and wrap another Card.' })
    }
  })

const fabric = z
  .strictObject({
    id: z.string(),
    label: z.string(),
    description: z.string().optional(),
    kind: z.string().optional(),
    bounds: box,
    ports: portCounts.optional(),
    properties: properties.optional(),
    appearance: visualIdentity.optional(),
    ...identityFields
  })
  .superRefine(rejectMixedIdentity)
  .transform(({ appearance: wrapped, color, fill, icon, ...value }): Fabric => {
    const unwrapped = identityFrom({ color, fill, icon })
    return wrapped || unwrapped ? { ...value, appearance: wrapped ?? unwrapped } : value
  })

const point = z
  .strictObject({
    id: z.string(),
    label: z.string(),
    at: coordinate,
    ports: portCounts.optional(),
    appearance: visualIdentity.optional(),
    ...identityFields
  })
  .superRefine(rejectMixedIdentity)
  .transform(({ appearance: wrapped, color, fill, icon, ...value }): DiagramPoint => {
    const unwrapped = identityFrom({ color, fill, icon })
    return wrapped || unwrapped ? { ...value, appearance: wrapped ?? unwrapped } : value
  })

const flowAppearance = z.strictObject({ line: z.enum(['solid', 'dashed']).optional() })
const flowBase = {
  id: z.string(),
  family: z.string().optional(),
  operation: z.string().optional(),
  interfaces: identifiers.optional(),
  appearance: flowAppearance.optional(),
  line: z.enum(['solid', 'dashed']).optional()
}
const structuredFlow = z.strictObject({
  ...flowBase,
  source: endpoint,
  target: endpoint,
  direction: z.enum(['forward', 'bidirectional']).optional(),
  route: z.strictObject({ waypoints: waypoints.optional(), labelAt: number.optional() }).optional()
})
const parsedLink = z
  .string()
  .regex(/^\S+\s+[NESW]\d+\s+(?:->|<->)\s+\S+\s+[NESW]\d+$/u, 'Expected link: ELEMENT PORT -> ELEMENT PORT.')
  .transform((value): Pick<Flow, 'direction' | 'source' | 'target'> => {
    const [sourceElement = '', sourcePort = '', arrow = '->', targetElement = '', targetPort = ''] = value.split(/\s+/u)
    return {
      direction: arrow === '<->' ? 'bidirectional' : 'forward',
      source: { element: sourceElement, port: sourcePort as PortId },
      target: { element: targetElement, port: targetPort as PortId }
    }
  })
const compactFlow = z.strictObject({
  ...flowBase,
  link: parsedLink,
  labelAt: number.optional(),
  waypoints: waypoints.optional()
})
const flow = z
  .union([compactFlow, structuredFlow])
  .superRefine((value, context) => {
    if (value.appearance !== undefined && value.line !== undefined) {
      context.addIssue({ code: 'custom', message: 'Use appearance or line, not both.' })
    }
  })
  .transform((authored): Flow => {
    const { appearance: wrapped, line, ...value } = authored
    const flowAppearanceValue = wrapped ?? (line === undefined ? undefined : { line })
    if ('link' in value) {
      const { link, labelAt, waypoints: authoredWaypoints, ...rest } = value
      const route =
        labelAt !== undefined || authoredWaypoints !== undefined ? { labelAt, waypoints: authoredWaypoints } : undefined
      return {
        ...rest,
        ...link,
        ...(route ? { route } : {}),
        ...(flowAppearanceValue ? { appearance: flowAppearanceValue } : {})
      }
    }
    return { ...value, ...(flowAppearanceValue ? { appearance: flowAppearanceValue } : {}) }
  })

const overlay = z.strictObject({
  id: z.string(),
  label: z.string(),
  description: z.string().optional(),
  kind: z.string(),
  bounds: box.optional(),
  properties: properties.optional()
})

const selection = z.strictObject({
  elements: identifiers.optional(),
  sets: identifiers.optional()
})

const callout = z.strictObject({
  title: z.string().optional(),
  body: z.string(),
  takeaways: identifiers.optional(),
  placement: z.union([z.strictObject({ at: coordinate }), z.strictObject({ element: z.string() })]).optional(),
  kind: z.string().optional(),
  properties: properties.optional()
})

const visibility = z.strictObject({
  show: selection.optional(),
  hide: selection.optional()
})

const sceneShape = {
  id: z.string(),
  label: z.string(),
  description: z.string().optional(),
  visibility: visibility.optional(),
  focus: selection.optional(),
  callout: callout.optional()
}

const scene = z.strictObject(sceneShape)

const theme = z.strictObject({
  id: z.string(),
  label: z.string(),
  description: z.string().optional(),
  scenes: z.array(scene).readonly()
})

const story = z.strictObject({
  id: z.string(),
  label: z.string(),
  description: z.string().optional(),
  question: z.string().optional(),
  scenes: z.array(z.strictObject({ ...sceneShape, duration: number.optional() })).readonly()
})

const interfaceContract = z.strictObject({
  id: z.string(),
  label: z.string(),
  description: z.string().optional(),
  document: z.strictObject({ label: z.string().optional(), href: z.string().optional() }).optional(),
  operations: z
    .array(z.strictObject({ id: z.string(), summary: z.string() }))
    .readonly()
    .optional()
})

const specification = z.strictObject({
  id: z.string(),
  label: z.string(),
  description: z.string().optional(),
  owner: z.string().optional(),
  document: z
    .strictObject({
      ownership: z.enum(['ours', 'theirs']),
      label: z.string().optional(),
      href: z.string().optional()
    })
    .optional(),
  interfaces: z.array(interfaceContract).readonly()
})

const diagram = z.strictObject({
  bounds: box,
  appearance: appearance.optional(),
  collections: z.array(collection).readonly().optional(),
  sets: z.array(elementSet).readonly().optional(),
  families: z.array(family).readonly().optional(),
  cards: z.array(card).readonly().optional(),
  fabrics: z.array(fabric).readonly().optional(),
  points: z.array(point).readonly().optional(),
  regions: z.array(region).readonly().optional(),
  flows: z.array(flow).readonly().optional(),
  overlays: z.array(overlay).readonly().optional(),
  calloutPositions: z.array(coordinate).readonly().optional()
})

/** Validate an authored Infoschematic document against the canonical domain contract. */
export const infoschematicSchema = z.strictObject({
  id: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  diagram,
  specifications: z.array(specification).readonly().optional(),
  stories: z.array(story).readonly().optional(),
  themes: z.array(theme).readonly().optional()
})

/** JSON Schema projected from the same runtime contract used by the YAML loader. */
export const infoschematicJsonSchema = (): Record<string, unknown> => ({
  $id: 'https://infoschematics.info/schema/infoschematic.schema.json',
  title: 'Infoschematic',
  ...z.toJSONSchema(infoschematicSchema, { io: 'input' })
})

type Flat<T> = T extends readonly (infer Item)[]
  ? T extends unknown[]
    ? Flat<Item>[]
    : readonly Flat<Item>[]
  : T extends object
    ? { [Key in keyof T]: Flat<T[Key]> }
    : T

type Mirrors<Inferred, Declared> =
  Flat<Inferred> extends Flat<Declared> ? (Flat<Declared> extends Flat<Inferred> ? true : false) : false

type Parity<Held extends true> = Held

/** Compile-time bond between the runtime schema's output and the canonical TypeScript contract. */
export type SchemaMirrorsContract = Parity<Mirrors<z.infer<typeof infoschematicSchema>, Infoschematic>>
