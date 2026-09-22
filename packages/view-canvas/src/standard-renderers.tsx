// The standard renderer catalogue, drawn as React elements.
//
// The artwork is not here. It is stated once in `@infoschematics/view-model/standard-artwork` as geometry and paint
// roles, and `render-svg` walks the same description into SVG strings. This file is only the interactive half of that
// walk, plus the versioned registration `EXTEND-006` asks of any renderer definition.
//
// Nothing imports this by default: `resolveInfoschematicRenderer` reaches for it where a host has registered nothing
// under the key a document names, so a host registration for a standard key still wins without the catalogue having
// to know it exists.

import { svgResourcePrefix } from '@infoschematics/view-model/resources'
import {
  type ArtworkPrimitive,
  type ArtworkRequest,
  type ArtworkResource,
  type ArtworkStroke,
  artworkProperties,
  type StandardArtworkKey,
  standardArtwork,
  standardArtworkSchemaVersion,
  standardFabricKeys,
  standardGraphicKeys
} from '@infoschematics/view-model/standard-artwork'
import { artworkPaintVariables, visualTokens } from '@infoschematics/view-model/tokens'
import type { ReactNode } from 'react'
import { useId } from 'react'

import type {
  FabricRendererDefinition,
  GraphicRendererDefinition,
  RendererProperties,
  RendererValidationResult
} from './renderer-contract.ts'

const artwork = visualTokens.canvas.artwork
/* A piece names the role it wants and the page resolves the colour, so one catalogue paints correctly in every
   scheme rather than carrying the interactive palette's values. */
const ink = artworkPaintVariables

const strokeProps = (stroke: ArtworkStroke | undefined) =>
  stroke
    ? {
        stroke: ink[stroke.paint],
        strokeDasharray: stroke.dash,
        strokeLinecap: stroke.cap,
        strokeLinejoin: stroke.join,
        strokeWidth: stroke.width
      }
    : {}

const fontSize = (role: 'caption' | 'detail' | 'glyph') =>
  role === 'caption'
    ? artwork.geometry.captionSize
    : role === 'detail'
      ? artwork.geometry.detailSize
      : artwork.geometry.glyphSize

/**
 * One piece's primitives as elements.
 *
 * The index is the key because the list is derived from the piece's bounds and nothing else: the same bounds produce
 * the same primitives in the same order, so position is identity here in a way it would not be for authored content.
 */
const primitiveElements = (
  primitives: readonly ArtworkPrimitive[],
  resourceId: (name: string) => string
): readonly ReactNode[] =>
  primitives.map((primitive, index) => {
    const key = `${primitive.shape}-${index}`
    if (primitive.shape === 'group')
      return (
        <g
          key={key}
          transform={`translate(${primitive.x} ${primitive.y})${primitive.scale === undefined ? '' : ` scale(${primitive.scale})`}`}
        >
          {primitiveElements(primitive.children, resourceId)}
        </g>
      )
    if (primitive.shape === 'rect')
      return (
        <rect
          fill={
            primitive.pattern ? `url(#${resourceId(primitive.pattern)})` : primitive.fill ? ink[primitive.fill] : 'none'
          }
          height={primitive.height}
          key={key}
          rx={primitive.radius}
          width={primitive.width}
          x={primitive.x}
          y={primitive.y}
          {...strokeProps(primitive.stroke)}
        />
      )
    if (primitive.shape === 'circle')
      return (
        <circle
          cx={primitive.cx}
          cy={primitive.cy}
          fill={primitive.fill ? ink[primitive.fill] : 'none'}
          key={key}
          r={primitive.r}
          {...strokeProps(primitive.stroke)}
        />
      )
    if (primitive.shape === 'path')
      return (
        <path
          d={primitive.d}
          fill={
            primitive.pattern ? `url(#${resourceId(primitive.pattern)})` : primitive.fill ? ink[primitive.fill] : 'none'
          }
          key={key}
          markerEnd={primitive.markerEnd ? `url(#${resourceId(primitive.markerEnd)})` : undefined}
          {...strokeProps(primitive.stroke)}
        />
      )
    return (
      <text
        dominantBaseline="middle"
        fill={ink[primitive.fill]}
        /* The scale is shared with the static renderer and the family is not, exactly as a Card's already is: this
           surface sets the interactive face and `render-svg` sets its paper one. */
        fontFamily={visualTokens.canvas.typography.bodyFamily}
        fontSize={fontSize(primitive.role)}
        fontWeight={primitive.role === 'caption' || primitive.role === 'glyph' ? 600 : undefined}
        key={key}
        textAnchor={primitive.anchor}
        x={primitive.x}
        y={primitive.y}
      >
        {primitive.text}
      </text>
    )
  })

const resourceElements = (
  resources: readonly ArtworkResource[],
  resourceId: (name: string) => string
): readonly ReactNode[] =>
  resources.map((resource) =>
    resource.resource === 'pattern' ? (
      <pattern
        height={resource.pitch}
        id={resourceId(resource.name)}
        key={resource.name}
        patternUnits="userSpaceOnUse"
        width={resource.pitch}
      >
        <path
          d={`M${resource.pitch} 0 H0 V${resource.pitch}`}
          fill="none"
          stroke={ink[resource.paint]}
          strokeWidth={resource.width}
        />
        <circle cx={resource.dotRadius} cy={resource.dotRadius} fill={ink[resource.paint]} r={resource.dotRadius} />
      </pattern>
    ) : (
      <marker
        id={resourceId(resource.name)}
        key={resource.name}
        markerHeight={resource.size}
        markerUnits="userSpaceOnUse"
        markerWidth={resource.size}
        orient="auto"
        refX={resource.refX}
        refY={resource.refY}
        viewBox={resource.viewBox}
      >
        <path d={resource.d} fill={ink[resource.fill]} />
      </marker>
    )
  )

/**
 * One standard piece, with the resources it declares defined inside it.
 *
 * The `defs` are local to this element rather than hoisted to the mount's own block, because a piece is drawn
 * wherever its element is and every id it names is derived from `useId` — so two Fabrics of the same kind at
 * different sizes each get their own lattice instead of sharing the first one's.
 */
const StandardArtworkPiece = ({ artworkKey, request }: { artworkKey: StandardArtworkKey; request: ArtworkRequest }) => {
  const prefix = svgResourcePrefix(undefined, useId())
  const drawn = standardArtwork[artworkKey](request)
  const resourceId = (name: string) => `${prefix}-artwork-${name}`

  return (
    <>
      {drawn.resources.length > 0 ? <defs>{resourceElements(drawn.resources, resourceId)}</defs> : null}
      {/* The key rides on the group so a rendering says which standard piece it drew, and the `defs` stay outside
          it so what the group holds is the drawing alone — which is the comparison parity makes. */}
      <g data-artwork={artworkKey}>{primitiveElements(drawn.primitives, resourceId)}</g>
    </>
  )
}

/** Which authored properties the catalogue reads, and what each of them has to be for a piece to draw from it. */
const numericProperties = ['band', 'head', 'platters', 'radius', 'tail'] as const
const tones = ['loud', 'quiet'] as const

/**
 * A real validator, as `EXTEND-006` requires of a versioned definition.
 *
 * Authored properties are JSON, so a `radius` may arrive as a string, as a negative number or as `NaN`. A piece that
 * silently ignored one would draw something the document does not describe, and the diagnostic a host listens for is
 * what tells an author the property was not used. Unrecognised keys are accepted and ignored: the catalogue is not
 * the only thing that may read a document's properties.
 */
const validateArtworkProperties = (properties: RendererProperties | undefined): RendererValidationResult => {
  for (const key of numericProperties) {
    const value = properties?.[key]
    if (value === undefined) continue
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0)
      return { reason: `"${key}" must be a finite positive number; received ${JSON.stringify(value)}`, valid: false }
  }
  const tone = properties?.tone
  if (tone !== undefined && !(tones as readonly unknown[]).includes(tone))
    return { reason: `"tone" must be one of ${tones.join(', ')}; received ${JSON.stringify(tone)}`, valid: false }
  return { properties: properties ?? {}, valid: true }
}

const standardFabricDefinition = (key: (typeof standardFabricKeys)[number]): FabricRendererDefinition => ({
  component: ({ bounds, fabric, properties }) => (
    <StandardArtworkPiece
      artworkKey={key}
      request={{
        bounds,
        detail: fabric.detail,
        label: fabric.label,
        properties: artworkProperties(properties)
      }}
    />
  ),
  key,
  schemaVersion: standardArtworkSchemaVersion,
  validateProperties: validateArtworkProperties
})

const standardGraphicDefinition = (key: (typeof standardGraphicKeys)[number]): GraphicRendererDefinition => ({
  component: ({ bounds, graphic, properties }) => (
    <StandardArtworkPiece
      artworkKey={key}
      request={{
        bounds,
        detail: graphic.description,
        label: graphic.label,
        properties: artworkProperties(properties)
      }}
    />
  ),
  key,
  schemaVersion: standardArtworkSchemaVersion,
  validateProperties: validateArtworkProperties
})

/** Every standard Fabric treatment, derived from the catalogue's own key list rather than restated here. */
export const standardFabricRenderers: readonly FabricRendererDefinition[] = Object.freeze(
  standardFabricKeys.map(standardFabricDefinition)
)

/** Every standard Graphic treatment, derived from the catalogue's own key list rather than restated here. */
export const standardGraphicRenderers: readonly GraphicRendererDefinition[] = Object.freeze(
  standardGraphicKeys.map(standardGraphicDefinition)
)
