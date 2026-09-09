import type { Infoschematic, JsonValue } from '@infoschematics/domain-model/model'
import { z } from 'zod'

/**
 * Runtime mirror of the canonical, dependency-free Infoschematic contract.
 *
 * Authored objects are strict so a misspelt key fails visibly instead of being dropped and changing the rendered result.
 */

const number = z.number()
const coordinate = z.strictObject({ x: number, y: number })
const box = z.strictObject({ x: number, y: number, height: number, width: number })
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

const portCounts = z.strictObject({
  east: number.optional(),
  north: number.optional(),
  south: number.optional(),
  west: number.optional()
})

const portId = z.templateLiteral([z.enum(['N', 'E', 'S', 'W']), number])

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

const collection = z.strictObject({
  id: z.string(),
  label: z.string(),
  description: z.string().optional(),
  appearance: visualIdentity.optional()
})

const family = z.strictObject({
  id: z.string(),
  label: z.string(),
  description: z.string().optional(),
  appearance: visualIdentity.extend({ line: z.enum(['solid', 'dashed']).optional() }).optional()
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

const card = z.strictObject({
  id: z.string(),
  label: z.string(),
  description: z.string().optional(),
  stereotype: z.string().optional(),
  collection: z.string().optional(),
  bounds: box,
  ports: portCounts.optional(),
  interfaces: identifiers.optional(),
  provides: identifiers.optional()
})

const fabric = z.strictObject({
  id: z.string(),
  label: z.string(),
  description: z.string().optional(),
  bounds: box,
  ports: portCounts.optional(),
  kind: z.string().optional(),
  properties: properties.optional(),
  appearance: visualIdentity.optional()
})

const point = z.strictObject({
  id: z.string(),
  label: z.string(),
  at: coordinate,
  ports: portCounts.optional(),
  appearance: visualIdentity.optional()
})

const flow = z.strictObject({
  id: z.string(),
  family: z.string().optional(),
  appearance: z.strictObject({ line: z.enum(['solid', 'dashed']).optional() }).optional(),
  source: z.strictObject({ element: z.string(), port: portId }),
  target: z.strictObject({ element: z.string(), port: portId }),
  operation: z.string().optional(),
  interfaces: identifiers.optional(),
  direction: z.enum(['forward', 'bidirectional']).optional(),
  route: z
    .strictObject({
      waypoints: z.array(coordinate).readonly().optional(),
      labelAt: number.optional()
    })
    .optional()
})

const overlay = z.strictObject({
  id: z.string(),
  label: z.string(),
  description: z.string().optional(),
  kind: z.string(),
  bounds: box.optional(),
  properties: properties.optional()
})

const assemblyBase = {
  id: z.string(),
  label: z.string().optional(),
  description: z.string().optional()
}

const assembly = z.discriminatedUnion('kind', [
  z.strictObject({ ...assemblyBase, kind: z.literal('adapter'), interface: z.string(), adapter: z.string() }),
  z.strictObject({ ...assemblyBase, kind: z.literal('wrapped'), wrapper: z.string(), wrapped: z.string() })
])

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
  calloutPositions: z.array(coordinate).readonly().optional(),
  collections: z.array(collection).readonly().optional(),
  families: z.array(family).readonly().optional(),
  sets: z.array(elementSet).readonly().optional(),
  regions: z.array(region).readonly().optional(),
  cards: z.array(card).readonly().optional(),
  fabrics: z.array(fabric).readonly().optional(),
  points: z.array(point).readonly().optional(),
  flows: z.array(flow).readonly().optional(),
  overlays: z.array(overlay).readonly().optional(),
  assemblies: z.array(assembly).readonly().optional()
})

/** Validate an authored Infoschematic document against the canonical domain contract. */
export const infoschematicSchema = z.strictObject({
  id: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  diagram,
  themes: z.array(theme).readonly().optional(),
  stories: z.array(story).readonly().optional(),
  specifications: z.array(specification).readonly().optional()
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
  (<Probe>() => Probe extends Flat<Inferred> ? 1 : 2) extends <Probe>() => Probe extends Flat<Declared> ? 1 : 2
    ? true
    : false

type Parity<Held extends true> = Held

/** Compile-time bond between the runtime schema and the canonical TypeScript contract. */
export type SchemaMirrorsContract = Parity<Mirrors<z.infer<typeof infoschematicSchema>, Infoschematic>>
