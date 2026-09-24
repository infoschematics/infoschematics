import type { Box, Point as Coordinate } from '@infoschematics/domain-model/geometry'
import type {
  ArchitecturalScope,
  CardCollection,
  Point as DiagramPoint,
  Fabric,
  Flow,
  FlowFamily,
  Infoschematic,
  JsonValue,
  VisualIdentity
} from '@infoschematics/domain-model/model'
import type { PortCounts, PortId } from '@infoschematics/domain-model/ports'
import type { RendererReference } from '@infoschematics/domain-model/renderer'
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

const coordinateObject = z.strictObject({
  x: number.describe('Distance from the left edge of the drawing area, in diagram units.'),
  y: number.describe('Distance from the top edge of the drawing area, in diagram units.')
})
const coordinateText = numericText([2], 'two finite numbers: x y').transform((value): Coordinate => {
  const [x = 0, y = 0] = numericParts(value)
  return { x, y }
})
const coordinate = z
  .union([coordinateObject, coordinateText])
  .describe('A position, written either as an object or as two numbers: x y.')

const boxObject = z.strictObject({
  x: number.describe('Distance from the left edge of the drawing area, in diagram units.'),
  y: number.describe('Distance from the top edge of the drawing area, in diagram units.'),
  width: number.describe('Width in diagram units.'),
  height: number.describe('Height in diagram units.')
})
const boxText = numericText([4], 'four finite numbers: x y width height').transform((value): Box => {
  const [x = 0, y = 0, width = 0, height = 0] = numericParts(value)
  return { x, y, width, height }
})
const box = z
  .union([boxObject, boxText])
  .describe('A rectangle, written either as an object or as four numbers: x y width height.')

const identifiers = z.array(z.string()).readonly()
const elementIdentifiers = z
  .array(z.string())
  .describe('Identifiers of the elements this applies to. Repeats are dropped and the list is sorted.')
  .transform((values) => [...new Set(values)].sort((left, right) => (left < right ? -1 : left > right ? 1 : 0)))
  .readonly()

const jsonValue: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([z.null(), z.boolean(), number, z.string(), z.array(jsonValue).readonly(), z.record(z.string(), jsonValue)])
)

const properties = z.record(z.string(), jsonValue).readonly()

const rendererReferenceObject = z.strictObject({
  key: z.string().min(1).describe('The renderer key a host registers this drawing under.'),
  version: z.number().int().positive().describe('Which version of that renderer to draw with.')
})
const rendererReference = z
  .union([
    rendererReferenceObject,
    z
      .string()
      .min(1)
      .transform((key): RendererReference => ({ key, version: 1 }))
  ])
  .describe('Which renderer draws this, as a key and a version. A bare string names the key at version 1.')

const visualIdentity = z.strictObject({
  color: z.string().describe('Stroke colour, as any CSS colour. Used exactly as authored.').optional(),
  fill: z.string().describe('Fill colour, as any CSS colour. Used exactly as authored.').optional(),
  icon: z.string().describe('Renderer key for an icon drawn with the element.').optional()
})

const portCountsObject = z.strictObject({
  north: number.describe('How many connection points the top edge offers.').optional(),
  east: number.describe('How many connection points the right edge offers.').optional(),
  south: number.describe('How many connection points the bottom edge offers.').optional(),
  west: number.describe('How many connection points the left edge offers.').optional()
})
const portCountsText = numericText([1, 2, 3, 4], 'one to four finite port counts').transform((value): PortCounts => {
  const values = numericParts(value)
  if (values.length === 1) {
    const [all = 0] = values
    return { north: all, east: all, south: all, west: all }
  }
  if (values.length === 2) {
    const [vertical = 0, horizontal = 0] = values
    return {
      north: vertical,
      east: horizontal,
      south: vertical,
      west: horizontal
    }
  }
  if (values.length === 3) {
    const [north = 0, horizontal = 0, south = 0] = values
    return { north, east: horizontal, south, west: horizontal }
  }
  const [north = 0, east = 0, south = 0, west = 0] = values
  return { north, east, south, west }
})
const portCountsScalar = number.transform(
  (all): PortCounts => ({
    north: all,
    east: all,
    south: all,
    west: all
  })
)
const portCounts = z
  .union([portCountsObject, portCountsText, portCountsScalar])
  .describe(
    'How many connection points each side offers. One number applies to every side; two are vertical then horizontal; three are north, horizontal, south; four are north, east, south, west.'
  )

const portId = z
  .templateLiteral([z.enum(['N', 'E', 'S', 'W']), number])
  .describe('A connection point: the side — N, E, S or W — followed by its index, such as N1.')
const endpoint = z.strictObject({
  element: z.string().describe('Identifier of the element this end attaches to.'),
  port: portId
})

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
const waypoints = z
  .union([pointsText, z.array(coordinate).readonly()])
  .describe('Bends the route is drawn through, written either as x,y x,y or as a list of positions.')

const appearance = z
  .strictObject({
    surface: z
      .enum(['neutral', 'blueprint'])
      .describe(
        'Which palette the drawing is painted from. `neutral` follows the palette the reader is in; `blueprint` is a drafting convention with a palette of its own.'
      )
      .optional(),
    grid: z
      .enum(['none', 'major', 'major-plus-minor', 'dots'])
      .describe(
        'The ruled ground behind the drawing. `major` rules a coarse grid, `major-plus-minor` subdivides it, `dots` marks the intersections only, and `none` leaves the ground plain.'
      )
      .optional(),
    identity: z
      .boolean()
      .describe('Whether elements show their identity chip. `card.identity` answers for Cards where both are set.')
      .optional(),
    card: z
      .strictObject({
        compact: z.boolean().describe('Draw Cards condensed, trading detail for density.').optional(),
        identity: z.boolean().describe("Show each Card's identity chip.").optional(),
        stereotype: z
          .boolean()
          .describe("Show each Card's stereotype, the classifying line above its label.")
          .optional(),
        description: z.boolean().describe("Show each Card's description beneath its label.").optional()
      })
      .describe('What every Card discloses. A renderer may disclose less where there is no room for it.')
      .optional()
  })
  .describe('How the drawing as a whole is painted, ruled and detailed.')

const identityFields = {
  color: z.string().describe('Stroke colour, as any CSS colour. Shorthand for `appearance.color`.').optional(),
  fill: z.string().describe('Fill colour, as any CSS colour. Shorthand for `appearance.fill`.').optional(),
  icon: z
    .string()
    .describe('Renderer key for an icon drawn with the element. Shorthand for `appearance.icon`.')
    .optional()
}

const rejectMixedIdentity = (
  value: {
    appearance?: unknown
    color?: unknown
    fill?: unknown
    icon?: unknown
  },
  context: z.core.$RefinementCtx<unknown>
) => {
  if (value.appearance !== undefined && [value.color, value.fill, value.icon].some((entry) => entry !== undefined)) {
    context.addIssue({
      code: 'custom',
      message: 'Use appearance or unwrapped appearance fields, not both.'
    })
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
    id: z
      .string()
      .describe('Stable identifier, unique among elements of its kind. This is what a Flow, Scope or Scene names.'),
    label: z.string().describe('The name a reader sees.'),
    description: z.string().describe('What this is, in a sentence.').optional(),
    appearance: visualIdentity
      .describe('How this element is drawn, overriding the document-wide treatment.')
      .optional(),
    ...identityFields
  })
  .superRefine(rejectMixedIdentity)
  .transform(({ appearance: wrapped, color, fill, icon, ...value }): CardCollection => {
    const unwrapped = identityFrom({ color, fill, icon })
    return wrapped || unwrapped ? { ...value, appearance: wrapped ?? unwrapped } : value
  })

const lineStyleValues = ['solid', 'dashed'] as const
const lineStyleDescription =
  'Whether the line is drawn continuous or dashed. Dashed usually marks something indirect, intermittent, or not yet built.'

const familyAppearance = visualIdentity.extend({
  line: z.enum(lineStyleValues).describe(lineStyleDescription).optional()
})
const family = z
  .strictObject({
    id: z
      .string()
      .describe('Stable identifier, unique among elements of its kind. This is what a Flow, Scope or Scene names.'),
    label: z.string().describe('The name a reader sees.'),
    description: z.string().describe('What this is, in a sentence.').optional(),
    appearance: familyAppearance.describe('How every Flow in this Family is drawn.').optional(),
    ...identityFields,
    line: z.enum(lineStyleValues).describe(lineStyleDescription).optional()
  })
  .superRefine((value, context) => {
    rejectMixedIdentity(value, context)
    if (value.appearance !== undefined && value.line !== undefined) {
      context.addIssue({
        code: 'custom',
        message: 'Use appearance or unwrapped appearance fields, not both.'
      })
    }
  })
  .transform(({ appearance: wrapped, color, fill, icon, line, ...value }): FlowFamily => {
    const identity = identityFrom({ color, fill, icon })
    const unwrapped =
      identity || line !== undefined ? { ...identity, ...(line !== undefined ? { line } : {}) } : undefined
    return wrapped || unwrapped ? { ...value, appearance: wrapped ?? unwrapped } : value
  })

const architecturalScope = z
  .strictObject({
    id: z
      .string()
      .describe('Stable identifier, unique among elements of its kind. This is what a Flow, Scope or Scene names.'),
    label: z.string().describe('The name a reader sees.'),
    description: z.string().describe('What this is, in a sentence.').optional(),
    elements: elementIdentifiers.describe('Identifiers of the elements this Scope covers.'),
    appearance: z
      .strictObject({ icon: z.string().describe('Renderer key for an icon shown with the Scope.').optional() })
      .describe('How this Scope is presented.')
      .optional(),
    icon: z
      .string()
      .describe('Renderer key for an icon shown with the Scope. Shorthand for `appearance.icon`.')
      .optional()
  })
  .superRefine((value, context) => {
    if (value.appearance !== undefined && value.icon !== undefined) {
      context.addIssue({
        code: 'custom',
        message: 'Use appearance or the unwrapped icon field, not both.'
      })
    }
  })
  .transform(({ appearance: wrapped, icon, ...value }): ArchitecturalScope => {
    const appearance = wrapped ?? (icon !== undefined ? { icon } : undefined)
    return appearance ? { ...value, appearance } : value
  })

const region = z.strictObject({
  id: z.string().describe('Stable identifier, unique among elements of its kind. This is what a Scope or Scene names.'),
  label: z.string().describe('The name a reader sees.'),
  bounds: box.describe('Where the Region sits and how large it is.'),
  identity: z.boolean().describe('Whether the Region shows its identity chip.').optional(),
  appearance: z
    .strictObject({
      fill: z.string().describe('Fill colour, as any CSS colour. Used exactly as authored.').optional(),
      cornerRadius: number.describe('How far the corners are rounded, in diagram units.').optional(),
      frame: z
        .strictObject({
          style: z.enum(['solid', 'dashed', 'dotted']).describe('How the frame border is drawn.'),
          opacity: number.describe('Frame opacity, from 0 for invisible to 1 for solid.').optional()
        })
        .describe('The border drawn around the Region.')
        .optional(),
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
            .describe('Where the label sits against the frame. `none` draws no label.')
            .optional(),
          mount: z
            .enum(['boundary', 'internal'])
            .describe('Whether the label sits on the frame border or inside the Region.')
            .optional(),
          offset: number.describe('How far the label is nudged from its placement, in diagram units.').optional()
        })
        .describe('How the Region names itself.')
        .optional()
    })
    .describe('How this Region is drawn, overriding the document-wide treatment.')
    .optional()
})

const card = z
  .strictObject({
    id: z
      .string()
      .describe('Stable identifier, unique among elements of its kind. This is what a Flow, Scope or Scene names.'),
    label: z.string().describe('The name a reader sees.'),
    description: z.string().describe('What this is, in a sentence.').optional(),
    stereotype: z.string().describe('A classifying phrase shown above the label.').optional(),
    collection: z.string().describe('Identifier of the Collection this Card belongs to.').optional(),
    adapts: z.string().describe('Identifier of a Card this one adapts. A Card cannot both adapt and wrap.').optional(),
    wraps: z.string().describe('Identifier of a Card this one wraps. A Card cannot both adapt and wrap.').optional(),
    bounds: box,
    identity: z.boolean().describe('Whether this Card shows its identity chip.').optional(),
    ports: portCounts.optional()
  })
  .superRefine((value, context) => {
    if (value.adapts !== undefined && value.wraps !== undefined) {
      context.addIssue({
        code: 'custom',
        message: 'A Card cannot both adapt and wrap another Card.'
      })
    }
  })

const fabric = z
  .strictObject({
    id: z
      .string()
      .describe('Stable identifier, unique among elements of its kind. This is what a Flow, Scope or Scene names.'),
    label: z.string().describe('The name a reader sees.'),
    description: z.string().describe('What this is, in a sentence.').optional(),
    kind: rendererReference.describe('Which renderer draws this Fabric. Omit it for the default body.').optional(),
    bounds: box.describe('Where the Fabric sits and how large it is.'),
    identity: z.boolean().describe('Whether the Fabric shows its identity chip.').optional(),
    ports: portCounts.optional(),
    properties: properties.describe('Values passed to the renderer that draws this Fabric.').optional(),
    appearance: visualIdentity
      .describe('How this element is drawn, overriding the document-wide treatment.')
      .optional(),
    ...identityFields
  })
  .superRefine(rejectMixedIdentity)
  .transform(({ appearance: wrapped, color, fill, icon, ...value }): Fabric => {
    const unwrapped = identityFrom({ color, fill, icon })
    return wrapped || unwrapped ? { ...value, appearance: wrapped ?? unwrapped } : value
  })

const point = z
  .strictObject({
    id: z
      .string()
      .describe('Stable identifier, unique among elements of its kind. This is what a Flow, Scope or Scene names.'),
    label: z.string().describe('The name a reader sees.'),
    at: coordinate.describe('Where the Point sits.'),
    identity: z.boolean().describe('Whether the Point shows its identity chip.').optional(),
    ports: portCounts.optional(),
    appearance: visualIdentity
      .describe('How this element is drawn, overriding the document-wide treatment.')
      .optional(),
    ...identityFields
  })
  .superRefine(rejectMixedIdentity)
  .transform(({ appearance: wrapped, color, fill, icon, ...value }): DiagramPoint => {
    const unwrapped = identityFrom({ color, fill, icon })
    return wrapped || unwrapped ? { ...value, appearance: wrapped ?? unwrapped } : value
  })

const flowAppearance = z.strictObject({
  line: z.enum(lineStyleValues).describe(lineStyleDescription).optional()
})
const flowBase = {
  id: z.string().describe('Stable identifier, unique among elements of its kind. This is what a Scope or Scene names.'),
  family: z
    .string()
    .describe('Identifier of the Flow Family this Flow belongs to, which supplies its treatment.')
    .optional(),
  identity: z.boolean().describe('Whether the Flow shows its identity chip.').optional(),
  appearance: flowAppearance.describe('How this Flow is drawn, overriding its Family.').optional(),
  line: z.enum(lineStyleValues).describe(lineStyleDescription).optional()
}
const structuredFlow = z.strictObject({
  ...flowBase,
  source: endpoint.describe('Where the Flow starts: an element and one of its ports.'),
  target: endpoint.describe('Where the Flow ends: an element and one of its ports.'),
  direction: z.enum(['forward', 'bidirectional']).describe('Whether the Flow is drawn one way or both.').optional(),
  route: z
    .strictObject({
      waypoints: waypoints.optional(),
      labelAt: number
        .describe('How far along the Flow its label sits, from 0 at the source to 1 at the target.')
        .optional()
    })
    .describe('The path the Flow takes, where the default routing is not what you want.')
    .optional()
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
  link: parsedLink.describe('The Flow written in one line: `ELEMENT PORT -> ELEMENT PORT`, or `<->` for both ways.'),
  labelAt: number
    .describe('How far along the Flow its label sits, from 0 at the source to 1 at the target.')
    .optional(),
  waypoints: waypoints.optional()
})
const flow = z
  .union([compactFlow, structuredFlow])
  .superRefine((value, context) => {
    if (value.appearance !== undefined && value.line !== undefined) {
      context.addIssue({
        code: 'custom',
        message: 'Use appearance or line, not both.'
      })
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
    return {
      ...value,
      ...(flowAppearanceValue ? { appearance: flowAppearanceValue } : {})
    }
  })

const overlay = z
  .strictObject({
    id: z
      .string()
      .describe('Stable identifier, unique among elements of its kind. This is what a Flow, Scope or Scene names.'),
    label: z.string().describe('The name a reader sees.'),
    description: z.string().describe('What this is, in a sentence.').optional(),
    kind: rendererReference,
    bounds: box.optional(),
    properties: properties.describe('Values passed to the renderer that draws this Overlay.').optional()
  })
  .describe('A figure drawn over the diagram by a named renderer.')

const dynamicIdentity = {
  id: z.string().describe('Stable identifier, unique among Dynamics. This is what a Scene cue names.'),
  label: z.string().describe('The name a reader sees.'),
  description: z.string().describe('What this Dynamic shows, in a sentence.').optional()
}

/**
 * A Dynamic declares a named semantic change and its authored targets.
 *
 * The kind is the discriminator because each kind owns a different target field: a Flow signal and element emphasis are
 * not the same statement with a different value, and a strict union says so rather than accepting either field for either
 * kind.
 */
const dynamic = z.discriminatedUnion('kind', [
  z.strictObject({
    ...dynamicIdentity,
    kind: z.literal('signal-flow').describe('Send a travelling signal along named Flows.'),
    flows: elementIdentifiers.describe('Identifiers of the Flows the signal travels along.')
  }),
  z.strictObject({
    ...dynamicIdentity,
    kind: z.literal('emphasise-elements').describe('Draw attention to named elements.'),
    elements: elementIdentifiers.describe('Identifiers of the elements to emphasise.'),
    // Whether the change is an event or a state a presenter is describing. A strict union keeps it off `signal-flow`,
    // which has no sustained treatment in any renderer to promise.
    depicts: z
      .enum(['event', 'state'])
      .describe('Whether the emphasis marks a moment that happens or a state that holds.')
      .optional()
  })
])

const selection = z
  .strictObject({
    elements: elementIdentifiers.optional(),
    scopes: identifiers.describe('Identifiers of Architectural Scopes, naming their elements in one go.').optional()
  })
  .describe('A set of elements, named directly or through the Scopes that contain them.')

const callout = z.strictObject({
  title: z.string().describe('A heading above the body.').optional(),
  body: z.string().describe('What the Callout says.'),
  takeaways: identifiers.describe('Short points listed beneath the body.').optional(),
  placement: z
    .union([
      z.strictObject({ at: coordinate }),
      z.strictObject({ element: z.string().describe('Identifier of the element the Callout sits beside.') })
    ])
    .describe('Where the Callout sits: at a fixed coordinate, or beside a named element.')
    .optional(),
  kind: rendererReference.optional(),
  properties: properties.describe('Values passed to the renderer that draws this Callout.').optional()
})

const visibility = z
  .strictObject({
    show: selection.describe('What this Scene reveals.').optional(),
    hide: selection.describe('What this Scene conceals.').optional()
  })
  .describe('What the Scene shows and hides relative to the whole drawing.')

/**
 * A Scene's request that a named Dynamic play: which one, how often, and where in the Scene's order. Never how long
 * or how. The object stays strict so a cue that carries its own duration is a validation failure, per `DYNAMIC-001`:
 * a stage is an order, and the Sequence paces it.
 */
const sceneCue = z.strictObject({
  dynamic: z.string().describe('Identifier of the Diagram Dynamic to play.'),
  playback: z
    .enum(['once', 'repeat'])
    .describe('Whether the Dynamic plays through once or repeats while the Scene is shown.')
    .optional(),
  stage: z
    .number()
    .int()
    .positive()
    .describe('Which stage of this Scene plays the Dynamic, counting from one. Absent is the first stage.')
    .optional()
})

const sceneShape = {
  id: z
    .string()
    .describe('Stable identifier, unique among elements of its kind. This is what a Flow, Scope or Scene names.'),
  label: z.string().describe('The name a reader sees.'),
  description: z.string().describe('What this is, in a sentence.').optional(),
  visibility: visibility.optional(),
  focus: selection.describe('What this Scene draws attention to among what is visible.').optional(),
  callout: callout.describe('A note shown alongside the drawing while this Scene is on.').optional(),
  cues: z.array(sceneCue).readonly().describe('Dynamics this Scene asks to play.').optional()
}

const sequence = z.strictObject({
  id: z
    .string()
    .describe('Stable identifier, unique among elements of its kind. This is what a Flow, Scope or Scene names.'),
  label: z.string().describe('The name a reader sees.'),
  description: z.string().describe('What this is, in a sentence.').optional(),
  presentation: z
    .strictObject({
      display: z.enum(['expanded', 'collapsed']).describe('Whether the Sequence opens expanded or collapsed.'),
      timed: z.boolean().describe('Whether Scenes advance on their own durations rather than waiting to be stepped.'),
      callouts: z.boolean().describe('Whether Scene Callouts are shown.')
    })
    .describe('How the Sequence is presented when it opens.'),
  scenes: z
    .array(
      z.strictObject({
        ...sceneShape,
        duration: number.describe('How long this Scene holds, in seconds, when the Sequence is timed.').optional()
      })
    )
    .readonly()
    .describe('The Scenes in the order they are stepped through.')
})

const realising = {
  realisedBy: elementIdentifiers.describe('Identifiers of the diagram elements that realise this.').optional()
}

const operation = z.strictObject({
  id: z
    .string()
    .describe('Stable identifier, unique among elements of its kind. This is what a Flow, Scope or Scene names.'),
  label: z.string().describe('The name a reader sees.'),
  description: z.string().describe('What this is, in a sentence.').optional(),
  ...realising
})

const interfaceContract = z.strictObject({
  id: z
    .string()
    .describe('Stable identifier, unique among elements of its kind. This is what a Flow, Scope or Scene names.'),
  label: z.string().describe('The name a reader sees.'),
  description: z.string().describe('What this is, in a sentence.').optional(),
  operations: z.array(operation).readonly().describe('The operations this interface offers.').optional(),
  ...realising
})

const specificationDocument = z
  .strictObject({
    code: z.string().describe('The published designation, such as a standard number.').optional(),
    href: z.string().describe('Where the document can be read.').optional(),
    version: z.string().describe('The edition this Specification is written against.').optional()
  })
  .describe('A published document a Specification points at.')

const specification = z.strictObject({
  id: z
    .string()
    .describe('Stable identifier, unique among elements of its kind. This is what a Flow, Scope or Scene names.'),
  label: z.string().describe('The name a reader sees.'),
  description: z.string().describe('What this is, in a sentence.').optional(),
  owner: z.string().describe('The body responsible for the Specification.').optional(),
  documents: z
    .array(specificationDocument)
    .readonly()
    .describe('Published documents this Specification points at.')
    .optional(),
  interfaces: z.array(interfaceContract).readonly().describe('Interfaces the Specification defines.').optional(),
  ...realising
})

const specificationGroup = z.strictObject({
  id: z
    .string()
    .describe('Stable identifier, unique among elements of its kind. This is what a Flow, Scope or Scene names.'),
  label: z.string().describe('The name a reader sees.'),
  description: z.string().describe('What this is, in a sentence.').optional(),
  specifications: z.array(specification).readonly().describe('The Specifications this group owns.')
})

const diagram = z.strictObject({
  bounds: box.describe('The drawing area every element is placed within.'),
  gridSize: z
    .number()
    .int()
    .nonnegative()
    .describe('The spacing elements snap to while being edited. 0 disables snapping.'),
  appearance: appearance
    .describe('Document-wide treatment every element inherits unless it says otherwise.')
    .optional(),
  collections: z
    .array(collection)
    .readonly()
    .describe('Named groupings a Card can belong to, so several Cards share one identity.')
    .optional(),
  families: z
    .array(family)
    .readonly()
    .describe('Named Flow kinds, so several Flows share one line treatment and legend entry.')
    .optional(),
  cards: z.array(card).readonly().describe('The named parts of the system, drawn as placed rectangles.').optional(),
  fabrics: z
    .array(fabric)
    .readonly()
    .describe('Shared media that many parts connect to, rather than connecting to each other.')
    .optional(),
  points: z
    .array(point)
    .readonly()
    .describe('Small placed markers, for a junction, a tap, or anything without a body.')
    .optional(),
  regions: z
    .array(region)
    .readonly()
    .describe('Background areas that group what sits inside them, drawn behind everything else.')
    .optional(),
  flows: z
    .array(flow)
    .readonly()
    .describe('Connections between placed elements, each running from one port to another.')
    .optional(),
  overlays: z.array(overlay).readonly().describe('Figures drawn over the diagram by a named renderer.').optional(),
  dynamics: z
    .array(dynamic)
    .readonly()
    .describe('Named changes a Scene can ask to play, such as a travelling signal or an emphasis.')
    .optional(),
  calloutPositions: z
    .array(coordinate)
    .readonly()
    .describe('Positions a Scene Callout may occupy, in preference order.')
    .optional()
})

/** Validate an authored Infoschematic document against the canonical domain contract. */
export const infoschematicSchema = z
  .strictObject({
    id: z.string().describe('Stable identifier for this document, unique across the documents shown together.'),
    title: z.string().describe('The name the document is known by.'),
    subtitle: z.string().describe('A qualifying line shown beneath the title.').optional(),
    description: z.string().describe('What the document is for, in a sentence or two.').optional(),
    diagram: diagram.describe('The drawing: its area, its treatment, and every element placed in it.'),
    scopes: z
      .array(architecturalScope)
      .readonly()
      .describe('Named groupings of elements, so a Scene can name many at once.')
      .optional(),
    specifications: z
      .array(specificationGroup)
      .readonly()
      .describe('Specifications the elements realise, grouped by the body that owns them.')
      .optional(),
    sequences: z
      .array(sequence)
      .readonly()
      .describe('Ordered walkthroughs of the drawing, each a series of Scenes.')
      .optional()
  })
  .describe('An authored Infoschematic: one drawing and everything a reader can be shown about it.')

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
