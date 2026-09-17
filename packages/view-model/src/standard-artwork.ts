// The standard renderer catalogue: the Fabric and Graphic treatments the product offers for a named `kind`, as
// data rather than as components.
//
// A host may still register its own renderer under any of these keys and it wins. What the catalogue adds is that
// naming `satellite-link` in a document draws a satellite link everywhere the document is drawn, instead of drawing
// artwork in the interactive Canvas and a fallback rectangle in `infoschematics render`.
//
// That is why a piece is a list of primitives and not a React element. `render-svg` emits strings and cannot mount a
// component; Canvas paints from a stylesheet and `render-svg` writes attributes, so a piece described in CSS classes
// would be a piece only one renderer can paint. Describing the drawing once and letting each renderer emit it in its
// own idiom is the same arrangement `resolveCardLayout` and `resolvePointLabel` already use for a Card's text and a
// Point's label: one geometry, two emitters.
//
// Every piece is drawn from its own `bounds` alone. Nothing here carries a coordinate from the document it was first
// drawn for, which is what makes a piece reusable at all: the artwork this catalogue started from was matrix-mapped
// back onto the absolute positions it was authored at, and so could only be placed where it had always been.

import type { Box } from '@infoschematics/domain-model/geometry'

import { truncateToWidth, wrapToWidth } from './card-layout.ts'
import { visualTokens } from './tokens.ts'

const { geometry } = visualTokens.canvas.artwork

/**
 * What one part of a piece is painted in, named by its role rather than by a colour.
 *
 * A renderer resolves the role against its own palette — `visualTokens.canvas.artwork.ink` for the dark interactive
 * surface, `.output` for the static renderer's light paper — exactly as a Card's ink is already resolved per outlet.
 */
export type ArtworkPaint =
  /** Dashed or drawn line work laid over the shell: an orbit, a constellation, a pulse. */
  | 'accent'
  /** Secondary text. */
  | 'detail'
  /** The shell's outline. */
  | 'frame'
  /** The line work of a drawn object: a satellite, a dish, a mast. */
  | 'glyph'
  /** The interior of a drawn object, opaque over the shell it sits on. */
  | 'glyphFill'
  /** The lattice tiled across the shell. */
  | 'grid'
  /** A filled node. */
  | 'mark'
  /** The body of the piece. */
  | 'shell'
  /** The broad, faint band a cycle sweeps. */
  | 'sweep'
  /** The caption. */
  | 'title'
  /** An attention line. */
  | 'warning'
  /** An attention interior. */
  | 'warningFill'
  /** Text inside an attention mark, which has to stay legible against it. */
  | 'warningGlyph'

export type ArtworkStroke = Readonly<{
  cap?: 'butt' | 'round'
  dash?: string
  join?: 'miter' | 'round'
  paint: ArtworkPaint
  width: number
}>

/** Which text scale a string is set at. The family stays each renderer's own, as it already is for a Card. */
export type ArtworkTextRole = 'caption' | 'detail' | 'glyph'

export type ArtworkPrimitive =
  | Readonly<{
      shape: 'rect'
      x: number
      y: number
      width: number
      height: number
      radius?: number
      fill?: ArtworkPaint
      /** A declared `pattern` resource's local name, tiled as this rectangle's fill. */
      pattern?: string
      stroke?: ArtworkStroke
    }>
  | Readonly<{ shape: 'circle'; cx: number; cy: number; r: number; fill?: ArtworkPaint; stroke?: ArtworkStroke }>
  | Readonly<{
      shape: 'path'
      d: string
      fill?: ArtworkPaint
      /** A declared `pattern` resource's local name, tiled inside this path. */
      pattern?: string
      /** A declared `marker` resource's local name, armed on this path's end. */
      markerEnd?: string
      stroke?: ArtworkStroke
    }>
  | Readonly<{
      shape: 'text'
      x: number
      y: number
      anchor: 'start' | 'middle' | 'end'
      fill: ArtworkPaint
      role: ArtworkTextRole
      text: string
    }>
  /** A local drawing space, so a glyph is authored around its own origin rather than around the document's. */
  | Readonly<{ shape: 'group'; x: number; y: number; scale?: number; children: readonly ArtworkPrimitive[] }>

/**
 * An SVG resource a piece needs defined before it can be referenced.
 *
 * A resource carries a local name, never an id. Each renderer emits it under its own id prefix and rewrites the
 * reference to match, because SVG resolves `url(#…)` to the first matching element in document order: two renderings
 * sharing a page and an id both draw the first definition. `svgResourcePrefix` states that rule; this is what makes a
 * piece able to obey it without knowing which renderer is drawing it.
 */
export type ArtworkResource =
  | Readonly<{
      resource: 'pattern'
      name: string
      pitch: number
      dotRadius: number
      paint: ArtworkPaint
      width: number
    }>
  | Readonly<{
      resource: 'marker'
      name: string
      size: number
      refX: number
      refY: number
      d: string
      fill: ArtworkPaint
      /** The space `d`, `refX` and `refY` are stated in, so the head scales to `size` rather than to its own path. */
      viewBox: string
    }>

export type StandardArtwork = Readonly<{
  primitives: readonly ArtworkPrimitive[]
  resources: readonly ArtworkResource[]
}>

export type ArtworkProperties = Readonly<Record<string, boolean | number | string>>

export type ArtworkRequest = Readonly<{
  bounds: Box
  /** Secondary text: the authored description, or whatever the outlet has in its place. */
  detail?: string
  /** Primary text: the authored label. */
  label?: string
  properties?: ArtworkProperties
}>

/** The Fabric treatments the product offers. Enumerate this rather than restating the keys. */
export const standardFabricKeys = [
  'internet-cloud',
  'message-bus',
  'mobile-network',
  'object-store',
  'satellite-link',
  'telemetry-plane'
] as const

/** The Graphic treatments the product offers. Enumerate this rather than restating the keys. */
export const standardGraphicKeys = ['annotation', 'cycle', 'gap-marker'] as const

export type StandardFabricKey = (typeof standardFabricKeys)[number]
export type StandardGraphicKey = (typeof standardGraphicKeys)[number]
export type StandardArtworkKey = StandardFabricKey | StandardGraphicKey

/* Coordinates are rounded so a piece scaled from arbitrary bounds reads as a drawing rather than as float noise, and
   so the two renderers emit the same string for the same piece without either rounding on its own terms. */
const n = (value: number) => Math.round(value * 100) / 100

const numeric = (properties: ArtworkProperties | undefined, key: string, fallback: number) => {
  const value = properties?.[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

const text = (properties: ArtworkProperties | undefined, key: string, fallback: string) => {
  const value = properties?.[key]
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback
}

const gridName = 'grid'

const gridResource: ArtworkResource = Object.freeze({
  dotRadius: geometry.gridDotRadius,
  name: gridName,
  paint: 'grid',
  pitch: geometry.gridPitch,
  resource: 'pattern',
  width: geometry.gridWidth
})

const accentStroke = (dash?: string): ArtworkStroke => ({
  cap: 'round',
  dash,
  paint: 'accent',
  width: geometry.accentWidth
})

const glyphStroke: ArtworkStroke = Object.freeze({
  cap: 'round',
  join: 'round',
  paint: 'glyph',
  width: geometry.glyphWidth
})

const frameStroke: ArtworkStroke = Object.freeze({ paint: 'frame', width: geometry.gridWidth * 1.5 })

/** The body of a rectangular piece, and the lattice tiled over it. */
const shell = (bounds: Box, radius: number): readonly ArtworkPrimitive[] => [
  {
    fill: 'shell',
    height: bounds.height,
    radius,
    shape: 'rect',
    stroke: frameStroke,
    width: bounds.width,
    x: bounds.x,
    y: bounds.y
  },
  {
    height: bounds.height,
    pattern: gridName,
    radius,
    shape: 'rect',
    width: bounds.width,
    x: bounds.x,
    y: bounds.y
  }
]

/** The body of a piece whose outline is its own path, tiled with the same lattice without needing a clip. */
const shellPath = (d: string): readonly ArtworkPrimitive[] => [
  { d, fill: 'shell', shape: 'path', stroke: frameStroke },
  { d, pattern: gridName, shape: 'path' }
]

/**
 * A piece's caption, on one line or two.
 *
 * The label and the detail are set at the two scales the catalogue offers, and each is cut to the width it is given
 * rather than to a character count, by the same fitter a Card's text uses. Two fitting rules is how a Card's label
 * came to say different things in the two renderers; a piece has no reason to repeat it.
 */
const caption = (
  request: ArtworkRequest,
  x: number,
  y: number,
  width: number,
  anchor: 'start' | 'middle' | 'end'
): readonly ArtworkPrimitive[] => {
  /* `caption` and `detail` override the authored label and description, because a piece often wants a shorter name
     than the element carries and the document should not have to choose between the two. The interactive Canvas's
     generic Fabric already reads both, so the catalogue reading them keeps one rule for what a piece is captioned. */
  const label = text(request.properties, 'caption', request.label?.trim() ?? '').trim()
  const detail = text(request.properties, 'detail', request.detail?.trim() ?? '').trim()
  const primitives: ArtworkPrimitive[] = []
  if (label)
    primitives.push({
      anchor,
      fill: 'title',
      role: 'caption',
      shape: 'text',
      text: truncateToWidth(label, width, geometry.captionSize * 0.56),
      x: n(x),
      y: n(y)
    })
  if (detail)
    primitives.push({
      anchor,
      fill: 'detail',
      role: 'detail',
      shape: 'text',
      text: truncateToWidth(detail, width, geometry.detailAdvance),
      x: n(x),
      y: n(y + geometry.detailSize + 6)
    })
  return primitives
}

/**
 * A cloud outline over the given bounds, drawn from the bounds alone.
 *
 * `bumps` sets how many crests the top carries, so one generator draws both the wide internet cloud and the shallower
 * mobile one and neither is a path string with a document's coordinates baked into it.
 */
const cloudPath = ({ height, width, x, y }: Box, bumps: number): string => {
  const crest = height * 0.34
  const shoulder = y + height * 0.46
  const base = y + height
  const foot = Math.min(height * 0.22, width * 0.08)
  const step = width / bumps
  const segments: string[] = [`M${n(x)} ${n(shoulder)}`]
  segments.push(
    `C${n(x)} ${n(shoulder - crest * 0.9)} ${n(x + step * 0.3)} ${n(y + crest * 0.1)} ${n(x + step * 0.62)} ${n(y + crest * 0.42)}`
  )
  for (let index = 1; index < bumps; index += 1) {
    const from = x + step * (index - 1 + 0.62)
    const to = x + step * (index + 0.62)
    const dip = index % 2 === 0 ? crest * 0.5 : crest * 0.18
    segments.push(
      `C${n(from + step * 0.22)} ${n(y - crest * 0.12 + dip)} ${n(to - step * 0.26)} ${n(y - crest * 0.16 + dip)} ${n(to)} ${n(y + crest * 0.42)}`
    )
  }
  const last = x + step * (bumps - 1 + 0.62)
  segments.push(
    `C${n(last + step * 0.2)} ${n(y + crest * 0.06)} ${n(x + width)} ${n(shoulder - crest * 0.8)} ${n(x + width)} ${n(shoulder)}`
  )
  segments.push(`V${n(base - foot)}`)
  segments.push(`Q${n(x + width)} ${n(base)} ${n(x + width - foot)} ${n(base)}`)
  segments.push(`H${n(x + foot)}`)
  segments.push(`Q${n(x)} ${n(base)} ${n(x)} ${n(base - foot)}`)
  segments.push('Z')
  return segments.join(' ')
}

/** A run of nodes joined by a dashed line, spread across the width it is given at alternating heights. */
const constellation = (bounds: Box, count: number, top: number, bottom: number): readonly ArtworkPrimitive[] => {
  const nodes = Array.from({ length: count }, (_unused, index) => ({
    x: n(bounds.x + bounds.width * ((index + 0.6) / (count + 0.2))),
    y: n(index % 2 === 0 ? bottom : top)
  }))
  /* Each node reaches its next two neighbours, so the links triangulate into a mesh. A single chain drew a sawtooth
     that read as a trace, and the telemetry plane is the piece that draws a trace. */
  const links = nodes.flatMap((node, index) =>
    nodes.slice(index + 1, index + 3).map((other) => `M${node.x} ${node.y}L${other.x} ${other.y}`)
  )
  if (links.length === 0) return []
  return [
    { d: links.join(''), shape: 'path', stroke: accentStroke(geometry.accentDash) },
    ...nodes.map(
      (node): ArtworkPrimitive => ({ cx: node.x, cy: node.y, fill: 'mark', r: geometry.markRadius, shape: 'circle' })
    )
  ]
}

const internetCloud = (request: ArtworkRequest): StandardArtwork => {
  const { bounds } = request
  const d = cloudPath(bounds, 3)
  /* The nodes hang below the caption, and inside the feet the outline curves in on: the first drawing ran them
     across the caption's own line, which is what looking at it showed and no structural check could. */
  const field = {
    height: bounds.height,
    width: bounds.width * 0.84,
    x: bounds.x + bounds.width * 0.08,
    y: bounds.y
  }
  return {
    primitives: [
      ...shellPath(d),
      ...constellation(field, 6, bounds.y + bounds.height * 0.66, bounds.y + bounds.height * 0.86),
      ...caption(
        request,
        n(bounds.x + bounds.width / 2),
        n(bounds.y + bounds.height * 0.46),
        bounds.width * 0.6,
        'middle'
      )
    ],
    resources: [gridResource]
  }
}

const mobileNetwork = (request: ArtworkRequest): StandardArtwork => {
  const { bounds } = request
  const d = cloudPath(bounds, 2)
  const mast = Math.min(bounds.height * 0.42, bounds.width * 0.14)
  const mastX = bounds.x + bounds.width * 0.2
  const mastY = bounds.y + bounds.height * 0.52
  return {
    primitives: [
      ...shellPath(d),
      {
        children: [
          { cx: 0, cy: 0, fill: 'mark', r: n(mast * 0.1), shape: 'circle' },
          {
            d: `M0 ${n(mast * 0.12)}V${n(mast)}M${n(-mast * 0.27)} ${n(mast)}H${n(mast * 0.27)}M${n(-mast * 0.17)} ${n(mast)}L0 ${n(mast * 0.12)}L${n(mast * 0.17)} ${n(mast)}`,
            shape: 'path',
            stroke: glyphStroke
          },
          {
            d: `M${n(-mast * 0.25)} ${n(-mast * 0.17)}Q0 ${n(-mast * 0.42)} ${n(mast * 0.25)} ${n(-mast * 0.17)}M${n(-mast * 0.48)} ${n(-mast * 0.38)}Q0 ${n(-mast * 0.85)} ${n(mast * 0.48)} ${n(-mast * 0.38)}`,
            shape: 'path',
            stroke: { ...glyphStroke, dash: geometry.beamDash }
          }
        ],
        shape: 'group',
        x: n(mastX),
        y: n(mastY)
      },
      ...caption(
        request,
        n(bounds.x + bounds.width * 0.42),
        n(bounds.y + bounds.height * 0.5),
        bounds.width * 0.5,
        'start'
      )
    ],
    resources: [gridResource]
  }
}

const satelliteLink = (request: ArtworkRequest): StandardArtwork => {
  const { bounds } = request
  const radius = visualTokens.canvas.geometry.cornerRadius
  const inset = Math.min(20, bounds.width * 0.04)
  /* The caption takes a lane along the top and the link is drawn in the band below it: the orbit's apex ran through
     the description line at every size, which looking at the drawing showed and no structural check could. */
  const lane = Math.min(bounds.height * 0.5, geometry.captionSize + geometry.detailSize + 20)
  const band = { height: bounds.height - lane, y: bounds.y + lane }
  const unit = Math.min(band.height, bounds.width) * 0.14
  const floor = band.y + band.height * 0.62
  const centre = bounds.x + bounds.width / 2
  return {
    primitives: [
      ...shell(bounds, radius),
      {
        d: `M${n(bounds.x + bounds.width * 0.12)} ${n(band.y + band.height * 0.44)}C${n(bounds.x + bounds.width * 0.3)} ${n(band.y + band.height * 0.24)} ${n(bounds.x + bounds.width * 0.7)} ${n(band.y + band.height * 0.24)} ${n(bounds.x + bounds.width * 0.88)} ${n(band.y + band.height * 0.44)}`,
        shape: 'path',
        stroke: { ...accentStroke(geometry.orbitDash), width: geometry.accentWidth * 0.75 }
      },
      {
        d: `M${n(centre - unit * 0.3)} ${n(band.y + band.height * 0.42)}L${n(bounds.x + bounds.width * 0.24)} ${n(floor)}M${n(centre + unit * 0.3)} ${n(band.y + band.height * 0.42)}L${n(bounds.x + bounds.width * 0.76)} ${n(floor)}`,
        shape: 'path',
        stroke: accentStroke(geometry.beamDash)
      },
      /* The satellite: a body between two panels, authored around its own centre so it can be placed anywhere. */
      {
        children: [
          {
            fill: 'glyphFill',
            height: n(unit * 0.7),
            radius: n(unit * 0.12),
            shape: 'rect',
            stroke: glyphStroke,
            width: n(unit),
            x: n(-unit / 2),
            y: n(-unit * 0.35)
          },
          {
            fill: 'glyphFill',
            height: n(unit * 0.8),
            shape: 'rect',
            stroke: glyphStroke,
            width: n(unit * 0.85),
            x: n(-unit * 1.6),
            y: n(-unit * 0.4)
          },
          {
            fill: 'glyphFill',
            height: n(unit * 0.8),
            shape: 'rect',
            stroke: glyphStroke,
            width: n(unit * 0.85),
            x: n(unit * 0.75),
            y: n(-unit * 0.4)
          },
          {
            d: `M${n(-unit * 1.32)} ${n(-unit * 0.4)}V${n(unit * 0.4)}M${n(-unit * 1.04)} ${n(-unit * 0.4)}V${n(unit * 0.4)}M${n(unit * 1.03)} ${n(-unit * 0.4)}V${n(unit * 0.4)}M${n(unit * 1.31)} ${n(-unit * 0.4)}V${n(unit * 0.4)}`,
            shape: 'path',
            stroke: glyphStroke
          }
        ],
        shape: 'group',
        x: n(centre),
        y: n(band.y + band.height * 0.42)
      },
      /* Two dishes on the ground, mirrored, each looking up at the satellite between them. */
      ...([-1, 1] as const).map(
        (side): ArtworkPrimitive => ({
          children: [
            {
              d: `M0 0Q${n(side * unit * 0.34)} ${n(unit * 0.68)} ${n(side * unit)} ${n(unit * 0.26)}M${n(side * unit * 0.08)} ${n(unit * 0.04)}L${n(side * unit * 0.88)} ${n(unit * 0.68)}M${n(side * unit * 0.5)} ${n(unit * 0.45)}L${n(side * unit * 0.33)} ${n(unit * 1.18)}M${n(side * unit * 0.5)} ${n(unit * 0.45)}L${n(side * unit * 0.72)} ${n(unit * 1.18)}M${n(side * unit * 0.25)} ${n(unit * 1.18)}H${n(side * unit * 0.8)}`,
              shape: 'path',
              stroke: glyphStroke
            }
          ],
          shape: 'group',
          x: n(centre + side * bounds.width * 0.27),
          y: n(floor - unit * 1.2)
        })
      ),
      ...caption(
        request,
        n(bounds.x + inset),
        n(bounds.y + inset * 0.8 + geometry.captionSize / 2),
        bounds.width * 0.5,
        'start'
      )
    ],
    resources: [gridResource]
  }
}

const telemetryPlane = (request: ArtworkRequest): StandardArtwork => {
  const { bounds } = request
  const inset = Math.min(20, bounds.width * 0.04)
  /* The caption takes the top lane and the trace the band below it, the division the message bus makes for the same
     reason: a trace threaded past a caption on one line drew a rule through the reading it was meant to carry. */
  const lane = Math.min(bounds.height * 0.5, geometry.captionSize + geometry.detailSize + 20)
  const band = bounds.height - lane
  const midline = bounds.y + lane + band / 2
  const unit = Math.min(band * 0.42, bounds.width * 0.03)
  /* Two beats of a trace, so the plane reads as carrying a reading rather than as an empty band. */
  const beat = (at: number) =>
    `h${n(unit * 1.6)}l${n(unit * 0.35)} ${n(-unit * 1.1)}l${n(unit * 0.5)} ${n(unit * 2)}l${n(unit * 0.4)} ${n(-unit * 0.9)}${at === 0 ? `h${n(unit * 2)}` : ''}`
  return {
    primitives: [
      ...shell(bounds, visualTokens.canvas.geometry.cornerRadius),
      {
        d: `M${n(bounds.x + inset)} ${n(midline)}H${n(bounds.x + bounds.width * 0.32)}${beat(0)}${beat(1)}H${n(bounds.x + bounds.width - inset)}`,
        shape: 'path',
        stroke: { ...accentStroke(), width: geometry.accentWidth * 0.8 }
      },
      ...caption(
        request,
        n(bounds.x + inset),
        n(bounds.y + inset * 0.8 + geometry.captionSize / 2),
        bounds.width * 0.6,
        'start'
      )
    ],
    resources: [gridResource]
  }
}

const messageBus = (request: ArtworkRequest): StandardArtwork => {
  const { bounds } = request
  const inset = Math.min(20, bounds.width * 0.04)
  /* The caption takes a lane along the top, and the rails and their taps own the band below it. A caption centred
     on the midline read well until the first rail crossed it, which is what looking at the drawing showed. */
  const lane = Math.min(bounds.height * 0.5, geometry.captionSize + geometry.detailSize + 20)
  const band = { height: bounds.height - lane, y: bounds.y + lane }
  const midline = band.y + band.height / 2
  const gauge = Math.min(band.height * 0.18, 14)
  const reach = { down: n(band.y + band.height * 0.84), up: n(band.y + band.height * 0.16) }
  const stops = Math.max(3, Math.round(bounds.width / 180))
  const from = bounds.x + bounds.width * 0.06
  const to = bounds.x + bounds.width * 0.94
  /* Two rails and a tap at each stop: the substrate every stage reaches, rather than a rectangle with a label. */
  const taps = Array.from({ length: stops }, (_unused, index) => {
    const at = n(from + ((to - from) * (index + 0.5)) / stops)
    const up = index % 2 === 0
    return `M${at} ${n(midline - gauge)}V${up ? reach.up : n(midline - gauge)}M${at} ${n(midline + gauge)}V${up ? n(midline + gauge) : reach.down}`
  })
  return {
    primitives: [
      ...shell(bounds, visualTokens.canvas.geometry.cornerRadius),
      {
        d: `M${n(from)} ${n(midline - gauge)}H${n(to)}M${n(from)} ${n(midline + gauge)}H${n(to)}`,
        shape: 'path',
        stroke: accentStroke()
      },
      { d: taps.join(''), shape: 'path', stroke: { ...glyphStroke, width: geometry.glyphWidth * 0.8 } },
      ...Array.from({ length: stops }, (_unused, index): ArtworkPrimitive => {
        const at = n(from + ((to - from) * (index + 0.5)) / stops)
        return {
          cx: at,
          cy: index % 2 === 0 ? reach.up : reach.down,
          fill: 'mark',
          r: geometry.markRadius,
          shape: 'circle'
        }
      }),
      ...caption(
        request,
        n(bounds.x + inset),
        n(bounds.y + inset * 0.8 + geometry.captionSize / 2),
        bounds.width * 0.5,
        'start'
      )
    ],
    resources: [gridResource]
  }
}

const objectStore = (request: ArtworkRequest): StandardArtwork => {
  const { bounds } = request
  const platters = Math.max(2, Math.min(4, Math.round(numeric(request.properties, 'platters', 3))))
  const stackWidth = Math.min(bounds.width * 0.3, bounds.height * 1.1)
  const lip = Math.min(bounds.height * 0.12, stackWidth * 0.18)
  const pitch = (bounds.height * 0.62) / platters
  const left = bounds.x + bounds.width * 0.07
  const top = bounds.y + bounds.height * 0.19
  /* A stack of platters: each drawn as a lipped slab, top-most last so the stack reads front to back. */
  const stack = Array.from({ length: platters }, (_unused, index): ArtworkPrimitive => {
    const at = n(top + pitch * index)
    return {
      d: [
        `M${n(left)} ${n(at + lip)}`,
        `Q${n(left)} ${n(at)} ${n(left + stackWidth / 2)} ${n(at)}`,
        `Q${n(left + stackWidth)} ${n(at)} ${n(left + stackWidth)} ${n(at + lip)}`,
        `Q${n(left + stackWidth)} ${n(at + lip * 2)} ${n(left + stackWidth / 2)} ${n(at + lip * 2)}`,
        `Q${n(left)} ${n(at + lip * 2)} ${n(left)} ${n(at + lip)}`,
        'Z'
      ].join(' '),
      fill: 'glyphFill',
      shape: 'path',
      stroke: glyphStroke
    }
  })
  return {
    primitives: [
      ...shell(bounds, visualTokens.canvas.geometry.cornerRadius),
      {
        d: `M${n(left)} ${n(top + lip)}V${n(top + pitch * (platters - 1) + lip)}M${n(left + stackWidth)} ${n(top + lip)}V${n(top + pitch * (platters - 1) + lip)}`,
        shape: 'path',
        stroke: { ...glyphStroke, dash: geometry.accentDash }
      },
      ...stack,
      ...caption(
        request,
        n(left + stackWidth + bounds.width * 0.06),
        n(bounds.y + bounds.height * 0.44),
        bounds.width - stackWidth - bounds.width * 0.14,
        'start'
      )
    ],
    resources: [gridResource]
  }
}

const cycleHeadName = 'cycle-head'

const cycle = (request: ArtworkRequest): StandardArtwork => {
  const { bounds } = request
  const short = Math.min(bounds.height, bounds.width)
  const band = Math.max(4, short * numeric(request.properties, 'band', geometry.sweepRatio))
  const radius = numeric(request.properties, 'radius', short * 0.3)
  const tail = numeric(request.properties, 'tail', short * 0.18)
  const head = numeric(request.properties, 'head', short * 0.22)
  const { height, width, x, y } = bounds
  const right = x + width
  const bottom = y + height
  const corners = [
    `M${n(x)} ${n(y + radius + tail)}V${n(y + radius)}A${n(radius)} ${n(radius)} 0 0 1 ${n(x + radius)} ${n(y)}H${n(x + radius + head)}`,
    `M${n(right - radius - tail)} ${n(y)}H${n(right - radius)}A${n(radius)} ${n(radius)} 0 0 1 ${n(right)} ${n(y + radius)}V${n(y + radius + head)}`,
    `M${n(right)} ${n(bottom - radius - tail)}V${n(bottom - radius)}A${n(radius)} ${n(radius)} 0 0 1 ${n(right - radius)} ${n(bottom)}H${n(right - radius - head)}`,
    `M${n(x + radius + tail)} ${n(bottom)}H${n(x + radius)}A${n(radius)} ${n(radius)} 0 0 1 ${n(x)} ${n(bottom - radius)}V${n(bottom - radius - head)}`
  ]
  /* The long sides carry the gap between one corner's head and the next one's tail. Closing it clockwise gives the
     loop six arrows rather than four, so the sweep reads as continuous at any aspect ratio. */
  const sides = [
    `M${n(x + radius + head)} ${n(y)}H${n(right - radius - tail)}`,
    `M${n(right - radius - head)} ${n(bottom)}H${n(x + radius + tail)}`
  ]
  return {
    primitives: [...corners, ...sides].map((d) => ({
      d,
      markerEnd: cycleHeadName,
      shape: 'path',
      /* Butt ends, because the head is armed at the path's end: a round cap bulged half a band past it and the two
         translucent shapes stacked into a dot at every arrow. */
      stroke: { paint: 'sweep', width: n(band) }
    })),
    resources: [
      {
        d: 'M0 0 L0 104 L104 52 z',
        fill: 'sweep',
        name: cycleHeadName,
        /* The head's base is the reference, so the triangle grows out of the arrow rather than over its own band. */
        refX: 0,
        refY: 52,
        resource: 'marker',
        size: n(band * 2.46),
        viewBox: '0 0 104 104'
      }
    ]
  }
}

const gapMarker = (request: ArtworkRequest): StandardArtwork => {
  const { bounds } = request
  const short = Math.min(bounds.height, bounds.width)
  const radius = numeric(request.properties, 'radius', short * 0.2)
  const glyph = text(request.properties, 'glyph', '?')
  const marks = [
    { cx: bounds.x + bounds.width * 0.24, cy: bounds.y + bounds.height * 0.27 },
    { cx: bounds.x + bounds.width * 0.74, cy: bounds.y + bounds.height * 0.73 }
  ] as const
  const centre = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 }
  return {
    primitives: [
      /* One tie, elbowed through the centre of the bounds, so the pair reads as marking one gap between two places.
         Drawn as a tie per mark it was two dashes that stopped in open space, which is what looking at it showed. */
      {
        d: `M${n(marks[0].cx + radius)} ${n(marks[0].cy)}H${n(centre.x)}V${n(marks[1].cy)}H${n(marks[1].cx - radius)}`,
        shape: 'path',
        stroke: { cap: 'round', dash: geometry.accentDash, paint: 'warning', width: geometry.accentWidth }
      },
      ...marks.flatMap((mark): readonly ArtworkPrimitive[] => [
        {
          cx: n(mark.cx),
          cy: n(mark.cy),
          fill: 'warningFill',
          r: n(radius),
          shape: 'circle',
          stroke: { dash: geometry.warningDash, paint: 'warning', width: geometry.warningWidth }
        },
        {
          anchor: 'middle',
          fill: 'warningGlyph',
          role: 'glyph',
          shape: 'text',
          text: glyph,
          x: n(mark.cx),
          y: n(mark.cy)
        }
      ])
    ],
    resources: []
  }
}

const annotation = (request: ArtworkRequest): StandardArtwork => {
  const { bounds } = request
  const quiet = text(request.properties, 'tone', 'quiet') === 'quiet'
  const body = text(request.properties, 'text', request.detail?.trim() ?? '')
  const inset = Math.min(14, bounds.width * 0.05)
  const label = request.label?.trim()
  const lineHeight = geometry.detailSize + 5
  const headline = label ? geometry.captionSize + 8 : 0
  const room = Math.max(1, Math.floor((bounds.height - inset * 2 - headline) / lineHeight))
  const lines = body ? wrapToWidth(body, bounds.width - inset * 2, geometry.detailAdvance, room) : []
  return {
    primitives: [
      {
        fill: 'shell',
        height: bounds.height,
        radius: visualTokens.canvas.geometry.cornerRadius,
        shape: 'rect',
        stroke: { dash: geometry.warningDash, paint: 'frame', width: geometry.gridWidth * 1.5 },
        width: bounds.width,
        x: bounds.x,
        y: bounds.y
      },
      ...(label
        ? [
            {
              anchor: 'start' as const,
              fill: 'title' as const,
              role: 'caption' as const,
              shape: 'text' as const,
              text: truncateToWidth(label, bounds.width - inset * 2, geometry.captionSize * 0.56),
              x: n(bounds.x + inset),
              y: n(bounds.y + inset + geometry.captionSize * 0.5)
            }
          ]
        : []),
      ...lines.map(
        (line, index): ArtworkPrimitive => ({
          anchor: 'start',
          fill: quiet ? 'detail' : 'title',
          role: 'detail',
          shape: 'text',
          text: line,
          x: n(bounds.x + inset),
          y: n(bounds.y + inset + headline + lineHeight * index + geometry.detailSize * 0.5)
        })
      )
    ],
    resources: []
  }
}

/**
 * Every standard treatment, by the key a document names it with.
 *
 * Each entry takes the bounds it is drawn into and nothing else about where it came from, so the same key draws the
 * same piece wherever it is placed and in whichever renderer draws it.
 */
export const standardArtwork: Readonly<Record<StandardArtworkKey, (request: ArtworkRequest) => StandardArtwork>> =
  Object.freeze({
    annotation,
    cycle,
    'gap-marker': gapMarker,
    'internet-cloud': internetCloud,
    'message-bus': messageBus,
    'mobile-network': mobileNetwork,
    'object-store': objectStore,
    'satellite-link': satelliteLink,
    'telemetry-plane': telemetryPlane
  })

/** The schema version every standard treatment is offered at. Stable keys carry stable versions, as `EXTEND-002` requires. */
export const standardArtworkSchemaVersion = 1

/**
 * The scalar properties a piece may read, taken from whatever the document carries.
 *
 * Authored properties are JSON, so a piece could be handed an array or an object it has no use for. Narrowing here
 * rather than casting at each call site means one rule about what a property is, and a renderer that never has to
 * assert a shape the document does not guarantee.
 */
export const artworkProperties = (
  properties: Readonly<Record<string, unknown>> | undefined
): ArtworkProperties | undefined => {
  if (!properties) return undefined
  const scalars = Object.entries(properties).filter(
    (entry): entry is [string, boolean | number | string] =>
      typeof entry[1] === 'boolean' || typeof entry[1] === 'number' || typeof entry[1] === 'string'
  )
  return scalars.length === 0 ? undefined : Object.freeze(Object.fromEntries(scalars))
}

export const isStandardFabricKey = (key: string): key is StandardFabricKey =>
  (standardFabricKeys as readonly string[]).includes(key)

export const isStandardGraphicKey = (key: string): key is StandardGraphicKey =>
  (standardGraphicKeys as readonly string[]).includes(key)

/**
 * The treatment the catalogue offers for one key, or `undefined` where it offers none.
 *
 * The kind is part of the lookup rather than an afterthought: a Fabric key is not a Graphic key, and a document that
 * names `cycle` as a Fabric has named a renderer this catalogue does not offer.
 */
export const standardArtworkFor = (
  kind: 'fabric' | 'graphic',
  key: string
): ((request: ArtworkRequest) => StandardArtwork) | undefined => {
  if (kind === 'fabric') return isStandardFabricKey(key) ? standardArtwork[key] : undefined
  return isStandardGraphicKey(key) ? standardArtwork[key] : undefined
}
