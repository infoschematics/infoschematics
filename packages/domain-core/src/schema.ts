import type { InfoschematicConfigInput } from '@infoschematics/domain-model'
import { z } from 'zod'

/**
 * A runtime mirror of the hand-written domain contract.
 *
 * Domain Model stays the dependency-free owner of the types; this schema restates them so an untrusted document can be
 * checked at a file boundary, and {@link SchemaMirrorsContract} holds the two together at compile time.
 *
 * Every object is strict. A hand-edited document's most common defect is a misspelt key, and a permissive schema would
 * drop it silently and render a subtly wrong diagram instead of reporting the typo.
 */

const point = z.strictObject({ x: z.number(), y: z.number() })

const box = z.strictObject({ x: z.number(), y: z.number(), height: z.number(), width: z.number() })

const identifiers = z.array(z.string()).readonly()

const properties = z.record(z.string(), z.union([z.boolean(), z.number(), z.string()])).readonly()

const portCounts = z.strictObject({
  east: z.number().optional(),
  north: z.number().optional(),
  south: z.number().optional(),
  west: z.number().optional()
})

// The contract states a port as a template literal type, and Zod restates it as one rather than as a hand-written
// pattern, so the inferred type is the contract's own and the emitted JSON Schema carries the same rule.
const portId = z.templateLiteral([z.enum(['N', 'E', 'S', 'W']), z.number()])

const placement = z.strictObject({ box, ports: portCounts.optional() })

const artefactIdentity = {
  id: z.string(),
  code: z.string(),
  label: z.string(),
  detail: z.string(),
  scopes: identifiers,
  scopeRule: z.enum(['all', 'any']).optional(),
  conformsTo: identifiers.optional(),
  services: identifiers.optional()
}

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

const scope = z.strictObject({
  id: z.string(),
  prefix: z.string(),
  label: z.string(),
  description: z.string(),
  color: z.string(),
  fill: z.string(),
  icon: z.string().optional()
})

const domain = z.strictObject({
  id: z.string(),
  label: z.string(),
  description: z.string().optional(),
  color: z.string(),
  fill: z.string()
})

const flowFamily = z.strictObject({
  id: z.string(),
  prefix: z.string(),
  label: z.string(),
  description: z.string(),
  color: z.string()
})

const region = z.strictObject({
  id: z.string(),
  label: z.string(),
  box: z.strictObject({
    x: z.number(),
    y: z.number(),
    height: z.number(),
    width: z.number(),
    radius: z.number().optional()
  }),
  frame: z.strictObject({ style: z.enum(['solid', 'dashed', 'dotted']), opacity: z.number().optional() }).optional(),
  fill: z.string().optional(),
  labelPlacement: z
    .enum(['none', 'north-west', 'north', 'north-east', 'west', 'center', 'east', 'south-west', 'south', 'south-east'])
    .optional(),
  labelMount: z.enum(['boundary', 'internal']).optional(),
  labelOffset: z.number().optional()
})

const card = z.strictObject({
  ...artefactIdentity,
  scope: z.string(),
  domain: z.string().optional(),
  stereotype: z.string().optional(),
  wraps: z.string().optional(),
  placement
})

const fabric = z.strictObject({
  ...artefactIdentity,
  scope: z.string(),
  placement,
  appearance: z
    .strictObject({
      renderer: z.string(),
      caption: z.string().optional(),
      detail: z.string().optional(),
      properties: properties.optional()
    })
    .optional()
})

const pointArtefact = z.strictObject({
  id: z.string(),
  code: z.string(),
  label: z.string(),
  scopes: identifiers,
  point,
  ports: portCounts.optional()
})

const flow = z.strictObject({
  id: z.string(),
  code: z.string(),
  family: z.string(),
  source: z.string(),
  target: z.string(),
  sourcePort: portId,
  targetPort: portId,
  operation: z.string().optional(),
  conformsTo: identifiers.optional(),
  over: z.string().optional(),
  bidirectional: z.boolean().optional(),
  dashed: z.boolean().optional(),
  label: z.strictObject({ along: z.number() }).optional(),
  points: z.array(point).readonly()
})

const graphic = z.strictObject({
  id: z.string(),
  label: z.string().optional(),
  renderer: z.string(),
  placement: box.optional(),
  scopes: identifiers.optional(),
  properties: properties.optional()
})

const documentOwnership = z.enum(['none', 'ours', 'theirs'])

const interfaceContract = z.strictObject({
  id: z.string(),
  prefix: z.string(),
  owner: z.string(),
  document: documentOwnership,
  contract: z.string().optional(),
  href: z.string().optional(),
  label: z.string(),
  description: z.string(),
  operations: z
    .array(z.strictObject({ id: z.string(), summary: z.string() }))
    .readonly()
    .optional()
})

const specificationGroup = z.strictObject({
  id: z.string(),
  label: z.string(),
  note: z.string(),
  owner: z.string(),
  document: documentOwnership
})

const focus = z.strictObject({
  artefacts: identifiers.optional(),
  flows: identifiers.optional(),
  graphics: identifiers.optional()
})

const callout = z.strictObject({
  title: z.string().optional(),
  body: z.string(),
  takeaways: identifiers.optional(),
  at: point.optional(),
  renderer: z.string().optional(),
  properties: properties.optional()
})

const standaloneScene = z.strictObject({
  id: z.string(),
  code: z.string(),
  label: z.string(),
  short: z.string().optional(),
  description: z.string(),
  focus
})

const thematicScene = z.strictObject({
  id: z.string(),
  code: z.string(),
  label: z.string(),
  short: z.string().optional(),
  description: z.string().optional(),
  focus,
  callout: callout.optional()
})

const theme = z.strictObject({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  scenes: z.array(thematicScene).readonly()
})

const storyScene = z.strictObject({
  id: z.string().optional(),
  sourceScene: z.string().optional(),
  title: z.string().optional(),
  focus: focus.optional(),
  anchor: z.string().optional(),
  callout: callout.optional(),
  graphic: z.string().optional(),
  duration: z.number().optional()
})

const story = z.strictObject({
  id: z.string(),
  code: z.string(),
  title: z.string(),
  short: z.string().optional(),
  question: z.string().optional(),
  scenes: z.array(storyScene).readonly()
})

/** The complete Infoschematic definition, before an authored document is allowed to omit parts of it. */
const infoschematicDefinition = z.strictObject({
  viewBox: box,
  appearance: appearance.optional(),
  scopes: z.array(scope).readonly(),
  domains: z.array(domain).readonly().optional(),
  flowFamilies: z.array(flowFamily).readonly(),
  regions: z.array(region).readonly(),
  cards: z.array(card).readonly(),
  fabrics: z.array(fabric).readonly(),
  points: z.array(pointArtefact).readonly(),
  flows: z.array(flow).readonly(),
  graphics: z.array(graphic).readonly(),
  interfaces: z.array(interfaceContract).readonly(),
  specificationGroups: z.array(specificationGroup).readonly()
})

/** Validate an authored Infoschematic document against the domain contract. */
export const infoschematicConfigSchema = z.strictObject({
  id: z.string().optional(),
  title: z.string(),
  subtitle: z.string().optional(),
  synopsis: z.string().optional(),
  takeaways: identifiers.optional(),
  infoschematic: infoschematicDefinition.partial().optional(),
  standaloneScenes: z.array(standaloneScene).readonly().optional(),
  themes: z.array(theme).readonly().optional(),
  stories: z.array(story).readonly().optional(),
  calloutPositions: z.array(point).readonly().optional()
})

// The contract composes its shapes with intersections, `Partial`, and `Readonly`; a schema can only infer the flattened
// result. Flattening both sides first compares what the two types mean rather than how each was written.
/**
 * The JSON Schema for an authored Infoschematic document, projected from the schema above.
 *
 * An editor and the loader therefore agree by construction: there is no second generator and no second contract to keep
 * in step. `scripts/generate-schema.ts` commits the serialised form so an editor can consume it without a build.
 */
export const infoschematicJsonSchema = (): Record<string, unknown> => ({
  $id: 'https://infoschematics.info/schema/infoschematic.schema.json',
  title: 'Infoschematic',
  ...z.toJSONSchema(infoschematicConfigSchema, { io: 'input' })
})

type Flat<T> = T extends readonly (infer Item)[]
  ? T extends unknown[]
    ? Flat<Item>[]
    : readonly Flat<Item>[]
  : T extends object
    ? { [Key in keyof T]: Flat<T[Key]> }
    : T

// Exact type identity rather than mutual assignability: two types that merely accept each other's values still differ
// when one drops an optional field, and that is the drift this assertion exists to catch.
type Mirrors<Inferred, Declared> =
  (<Probe>() => Probe extends Flat<Inferred> ? 1 : 2) extends <Probe>() => Probe extends Flat<Declared> ? 1 : 2
    ? true
    : false

// The constraint is the assertion: instantiating it with `false` is the type error.
type Parity<Held extends true> = Held

/**
 * The compile-time bond between the schema and the contract it mirrors.
 *
 * Mutual assignability is checked in both directions on purpose: a field added to `InfoschematicConfigInput` and not to
 * the schema fails one direction, and a field added to the schema and not to the contract fails the other, so the
 * mirror cannot drift while the type-check still passes.
 */
export type SchemaMirrorsContract = Parity<Mirrors<z.infer<typeof infoschematicConfigSchema>, InfoschematicConfigInput>>
