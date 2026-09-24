import { type InfoschematicInput, rendererReferenceOf } from '@infoschematics/domain-model'
import {
  type CardDetailOverrides,
  drawsOwnCode,
  type RenderedSize,
  resolveReadableInk,
  resolveRegionTreatment,
  resolveResponsiveCardTreatment,
  resolveVisualTreatment
} from '@infoschematics/view-model/appearance'
import { adapterBoundsFor, adapterClaspOutline, adapterLabelBaseline } from '@infoschematics/view-model/assembly'
import { resolveCardLayout } from '@infoschematics/view-model/card-layout'
import { type CodeBadgeAnchor, codeBadgeRadius, resolveCodeBadge } from '@infoschematics/view-model/code-badge'
import { type DetailBand, resolveDetailTreatment } from '@infoschematics/view-model/detail'
import { type DynamicOccurrence, resolveDiagramDynamics } from '@infoschematics/view-model/dynamics'
import { emphasisPerimeterPath, emphasisPointRadius } from '@infoschematics/view-model/perimeter'
import { resolvePointLabel } from '@infoschematics/view-model/point-layout'
import { regionGeometry } from '@infoschematics/view-model/region-geometry'
import { svgResourcePrefix } from '@infoschematics/view-model/resources'
import { createInfoschematicRuntime } from '@infoschematics/view-model/runtime'
import {
  type ArtworkPaint,
  type ArtworkPrimitive,
  type ArtworkRequest,
  type ArtworkResource,
  type ArtworkStroke,
  artworkProperties,
  standardArtworkFor,
  standardArtworkSchemaVersion
} from '@infoschematics/view-model/standard-artwork'
import {
  adaptivePaint,
  type PaintRoles,
  type PaintScheme,
  paintDeclarations,
  paintFor,
  visualTokens
} from '@infoschematics/view-model/tokens'

const canvasTokens = visualTokens.canvas

export type SvgSceneSelection =
  | { kind: 'sequence'; sceneIndex: number; sequenceId: string }
  | { kind: 'standalone'; sceneId: string }
  | { kind: 'theme'; sceneId: string; themeId: string }
  | { kind: 'story'; sceneIndex: number; storyId: string }

export type SvgVisibilityOptions = {
  /**
   * Which authored Graphic overlays to include. Defaults to every authored one.
   *
   * `scene` narrows the set to the Graphics the selected Scene names, which is what this defaulted to until an
   * authored document proved the default unreachable: no authored Scene can name a Graphic, so every authored
   * Overlay was filtered out of every still rendering — `ADR-INFOSCHEMATICS-033`.
   */
  graphics?: 'all' | 'none' | 'scene'
  /** Scope ids to show. Omit this field to show every declared Scope. */
  scopes?: readonly string[]
  /** What to do with content outside the selected Scene. Defaults to `dim`. */
  unfocused?: 'dim' | 'hide' | 'show'
}

/** Which kinds of visible element draw their code because the caller asked, rather than because an author did. */
export type SvgCodeAnnotations = {
  /** Every visible Card, Adapter and Fabric draws its code, as the Canvas's tags do. Defaults to off. */
  components?: boolean
  /** Every visible Flow draws its code. Defaults to off. */
  flows?: boolean
}

export type RenderInfoschematicSvgOptions = {
  /**
   * Which visible elements draw their code, which is the caller asking rather than the author. Defaults to none.
   *
   * `true` means every kind the live view's tags cover — Cards, Adapters, Fabrics and Flows — so a still and a live
   * view asked the same question answer it the same way. A caller that wants only some of them names those instead,
   * which is how a page showing a still beside an unannotated live view keeps the two saying the same thing. An
   * element whose author said it carries its code draws it whatever this option says.
   */
  annotations?: boolean | SvgCodeAnnotations
  /** Override authored Card metadata visibility without removing authored data. */
  cardDetails?: CardDetailOverrides
  /**
   * The detail band this still is drawn in, as an interactive view would have resolved it from magnification.
   *
   * This is what makes a still of a magnified part match what a reader saw: the Canvas resolves a band from the scale
   * its viewport is drawn at, and a caller that wants the same drawing hands that band straight over. Omitted, the
   * output is `full` — everything asked for — so a caller that never heard of a band renders exactly what it always
   * did. A band only ever withholds, so it cannot restore a row `cardDetails` turned off.
   *
   * Given alongside `responsiveCardDetails`, the band wins: it is an answer, and the size is the question.
   */
  detail?: DetailBand
  /** Opt into responsive Card detail for this explicit rendered output size. */
  responsiveCardDetails?: RenderedSize
  /**
   * Which colour scheme this rendering is painted in. Defaults to `light`.
   *
   * A named scheme is resolved once and written as colours, which is what a raster encoder and a print path need:
   * neither has a preference left to read. `adaptive` instead carries both palettes in the document's own
   * stylesheet behind `prefers-color-scheme`, so one committed SVG reads correctly for someone whose preference
   * this renderer will never know. An authored blueprint surface is not a scheme and overrides either, per
   * `ADR-INFOSCHEMATICS-037`.
   */
  scheme?: RenderedScheme
  /** An authored Scene to render without introducing playback or other motion. */
  scene?: SvgSceneSelection
  /** Host-owned Dynamic occurrences, interpreted as this renderer's still treatment. Defaults to none. */
  dynamics?: readonly DynamicOccurrence[]
  /** Flow ids to emphasise deterministically without serialising animation. */
  signals?: readonly string[]
  /** Host-owned prefix for internal SVG resource ids. Use a unique value for each inline SVG. */
  resourceIdPrefix?: string
  visibility?: SvgVisibilityOptions
}

/**
 * How a rendering answers the colour-scheme question.
 *
 * A `PaintScheme` names the answer, and `adaptive` declines to: the document then carries every palette it might
 * need and lets whatever displays it choose. `blueprint` is accepted here because a caller may pin it, but a
 * document that authored it does not need to.
 */
export type RenderedScheme = PaintScheme | 'adaptive'

/** The attribute that says which palette a rendering was painted from, and scopes the block that declares it. */
const paintMarker = 'data-infoschematic-paint'

/**
 * The palette a rendering carries, as a stylesheet inside the document.
 *
 * Scoped to the marker attribute rather than `:root`, because `:root` is this `<svg>` in a standalone file and the
 * host's `<html>` once the same markup is inlined into a page — which would declare a drawing's palette over
 * everything around it. Declaring on the drawing's own element is enough either way: custom properties inherit, and
 * the selector names the palette, so two drawings resolved differently on one page do not reach each other.
 *
 * A resolved rendering carries one block, which looks redundant beside colours it already wrote as attributes and
 * is not. A presentation attribute loses to any CSS declaration, so the moment such a drawing is inlined into a page
 * that loads the Canvas stylesheet — the guide's own light-beside-dark gallery, a README rendered in place — every
 * `fill: var(--infoschematic-canvas-paint-…)` rule repaints it in the page's scheme, and `--scheme dark` produces a
 * drawing indistinguishable from `--scheme light`. Declaring the palette it settled on makes those rules resolve to
 * the rendering's own colours rather than the host's.
 *
 * `adaptive` carries every palette it might need instead. Paper is light whatever the screen was: a dark palette
 * printed is a page of ink and a reader who cannot read the result, so the print rule comes last and restores the
 * light palette. An authored blueprint outranks both, because that is a treatment its author chose rather than a
 * scheme resolved for a reader.
 */
const paintPalettes = (depth: number, marker: RenderedScheme) => {
  const indentation = '  '.repeat(depth)
  const block = (indent: string, scheme: PaintScheme) => [
    `${indent}[${paintMarker}="${marker}"] {`,
    ...paintDeclarations(scheme).map(([name, value]) => `${indent}  ${name}: ${value};`),
    `${indent}}`
  ]
  if (marker !== 'adaptive') {
    return [`${indentation}<style>`, ...block(`${indentation}  `, marker), `${indentation}</style>`].join('\n')
  }
  return [
    `${indentation}<style>`,
    ...block(`${indentation}  `, 'light'),
    `${indentation}  @media (prefers-color-scheme: dark) {`,
    ...block(`${indentation}    `, 'dark'),
    `${indentation}  }`,
    `${indentation}  @media print {`,
    ...block(`${indentation}    `, 'light'),
    `${indentation}  }`,
    `${indentation}</style>`
  ].join('\n')
}

type Attributes = readonly (readonly [name: string, value: boolean | number | string | undefined])[]

type ResolvedFocus = {
  artefacts: ReadonlySet<string>
  flows: ReadonlySet<string>
  graphics: ReadonlySet<string>
}

const xmlText = (value: string) =>
  value
    // biome-ignore lint/suspicious/noControlCharactersInRegex: deliberately strips XML-illegal control characters
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '\uFFFD')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')

const xmlAttribute = (value: string) => xmlText(value).replaceAll('"', '&quot;').replaceAll("'", '&apos;')

const number = (value: number) => {
  if (!Number.isFinite(value)) throw new TypeError(`SVG coordinates must be finite numbers; received ${value}`)
  return Object.is(value, -0) ? '0' : String(value)
}

const literal = (value: boolean | number | string) => (typeof value === 'number' ? number(value) : String(value))

/**
 * One element's attributes, with any custom-property reference moved into an inline style.
 *
 * `fill="var(--paint)"` is only a CSS value where SVG 2's presentation-attribute parsing is implemented, so it
 * resolves in some engines and silently paints black in others. `style="fill: var(--paint)"` is the one spelling
 * every engine agrees on — and a self-theming rendering is precisely the output that ends up in a browser nobody
 * chose, in somebody else's README. A rendering that resolved its scheme writes colours and never reaches this.
 */
const attributes = (values: Attributes) => {
  const present = values.filter(
    (entry): entry is readonly [string, boolean | number | string] => entry[1] !== undefined
  )
  const referenced = present.filter(([, value]) => typeof value === 'string' && value.startsWith('var('))
  const written = present
    .filter((entry) => !referenced.includes(entry))
    .map(([name, value]) => ` ${name}="${xmlAttribute(literal(value))}"`)
    .join('')
  if (referenced.length === 0) return written
  const declarations = referenced.map(([name, value]) => `${name}: ${literal(value)}`).join('; ')
  return `${written} style="${xmlAttribute(declarations)}"`
}

const line = (depth: number, name: string, values: Attributes, content?: string) => {
  const indentation = '  '.repeat(depth)
  const opening = `${indentation}<${name}${attributes(values)}`
  return content === undefined ? `${opening} />` : `${opening}>${content}</${name}>`
}

const container = (depth: number, name: string, values: Attributes, children: readonly string[]) => {
  const indentation = '  '.repeat(depth)
  return [`${indentation}<${name}${attributes(values)}>`, ...children, `${indentation}</${name}>`]
}

const group = (depth: number, values: Attributes, children: readonly string[]) =>
  container(depth, 'g', values, children)

/*
 * One drawn code, wherever it is drawn and whoever asked for it.
 *
 * An author saying an element carries its code permanently and a caller asking for every code produce the same chip
 * in the same place — `ROUTE-021` — so both come through here, and `resolveCodeBadge` rather than this file decides
 * where that place is for each kind of element.
 */
const codeBadge = (depth: number, values: Attributes, anchor: CodeBadgeAnchor, code: string, paint: PaintRoles) => {
  const placement = resolveCodeBadge(anchor, code)
  return group(depth, values, [
    line(depth + 1, 'rect', [
      ['fill', paint.annotationFill],
      ['height', placement.height],
      ['rx', codeBadgeRadius],
      ['stroke', paint.annotationStroke],
      ['width', placement.width],
      ['x', placement.x],
      ['y', placement.y]
    ]),
    line(
      depth + 1,
      'text',
      [
        ['fill', paint.annotationText],
        ['font-family', canvasTokens.typography.staticCodeFamily],
        ['font-size', canvasTokens.typography.annotationFontSize],
        ['font-weight', 700],
        ['text-anchor', 'middle'],
        ['x', placement.textX],
        ['y', placement.textY]
      ],
      xmlText(code)
    )
  ]).join('\n')
}

/*
 * The standard renderer catalogue, emitted as strings.
 *
 * `standard-artwork.ts` states each piece once as geometry and paint roles; this walks that description into the
 * attribute-per-element idiom this renderer writes, and Canvas walks the same description into React elements. The
 * artwork itself is stated in neither renderer, which is the whole point: a named `kind` that drew a satellite link
 * in Canvas and a plain rectangle here is the defect `INFOSCHEMATICS-TOOL-088` already records once.
 */
const artworkTokens = visualTokens.canvas.artwork

type ArtworkPalette = Readonly<Record<ArtworkPaint, string>>

const strokeAttributes = (stroke: ArtworkStroke | undefined, ink: ArtworkPalette): Attributes =>
  stroke
    ? [
        ['stroke', ink[stroke.paint]],
        ['stroke-dasharray', stroke.dash],
        ['stroke-linecap', stroke.cap],
        ['stroke-linejoin', stroke.join],
        ['stroke-width', stroke.width]
      ]
    : []

const artworkFontSize = (role: 'caption' | 'detail' | 'glyph') =>
  role === 'caption'
    ? artworkTokens.geometry.captionSize
    : role === 'detail'
      ? artworkTokens.geometry.detailSize
      : artworkTokens.geometry.glyphSize

/** A piece's primitives, resolved against this renderer's palette and this rendering's resource ids. */
const artworkPrimitives = (
  primitives: readonly ArtworkPrimitive[],
  depth: number,
  ink: ArtworkPalette,
  resourceId: (name: string) => string
): readonly string[] =>
  primitives.flatMap((primitive): readonly string[] => {
    if (primitive.shape === 'group')
      return group(
        depth,
        [
          [
            'transform',
            `translate(${number(primitive.x)} ${number(primitive.y)})${primitive.scale === undefined ? '' : ` scale(${number(primitive.scale)})`}`
          ]
        ],
        artworkPrimitives(primitive.children, depth + 1, ink, resourceId)
      )
    if (primitive.shape === 'rect')
      return [
        line(depth, 'rect', [
          [
            'fill',
            primitive.pattern ? `url(#${resourceId(primitive.pattern)})` : primitive.fill ? ink[primitive.fill] : 'none'
          ],
          ['height', primitive.height],
          ['rx', primitive.radius],
          ...strokeAttributes(primitive.stroke, ink),
          ['width', primitive.width],
          ['x', primitive.x],
          ['y', primitive.y]
        ])
      ]
    if (primitive.shape === 'circle')
      return [
        line(depth, 'circle', [
          ['cx', primitive.cx],
          ['cy', primitive.cy],
          ['fill', primitive.fill ? ink[primitive.fill] : 'none'],
          ['r', primitive.r],
          ...strokeAttributes(primitive.stroke, ink)
        ])
      ]
    if (primitive.shape === 'path')
      return [
        line(depth, 'path', [
          ['d', primitive.d],
          [
            'fill',
            primitive.pattern ? `url(#${resourceId(primitive.pattern)})` : primitive.fill ? ink[primitive.fill] : 'none'
          ],
          ['marker-end', primitive.markerEnd ? `url(#${resourceId(primitive.markerEnd)})` : undefined],
          ...strokeAttributes(primitive.stroke, ink)
        ])
      ]
    return [
      line(
        depth,
        'text',
        [
          ['dominant-baseline', 'middle'],
          ['fill', ink[primitive.fill]],
          /* The scale is shared and the family is not, exactly as a Card's already is: this renderer sets its own
             paper face, and Canvas sets the interactive surface's. */
          ['font-family', canvasTokens.typography.staticBodyFamily],
          ['font-size', artworkFontSize(primitive.role)],
          ['font-weight', primitive.role === 'caption' || primitive.role === 'glyph' ? 600 : undefined],
          ['text-anchor', primitive.anchor],
          ['x', primitive.x],
          ['y', primitive.y]
        ],
        xmlText(primitive.text)
      )
    ]
  })

/** A piece's `defs`, under ids this rendering owns rather than a name two renderings on one page would share. */
const artworkResources = (
  resources: readonly ArtworkResource[],
  ink: ArtworkPalette,
  resourceId: (name: string) => string
): readonly string[] =>
  resources.flatMap((resource): readonly string[] =>
    resource.resource === 'pattern'
      ? container(
          2,
          'pattern',
          [
            ['height', resource.pitch],
            ['id', resourceId(resource.name)],
            ['patternUnits', 'userSpaceOnUse'],
            ['width', resource.pitch]
          ],
          [
            line(3, 'path', [
              ['d', `M${number(resource.pitch)} 0 H0 V${number(resource.pitch)}`],
              ['fill', 'none'],
              ['stroke', ink[resource.paint]],
              ['stroke-width', resource.width]
            ]),
            line(3, 'circle', [
              ['cx', resource.dotRadius],
              ['cy', resource.dotRadius],
              ['fill', ink[resource.paint]],
              ['r', resource.dotRadius]
            ])
          ]
        )
      : container(
          2,
          'marker',
          [
            ['id', resourceId(resource.name)],
            ['markerHeight', resource.size],
            ['markerUnits', 'userSpaceOnUse'],
            ['markerWidth', resource.size],
            /* `auto`, never `auto-start-reverse`: the same rasteriser limitation the Flow arrowhead records. */
            ['orient', 'auto'],
            ['refX', resource.refX],
            ['refY', resource.refY],
            /* A `viewBox` is what makes the head scale with the band it arms. Without one, `markerUnits` only clips
               and the arrow is drawn at whatever size its own path states, which is how a head sized for one piece
               arrives wrong on every other. */
            ['viewBox', resource.viewBox]
          ],
          [
            line(3, 'path', [
              ['d', resource.d],
              ['fill', ink[resource.fill]]
            ])
          ]
        )
  )

const focusOf = (scene: {
  components: readonly string[]
  flows: readonly string[]
  graphic?: { id: string }
}): ResolvedFocus => ({
  artefacts: new Set(scene.components),
  flows: new Set(scene.flows),
  graphics: new Set(scene.graphic ? [scene.graphic.id] : [])
})

const resolveFocus = (
  runtime: ReturnType<typeof createInfoschematicRuntime>,
  selection: SvgSceneSelection | undefined
): ResolvedFocus | undefined => {
  if (!selection) return undefined

  if (selection.kind === 'standalone') {
    const legacyScene = runtime.compatibilityConfig.standaloneScenes.find(
      (candidate) => candidate.id === selection.sceneId
    )
    const scene = runtime.standaloneScenes.find(
      (candidate) => candidate.id === (legacyScene?.code ?? selection.sceneId)
    )
    if (!scene) throw new Error(`Unknown Standalone Scene: ${selection.sceneId}`)
    return focusOf(scene)
  }

  if (selection.kind === 'theme') {
    const legacyScene = runtime.compatibilityConfig.themes
      .find((candidate) => candidate.id === selection.themeId)
      ?.scenes.find((candidate) => candidate.id === selection.sceneId)
    const scene = runtime.expandedScenes.find((candidate) => candidate.id === (legacyScene?.code ?? selection.sceneId))
    if (!scene) throw new Error(`Unknown Scene in Theme ${selection.themeId}: ${selection.sceneId}`)
    return focusOf(scene)
  }

  if (selection.kind === 'sequence') {
    const sequence = runtime.sequences.find((candidate) => candidate.id === selection.sequenceId)
    if (!sequence) throw new Error(`Unknown Sequence: ${selection.sequenceId}`)
    const scene = sequence.scenes[selection.sceneIndex]
    if (!scene) throw new Error(`Unknown Sequence Scene in ${selection.sequenceId}: ${selection.sceneIndex}`)
    return focusOf(scene)
  }

  const legacyStory = runtime.compatibilityConfig.stories.find((candidate) => candidate.id === selection.storyId)
  const story = runtime.stories.find((candidate) => candidate.id === (legacyStory?.code ?? selection.storyId))
  if (!story) throw new Error(`Unknown Story: ${selection.storyId}`)
  const scene = story.steps[selection.sceneIndex]
  if (!scene) throw new Error(`Unknown Story Scene in ${selection.storyId}: ${selection.sceneIndex}`)
  return focusOf(scene)
}

const focusClass = (
  id: string,
  focused: ReadonlySet<string> | undefined,
  unfocused: NonNullable<SvgVisibilityOptions['unfocused']>
) => (focused && !focused.has(id) && unfocused === 'dim' ? ' is-unfocused' : '')

const includedByFocus = (
  id: string,
  focused: ReadonlySet<string> | undefined,
  unfocused: NonNullable<SvgVisibilityOptions['unfocused']>
) => !focused || focused.has(id) || unfocused !== 'hide'

/**
 * Render one complete, standalone SVG document from serialisable Infoschematic data.
 *
 * The function reads no DOM state and has no renderer registry. Authored Graphics
 * therefore use a labelled geometric fallback in this framework-neutral output.
 */
type EmphasisShape = readonly [element: string, values: Attributes]

const emphasis = canvasTokens.emphasis
const arrow = canvasTokens.arrowhead

/**
 * One arrowhead definition: which way its triangle faces, and what paints it.
 *
 * Neither axis is authored. Direction comes from the route — a bidirectional Flow carries its one head at the start,
 * facing back out of its source — and paint comes from whether an emphasis is drawn over that route. This renderer
 * writes a colour as a literal attribute, because `context-stroke` is SVG 2 and the rasteriser behind the command
 * line does not resolve it, so an emphasised head is a second definition here where the Canvas needs only a second
 * stroke.
 */
type Arrowhead = Readonly<{ color: string; direction: 'forward' | 'reversed'; id: string }>

/** The reference for one end of a route, or nothing when the head belongs at the other end. */
const arrowReference = (head: Arrowhead | undefined, end: 'end' | 'start'): string | undefined =>
  head && (head.direction === 'reversed' ? end === 'start' : end === 'end') ? `url(#${head.id})` : undefined

/**
 * The still interpretation of element emphasis: an outline around whatever the element already occupies.
 *
 * It is drawn from geometry alone, so emphasising a Card, a Region, a Point or a Flow needs no knowledge of how that
 * element is painted, and emphasis can never change the element's own output.
 *
 * The box perimeter is the shared View Model calculation rather than a `rect` stated here, because the interactive
 * renderer sends a mark along that same line and the two cannot be allowed to disagree about where it runs. Nothing
 * travels here: a single frame has no time to travel, and the direction a mark traces is chosen from the geometry
 * rather than stated by the document, so there is no authored direction for a still frame to record.
 * `ADR-INFOSCHEMATICS-027` records that decision and its cost.
 */
const boxEmphasis = (box: { height: number; width: number; x: number; y: number }): EmphasisShape => [
  'path',
  [
    ['d', emphasisPerimeterPath(box)],
    ['fill', 'none'],
    ['stroke', emphasis.stroke],
    ['stroke-width', emphasis.strokeWidth]
  ]
]

const pointEmphasis = (at: { x: number; y: number }): EmphasisShape => [
  'circle',
  [
    ['cx', at.x],
    ['cy', at.y],
    ['fill', 'none'],
    /* The shared View Model radius rather than the same two tokens summed here, for the reason the box perimeter is
       shared: DYNAMIC-003 puts a treatment's geometry in one calculation both renderers draw from, and a ring summed
       independently in each is a ring that can disagree. */
    ['r', emphasisPointRadius],
    ['stroke', emphasis.stroke],
    ['stroke-width', emphasis.strokeWidth]
  ]
]

const routeEmphasis = (d: string, head: Arrowhead | undefined): EmphasisShape => [
  'path',
  [
    ['d', d],
    ['fill', 'none'],
    /* The overlay carries its own head, drawn over the Flow's, so an emphasised Flow reads as one emphasised thing
    rather than an amber route ending in a family-coloured point. The Flow's own head is untouched underneath —
    which is the distinction DYNAMIC-003 draws between what an occurrence may decorate and what an element outputs. */
    ['marker-end', arrowReference(head, 'end')],
    ['marker-start', arrowReference(head, 'start')],
    ['stroke', emphasis.stroke],
    ['stroke-linecap', canvasTokens.flows.lineCap],
    ['stroke-linejoin', canvasTokens.flows.lineJoin],
    ['stroke-width', emphasis.strokeWidth]
  ]
]

export const renderInfoschematicSvg = (
  input: InfoschematicInput,
  options: RenderInfoschematicSvgOptions = {}
): string => {
  const runtime = createInfoschematicRuntime(input)
  const config = runtime.config
  const definition = config.diagram
  const viewBox = definition.bounds
  const requestedVisualTreatment = resolveVisualTreatment(definition.appearance, options.cardDetails)
  const authoredGridSize = definition.gridSize
  const gridSize = authoredGridSize || 1
  const gridMajorSize = gridSize * (canvasTokens.geometry.gridMajorSize / canvasTokens.geometry.gridSize)
  const visualTreatment = {
    ...requestedVisualTreatment,
    grid: authoredGridSize === 0 ? ('none' as const) : requestedVisualTreatment.grid,
    card: options.detail
      ? resolveDetailTreatment(options.detail, requestedVisualTreatment.card)
      : options.responsiveCardDetails
        ? resolveResponsiveCardTreatment(viewBox, options.responsiveCardDetails, requestedVisualTreatment.card)
        : requestedVisualTreatment.card
  }
  /* What the caller asked to see, kept apart from what an author said: an element draws its code if either says so,
     and neither answer is derived from the other. */
  const revealed =
    options.annotations === true
      ? { components: true, flows: true }
      : {
          components: options.annotations !== false && options.annotations?.components === true,
          flows: options.annotations !== false && options.annotations?.flows === true
        }
  const legacyFlowIds = new Map(runtime.compatibilityConfig.infoschematic.flows.map((flow) => [flow.id, flow.code]))
  const declaredDynamics = new Map(definition.dynamics.map((dynamic) => [dynamic.id, dynamic]))
  const resolvedDynamics = resolveDiagramDynamics(definition.dynamics, options.dynamics ?? [])
  /* A resolved Flow signal and the direct `signals` option say the same thing, so they meet here and receive one
     treatment rather than two that could drift. */
  const signalledFlows = new Set(
    [...(options.signals ?? []), ...resolvedDynamics.signals.map(({ flowId }) => flowId)].map(
      (id) => legacyFlowIds.get(id) ?? id
    )
  )
  /* One palette, resolved once, for every colour this rendering writes.
     The surface-sensitive tokens used to be picked one branch at a time, and a token left on the light set alone
     painted a light slab onto the blueprint backdrop. There is now nothing to pick: an authored blueprint surface
     is its own palette, anything else takes the scheme the caller asked for, and a role neither answers does not
     exist. */
  const requestedScheme = options.scheme ?? 'light'
  /* A drawing that defers the scheme carries the palettes with it; one that was given a scheme carries colours. An
     authored blueprint is a palette in its own right, so there is nothing for a reader's preference to change. */
  const adaptive = requestedScheme === 'adaptive' && visualTreatment.surface !== 'blueprint'
  /* Which palette this rendering settled on, and the value it marks itself with so the block it carries reaches it
     and nothing else. An authored blueprint answers for itself; a caller who asked to defer and was overruled by one
     is marked `blueprint` rather than `adaptive`, because that is what it is. */
  const resolvedScheme: PaintScheme =
    visualTreatment.surface === 'blueprint' ? 'blueprint' : requestedScheme === 'adaptive' ? 'light' : requestedScheme
  const paintMarkerValue: RenderedScheme = adaptive ? 'adaptive' : resolvedScheme
  const paint = adaptive ? adaptivePaint : paintFor(resolvedScheme)
  const backdrop = paint.backdrop
  const regionStroke = paint.regionStroke
  const visibleScopes = new Set(options.visibility?.scopes ?? config.scopes.map((scope) => scope.id))
  const unfocused = options.visibility?.unfocused ?? 'dim'
  const graphicVisibility = options.visibility?.graphics ?? 'all'
  const resourceIdPrefix = svgResourcePrefix(options.resourceIdPrefix)
  const focus = resolveFocus(runtime, options.scene)
  const collections = new Map(runtime.infoschematicCollections.map((collection) => [collection.id, collection]))
  const families = new Map(runtime.infoschematicFamilies.map((family, index) => [family.id, { family, index }]))

  const cards = runtime.infoschematicCards.filter(
    (card) =>
      runtime.infoschematicCardIsVisible(card, visibleScopes) && includedByFocus(card.id, focus?.artefacts, unfocused)
  )
  /*
   * An Adapter Card is drawn as a clasp derived from the Card it holds, and its own authored `bounds` do not position
   * it — `ADR-INFOSCHEMATICS-032`. This renderer read those bounds and painted an opaque rectangle, so a still
   * rendering covered the lower half of the held Card and the two renderers placed the same adapter in two places
   * wherever the authored box was not already the derived one. An adapter whose held Card this render did not draw is
   * not drawn either: a clasp with nothing in it is a notch around empty space.
   */
  const heldCards = new Map(cards.map((card) => [card.id, card]))
  const adapters = cards.flatMap((card) => {
    if (!card.wraps) return []
    const held = heldCards.get(card.wraps)
    return held ? [{ card, clasp: adapterBoundsFor(held.bounds), held: held.bounds }] : []
  })
  const plainCards = cards.filter((card) => !card.wraps)
  const fabrics = runtime.infoschematicFabrics.filter(
    (fabric) =>
      runtime.infoschematicFabricIsVisible(fabric, visibleScopes) &&
      includedByFocus(fabric.id, focus?.artefacts, unfocused)
  )
  const points = runtime.infoschematicPoints.filter((point) => includedByFocus(point.id, focus?.artefacts, unfocused))
  const visibleFamilies = new Set(runtime.infoschematicFamilies.map((family) => family.id))
  const flows = runtime.infoschematicFlows.filter(
    (flow) =>
      runtime.infoschematicFlowIsVisible(flow, visibleFamilies, visibleScopes) &&
      includedByFocus(flow.id, focus?.flows, unfocused)
  )
  /*
   * Which arrowheads this document needs, under whose identity.
   *
   * Only the combinations something references are defined, so a document that authors no bidirectional Flow and
   * receives no Dynamic emits the one head per family it always did rather than carrying three it never draws.
   * Identity runs through the same `svgResourcePrefix` as every other definition, so two renders on one page cannot
   * resolve each other's heads.
   */
  const emphasisedElements = new Set(resolvedDynamics.emphasis.map(({ elementId }) => elementId))
  const arrowheadFor = (flow: { bidirectional?: boolean; family: string }, emphasised: boolean) => {
    const resolved = families.get(flow.family)
    if (!resolved) return undefined
    const direction = flow.bidirectional ? ('reversed' as const) : ('forward' as const)
    return {
      color: emphasised ? emphasis.stroke : resolved.family.color,
      direction,
      id: `${resourceIdPrefix}-arrow-${resolved.index}${emphasised ? '-emphasised' : ''}${
        direction === 'reversed' ? '-reversed' : ''
      }`
    } satisfies Arrowhead
  }
  const arrowheads = [
    ...new Map(
      flows
        .flatMap((flow) => [
          arrowheadFor(flow, false),
          emphasisedElements.has(flow.id) ? arrowheadFor(flow, true) : undefined
        ])
        .filter((head): head is Arrowhead => head !== undefined)
        .map((head) => [head.id, head] as const)
    ).values()
  ]

  const graphics = runtime.infoschematicOverlays.filter(
    (graphic) =>
      graphicVisibility !== 'none' &&
      (graphicVisibility === 'all'
        ? includedByFocus(graphic.id, focus?.graphics, unfocused)
        : Boolean(focus?.graphics.has(graphic.id)))
  )

  /*
   * What the standard catalogue draws for this rendering, resolved before anything is written.
   *
   * Resolving up front is what lets every declared resource reach the `defs` block ahead of the element that
   * references it. It is also why a piece is numbered: two Fabrics of the same kind at different sizes declare the
   * same resource name with different geometry, so a name shared across pieces would give the second one the first
   * one's lattice.
   */
  const artworkInk: ArtworkPalette = paint.artwork
  const artworkDefs: string[] = []
  const artworkContent = new Map<string, readonly string[]>()
  const drawStandardArtwork = (
    kind: 'fabric' | 'graphic',
    reference: { key: string; version: number } | undefined,
    artefactId: string,
    request: ArtworkRequest
  ) => {
    if (!reference || reference.version !== standardArtworkSchemaVersion) return
    const piece = standardArtworkFor(kind, reference.key)
    if (!piece) return
    const drawn = piece(request)
    const ordinal = artworkContent.size
    const resourceId = (name: string) => `${resourceIdPrefix}-artwork-${ordinal}-${name}`
    artworkDefs.push(...artworkResources(drawn.resources, artworkInk, resourceId))
    /* The key rides on the group so a rendering says which standard piece it drew. Canvas marks its own the same
       way, which is what lets the parity check compare one piece against the other rather than two whole pages. */
    artworkContent.set(
      artefactId,
      group(2, [['data-artwork', reference.key]], artworkPrimitives(drawn.primitives, 3, artworkInk, resourceId))
    )
  }
  for (const fabric of fabrics)
    drawStandardArtwork(
      'fabric',
      fabric.renderer === undefined ? undefined : rendererReferenceOf(fabric.renderer),
      fabric.id,
      {
        bounds: fabric.bounds,
        detail: fabric.detail,
        label: fabric.label,
        properties: artworkProperties(fabric.properties)
      }
    )
  for (const graphic of graphics)
    if (graphic.bounds)
      drawStandardArtwork('graphic', rendererReferenceOf(graphic.kind), graphic.id, {
        bounds: graphic.bounds,
        detail: graphic.description,
        label: graphic.label,
        properties: artworkProperties(graphic.properties)
      })

  /* Emphasis needs geometry and nothing else, and only from elements this render actually drew: an occurrence must
     never make hidden or filtered content appear. */
  const emphasisShapes = new Map<string, EmphasisShape>()
  for (const region of runtime.infoschematicRegions) emphasisShapes.set(region.id, boxEmphasis(region.box))
  for (const card of plainCards) emphasisShapes.set(card.id, boxEmphasis(card.bounds))
  for (const { card, clasp } of adapters) emphasisShapes.set(card.id, boxEmphasis(clasp))
  for (const fabric of fabrics) emphasisShapes.set(fabric.id, boxEmphasis(fabric.bounds))
  for (const graphic of graphics) if (graphic.bounds) emphasisShapes.set(graphic.id, boxEmphasis(graphic.bounds))
  for (const point of points) emphasisShapes.set(point.id, pointEmphasis(point.at))
  for (const flow of flows) emphasisShapes.set(flow.id, routeEmphasis(flow.d, arrowheadFor(flow, true)))

  /* The accessible statement is the Dynamic's meaning, not the treatment used to depict it. */
  const occurredDynamics = [
    ...new Set(
      (options.dynamics ?? [])
        .map(({ dynamicId }) => declaredDynamics.get(dynamicId)?.label)
        .filter((label): label is string => label !== undefined)
    )
  ]

  const accessibleSummary = [
    config.subtitle,
    config.description,
    occurredDynamics.length > 0 ? `Dynamics: ${occurredDynamics.join('; ')}` : undefined,
    cards.length > 0
      ? `Cards: ${cards
          .map((card) => [card.code, card.label, card.stereotype, card.detail].filter(Boolean).join(' · '))
          .join('; ')}`
      : undefined
  ]
    .filter(Boolean)
    .join(' — ')
  const body: string[] = []
  /* Every code drawn on something other than a Card's own detail row, collected as each element is drawn and laid
     over the diagram at the end, because a code is read against the drawing rather than buried in it. */
  const codeLayer: string[] = []
  /* Region labels, lifted out of their own groups and laid over the Flow layer - `ROUTE-019`. Region-before-Flow is
     the right order for a fill and a frame and the wrong one for the glyphs, which a route that legitimately crosses
     the band would otherwise cut through. Cards are drawn after this, so the label rises above the routes and stays
     under the elements the Region contains. */
  const regionLabelLayer: string[] = []
  if (artworkDefs.length > 0) body.push(['  <defs>', ...artworkDefs, '  </defs>'].join('\n'))
  body.push(line(1, 'title', [], xmlText(config.title)))
  if (accessibleSummary) body.push(line(1, 'desc', [], xmlText(accessibleSummary)))
  body.push(
    line(1, 'rect', [
      ['class', 'infoschematic-backdrop'],
      ['fill', backdrop],
      ['height', viewBox.height],
      ['width', viewBox.width],
      ['x', viewBox.x],
      ['y', viewBox.y]
    ])
  )

  if (arrowheads.length > 0) {
    /* A `marker` element, not a `g`: a marker reference resolves nothing else, so a group here defines an
       arrowhead that is referenced and never drawn. The geometry is the shared token rather than a path string
       stated here, so the same Flow cannot arrive blunt in one renderer and sharp in the other. */
    const markers = arrowheads.map(({ color, direction, id }) =>
      container(
        3,
        'marker',
        [
          ['id', id],
          ['markerHeight', arrow.size],
          ['markerUnits', 'userSpaceOnUse'],
          ['markerWidth', arrow.size],
          /* `auto`, never the SVG 2 `auto-start-reverse` the Canvas uses: the rasteriser chosen in
             `ADR-INFOSCHEMATICS-022` ignores that value and paints the head unrotated rather than failing, so
             every PNG hung a flat pennant off its target and every check agreed. A head that has to face back
             out of its source is mirrored geometry here rather than a reversed axis. */
          ['orient', 'auto'],
          ['refX', direction === 'reversed' ? arrow.reversedRefX : arrow.forwardRefX],
          ['refY', arrow.refY]
        ],
        [
          line(4, 'path', [
            ['d', direction === 'reversed' ? arrow.reversed : arrow.forward],
            ['fill', color]
          ])
        ]
      ).join('\n')
    )
    body.push(['  <defs>', ...markers, '  </defs>'].join('\n'))
  }

  if (visualTreatment.grid !== 'none') {
    const gridStroke = regionStroke
    const patternId = `${resourceIdPrefix}-grid-${visualTreatment.grid}`
    const defs: string[] =
      visualTreatment.grid === 'dots'
        ? // A dot marks each major intersection, so the same lattice the major
          // lines would draw is implied by its corners alone. The tile is offset
          // by half its width and the dot sits at its centre: a dot authored at
          // the tile's corner would be clipped to a quarter by the tile edge.
          [
            `    <pattern${attributes([
              ['height', gridMajorSize],
              ['id', patternId],
              ['patternUnits', 'userSpaceOnUse'],
              ['width', gridMajorSize],
              ['x', -gridMajorSize / 2],
              ['y', -gridMajorSize / 2]
            ])}>`,
            line(3, 'circle', [
              ['cx', gridMajorSize / 2],
              ['cy', gridMajorSize / 2],
              ['fill', gridStroke],
              ['r', canvasTokens.geometry.gridMinorStrokeWidth * 3]
            ]),
            '    </pattern>'
          ]
        : [
            ...(visualTreatment.grid === 'major-plus-minor'
              ? [
                  `    <pattern${attributes([
                    ['height', gridSize],
                    ['id', `${resourceIdPrefix}-grid-minor`],
                    ['patternUnits', 'userSpaceOnUse'],
                    ['width', gridSize]
                  ])}>`,
                  line(3, 'path', [
                    [
                      'd',
                      `M ${number(gridSize)} 0 V ${number(gridSize)} M 0 ${number(gridSize)} H ${number(gridSize)}`
                    ],
                    ['fill', 'none'],
                    ['stroke', gridStroke],
                    ['stroke-width', canvasTokens.geometry.gridMinorStrokeWidth]
                  ]),
                  '    </pattern>'
                ]
              : []),
            `    <pattern${attributes([
              ['height', gridMajorSize],
              ['id', patternId],
              ['patternUnits', 'userSpaceOnUse'],
              ['width', gridMajorSize]
            ])}>`,
            ...(visualTreatment.grid === 'major-plus-minor'
              ? [
                  line(3, 'rect', [
                    ['fill', `url(#${resourceIdPrefix}-grid-minor)`],
                    ['height', gridMajorSize],
                    ['width', gridMajorSize]
                  ])
                ]
              : []),
            line(3, 'path', [
              [
                'd',
                `M ${number(gridMajorSize)} 0 V ${number(gridMajorSize)} M 0 ${number(gridMajorSize)} H ${number(gridMajorSize)}`
              ],
              ['fill', 'none'],
              ['stroke', gridStroke],
              ['stroke-width', canvasTokens.geometry.gridMajorStrokeWidth]
            ]),
            '    </pattern>'
          ]
    body.push(['  <defs>', ...defs, '  </defs>'].join('\n'))
    body.push(
      line(1, 'rect', [
        ['class', 'infoschematic-grid'],
        ['fill', `url(#${patternId})`],
        ['height', viewBox.height],
        ['width', viewBox.width],
        ['x', viewBox.x],
        ['y', viewBox.y]
      ])
    )
  }

  for (const region of runtime.infoschematicRegions) {
    const treatment = resolveRegionTreatment(region)
    const geometry = regionGeometry({ box: region.box, label: region.label, treatment })
    // A boundary-mounted label sits over the backdrop the notch exposes,
    // not the fill, so only a plain label takes its ink from the fill.
    const ink =
      region.fill && geometry.label && treatment.labelTreatment === 'plain' ? resolveReadableInk(region.fill) : null
    const content: string[] = []
    if (region.fill) {
      content.push(
        line(2, 'rect', [
          ['class', 'infoschematic-region-fill'],
          ['fill', region.fill],
          ['height', region.box.height],
          ['rx', region.box.radius ?? canvasTokens.geometry.cornerRadius],
          ['width', region.box.width],
          ['x', region.box.x],
          ['y', region.box.y]
        ])
      )
    }
    if (geometry.outline) {
      content.push(
        line(2, 'path', [
          ['class', 'infoschematic-region-frame'],
          ['d', geometry.outline],
          ['fill', 'none'],
          ['stroke', regionStroke],
          [
            'stroke-dasharray',
            treatment.frame === 'dashed'
              ? canvasTokens.metrics.regionDash
              : treatment.frame === 'dotted'
                ? canvasTokens.metrics.regionDot
                : undefined
          ],
          ['stroke-linecap', treatment.frame === 'dotted' ? 'round' : undefined],
          ['stroke-opacity', treatment.frameOpacity === 1 ? undefined : treatment.frameOpacity]
        ])
      )
    }
    if (geometry.label) {
      /* The glyphs and the band beneath them, drawn in the Region's own layer group over the routes rather than in
         the Region's group under them. The backing takes the surface the label actually sits on: a plain label sets
         down on the fill, a boundary-mounted one sits on the frame line over the backdrop the notch exposes - the
         same reading the ink above takes. */
      const labelContent: string[] = []
      if (geometry.labelBacking) {
        labelContent.push(
          line(2, 'rect', [
            ['class', 'infoschematic-region-label-backing'],
            ['fill', ink !== null && region.fill ? region.fill : backdrop],
            ['height', geometry.labelBacking.height],
            ['width', geometry.labelBacking.width],
            ['x', geometry.labelBacking.x],
            ['y', geometry.labelBacking.y]
          ])
        )
      }
      labelContent.push(
        line(
          2,
          'text',
          [
            ['class', `infoschematic-region-label${treatment.labelTreatment === 'notched' ? ' notched' : ''}`],
            ['data-ink', ink ?? undefined],
            [
              'fill',
              ink !== null
                ? ink === 'light'
                  ? canvasTokens.ink.lightMuted
                  : canvasTokens.ink.darkMuted
                : paint.textMuted
            ],
            ['dominant-baseline', geometry.label.dominantBaseline],
            ['font-family', canvasTokens.typography.staticBodyFamily],
            ['font-size', canvasTokens.typography.metadataFontSize],
            ['lengthAdjust', geometry.label.length === null ? undefined : 'spacingAndGlyphs'],
            ['text-anchor', geometry.label.textAnchor],
            ['textLength', geometry.label.length ?? undefined],
            ['x', geometry.label.x],
            ['y', geometry.label.y]
          ],
          xmlText(region.label.toUpperCase())
        )
      )
      regionLabelLayer.push(
        group(
          1,
          [
            ['class', 'infoschematic-region-label-layer'],
            ['data-artefact-id', region.id],
            ['data-artefact-kind', 'region']
          ],
          labelContent
        ).join('\n')
      )
    }
    if (drawsOwnCode(region, visualTreatment.identity)) {
      codeLayer.push(
        codeBadge(
          1,
          [
            ['class', 'infoschematic-code'],
            ['data-artefact-id', region.id],
            ['data-artefact-kind', 'region'],
            ['data-code', region.id]
          ],
          { box: region.box, kind: 'box' },
          region.id,
          paint
        )
      )
    }
    body.push(
      group(
        1,
        [
          ['aria-label', `Region ${region.label}`],
          ['class', 'infoschematic-region'],
          ['data-frame-treatment', treatment.frame],
          ['data-artefact-id', region.id],
          ['data-artefact-kind', 'region'],
          ['data-id', region.id],
          ['data-label-placement', treatment.label ?? 'none'],
          ['data-label-treatment', treatment.labelTreatment]
        ],
        content
      ).join('\n')
    )
  }

  for (const fabric of fabrics) {
    const box = fabric.bounds
    /* The accessible name is the document's and stays whichever treatment draws the Fabric; only the drawing is the
       catalogue's. An unrecognised key still draws the generic plane below, which is the contract working as
       designed rather than a fault in the document. */
    const content = [
      line(2, 'title', [], xmlText(`${fabric.code}: ${fabric.label} · ${fabric.detail}`)),
      ...(artworkContent.get(fabric.id) ?? [
        line(2, 'rect', [
          ['fill', paint.fabricFill],
          ['height', box.height],
          ['rx', canvasTokens.geometry.cornerRadius],
          ['stroke', paint.fabricStroke],
          ['width', box.width],
          ['x', box.x],
          ['y', box.y]
        ]),
        line(
          2,
          'text',
          [
            ['fill', paint.fabricText],
            ['font-family', canvasTokens.typography.staticBodyFamily],
            ['font-size', canvasTokens.typography.componentFontSize],
            ['text-anchor', 'middle'],
            ['x', box.x + box.width / 2],
            ['y', box.y + box.height / 2 + 4]
          ],
          xmlText(fabric.label)
        )
      ])
    ]
    if (revealed.components || drawsOwnCode(fabric, visualTreatment.identity)) {
      const dimmed = focusClass(fabric.id, focus?.artefacts, unfocused)
      codeLayer.push(
        codeBadge(
          1,
          [
            ['class', `infoschematic-code${dimmed}`],
            ['data-artefact-id', fabric.id],
            ['data-artefact-kind', 'fabric'],
            ['data-code', fabric.code],
            ['opacity', dimmed ? canvasTokens.metrics.unfocusedOpacity : undefined]
          ],
          { box, kind: 'box' },
          fabric.code,
          paint
        )
      )
    }
    body.push(
      group(
        1,
        [
          ['class', `infoschematic-fabric${focusClass(fabric.id, focus?.artefacts, unfocused)}`],
          ['data-code', fabric.code],
          ['data-artefact-id', fabric.id],
          ['data-artefact-kind', 'fabric'],
          ['data-id', fabric.id],
          [
            'opacity',
            focusClass(fabric.id, focus?.artefacts, unfocused) ? canvasTokens.metrics.unfocusedOpacity : undefined
          ]
        ],
        content
      ).join('\n')
    )
  }

  const flowPipe = paint.flowPipe
  for (const flow of flows) {
    const resolved = families.get(flow.family)
    const color = resolved?.family.color ?? paint.unauthored
    const head = arrowheadFor(flow, false)
    const dimmed = focusClass(flow.id, focus?.flows, unfocused)
    const signalled = signalledFlows.has(flow.id)
    const content = [
      line(2, 'title', [], xmlText(flow.code)),
      line(2, 'path', [
        ['d', flow.d],
        ['fill', 'none'],
        ['stroke', flowPipe],
        ['stroke-linecap', canvasTokens.flows.lineCap],
        ['stroke-linejoin', canvasTokens.flows.lineJoin],
        ['stroke-width', canvasTokens.flows.pipeWidth]
      ]),
      line(2, 'path', [
        ['d', flow.d],
        ['fill', 'none'],
        ['marker-end', arrowReference(head, 'end')],
        ['marker-start', arrowReference(head, 'start')],
        ['stroke', color],
        ['stroke-dasharray', flow.dashed ? canvasTokens.flows.dash : undefined],
        ['stroke-linecap', canvasTokens.flows.lineCap],
        ['stroke-linejoin', canvasTokens.flows.lineJoin],
        ['stroke-width', canvasTokens.flows.routeWidth]
      ])
    ]
    if (signalled) {
      content.push(
        line(2, 'path', [
          ['class', 'infoschematic-flow-signal'],
          ['d', flow.d],
          ['fill', 'none'],
          ['stroke', color],
          ['stroke-linecap', canvasTokens.flows.lineCap],
          ['stroke-linejoin', canvasTokens.flows.lineJoin],
          ['stroke-width', canvasTokens.flows.signalStillWidth]
        ])
      )
    }
    body.push(
      group(
        1,
        [
          ['class', `infoschematic-flow${dimmed}${signalled ? ' is-signalled' : ''}`],
          ['data-code', flow.code],
          ['data-artefact-id', flow.id],
          ['data-artefact-kind', 'flow'],
          ['data-id', flow.id],
          ['data-signalled', signalled || undefined],
          ['opacity', dimmed ? canvasTokens.metrics.unfocusedOpacity : undefined]
        ],
        content
      ).join('\n')
    )
  }

  body.push(...regionLabelLayer)

  /* Every visible Flow is placed, not only the coded ones: the placement avoids the other labels on the surface, so
     asking it about a subset would move a chip because a Flow beside it happens to be drawing nothing. */
  const flowCodePositions =
    flows.length > 0 ? runtime.infoschematicAnnotationLabelPositions(flows, visibleScopes) : undefined
  for (const flow of flows) {
    if (!revealed.flows && !drawsOwnCode(flow, visualTreatment.identity)) continue
    const at = flowCodePositions?.get(flow.id)
    if (!at) continue
    const dimmed = focusClass(flow.id, focus?.flows, unfocused)
    codeLayer.push(
      codeBadge(
        1,
        [
          ['class', `infoschematic-flow-annotation${dimmed}`],
          ['data-artefact-id', flow.id],
          ['data-artefact-kind', 'flow'],
          ['data-code', flow.code],
          ['opacity', dimmed ? canvasTokens.metrics.unfocusedOpacity : undefined]
        ],
        { at, kind: 'route' },
        flow.code,
        paint
      )
    )
  }

  /*
   * The clasp, traced as one outline by `adapterClaspOutline` so both renderers draw the same shape, and its label in
   * the footer band below the notch rather than centred in the box — where a non-compact held Card's own label is.
   * Drawn before the cards so the Card it holds sits above it, as the Canvas stacks them.
   */
  for (const { card, clasp, held } of adapters) {
    const dimmed = focusClass(card.id, focus?.artefacts, unfocused)
    if (revealed.components || drawsOwnCode(card, visualTreatment.identity)) {
      codeLayer.push(
        codeBadge(
          1,
          [
            ['class', `infoschematic-code${dimmed}`],
            ['data-artefact-id', card.id],
            ['data-artefact-kind', 'card'],
            ['data-code', card.code],
            ['opacity', dimmed ? canvasTokens.metrics.unfocusedOpacity : undefined]
          ],
          { box: clasp, held, kind: 'clasp' },
          card.code,
          paint
        )
      )
    }
    body.push(
      group(
        1,
        [
          ['aria-label', `${card.label}, holding ${card.wraps}`],
          ['class', `infoschematic-adapter${dimmed}`],
          ['data-artefact-id', card.id],
          ['data-artefact-kind', 'card'],
          ['data-code', card.code],
          ['data-id', card.id],
          ['opacity', dimmed ? canvasTokens.metrics.unfocusedOpacity : undefined]
        ],
        [
          line(2, 'title', [], xmlText([card.code, card.label, card.detail].filter(Boolean).join(' \u00b7 '))),
          line(2, 'path', [
            ['class', 'adapter-socket'],
            ['d', adapterClaspOutline(held, canvasTokens.geometry.cornerRadius)],
            ['fill', paint.graphicFill],
            ['stroke', paint.graphicStroke],
            ['stroke-width', 2]
          ]),
          line(
            2,
            'text',
            [
              ['class', 'adapter-label'],
              ['dominant-baseline', 'middle'],
              ['fill', paint.text],
              ['font-family', canvasTokens.typography.bodyFamily],
              ['font-size', 14],
              ['font-weight', 700],
              ['text-anchor', 'middle'],
              ['x', clasp.x + clasp.width / 2],
              ['y', adapterLabelBaseline(held)]
            ],
            xmlText(card.label)
          )
        ]
      ).join('\n')
    )
  }

  for (const card of plainCards) {
    const box = card.bounds
    const appearance = card.collection ? collections.get(card.collection) : undefined
    const dimmed = focusClass(card.id, focus?.artefacts, unfocused)
    const fill = appearance?.fill ?? paint.surface
    const ink = resolveReadableInk(fill)
    const metadataColor = ink === 'light' ? canvasTokens.ink.lightMuted : canvasTokens.ink.darkMuted
    const accessibleDetail = [card.code, card.label, card.stereotype, card.detail].filter(Boolean).join(' · ')
    /* The chip is resolved whether or not this Card draws one, because its slot is also where a code the caller
       asked for goes, and nothing else in the layout depends on the flag. The Card draws it only where its author
       asked: the Card's own statement first, then the Diagram's default for Cards. */
    const carriesCode = drawsOwnCode(card, visualTreatment.card.identity)
    const layout = resolveCardLayout({
      box,
      code: card.code,
      compact: visualTreatment.card.compact,
      description: card.detail,
      detail: {
        description: visualTreatment.card.description,
        identity: true,
        stereotype: visualTreatment.card.stereotype
      },
      label: card.label,
      stereotype: card.stereotype
    })
    const content = [
      line(2, 'title', [], xmlText(accessibleDetail)),
      line(2, 'rect', [
        ['fill', fill],
        ['height', box.height],
        ['rx', canvasTokens.geometry.cornerRadius],
        ['stroke', appearance?.color ?? paint.unauthored],
        ['stroke-width', 2],
        ['width', box.width]
      ])
    ]
    if (layout.stereotype) {
      content.push(
        line(
          2,
          'text',
          [
            ['class', 'infoschematic-card-stereotype'],
            ['dominant-baseline', 'middle'],
            ['fill', appearance?.color ?? paint.unauthored],
            ['font-family', canvasTokens.typography.codeFamily],
            ['font-size', 9],
            ['font-weight', 500],
            ['letter-spacing', '0.4px'],
            ['text-anchor', layout.stereotype.anchor],
            ['x', layout.stereotype.x],
            ['y', layout.stereotype.y]
          ],
          xmlText(layout.stereotype.text.toUpperCase())
        )
      )
    }
    if (layout.identity && carriesCode) {
      content.push(
        group(
          2,
          [
            ['class', 'infoschematic-card-identity'],
            ['data-card-detail', 'identity']
          ],
          [
            line(3, 'rect', [
              ['fill', paint.annotationFill],
              ['height', layout.identity.height],
              ['rx', 4],
              ['stroke', appearance?.color ?? paint.unauthored],
              ['stroke-width', 1],
              ['width', layout.identity.width],
              ['x', layout.identity.x],
              ['y', layout.identity.y]
            ]),
            line(
              3,
              'text',
              [
                ['dominant-baseline', 'middle'],
                ['fill', paint.annotationText],
                ['font-family', canvasTokens.typography.codeFamily],
                ['font-size', 9],
                ['font-weight', 600],
                ['letter-spacing', '0.5px'],
                ['text-anchor', 'middle'],
                ['x', layout.identity.textX],
                ['y', layout.identity.textY]
              ],
              xmlText(card.code)
            )
          ]
        ).join('\n')
      )
    }
    if (revealed.components && !(carriesCode && layout.identity)) {
      codeLayer.push(
        codeBadge(
          1,
          [
            ['class', `infoschematic-code${dimmed}`],
            ['data-artefact-id', card.id],
            ['data-artefact-kind', 'card'],
            ['data-code', card.code],
            ['opacity', dimmed ? canvasTokens.metrics.unfocusedOpacity : undefined]
          ],
          layout.identity ? { box, kind: 'chip', slot: layout.identity } : { box, kind: 'box' },
          card.code,
          paint
        )
      )
    }
    content.push(
      line(
        2,
        'text',
        [
          ['class', 'infoschematic-card-label'],
          ['dominant-baseline', 'middle'],
          ['fill', ink === 'light' ? canvasTokens.ink.light : canvasTokens.ink.dark],
          ['font-family', canvasTokens.typography.bodyFamily],
          ['font-size', visualTreatment.card.compact ? 13 : 14],
          ['font-weight', 700],
          ['text-anchor', layout.label.anchor],
          ['x', layout.label.x],
          ['y', layout.label.y]
        ],
        // One tspan per drawn line, as the Canvas draws it: a wrapped label is
        // one text element whose lines are placed from the same first line.
        layout.label.lines
          .map(
            (text, index) =>
              `<tspan${attributes([
                ['x', layout.label.x],
                ['dy', index === 0 ? 0 : layout.label.lineHeight]
              ])}>${xmlText(text)}</tspan>`
          )
          .join('')
      )
    )
    if (layout.description) {
      content.push(
        line(
          2,
          'text',
          [
            ['class', 'infoschematic-card-description'],
            ['dominant-baseline', 'middle'],
            ['fill', metadataColor],
            ['font-family', canvasTokens.typography.bodyFamily],
            ['font-size', 10],
            ['text-anchor', layout.description.anchor],
            ['x', layout.description.x],
            ['y', layout.description.y]
          ],
          xmlText(layout.description.text)
        )
      )
    }
    body.push(
      group(
        1,
        [
          ['aria-label', accessibleDetail],
          ['class', `infoschematic-card${dimmed}`],
          ['data-compact', visualTreatment.card.compact || undefined],
          ['data-code', card.code],
          ['data-collection', card.collection],
          ['data-artefact-id', card.id],
          ['data-artefact-kind', 'card'],
          ['data-id', card.id],
          ['data-ink', ink],
          ['data-stereotype', card.stereotype],
          ['opacity', dimmed ? canvasTokens.metrics.unfocusedOpacity : undefined],
          ['transform', `translate(${number(box.x)} ${number(box.y)})`]
        ],
        content
      ).join('\n')
    )
  }

  /*
   * A Point's authored label, drawn beside the mark.
   *
   * The side comes from the Flows that leave the Point rather than from the author, so the text never lies over the
   * route it terminates; `resolvePointLabel` decides it once for this renderer and for Canvas. Nothing is drawn where
   * the label is blank, because a required field left empty has nothing to say.
   */
  const pointLabel = (point: (typeof points)[number], routes: typeof flows) => {
    const placement = resolvePointLabel(point, routes)
    if (!placement) return []
    return [
      line(
        2,
        'text',
        [
          ['class', 'infoschematic-point-label'],
          ['dominant-baseline', 'middle'],
          ['fill', paint.text],
          ['font-family', canvasTokens.typography.bodyFamily],
          ['font-size', canvasTokens.typography.metadataFontSize],
          ['font-weight', 500],
          ['text-anchor', placement.anchor],
          ['x', placement.at.x],
          ['y', placement.at.y]
        ],
        xmlText(placement.text)
      )
    ]
  }

  for (const point of points) {
    const dimmed = focusClass(point.id, focus?.artefacts, unfocused)
    if (drawsOwnCode(point, visualTreatment.identity)) {
      codeLayer.push(
        codeBadge(
          1,
          [
            ['class', `infoschematic-code${dimmed}`],
            ['data-artefact-id', point.id],
            ['data-artefact-kind', 'point'],
            ['data-code', point.id],
            ['opacity', dimmed ? canvasTokens.metrics.unfocusedOpacity : undefined]
          ],
          { at: point.at, kind: 'mark', labelSide: resolvePointLabel(point, flows)?.side },
          point.id,
          paint
        )
      )
    }
    body.push(
      group(
        1,
        [
          ['class', `infoschematic-point${dimmed}`],
          ['data-code', point.id],
          ['data-artefact-id', point.id],
          ['data-artefact-kind', 'point'],
          ['data-id', point.id],
          ['opacity', dimmed ? canvasTokens.metrics.unfocusedOpacity : undefined]
        ],
        [
          line(2, 'title', [], xmlText(`${point.id}: ${point.label}`)),
          line(2, 'circle', [
            ['cx', point.at.x],
            ['cy', point.at.y],
            ['fill', point.appearance?.fill ?? paint.backdrop],
            ['r', canvasTokens.geometry.pointRadius],
            ['stroke', point.appearance?.color ?? paint.unauthored],
            ['stroke-width', 2]
          ]),
          ...pointLabel(point, flows)
        ]
      ).join('\n')
    )
  }

  for (const graphic of graphics) {
    if (!graphic.bounds) continue
    const box = graphic.bounds
    const renderer = rendererReferenceOf(graphic.kind)
    const dimmed = focusClass(graphic.id, focus?.graphics, unfocused)
    body.push(
      group(
        1,
        [
          ['class', `infoschematic-graphic${dimmed}`],
          ['data-artefact-id', graphic.id],
          ['data-artefact-kind', 'overlay'],
          ['data-id', graphic.id],
          ['data-renderer', renderer.key],
          ['data-renderer-version', renderer.version],
          ['opacity', dimmed ? canvasTokens.metrics.unfocusedOpacity : undefined]
        ],
        artworkContent.get(graphic.id) ?? [
          line(2, 'rect', [
            ['fill', paint.graphicFill],
            ['height', box.height],
            ['stroke', paint.graphicStroke],
            ['stroke-dasharray', '6 4'],
            ['width', box.width],
            ['x', box.x],
            ['y', box.y]
          ]),
          line(
            2,
            'text',
            [
              ['dominant-baseline', 'middle'],
              ['fill', paint.textMuted],
              ['font-family', canvasTokens.typography.staticBodyFamily],
              ['font-size', canvasTokens.typography.metadataFontSize],
              ['text-anchor', 'middle'],
              ['x', box.x + box.width / 2],
              ['y', box.y + box.height / 2]
            ],
            xmlText(graphic.label ?? renderer.key)
          )
        ]
      ).join('\n')
    )
  }

  body.push(...codeLayer)

  /* Emphasis is drawn last so it reads as a layer over the diagram: no authored element's own output, ordering, or
     geometry changes because a host asked for a Dynamic. */
  for (const { dynamicId, elementId } of resolvedDynamics.emphasis) {
    const shape = emphasisShapes.get(elementId)
    if (!shape) continue
    const [element, values] = shape
    body.push(
      group(
        1,
        [
          ['class', 'infoschematic-element-emphasis'],
          ['data-artefact-id', elementId],
          ['data-dynamic-id', dynamicId],
          ['data-emphasised', true]
        ],
        [line(2, element, values)]
      ).join('\n')
    )
  }

  return [
    `<svg${attributes([
      ['xmlns', 'http://www.w3.org/2000/svg'],
      ['aria-label', `${config.title} structural Infoschematic`],
      [paintMarker, paintMarkerValue],
      ['data-grid-treatment', visualTreatment.grid],
      ['data-surface-treatment', visualTreatment.surface],
      ['height', options.responsiveCardDetails?.height ?? viewBox.height],
      ['preserveAspectRatio', 'xMidYMid meet'],
      ['role', 'img'],
      ['viewBox', `${number(viewBox.x)} ${number(viewBox.y)} ${number(viewBox.width)} ${number(viewBox.height)}`],
      ['width', options.responsiveCardDetails?.width ?? viewBox.width]
    ])}>`,
    paintPalettes(1, paintMarkerValue),
    ...body,
    '</svg>'
  ].join('\n')
}
