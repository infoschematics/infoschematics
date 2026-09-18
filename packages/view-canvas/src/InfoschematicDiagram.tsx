import type { Overlay } from '@infoschematics/domain-model'
import {
  type CardDetailOverrides,
  resolveCardDomain,
  resolveReadableInk,
  resolveRegionTreatment,
  resolveResponsiveCardTreatment,
  resolveVisualTreatment
} from '@infoschematics/view-model/appearance'
import { type ArtefactDraftOperation, applyArtefactOperations } from '@infoschematics/view-model/artefact-draft'
import { adapterClaspOutline, adapterLabelBaseline } from '@infoschematics/view-model/assembly'
import { resolveCardLayout } from '@infoschematics/view-model/card-layout'
import type { ElementEmphasis } from '@infoschematics/view-model/dynamics'
import {
  type ArtefactKind,
  type ArtefactSelection,
  type ArtefactSelectionSet,
  type CreatedComponent,
  type InteractionLayers,
  interactionLayerOpen,
  type ResizeMinimum
} from '@infoschematics/view-model/editable'
import type { Box, Point } from '@infoschematics/view-model/geometry'
import type { Guide } from '@infoschematics/view-model/guides'
import { emphasisPerimeterPath } from '@infoschematics/view-model/perimeter'
import { resolvePointLabel } from '@infoschematics/view-model/point-layout'
import { type Port, type PortCounts, portsForBox } from '@infoschematics/view-model/ports'
import { regionGeometry } from '@infoschematics/view-model/region-geometry'
import { svgResourcePrefix } from '@infoschematics/view-model/resources'
import type { FlowSignal } from '@infoschematics/view-model/signals'
import { annotationLabelWidth, visualTokens } from '@infoschematics/view-model/tokens'
import { segmentAt } from '@infoschematics/view-model/waypoints'
import {
  type CSSProperties,
  type ReactNode,
  type Ref,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from 'react'
export type CanvasMode = 'design' | 'scenes' | 'stories' | null
export type DiagramMinimapPosition = 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right'
export type DiagramViewportController = Readonly<{
  fit: () => void
  zoomIn: () => void
  zoomOut: () => void
}>

import {
  createInfoschematicRuntime,
  type RuntimeFlow as InfoschematicFlow,
  type RuntimeFabric
} from '@infoschematics/view-model/runtime'
import { elementEmphasisKey } from './element-emphasis.ts'
import { flowSignalDuration, flowSignalKey } from './flow-signals.ts'
import type { FabricRendererProps, RendererProperties } from './renderer-contract.ts'
import { resolveInfoschematicRenderer, useInfoschematicRenderers } from './renderers.tsx'
import { useInfoschematic } from './runtime-context.tsx'
import {
  centerViewportAt,
  containSurface,
  panViewport,
  sameViewport,
  viewportZoomStep,
  zoomViewport
} from './viewport.ts'

type Highlight = { endpoints: ReadonlySet<string>; flows: ReadonlySet<string> }
type LabelOffsets = ReadonlyMap<string, { dx: number; dy: number }>
type MovableArtefactSelection = Exclude<ArtefactSelection, { kind: 'flow' }>
type ResizeAxes = Readonly<{ height: boolean; width: boolean }>
/** The selection's own controls, resolved once so one layer can draw them wherever the element itself sits. */
type SelectionControls = Readonly<{
  actionsAt: Point
  /** Absent where the kind has no box of its own to resize, which is the case for an adapter. */
  axes: ResizeAxes | null
  bounds: Box
  label: string
  selection: MovableArtefactSelection
}>
type PanGesture = Readonly<{
  clientX: number
  clientY: number
  pointerId: number
  scaleX: number
  scaleY: number
  viewport: Box
}>
type MinimapGesture = Readonly<{ pointerId: number }>
/** Where a range sweep started and where it has reached, in diagram units, so the band is drawn from the same numbers the hit test uses. */
type RangeGesture = Readonly<{ from: Point; to: Point }>

/** One empty set, so a host that holds nothing does not hand a new array to every render. */
const noSelectionSet: ArtefactSelectionSet = []

/** The band a sweep has covered, whichever corner it started from. */
const rangeBand = (gesture: RangeGesture): Box => ({
  height: Math.abs(gesture.to.y - gesture.from.y),
  width: Math.abs(gesture.to.x - gesture.from.x),
  x: Math.min(gesture.from.x, gesture.to.x),
  y: Math.min(gesture.from.y, gesture.to.y)
})

/* Touched, not enclosed: a sweep that crosses an element takes it, which is what lets a Producer gather a row of
   Cards without also covering the Region they sit in. */
const bandTouches = (band: Box, box: Box) =>
  band.x < box.x + box.width &&
  box.x < band.x + band.width &&
  band.y < box.y + box.height &&
  box.y < band.y + band.height

const sameArtefact = (left: ArtefactSelection | null | undefined, right: ArtefactSelection) =>
  left?.kind === right.kind && left.id === right.id

const controlsFor = (
  selection: MovableArtefactSelection,
  bounds: Box,
  label: string,
  resizable: boolean
): SelectionControls => ({
  actionsAt: { x: bounds.x + bounds.width - 48, y: bounds.y + 12 },
  axes: resizable ? { height: true, width: true } : null,
  bounds,
  label,
  selection
})

const pointInDiagram = (svg: SVGSVGElement, clientX: number, clientY: number): Point | undefined => {
  const matrix = svg.getScreenCTM()
  if (!matrix) return undefined
  const point = svg.createSVGPoint()
  point.x = clientX
  point.y = clientY
  const mapped = point.matrixTransform(matrix.inverse())
  return { x: mapped.x, y: mapped.y }
}

const graphicBounds = (graphic: Overlay, viewBox: Box): Box => {
  const width = graphic.bounds?.width ?? Math.min(320, viewBox.width / 3)
  const height = graphic.bounds?.height ?? 80
  return {
    height,
    width,
    x: graphic.bounds?.x ?? viewBox.x + (viewBox.width - width) / 2,
    y: graphic.bounds?.y ?? viewBox.y + (viewBox.height - height) / 2
  }
}

/**
 * Domain answers what semantic family a Card belongs to; Scope answers whether
 * it is applicable and visible. Cards authored before Domain classification
 * retain their Scope colours as a compatibility fallback.
 */
function DefaultFabric({ fabric, bounds }: FabricRendererProps) {
  const caption = typeof fabric.properties?.caption === 'string' ? fabric.properties.caption : fabric.label
  const detail = typeof fabric.properties?.detail === 'string' ? fabric.properties.detail : fabric.description
  const centre = bounds.x + bounds.width / 2
  const captionY = bounds.y + bounds.height / 2 - (detail ? 4 : 0)

  return (
    <>
      <rect
        className="fabric-shell"
        height={bounds.height}
        rx={cornerRadius}
        width={bounds.width}
        x={bounds.x}
        y={bounds.y}
      />
      <text className="fabric-title" x={centre} y={captionY}>
        {caption}
      </text>
      {detail ? (
        <text className="fabric-detail" x={centre} y={captionY + 18}>
          {detail}
        </text>
      ) : null}
    </>
  )
}

function DefaultGraphic({ graphic, bounds }: { graphic: Overlay; bounds: Box }) {
  const { height, width, x, y } = bounds
  const label = graphic.label ?? graphic.id

  return (
    <>
      <rect className="fabric-shell" height={height} rx={cornerRadius} width={width} x={x} y={y} />
      <text className="fabric-title" x={x + width / 2} y={y + height / 2 + 5}>
        {label}
      </text>
    </>
  )
}

const { addReach, attachmentReach, cornerRadius, dragThreshold, gridMinorStrokeWidth, pointRadius, pointTargetRadius } =
  visualTokens.canvas.geometry
// The moving pulse is Canvas-only; static output shares only the still-path treatment.
const signalRadius = 5
const emphasisTokens = visualTokens.canvas.emphasis
const arrowTokens = visualTokens.canvas.arrowhead
// The travelling mark is Canvas-only, like the Flow pulse above: still output shares the perimeter and draws nothing
// travelling on it, because the direction a mark traces is chosen from the geometry and not stated by the document.
const emphasisMarkRadius = 5

/* What an unscoped Point is painted in. The static renderer reaches for its own light-paper defaults here; the
   interactive surface is dark, so the two renderings agree on the Point's geometry and differ on its palette
   exactly as a Card's already does. */
const pointTokens = { fill: visualTokens.canvas.surfaces.backdrop, stroke: visualTokens.canvas.text.muted }

/**
 * What an emphasis draws for one element.
 *
 * A travelling mark is offered only where the element has a closed perimeter a mark can be seen to follow. A Flow is
 * a route that may already be carrying a signal along its own length, so a second mark on the same line would be read
 * as one; it keeps the finite route outline. `ADR-INFOSCHEMATICS-029` records which geometries are declined and why.
 */
type CanvasEmphasisGeometry = Readonly<{
  d: string
  /** The Flow head this overlay redraws in the emphasis stroke, if the element has one. */
  markerEnd?: string
  markerStart?: string
  travels: boolean
}>

const emphasisTreatment = (
  { d, markerEnd, markerStart, travels }: CanvasEmphasisGeometry,
  depicts: ElementEmphasis['depicts']
): ReactNode => (
  <>
    {/* The overlay draws its own head over the Flow's, so an emphasised Flow reads as one emphasised thing rather
        than an amber route ending in a family-coloured point. `.arrow-head { fill: context-stroke }` means this
        costs no second marker definition here — the head takes the stroke of the path referencing it, which is the
        emphasis stroke. The Flow's own head is untouched underneath, which is the distinction DYNAMIC-003 draws
        between what an occurrence may decorate and what an element outputs. */}
    <path
      className={travels ? undefined : 'infoschematic-element-emphasis-route'}
      d={d}
      markerEnd={markerEnd}
      markerStart={markerStart}
    />
    {travels ? (
      /* The mark travels the very path string the outline is drawn from, so it cannot cut a corner the outline
         rounds. One circuit per token period; for a state it repeats for as long as the host holds the occurrence,
         which is how held and travelling compose without either knowing about the other. Declarative SVG motion is
         beyond the reach of any CSS animation property, so reduced motion removes this element rather than stilling
         it — the rule is in `styles.css` and `Canvas.dynamics.test.tsx` holds it there. */
      <circle className="infoschematic-element-emphasis-mark" opacity="0" r={emphasisMarkRadius}>
        <animateMotion
          dur={emphasisTokens.duration}
          path={d}
          repeatCount={depicts === 'state' ? 'indefinite' : undefined}
        />
      </circle>
    ) : null}
  </>
)

export function InfoschematicDiagram({
  artefactOperations = [],
  componentOffsets,
  removals = {},
  guides,
  highlight,
  labelAlong,
  onAddWaypoint,
  onComponentMove,
  onComponentRelease,
  onDeleteWaypoint,
  onLabelMove,
  onLabelRelease,
  onMoveSegment,
  onMoveWaypoint,
  onRouteRelease,
  hovered,
  onAttach,
  layers,
  mode = null,
  litByScene,
  onLight,
  createdCards = [],
  onCreateLine,
  onFreeEnd,
  onHover,
  onSelect,
  onArtefactExtend,
  onArtefactGroupMove,
  onArtefactMove,
  onArtefactRange,
  onArtefactRelease,
  onArtefactRemove,
  onArtefactReorder,
  onArtefactResize,
  onArtefactSelect,
  portCounts,
  selected,
  selectedArtefact,
  selectionSet = noSelectionSet,
  signals = [],
  emphasis = [],
  flows: suppliedFlows,
  annotated,
  cardDetails,
  responsiveCardDetails = false,
  grid,
  graphic,
  visibleScopes,
  minimap = 'top-right',
  viewportControllerRef,
  viewportControls = 'overlay',
  resourceIdPrefix
}: {
  /** Authored Design operations previewed without changing the host configuration. */
  artefactOperations?: readonly ArtefactDraftOperation[]
  /** Codes marked for removal, drawn as going rather than gone. */
  removals?: Record<string, unknown>
  /** Component positions dragged in the editor but not yet written into the model. */
  componentOffsets?: LabelOffsets
  guides?: readonly Guide[]
  highlight?: Highlight
  labelAlong?: ReadonlyMap<string, number>
  /** Click on a selected flow's line, away from any waypoint, to insert one there. */
  onAddWaypoint?: (code: string, points: readonly Point[], at: Point) => void
  onComponentMove?: (code: string, point: { x: number; y: number }) => void
  onComponentRelease?: () => void
  /** The delete control next to a selected waypoint. */
  onDeleteWaypoint?: (code: string, points: readonly Point[], index: number) => void
  onLabelMove?: (code: string, point: { x: number; y: number }) => void
  onLabelRelease?: () => void
  /** Dragging the grip on the run between two interior waypoints. */
  onMoveSegment?: (code: string, points: readonly Point[], index: number, to: Point) => void
  /** Dragging a waypoint handle on a selected flow. */
  onMoveWaypoint?: (code: string, points: readonly Point[], index: number, to: Point) => void
  /** Release for a waypoint or segment drag, closing the gesture the way a component drag does. */
  onRouteRelease?: () => void
  onAttach?: (code: string, end: 'source' | 'target', port: string, component: string) => void
  /**
   * Which visual element kinds this Design session lets a Producer reach.
   *
   * Absent leaves every kind interactive, which is what a host that has no layer control wants. The set is the
   * session's, never the document's: nothing here is written back, and no authored order changes because of it.
   */
  layers?: InteractionLayers
  /** Which editor is open, if either. The Infoschematic does not infer it. */
  mode?: CanvasMode
  /** In scene editing, what the selected scene lights, so the Infoschematic can show it. */
  litByScene?: ReadonlySet<string>
  /** In scene editing, a click adds or removes what it lands on. */
  onLight?: (id: string, isFlow: boolean) => void
  /** Cards made in the editor, which the model has no entry for yet. */
  createdCards?: readonly CreatedComponent[]
  /**
   * Two ports a drag has joined, and where on screen it was let go.
   *
   * The line is not made here: which family it belongs to has still to be
   * chosen, and that decides its code and its colour. The screen point is so
   * that question can be asked where the reader is looking.
   */
  onCreateLine?: (ends: { source: string; sourcePort: string; target: string; targetPort: string }, at: Point) => void
  onFreeEnd?: (code: string, points: readonly Point[], end: 'end' | 'start', to: Point) => void
  /** What the pointer is over, so a change in the panel can light up with it. */
  onHover?: (code: string | null) => void
  /** What the panel is pointing back at, lit here the way a hover on Infoschematic is. */
  hovered?: string | null
  onSelect?: (code: string) => void
  /** Typed six-kind Design selection. String selection remains for auxiliary handles during migration. */
  onArtefactSelect?: (selection: ArtefactSelection | null) => void
  /** Shift on a press or on Enter: add the element to the held group, or take it back out. */
  onArtefactExtend?: (selection: ArtefactSelection) => void
  /**
   * How far a group drag has travelled, in diagram units, measured from where it started.
   *
   * One offset for the whole group rather than a point per element: the elements keep their positions relative to
   * each other, so the only thing the gesture has to say is how far. Absent leaves a held element dragging alone.
   */
  onArtefactGroupMove?: (offset: { dx: number; dy: number }) => void
  /** Canvas emits pointer coordinates; View Model owns constraints and operation construction. */
  onArtefactMove?: (selection: MovableArtefactSelection, point: Point) => void
  /** Everything a range sweep crossed, for the host to add to what it already holds. */
  onArtefactRange?: (selections: readonly ArtefactSelection[]) => void
  onArtefactResize?: (selection: MovableArtefactSelection, size: ResizeMinimum) => void
  onArtefactReorder?: (selection: ArtefactSelection, direction: -1 | 1) => void
  onArtefactRemove?: (selection: ArtefactSelection) => void
  /** Closes one pointer gesture for undo grouping. */
  onArtefactRelease?: () => void
  /** Port counts changed in the editor but not yet written into the model. */
  portCounts?: Readonly<Record<string, PortCounts>>
  selected?: string | null
  selectedArtefact?: ArtefactSelection | null
  /**
   * Every element the Design session holds, anchor first, with `selectedArtefact` as its first element.
   *
   * The anchor is what a group operation aligns to, and it is the element every single-selection control already
   * reads, so a group is the single selection with more behind it rather than a second kind of selection.
   */
  selectionSet?: ArtefactSelectionSet
  /** Transient host-owned Flow occurrences; stable keys prevent accidental replay. */
  signals?: readonly FlowSignal[]
  /**
   * Transient host-owned element emphasis, already resolved from authored Diagram Dynamics.
   *
   * The treatment is this renderer's choice; the accessible meaning belongs to the Dynamic, which is why the
   * announcement is made by the Canvas and the graphics here are decorative.
   */
  emphasis?: readonly ElementEmphasis[]
  flows: readonly InfoschematicFlow[]
  annotated?: boolean
  /** Output-only Card metadata visibility; authored data remains unchanged. */
  cardDetails?: CardDetailOverrides
  /** Reduce optional Card rows from the measured rendered size. Defaults off. */
  responsiveCardDetails?: boolean
  /** Legacy Design grid overlay, independent of the authored grid treatment. */
  grid?: boolean
  /** A resolved Graphic drawn by the active Story Scene. */
  graphic?: Overlay
  visibleScopes: ReadonlySet<string>
  /** Overview map shown while zoomed; false disables it, otherwise selects its corner. */
  minimap?: false | DiagramMinimapPosition
  /** Allows a host toolbar to operate this otherwise self-contained viewport. */
  viewportControllerRef?: Ref<DiagramViewportController>
  /** Studio supplies its own toolbar; ordinary Canvas hosts retain the overlay controls. */
  viewportControls?: 'external' | 'overlay'
  /**
   * Prefix for the SVG `marker` and `pattern` identifiers this rendering defines for itself.
   *
   * A host never has to supply one. The default is derived from `useId`, which makes every Canvas mounted in one React
   * root name its own definitions, so an unconfigured page that embeds two Infoschematics is already correct. Supply a
   * value only when the host composes one document out of separately rendered passes — two independent
   * `renderToStaticMarkup` calls produce the same identifiers by design, and nothing inside either pass can see the
   * other. Authored artefact identity is untouched: this names only what the renderer itself puts in `defs`.
   */
  resourceIdPrefix?: string
}) {
  const hostRuntime = useInfoschematic()
  // Removal is a review state, not a materialised preview state. Keeping
  // authored artefacts in the runtime lets Canvas draw and select them with
  // the `going` treatment until the host applies the change set.
  const previewOperations = useMemo(
    () => artefactOperations.filter((operation) => operation.operation !== 'remove'),
    [artefactOperations]
  )
  const pendingRemovals = useMemo(
    () => ({
      ...removals,
      ...Object.fromEntries(
        artefactOperations
          .filter((operation) => operation.operation === 'remove')
          .map((operation) => [operation.target.code ?? operation.target.id, {}])
      )
    }),
    [artefactOperations, removals]
  )
  const previewing = previewOperations.length > 0
  const runtime = useMemo(() => {
    if (!previewing) return hostRuntime
    const preview = createInfoschematicRuntime(
      applyArtefactOperations(hostRuntime.compatibilityConfig, previewOperations).config
    )
    // Artefact operations still project through the established compatibility
    // shape. Preserve canonical-only Diagram settings while that boundary is
    // in force so opening a Design draft cannot silently restore its defaults.
    return {
      ...preview,
      config: {
        ...preview.config,
        diagram: { ...preview.config.diagram, gridSize: hostRuntime.config.diagram.gridSize }
      }
    }
  }, [hostRuntime, previewing, previewOperations])
  const {
    adapterFloor,
    config,
    infoschematicAnnotationLabelPositions,
    infoschematicCardIsVisible,
    infoschematicCards,
    infoschematicCollections,
    infoschematicEndpointCodes,
    infoschematicEndpointLabels,
    infoschematicFabricIsVisible,
    infoschematicFabrics,
    infoschematicFamilies,
    infoschematicFlowIsVisible,
    infoschematicFlows,
    infoschematicLayout,
    infoschematicPlaceables,
    infoschematicPoints,
    infoschematicRegions,
    infoschematicRegisterWith,
    infoschematicScopes,
    infoschematicSpecificationsFor,
    infoschematicViewBox
  } = runtime
  // biome-ignore lint/correctness/useExhaustiveDependencies: pre-existing dependency shape kept as-is; TOOL-015 is toolchain-only and does not change effect/callback behaviour.
  const flows = useMemo(() => {
    if (!previewing || mode !== 'design') return suppliedFlows

    const families = new Set(infoschematicFamilies.map((family) => family.id))
    const suppliedById = new Map(suppliedFlows.map((flow) => [flow.id, flow]))
    const authoredById = new Map(hostRuntime.infoschematicFlows.map((flow) => [flow.id, flow]))
    const effective = infoschematicFlows
      .filter((flow) => infoschematicFlowIsVisible(flow, families, visibleScopes))
      .map((flow) => {
        const draft = suppliedById.get(flow.id)
        const authored = authoredById.get(flow.id)
        const hasRouteDraft =
          draft &&
          authored &&
          (draft.d !== authored.d ||
            draft.source !== authored.source ||
            draft.sourcePort !== authored.sourcePort ||
            draft.target !== authored.target ||
            draft.targetPort !== authored.targetPort)
        return hasRouteDraft
          ? {
              ...flow,
              d: draft.d,
              points: draft.points,
              source: draft.source,
              sourcePort: draft.sourcePort,
              target: draft.target,
              targetPort: draft.targetPort
            }
          : flow
      })
    const effectiveIds = new Set(effective.map((flow) => flow.id))
    const authoredIds = new Set(hostRuntime.config.diagram.flows.map((flow) => flow.id))
    const legacyDrafts = suppliedFlows.filter((flow) => !authoredIds.has(flow.id) && !effectiveIds.has(flow.id))
    return [...effective, ...legacyDrafts]
  }, [
    hostRuntime.config.diagram.flows,
    infoschematicFamilies,
    infoschematicFlowIsVisible,
    infoschematicFlows,
    mode,
    previewing,
    suppliedFlows,
    visibleScopes
  ])
  const renderers = useInfoschematicRenderers()
  const requestedVisualTreatment = resolveVisualTreatment(config.diagram.appearance, cardDetails)
  const authoredGridSize = config.diagram.gridSize
  // Pattern dimensions cannot be zero even though zero intentionally disables
  // the authored lattice. Keep dormant definitions valid and suppress their use.
  const gridSize = authoredGridSize || 1
  const gridMajorSize = gridSize * (visualTokens.canvas.geometry.gridMajorSize / visualTokens.canvas.geometry.gridSize)
  const domains = infoschematicCollections
  const Definitions = renderers.definitions
  /* Every `marker` and `pattern` below is resolved by document order, not by proximity, so an unprefixed identifier
     lets a sibling rendering on the same page draw this one's arrowheads and grid. `useId` is unique per mount within
     a React root and stable across a render pass, which is what makes an unconfigured two-Canvas host correct while
     keeping identical markup identical. A host that assembles a document from separate passes supplies its own. */
  const resourcePrefix = svgResourcePrefix(resourceIdPrefix, useId())
  /* One definition per family serves both ends of every Flow here, because a browser resolves the SVG 2
     `orient="auto-start-reverse"` and turns the same triangle to face back out of a source when it is a
     `marker-start`. The static renderer cannot: the rasteriser behind the command line ignores that value, so it
     mirrors the geometry into a second definition instead. The divergence is deliberate and is stated in both
     places, so that neither reads as an oversight in the other.

     A registration is bidirectional, and six heads converging on the registry said nothing a reader did not
     already know — every one of them points there. The head that carries meaning is the one at the provider, so a
     two-way line keeps that and drops the other. */
  const flowArrowhead = (flow: { bidirectional?: boolean; family: string }, end: 'end' | 'start') =>
    (flow.bidirectional ? end === 'start' : end === 'end') ? `url(#${resourcePrefix}-arrow-${flow.family})` : undefined
  const activeGraphicRenderer =
    mode !== 'design' && graphic
      ? resolveInfoschematicRenderer(
          renderers,
          'graphic',
          graphic.kind,
          graphic.properties as RendererProperties | undefined,
          graphic.id
        )
      : undefined
  const familyById = new Map(infoschematicFamilies.map((family) => [family.id, family]))
  const familyLayer = new Map(infoschematicFamilies.map((family, index) => [family.id, index]))
  const scopeAppearance = Object.fromEntries(
    infoschematicScopes.map((scope) => [scope.id, { fill: scope.fill, stroke: scope.color }])
  ) as Record<string, { fill: string; stroke: string }>
  const cardById = new Map(infoschematicCards.map((card) => [card.id, card]))
  const accessibleSummary = infoschematicCards
    .filter((card) => infoschematicCardIsVisible(card, visibleScopes))
    .map((card) => [card.code, card.label, card.stereotype, card.detail].filter(Boolean).join(' · '))
    .join('; ')
  // Every port a card offers is shown; the ones a route already meets are drawn
  // solid and named, so a reader can see what is taken and what is free.
  // Green marks the ports the *selected* flow meets, not every port in
  // use anywhere: a Infoschematic full of green says nothing about what is selected,
  // and the two ends you can re-attach are the two worth pointing at.
  const selectedFlow = flows.find(
    (flow) => flow.code === selected || (selectedArtefact?.kind === 'flow' && selectedArtefact.id === flow.id)
  )
  const used = new Set(
    selectedFlow
      ? [`${selectedFlow.source}:${selectedFlow.sourcePort}`, `${selectedFlow.target}:${selectedFlow.targetPort}`]
      : []
  )
  // The ports a route actually meets, which is a different question from the one
  // `used` answers. `used` stays scoped to the selected flow so green keeps
  // saying what is selected; these are the anchors the diagram is read by, so
  // they keep their dot whether or not anything is selected.
  const attached = new Set(
    flows.flatMap((flow) => [`${flow.source}:${flow.sourcePort}`, `${flow.target}:${flow.targetPort}`])
  )
  // Boxes and ports with the edits in hand already folded in, so the drop
  // target, the ports drawn, and the lookup that resolves a chosen port all
  // read one answer rather than three merges of the same two drafts.
  const placeables = infoschematicPlaceables(visibleScopes, {
    created: createdCards,
    offsets: componentOffsets,
    portCounts
  })
  // The register with the created cards folded in, so a card made a moment ago
  // answers what it is called and what scope it belongs to exactly as one that
  // was authored does.
  const register = infoschematicRegisterWith(createdCards)

  // A card keeps its authored box until it is dragged; only a moved one needs
  // the editor's offset folded in, so ports, the code badge, and the card
  // itself all read the same adjusted position.
  const movedBox = (box: Box, code: string): Box => {
    const offset = componentOffsets?.get(code)
    return offset ? { ...box, x: box.x + offset.dx, y: box.y + offset.dy } : box
  }

  /*
   * An end is anchored only when its component offers the named port. Treating
   * an invalid reference as unanchored gives the editor a visible handle and
   * lets a later drop resolve it to a real port.
   */
  const anchoredEnds = new Set(
    flows.flatMap((flow) => {
      const anchored = (id: string, port: string) => {
        const placeable = placeables.find((candidate) => candidate.id === id)
        if (!placeable) return false
        return portsForBox(placeable.box, placeable.ports).some((candidate) => candidate.id === port)
      }
      return [
        ...(anchored(flow.source, flow.sourcePort) ? [`${flow.code}:start`] : []),
        ...(anchored(flow.target, flow.targetPort) ? [`${flow.code}:end`] : [])
      ]
    })
  )
  const labelPositions = infoschematicAnnotationLabelPositions(flows, visibleScopes, labelAlong)
  /*
   * Which editor is open, told rather than guessed.
   *
   * This read `Boolean(onLabelMove)` - edit mode inferred from a callback being
   * present, so the Infoschematic learned what it could do from what it had been handed
   * rather than from what was being edited. That was serviceable while there was
   * one editor and became wrong the moment there were two.
   *
   * `editing` below still means "the Infoschematic editor is open", which is what all
   * thirty-odd checks meant when they were written. Scene editing shows none of
   * them: `TERM-010` requires absent rather than dimmed, so the handles, ports
   * and waypoint controls simply are not rendered.
   */
  const editing = mode === 'design'
  /*
   * Every authored Graphic, wherever the Diagram is drawn, with a Scene's own Graphic added to them.
   *
   * This was `editing ? config.diagram.overlays : graphic ? [graphic] : []`, so an authored Overlay appeared in
   * Design and nowhere else, and the only Graphic a reader ever saw was one a Scene named. An authored Scene has no
   * field that can name one, so for an authored document that set was always empty and the declaration drew nothing
   * at all — `ADR-INFOSCHEMATICS-037`. A Scene now adds to what is drawn rather than replacing it, deduplicated by id
   * because a Scene naming an authored Overlay means the same Overlay.
   */
  const graphics = useMemo(() => {
    const authored = config.diagram.overlays
    if (!graphic || authored.some((overlay) => overlay.id === graphic.id)) return authored
    return [...authored, graphic]
  }, [config.diagram.overlays, graphic])
  // Both editing layers above the Infoschematic light rather than place: a scene says
  // what it shows, and a story's Story Scene does the same through the scene it plays.
  const focusing = mode === 'scenes' || mode === 'stories'

  /*
   * Which kinds a press or a key may reach, which is a different question from which kinds are drawn.
   *
   * A closed interaction layer leaves its elements exactly as authored - same geometry, same treatment, same place in
   * the paint order - and only stops them answering, so a Graphic laid across a Card stops taking the press meant for
   * the Card without either of them being moved to make room. Keyboard reach has to leave the markup as well:
   * `pointer-events: none` takes an element out of hit testing and leaves it in the tab order.
   */
  const interactive = (kind: ArtefactKind) => editing && interactionLayerOpen(kind, layers)
  /** The class that takes a closed layer out of hit testing, paired with withholding the selectable classes. */
  const inert = (kind: ArtefactKind) => (editing && !interactive(kind) ? ' layer-inert' : '')

  // Which waypoint carries the delete control. Local rather than editor state:
  // it names a dot on screen for as long as it is looked at, not an edit worth
  // an undo entry, so it is cleared whenever the flow selection moves on.
  //
  // Reset during render against a ref, rather than a useEffect keyed on
  // `selected`: the effect body never reads `selected` itself, only depends on
  // it, so Biome's hooks lint sees an unused dependency and its --unsafe fix
  // strips it - silently turning this into a one-off reset on mount. This is
  // React's own documented alternative for "clear derived state when a prop
  // changes", and it has no dependency array for that fix to miscompile.
  const [addAt, setAddAt] = useState<Point | null>(null)
  // Adding and removing a waypoint are armed by a held modifier rather than
  // always offered: a selected flow is a thing to look at more often than
  // a thing to change, and an unarmed pointer cannot alter it by accident.
  const [armed, setArmed] = useState(false)
  const infoschematic = useRef<SVGSVGElement>(null)
  const diagramFrame = useRef<HTMLDivElement>(null)
  const minimapOverview = useRef<SVGSVGElement>(null)
  const pointerGestureCleanups = useRef(new Set<() => void>())
  const zoomPointer = useRef<{ clientX: number; clientY: number } | null>(null)
  const [surfaceSize, setSurfaceSize] = useState<{ height: number; width: number } | null>(null)
  const [viewport, setViewport] = useState<Box>(infoschematicViewBox)
  const [panGesture, setPanGesture] = useState<PanGesture | null>(null)
  const [minimapGesture, setMinimapGesture] = useState<MinimapGesture | null>(null)
  const [rangeGesture, setRangeGesture] = useState<RangeGesture | null>(null)

  const listenForPointerGesture = useCallback(
    (move: (event: PointerEvent) => void, release: (event: PointerEvent) => void, cancel: () => void) => {
      const cleanup = () => {
        window.removeEventListener('pointermove', move)
        window.removeEventListener('pointerup', finish)
        window.removeEventListener('pointercancel', abort)
        pointerGestureCleanups.current.delete(cleanup)
      }
      const finish = (event: PointerEvent) => {
        cleanup()
        release(event)
      }
      const abort = () => {
        cleanup()
        cancel()
      }
      pointerGestureCleanups.current.add(cleanup)
      window.addEventListener('pointermove', move)
      window.addEventListener('pointerup', finish)
      window.addEventListener('pointercancel', abort)
    },
    []
  )

  useEffect(
    () => () => {
      for (const cleanup of pointerGestureCleanups.current) cleanup()
      pointerGestureCleanups.current.clear()
    },
    []
  )
  const frameSize = useMemo(
    () => (surfaceSize ? containSurface(surfaceSize, infoschematicViewBox) : null),
    [infoschematicViewBox, surfaceSize]
  )
  const frameStyle: CSSProperties = frameSize
    ? { height: frameSize.height, width: frameSize.width }
    : {
        aspectRatio: `${infoschematicViewBox.width} / ${infoschematicViewBox.height}`,
        height: '100%',
        width: '100%'
      }
  const visualTreatment = {
    ...requestedVisualTreatment,
    grid: authoredGridSize === 0 ? ('none' as const) : requestedVisualTreatment.grid,
    card:
      responsiveCardDetails && frameSize
        ? resolveResponsiveCardTreatment(infoschematicViewBox, frameSize, requestedVisualTreatment.card)
        : requestedVisualTreatment.card
  }

  useLayoutEffect(() => {
    const surface = diagramFrame.current?.parentElement
    if (!surface) return

    const measure = (width: number, height: number) => {
      if (width <= 0 || height <= 0) return
      setSurfaceSize((current) =>
        current && Math.abs(current.width - width) < 0.1 && Math.abs(current.height - height) < 0.1
          ? current
          : { height, width }
      )
    }

    measure(surface.clientWidth, surface.clientHeight)
    if (typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver(([entry]) => {
      if (entry) measure(entry.contentRect.width, entry.contentRect.height)
    })
    observer.observe(surface)
    return () => observer.disconnect()
  }, [])

  const lastAuthoredViewport = useRef(infoschematicViewBox)
  if (!sameViewport(lastAuthoredViewport.current, infoschematicViewBox)) {
    lastAuthoredViewport.current = infoschematicViewBox
    setViewport(infoschematicViewBox)
    if (panGesture) setPanGesture(null)
    if (minimapGesture) setMinimapGesture(null)
  }
  const fitted = sameViewport(viewport, infoschematicViewBox)
  const zoomBy = useCallback(
    (magnification: number, anchor?: Point) => {
      setViewport((current) => zoomViewport(infoschematicViewBox, current, magnification, anchor))
    },
    [infoschematicViewBox]
  )
  const fitViewport = useCallback(() => setViewport(infoschematicViewBox), [infoschematicViewBox])
  useImperativeHandle(
    viewportControllerRef,
    () => ({
      fit: fitViewport,
      zoomIn: () => zoomBy(viewportZoomStep),
      zoomOut: () => zoomBy(1 / viewportZoomStep)
    }),
    [fitViewport, zoomBy]
  )
  const zoomAnchor = useCallback((): Point | undefined => {
    const svg = infoschematic.current
    const at = zoomPointer.current
    return svg && at ? pointInDiagram(svg, at.clientX, at.clientY) : undefined
  }, [])

  useEffect(() => {
    const keyDown = (event: KeyboardEvent) => {
      if (!zoomPointer.current || event.altKey || event.ctrlKey || event.metaKey) return
      const target = event.target
      if (target instanceof Element && target.closest('input, textarea, select, [contenteditable="true"]')) return

      if (event.key === '0') {
        event.preventDefault()
        fitViewport()
      } else if (event.key === '+') {
        event.preventDefault()
        zoomBy(viewportZoomStep, zoomAnchor())
      } else if (event.key === '-') {
        event.preventDefault()
        zoomBy(1 / viewportZoomStep, zoomAnchor())
      }
    }
    window.addEventListener('keydown', keyDown)
    return () => window.removeEventListener('keydown', keyDown)
  }, [fitViewport, zoomAnchor, zoomBy])

  const rememberZoomPointer = (event: React.PointerEvent<SVGSVGElement>) => {
    zoomPointer.current = { clientX: event.clientX, clientY: event.clientY }
  }
  const clearZoomPointer = () => {
    zoomPointer.current = null
  }
  const clearSelection = () => {
    if (!editing) return
    if (onArtefactSelect) onArtefactSelect(null)
    else onSelect?.('')
  }
  /*
   * What a range sweep can gather, taken from the collections this render already resolved.
   *
   * Read from the geometry the diagram drew rather than by hit testing the document, so an element lying under a
   * Graphic is still swept while a closed layer is still left out. Flows are absent because a route is not a box and
   * follows the ports it is attached to. An adapter is absent because the Card it holds is swept in its own right,
   * and holding both would ask one Card to move twice.
   */
  const rangeCandidates = (): readonly { box: Box; selection: ArtefactSelection }[] => [
    ...(interactive('region')
      ? infoschematicRegions.map((region) => ({
          box: region.box,
          selection: { code: null, geometry: 'box', id: region.id, kind: 'region' } as const
        }))
      : []),
    ...(interactive('fabric')
      ? infoschematicFabrics
          .filter((fabric) => infoschematicFabricIsVisible(fabric, visibleScopes))
          .map((fabric) => ({
            box: movedBox(fabric.bounds, fabric.code),
            selection: { code: fabric.code, geometry: 'box', id: fabric.id, kind: 'fabric' } as const
          }))
      : []),
    ...(interactive('card')
      ? placeables
          .filter((placeable) => !register.cardAt(placeable.code)?.wraps)
          .map((placeable) => ({
            box: placeable.box,
            selection: { code: placeable.code, geometry: 'box', id: placeable.id, kind: 'card' } as const
          }))
      : []),
    ...(interactive('graphic')
      ? graphics.map((entry) => ({
          box: graphicBounds(entry, infoschematicViewBox),
          selection: { code: null, geometry: 'box', id: entry.id, kind: 'graphic' } as const
        }))
      : [])
  ]

  /*
   * Shift and drag across the surface: take everything the band covers, and keep what is already held.
   *
   * Both ends are mapped into diagram units as they happen, because the viewport can be zoomed and panned: a band
   * measured in screen pixels would cover something other than what the Producer drew it around. The sweep is only
   * read once, on release - a selection that changed under every pointer event would make the band a series of
   * guesses rather than one question.
   */
  const startRange = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!onArtefactRange) return
    const svg = event.currentTarget
    const from = pointInDiagram(svg, event.clientX, event.clientY)
    if (!from) return
    event.preventDefault()
    setRangeGesture({ from, to: from })
    const candidates = rangeCandidates()
    let band: Box | null = null
    const move = (moved: PointerEvent) => {
      const to = pointInDiagram(svg, moved.clientX, moved.clientY)
      if (!to) return
      band = rangeBand({ from, to })
      setRangeGesture({ from, to })
    }
    const abandon = () => setRangeGesture(null)
    const finish = () => {
      setRangeGesture(null)
      const swept = band
      if (!swept) return
      onArtefactRange(candidates.flatMap(({ box, selection }) => (bandTouches(swept, box) ? [selection] : [])))
    }
    listenForPointerGesture(move, finish, abandon)
  }

  const startPan = (event: React.PointerEvent<SVGSVGElement>) => {
    if (editing && (event.target as Element).closest('[data-artefact-kind]')) return
    // Shift on the surface gathers rather than pans, and must not clear the group it is about to add to.
    if (editing && onArtefactRange && event.shiftKey && event.button === 0) {
      startRange(event)
      return
    }
    clearSelection()
    if (fitted || event.button !== 0) return
    const bounds = event.currentTarget.getBoundingClientRect()
    if (bounds.width <= 0 || bounds.height <= 0) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    setPanGesture({
      clientX: event.clientX,
      clientY: event.clientY,
      pointerId: event.pointerId,
      scaleX: viewport.width / bounds.width,
      scaleY: viewport.height / bounds.height,
      viewport
    })
  }
  const movePan = (event: React.PointerEvent<SVGSVGElement>) => {
    rememberZoomPointer(event)
    if (!panGesture || panGesture.pointerId !== event.pointerId) return
    setViewport(
      panViewport(infoschematicViewBox, panGesture.viewport, {
        x: -(event.clientX - panGesture.clientX) * panGesture.scaleX,
        y: -(event.clientY - panGesture.clientY) * panGesture.scaleY
      })
    )
  }
  const stopPan = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!panGesture || panGesture.pointerId !== event.pointerId) return
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId)
    setPanGesture(null)
  }
  const moveFromMinimap = (event: React.PointerEvent<HTMLButtonElement>) => {
    const at = minimapOverview.current
      ? pointInDiagram(minimapOverview.current, event.clientX, event.clientY)
      : undefined
    if (at) setViewport((current) => centerViewportAt(infoschematicViewBox, current, at))
  }
  const startMinimapPan = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return
    event.preventDefault()
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    setMinimapGesture({ pointerId: event.pointerId })
    moveFromMinimap(event)
  }
  const continueMinimapPan = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!minimapGesture || minimapGesture.pointerId !== event.pointerId) return
    moveFromMinimap(event)
  }
  const stopMinimapPan = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!minimapGesture || minimapGesture.pointerId !== event.pointerId) return
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId)
    setMinimapGesture(null)
  }
  const minimapKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    const delta = {
      ArrowDown: { x: 0, y: viewport.height / 10 },
      ArrowLeft: { x: -viewport.width / 10, y: 0 },
      ArrowRight: { x: viewport.width / 10, y: 0 },
      ArrowUp: { x: 0, y: -viewport.height / 10 }
    }[event.key]
    if (!delta) return
    event.preventDefault()
    setViewport((current) => panViewport(infoschematicViewBox, current, delta))
  }
  // The last pointer position, since a key press does not carry one.
  const pointer = useRef<MouseEvent | null>(null)
  const [dropPort, setDropPort] = useState<string | null>(null)
  // The line a port-to-port drag is drawing, before there is anything to draw it from.
  const [drawing, setDrawing] = useState<{ from: Point; to: Point } | null>(null)
  const [hoveredWaypoint, setHoveredWaypoint] = useState<string | null>(null)
  const [selectedWaypoint, setSelectedWaypoint] = useState<{ code: string; index: number } | null>(null)
  const lastSelected = useRef(selected)
  if (lastSelected.current !== selected) {
    lastSelected.current = selected
    setSelectedWaypoint(null)
  }

  const artefactSelected = (selection: ArtefactSelection, legacyKey: string) =>
    selectedArtefact ? sameArtefact(selectedArtefact, selection) : selected === legacyKey

  const artefactInGroup = (selection: ArtefactSelection) =>
    selectionSet.length > 1 && selectionSet.some((element) => sameArtefact(element, selection))

  /*
   * The class for a held element that is not the anchor.
   *
   * The anchor keeps the ordinary selected treatment, because it is the element every single-selection control still
   * acts on and the one an alignment brings the rest onto. Marking the others differently is how a Producer can see
   * which of them that is before pressing an align control.
   */
  const inGroup = (selection: ArtefactSelection) =>
    artefactInGroup(selection) && !sameArtefact(selectedArtefact, selection) ? ' group-held' : ''

  const selectArtefact = (selection: ArtefactSelection, legacyKey: string) => {
    if (onArtefactSelect) onArtefactSelect(selection)
    else onSelect?.(legacyKey)
  }

  const artefactKeyDown = (selection: ArtefactSelection, legacyKey: string) => (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      // Shift is the keyboard's whole multi-selection gesture. There is no keyboard range, because adding one
      // element at a time is already how a group is built without a pointer.
      if (event.shiftKey && onArtefactExtend) onArtefactExtend(selection)
      else selectArtefact(selection, legacyKey)
      return
    }
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault()
      selectArtefact(selection, legacyKey)
      onArtefactRemove?.(selection)
      return
    }
    if (event.altKey && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
      event.preventDefault()
      selectArtefact(selection, legacyKey)
      onArtefactReorder?.(selection, event.key === 'ArrowUp' ? -1 : 1)
    }
  }

  const eventPoint = (element: SVGElement, clientX: number, clientY: number): Point | undefined => {
    const svg = element.ownerSVGElement
    const matrix = svg?.getScreenCTM()
    if (!svg || !matrix) return undefined
    const point = svg.createSVGPoint()
    point.x = clientX
    point.y = clientY
    const mapped = point.matrixTransform(matrix.inverse())
    return { x: mapped.x, y: mapped.y }
  }

  /*
   * One press, every held element.
   *
   * The gesture reports how far it has travelled from where it started rather than where the pointer now is, so the
   * group keeps its own shape however the host decides to place it, and a second drag carries on from the first.
   */
  const dragGroup = (event: React.PointerEvent<SVGElement>) => {
    if (!onArtefactGroupMove) return
    event.preventDefault()
    event.stopPropagation()
    const element = event.currentTarget
    const origin = { x: event.clientX, y: event.clientY }
    const start = eventPoint(element, event.clientX, event.clientY)
    if (!start) return
    let dragging = false
    const move = (moved: PointerEvent) => {
      if (!dragging) {
        if (Math.hypot(moved.clientX - origin.x, moved.clientY - origin.y) < dragThreshold) return
        dragging = true
      }
      const point = eventPoint(element, moved.clientX, moved.clientY)
      if (!point) return
      onArtefactGroupMove({ dx: point.x - start.x, dy: point.y - start.y })
    }
    const release = () => {
      if (dragging) onArtefactRelease?.()
    }
    listenForPointerGesture(move, release, release)
  }

  const dragArtefact =
    (
      selection: MovableArtefactSelection,
      legacyKey: string,
      origin: Point,
      axes: Readonly<{ x: boolean; y: boolean }>,
      selectionToSelect: ArtefactSelection = selection
    ) =>
    (event: React.PointerEvent<SVGElement>) => {
      // Shift takes the element into the group or out of it, and never starts a drag: the press that is building a
      // selection is not the press that moves it.
      if (event.shiftKey && onArtefactExtend) {
        event.preventDefault()
        event.stopPropagation()
        onArtefactExtend(selectionToSelect)
        return
      }
      /*
       * A press on something already held moves the whole group, and does not reduce the selection to it.
       *
       * Taking hold of one of several elements is how a Producer expects to move all of them; re-selecting on the
       * press would throw the group away before the drag it was collected for could happen.
       */
      if (onArtefactGroupMove && artefactInGroup(selectionToSelect)) {
        dragGroup(event)
        return
      }
      selectArtefact(selectionToSelect, legacyKey)
      if (!onArtefactMove) return
      event.preventDefault()
      event.stopPropagation()
      const element = event.currentTarget
      const from = { x: event.clientX, y: event.clientY }
      let dragging = false
      const move = (moved: PointerEvent) => {
        if (!dragging) {
          if (Math.hypot(moved.clientX - from.x, moved.clientY - from.y) < dragThreshold) return
          dragging = true
        }
        const point = eventPoint(element, moved.clientX, moved.clientY)
        if (!point) return
        onArtefactMove(selection, {
          x: axes.x ? point.x : origin.x,
          y: axes.y ? point.y : origin.y
        })
      }
      const release = () => {
        if (dragging) onArtefactRelease?.()
      }
      listenForPointerGesture(move, release, release)
    }

  const ResizeHandle = ({
    axes,
    bounds,
    label,
    selection
  }: {
    axes: ResizeAxes
    bounds: Box
    label: string
    selection: MovableArtefactSelection
  }) => {
    if (!onArtefactResize) return null
    const resize = (point: Point) =>
      onArtefactResize(selection, {
        height: axes.height ? point.y - bounds.y : undefined,
        width: axes.width ? point.x - bounds.x : undefined
      })
    return (
      // biome-ignore lint/a11y/useSemanticElements: SVG has no button element; the labelled group is keyboard operable.
      <g
        aria-label={`Resize ${label}`}
        className="artefact-resize-handle"
        onKeyDown={(event) => {
          // With the grid on a resize steps a whole cell, so the far edge
          // stays on a grid line; the editor rounds the result to the grid too.
          const step = grid && authoredGridSize > 0 ? authoredGridSize : event.shiftKey ? 10 : 1
          const size: ResizeMinimum =
            axes.width && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')
              ? { width: bounds.width + (event.key === 'ArrowRight' ? step : -step) }
              : axes.height && (event.key === 'ArrowUp' || event.key === 'ArrowDown')
                ? { height: bounds.height + (event.key === 'ArrowDown' ? step : -step) }
                : {}
          if (size.height === undefined && size.width === undefined) return
          event.preventDefault()
          onArtefactResize(selection, size)
        }}
        onPointerDown={(event) => {
          event.preventDefault()
          event.stopPropagation()
          const element = event.currentTarget
          const from = { x: event.clientX, y: event.clientY }
          let dragging = false
          const move = (moved: PointerEvent) => {
            if (!dragging) {
              if (Math.hypot(moved.clientX - from.x, moved.clientY - from.y) < dragThreshold) return
              dragging = true
            }
            const point = eventPoint(element, moved.clientX, moved.clientY)
            if (point) resize(point)
          }
          const release = () => {
            if (dragging) onArtefactRelease?.()
          }
          listenForPointerGesture(move, release, release)
        }}
        role="button"
        tabIndex={0}
        transform={`translate(${bounds.x + bounds.width} ${bounds.y + bounds.height})`}
      >
        <rect height="12" width="12" x="-6" y="-6" />
      </g>
    )
  }

  const ArtefactActions = ({ at, label, selection }: { at: Point; label: string; selection: ArtefactSelection }) => {
    const actions = [
      ...(onArtefactReorder
        ? [
            { action: () => onArtefactReorder(selection, -1), glyph: '↑', label: `Move ${label} earlier` },
            { action: () => onArtefactReorder(selection, 1), glyph: '↓', label: `Move ${label} later` }
          ]
        : []),
      ...(onArtefactRemove ? [{ action: () => onArtefactRemove(selection), glyph: '×', label: `Remove ${label}` }] : [])
    ] as const
    if (actions.length === 0) return null
    return (
      <g className="artefact-actions" transform={`translate(${at.x} ${at.y})`}>
        {actions.map((entry, index) => (
          // biome-ignore lint/a11y/useSemanticElements: SVG has no button element; every action is labelled and keyboard operable.
          <g
            aria-label={entry.label}
            className="artefact-action"
            key={entry.label}
            onKeyDown={(event) => {
              if (event.key !== 'Enter' && event.key !== ' ') return
              event.preventDefault()
              entry.action()
            }}
            onPointerDown={(event) => {
              event.preventDefault()
              event.stopPropagation()
              entry.action()
            }}
            role="button"
            tabIndex={0}
            transform={`translate(${index * 18} 0)`}
          >
            <circle r="7" />
            <text y="4">{entry.glyph}</text>
          </g>
        ))}
      </g>
    )
  }

  // Drag in the SVG's own coordinates, so a handle lands under the pointer at
  // any zoom or panel width. Shared by labels and components: both resolve a
  // drop to the same editor machinery, only the key they drag under differs.
  useEffect(() => {
    if (!editing) return setArmed(false)

    /*
     * The offer follows the pointer wherever it is, rather than only while it
     * is moving along the line.
     *
     * Tracking it from the line's own pointer move made it unreliable twice
     * over: arming while the pointer already rested on the line produced
     * nothing until it was jiggled, and reaching for the control meant leaving
     * the line, which crossed a boundary that cleared the offer. Neither is
     * about where the pointer is - the question is only whether it is near a
     * run of the selected flow - so it is answered from the window.
     */
    const offer = (event: MouseEvent) => {
      const svg = infoschematic.current
      const chosen = flows.find((candidate) => candidate.code === selected)
      const matrix = svg?.getScreenCTM()
      if (!svg || !chosen || !matrix || !event.shiftKey) {
        setHoveredWaypoint(null)
        return setAddAt(null)
      }

      const point = svg.createSVGPoint()
      point.x = event.clientX
      point.y = event.clientY
      const at = point.matrixTransform(matrix.inverse())

      // A nearby waypoint receives the delete affordance before a new waypoint
      // is offered at the pointer position.
      const near = chosen.points
        .slice(1, -1)
        .map((waypoint, offset) => ({ away: Math.hypot(waypoint.x - at.x, waypoint.y - at.y), index: offset + 1 }))
        .sort((left, right) => left.away - right.away)
        .find((candidate) => candidate.away <= addReach)

      if (near) {
        setHoveredWaypoint(`${chosen.code}:${near.index}`)
        return setAddAt(null)
      }
      setHoveredWaypoint(null)

      const index = segmentAt(chosen.points, at, addReach)
      if (index === undefined) return setAddAt(null)

      const from = chosen.points[index]
      const to = chosen.points[index + 1]
      const snapped =
        authoredGridSize > 0
          ? {
              x: Math.round(at.x / authoredGridSize) * authoredGridSize,
              y: Math.round(at.y / authoredGridSize) * authoredGridSize
            }
          : at
      setAddAt(from.x === to.x ? { x: from.x, y: snapped.y } : { x: snapped.x, y: from.y })
    }

    const holding = (event: KeyboardEvent | MouseEvent) => {
      setArmed(event.shiftKey)
      // A key event carries no position, so the last pointer position is used:
      // pressing Shift without moving is the case that produced nothing at all.
      if ('clientX' in event) offer(event)
      else if (pointer.current) offer(pointer.current)
    }

    const remember = (event: MouseEvent) => {
      pointer.current = event
    }
    window.addEventListener('pointermove', remember)
    // Shift rather than Ctrl: Ctrl-click is the secondary click on macOS, so it
    // fought the very control it armed. Blur as well as keyup, since a modifier
    // released while the window is unfocused never reports one.
    const clear = () => setArmed(false)

    window.addEventListener('keydown', holding)
    window.addEventListener('keyup', holding)
    // Pointer moves report the modifier too, which is what keeps this true when
    // a key event was missed - held through a focus change, or pressed while
    // the pointer was already where it needed to be.
    window.addEventListener('pointermove', holding)
    window.addEventListener('blur', clear)
    return () => {
      window.removeEventListener('pointermove', remember)
      window.removeEventListener('keydown', holding)
      window.removeEventListener('keyup', holding)
      window.removeEventListener('pointermove', holding)
      window.removeEventListener('blur', clear)
    }
  }, [authoredGridSize, flows, editing, selected])

  const dragHandle =
    (key: string, onMove?: (key: string, point: Point) => void, onRelease?: () => void) =>
    (event: React.PointerEvent<SVGGElement>) => {
      if (!onMove) return
      const svg = event.currentTarget.ownerSVGElement
      const matrix = svg?.getScreenCTM()
      if (!svg || !matrix) return
      event.preventDefault()
      event.stopPropagation()

      const inverse = matrix.inverse()
      const toDiagram = (clientX: number, clientY: number) => {
        const point = svg.createSVGPoint()
        point.x = clientX
        point.y = clientY
        const mapped = point.matrixTransform(inverse)
        return { x: mapped.x, y: mapped.y }
      }

      // A click has to travel before it becomes a drag, or aiming slightly off a
      // label nudges the thing it was trying to select. Measured in screen
      // pixels rather than diagram units, because it is about the hand.
      const from = { x: event.clientX, y: event.clientY }
      let dragging = false

      const move = (moved: PointerEvent) => {
        if (!dragging) {
          if (Math.hypot(moved.clientX - from.x, moved.clientY - from.y) < dragThreshold) return
          dragging = true
        }
        onMove(key, toDiagram(moved.clientX, moved.clientY))
      }
      const release = () => {
        if (dragging) onRelease?.()
      }
      listenForPointerGesture(move, release, release)
    }

  /**
   * Dragging the ring on a selected flow's end moves that end to whatever
   * port it is dropped nearest. A port is chosen rather than placed, so the drop
   * snaps to a real port or does nothing - it never leaves an end in mid-air.
   */
  // Every port on the Infoschematic, not just the end's own component's: an end on the
  // wrong component is exactly the case worth being able to correct. Drafted
  // counts are included, so a port added a moment ago can be dropped onto.
  const portChoices = () =>
    placeables.flatMap((placeable) =>
      portsForBox(placeable.box, placeable.ports).map((port) => ({
        at: port.at,
        endpoint: placeable.id,
        id: port.id
      }))
    )

  /**
   * The port a drop would take, shown green as it is tracked, so the target is
   * visible before committing rather than discovered afterwards. Out of reach of
   * every port it reports nothing, which is what lets a free end stay free.
   */
  const portFinder = (svg: SVGSVGElement, matrix: DOMMatrix) => {
    const choices = portChoices()
    const inverse = matrix.inverse()
    return (clientX: number, clientY: number) => {
      if (choices.length === 0) return undefined
      const at = svg.createSVGPoint()
      at.x = clientX
      at.y = clientY
      const dropped = at.matrixTransform(inverse)
      const nearest = choices.reduce((best, port) =>
        Math.hypot(port.at.x - dropped.x, port.at.y - dropped.y) <
        Math.hypot(best.at.x - dropped.x, best.at.y - dropped.y)
          ? port
          : best
      )
      return Math.hypot(nearest.at.x - dropped.x, nearest.at.y - dropped.y) <= attachmentReach ? nearest : undefined
    }
  }

  const dragAttachment =
    (flow: InfoschematicFlow, end: 'source' | 'target') => (event: React.PointerEvent<SVGElement>) => {
      if (!onAttach) return
      const svg = event.currentTarget.ownerSVGElement
      const matrix = svg?.getScreenCTM()
      if (!svg || !matrix) return
      event.preventDefault()
      event.stopPropagation()

      const nearestTo = portFinder(svg, matrix)

      const track = (moved: PointerEvent) => {
        const over = nearestTo(moved.clientX, moved.clientY)
        setDropPort(over ? `${over.endpoint}:${over.id}` : null)
      }

      const stop = (released: PointerEvent) => {
        const over = nearestTo(released.clientX, released.clientY)
        if (over) onAttach(flow.code, end, over.id, over.endpoint)
        setDropPort(null)
      }
      listenForPointerGesture(track, stop, () => setDropPort(null))
    }

  /**
   * An end anchored to nothing, or to a point rather than a component, is
   * placed by hand but may still be dropped onto a port.
   */
  const dragUnanchoredEnd =
    (flow: InfoschematicFlow, end: 'end' | 'start') => (event: React.PointerEvent<SVGElement>) => {
      if (!onFreeEnd) return
      const svg = event.currentTarget.ownerSVGElement
      const matrix = svg?.getScreenCTM()
      if (!svg || !matrix) return
      event.preventDefault()
      event.stopPropagation()

      const nearestTo = portFinder(svg, matrix)
      const inverse = matrix.inverse()
      const toDiagram = (clientX: number, clientY: number) => {
        const point = svg.createSVGPoint()
        point.x = clientX
        point.y = clientY
        const mapped = point.matrixTransform(inverse)
        return { x: mapped.x, y: mapped.y }
      }

      const from = { x: event.clientX, y: event.clientY }
      let dragging = false

      const move = (moved: PointerEvent) => {
        if (!dragging) {
          if (Math.hypot(moved.clientX - from.x, moved.clientY - from.y) < dragThreshold) return
          dragging = true
        }
        const over = nearestTo(moved.clientX, moved.clientY)
        setDropPort(over ? `${over.endpoint}:${over.id}` : null)
        onFreeEnd(flow.code, flow.points, end, over ? over.at : toDiagram(moved.clientX, moved.clientY))
      }

      const stop = (released: PointerEvent) => {
        const over = dragging ? nearestTo(released.clientX, released.clientY) : undefined
        if (over && onAttach) onAttach(flow.code, end === 'start' ? 'source' : 'target', over.id, over.endpoint)
        else if (dragging) onRouteRelease?.()
        setDropPort(null)
      }
      listenForPointerGesture(move, stop, () => {
        if (dragging) onRouteRelease?.()
        setDropPort(null)
      })
    }

  /**
   * Dragging from a free port to another port makes a line between them.
   *
   * The gesture is the one the reader already has - take hold of a port, let go
   * over a port - started somewhere there is nothing rather than on an end that
   * exists. A free port is the only place it can begin, because a port already
   * in use is how an existing end is re-attached and one gesture cannot mean
   * both.
   *
   * Nothing is made until a second port is under the pointer on release, so
   * letting go anywhere else calls the drag off. Which family the line belongs
   * to is asked afterwards, at the drop: it decides the code and the colour, so
   * there is nothing to draw until it is answered.
   */
  const dragNewFlow = (endpoint: string, port: Port) => (event: React.PointerEvent<SVGElement>) => {
    if (!onCreateLine) return
    const svg = event.currentTarget.ownerSVGElement
    const matrix = svg?.getScreenCTM()
    if (!svg || !matrix) return
    event.preventDefault()
    event.stopPropagation()

    const nearestTo = portFinder(svg, matrix)
    const inverse = matrix.inverse()
    const toDiagram = (clientX: number, clientY: number) => {
      const point = svg.createSVGPoint()
      point.x = clientX
      point.y = clientY
      const mapped = point.matrixTransform(inverse)
      return { x: mapped.x, y: mapped.y }
    }

    const from = { x: event.clientX, y: event.clientY }
    let dragging = false

    const move = (moved: PointerEvent) => {
      if (!dragging) {
        if (Math.hypot(moved.clientX - from.x, moved.clientY - from.y) < dragThreshold) return
        dragging = true
      }
      const over = nearestTo(moved.clientX, moved.clientY)
      setDropPort(over ? `${over.endpoint}:${over.id}` : null)
      setDrawing({ from: port.at, to: over ? over.at : toDiagram(moved.clientX, moved.clientY) })
    }

    const stop = (released: PointerEvent) => {
      const over = dragging ? nearestTo(released.clientX, released.clientY) : undefined
      // A port cannot be joined to itself, and a line whose two ends are the
      // same port is not a relationship anyone means to draw.
      if (over && !(over.endpoint === endpoint && over.id === port.id)) {
        onCreateLine(
          { source: endpoint, sourcePort: port.id, target: over.endpoint, targetPort: over.id },
          { x: released.clientX, y: released.clientY }
        )
      }
      setDropPort(null)
      setDrawing(null)
    }
    listenForPointerGesture(move, stop, () => {
      setDropPort(null)
      setDrawing(null)
    })
  }

  const dragLabel = (code: string) => dragHandle(code, onLabelMove, onLabelRelease)
  const dragComponent = (code: string) => dragHandle(code, onComponentMove, onComponentRelease)
  // Waypoint and segment handles carry an index dragHandle knows nothing about,
  // so each gets its own key and folds the index into the callback closure
  // rather than dragHandle's generic (key, point) shape.
  const dragWaypoint = (flow: InfoschematicFlow, index: number) =>
    dragHandle(
      `${flow.code}:waypoint:${index}`,
      onMoveWaypoint && ((_key, point) => onMoveWaypoint(flow.code, flow.points, index, point)),
      onRouteRelease
    )
  const dragSegment = (flow: InfoschematicFlow, index: number) =>
    dragHandle(
      `${flow.code}:segment:${index}`,
      onMoveSegment && ((_key, point) => onMoveSegment(flow.code, flow.points, index, point)),
      onRouteRelease
    )

  // Selecting a Flow and adding a waypoint are separate actions. The dedicated
  // waypoint control prevents selection from changing the route.
  const routeClicked = (flow: InfoschematicFlow) => (event: React.PointerEvent<SVGPathElement>) => {
    if (!editing) return
    event.stopPropagation()
    selectArtefact({ code: flow.code, geometry: 'route', id: flow.id, kind: 'flow' }, flow.code)
  }

  // Where the delete control sits: pushed away from whichever card's centre is
  // nearest the waypoint, so it never lands back over the card it is beside.

  // A Fabric is an artefact like any other: it dims with the rest and is focused
  // when a Standalone Scene, Thematic Scene or Story Scene names it.
  /*
   * What a thing says when the pointer rests on it. One shape for all four
   * kinds - code, name, what it is - because a reader hovering a cloud and a
   * reader hovering a card are asking the same question and were getting an
   * answer from three of them and silence from the fourth.
   */
  const endpointLabel = (id: string) => infoschematicEndpointLabels.get(id) ?? id

  const fabricTitle = (fabric: RuntimeFabric) => `${fabric.code}: ${fabric.label} · ${fabric.detail}`

  const fabricClass = (id: string) => {
    return highlight?.endpoints.has(id) ? 'infoschematic-fabric highlighted' : 'infoschematic-fabric'
  }

  // Drawn from one place and used twice: once in the layer beneath the cards,
  // and again above them for whichever flow is selected, so the line
  // being worked on is never behind a card.
  const renderFlow = (flow: InfoschematicFlow) => {
    const selection = {
      code: flow.code,
      geometry: 'route',
      id: flow.id,
      kind: 'flow'
    } as const satisfies ArtefactSelection
    const family = familyById.get(flow.family) ?? infoschematicFamilies[0]
    const sourceCode = infoschematicEndpointCodes.get(flow.source) ?? flow.source
    const targetCode = infoschematicEndpointCodes.get(flow.target) ?? flow.target
    const realisedSpecifications = infoschematicSpecificationsFor?.(flow.id) ?? []
    const conforms = realisedSpecifications.map(({ label }) => label).join(' or ')
    const operation = realisedSpecifications.find(({ kind }) => kind === 'operation')
    const call = operation ? ` · ${operation.label}` : ''
    const flowSelected = artefactSelected(selection, flow.code)
    return (
      // biome-ignore lint/a11y/noStaticElementInteractions: role and tabIndex are conditional on editing, which the linter cannot see through.
      <g
        aria-label={`Flow ${flow.code}`}
        data-artefact-id={selection.id}
        data-artefact-kind={selection.kind}
        className={`flow-family-${flow.family}${highlight?.flows.has(flow.id) ? ' highlighted' : ''}${flowSelected ? ' selected' : ''}${hovered === flow.code ? ' pointed' : ''}${pendingRemovals[flow.code] ? ' going' : ''}${focusing && litByScene?.has(flow.id) ? ' lit' : ''}${inGroup(selection)}${inert('flow')}`}
        key={flow.id}
        onKeyDown={interactive('flow') ? artefactKeyDown(selection, flow.code) : undefined}
        role={interactive('flow') ? 'button' : undefined}
        style={{ color: family.color }}
        tabIndex={interactive('flow') ? 0 : undefined}
      >
        {/* Names for a reader, ports for an editor. It said
            origin:E1 → cdn-ingress:W1 to everyone, which is the question
            somebody placing the line has and not the one somebody reading it
            has. */}
        <title>{`${flow.code}: ${endpointLabel(flow.source)} → ${endpointLabel(flow.target)}\n${conforms || 'Carriage'}${call}${editing ? `\n${sourceCode}:${flow.sourcePort} → ${targetCode}:${flow.targetPort}` : ''}`}</title>
        <path className="infoschematic-pipe" d={flow.d} />
        <path
          className={`infoschematic-route${flow.dashed ? ' dashed' : ''}`}
          d={flow.d}
          markerEnd={flowArrowhead(flow, 'end')}
          markerStart={flowArrowhead(flow, 'start')}
          stroke={family.color}
        />
        {signals
          .filter((signal) => signal.flowId === flow.id)
          .map((signal) => (
            // biome-ignore lint/a11y/noAriaHiddenOnFocusable: decorative signal graphic with no focusable descendants.
            <g
              aria-hidden="true"
              className="infoschematic-flow-signal"
              data-occurrence-key={signal.occurrenceKey}
              key={flowSignalKey(signal)}
            >
              <path className="infoschematic-flow-signal-still" d={flow.d} />
              <circle className="infoschematic-flow-signal-pulse" opacity="0" r={signalRadius}>
                <animate attributeName="opacity" dur={`${flowSignalDuration}ms`} values="0;1;1;0" />
                <animateMotion dur={`${flowSignalDuration}ms`} path={flow.d} />
              </circle>
            </g>
          ))}
        {/* Twelve units of transparent stroke, so a line can be pointed at
            without having to be hit exactly. Present whether or not the editor
            is open: the tooltip and the highlight are for a reader, and only
            the click is for an author. */}
        <path
          className="infoschematic-route-hit"
          d={flow.d}
          onPointerDown={
            interactive('flow') ? routeClicked(flow) : focusing ? () => onLight?.(flow.id, true) : undefined
          }
          onPointerEnter={onHover ? () => onHover(flow.code) : undefined}
          onPointerLeave={onHover ? () => onHover(null) : undefined}
        />
        {interactive('flow') && flowSelected
          ? flow.points.slice(1, -2).map((_, offset) => {
              const index = offset + 1
              const start = flow.points[index]
              const end = flow.points[index + 1]
              const mid = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 }
              return (
                <rect
                  className="route-segment-grip"
                  height="10"
                  key={`${flow.code}-segment-${index}`}
                  onPointerDown={dragSegment(flow, index)}
                  width="10"
                  x={mid.x - 5}
                  y={mid.y - 5}
                />
              )
            })
          : null}
        {/* An end anchored to no component has no port to choose, so it
            gets a handle of its own and is placed rather than chosen. */}
        {/* Offered where the pointer is, on the line, snapped to the grid.
            Its own control rather than a click on the line, so a line can
            be looked at without gaining a corner. */}
        {interactive('flow') && flowSelected && armed && addAt && !hoveredWaypoint && onAddWaypoint ? (
          // biome-ignore lint/a11y/useSemanticElements: SVG has no button element, so a group carrying the role is the pattern inside one.
          <g
            aria-label={`Add a waypoint to ${flow.code}`}
            className="waypoint-add"
            onKeyDown={(event) => {
              if (event.key !== 'Enter' && event.key !== ' ') return
              event.preventDefault()
              onAddWaypoint(flow.code, flow.points, addAt)
              setAddAt(null)
            }}
            onPointerDown={(event) => {
              event.preventDefault()
              event.stopPropagation()
              onAddWaypoint(flow.code, flow.points, addAt)
              setAddAt(null)
            }}
            role="button"
            tabIndex={0}
          >
            <title>Add a waypoint here</title>
            <circle cx={addAt.x} cy={addAt.y} r="7" />
            <path d={`M${addAt.x - 3} ${addAt.y} H${addAt.x + 3} M${addAt.x} ${addAt.y - 3} V${addAt.y + 3}`} />
          </g>
        ) : null}
        {interactive('flow') && flowSelected && onFreeEnd
          ? (['start', 'end'] as const)
              .filter((end) => !anchoredEnds.has(`${flow.code}:${end}`))
              .map((end) => {
                const at = end === 'start' ? flow.points[0] : flow.points.at(-1)
                if (!at) return null
                return (
                  <circle
                    className="route-free-end"
                    cx={at.x}
                    cy={at.y}
                    key={`${flow.code}-${end}`}
                    onPointerDown={dragUnanchoredEnd(flow, end)}
                    r="6"
                  />
                )
              })
          : null}
        {interactive('flow') && flowSelected
          ? flow.points.slice(1, -1).map((point, offset) => {
              const index = offset + 1
              const waypointSelected = selectedWaypoint?.code === flow.code && selectedWaypoint.index === index
              return (
                <g key={`${flow.code}-waypoint-${index}`}>
                  <circle
                    className={`route-waypoint${waypointSelected ? ' selected' : ''}${
                      hovered === `waypoint:${flow.code}:${index}` ? ' pointed' : ''
                    }`}
                    cx={point.x}
                    cy={point.y}
                    onPointerEnter={onHover ? () => onHover(`waypoint:${flow.code}:${index}`) : undefined}
                    onPointerLeave={onHover ? () => onHover(null) : undefined}
                    onPointerDown={(event) => {
                      setSelectedWaypoint({ code: flow.code, index })
                      onSelect?.(`waypoint:${flow.code}:${index}`)
                      dragWaypoint(flow, index)(event)
                    }}
                    r="5"
                  />
                  {armed && hoveredWaypoint === `${flow.code}:${index}` ? (
                    // biome-ignore lint/a11y/useSemanticElements: as above, inside SVG the role is the only way to say button.
                    <g
                      aria-label={`Delete waypoint ${index} of ${flow.code}`}
                      className="waypoint-delete"
                      onKeyDown={(event) => {
                        if (event.key !== 'Enter' && event.key !== ' ') return
                        event.preventDefault()
                        onDeleteWaypoint?.(flow.code, flow.points, index)
                        setSelectedWaypoint(null)
                      }}
                      onPointerDown={(event) => {
                        event.preventDefault()
                        event.stopPropagation()
                        onDeleteWaypoint?.(flow.code, flow.points, index)
                        setSelectedWaypoint(null)
                      }}
                      role="button"
                      tabIndex={0}
                      transform={`translate(${point.x} ${point.y})`}
                    >
                      <circle r="7" />
                      <path d="M-3 0 H3" />
                    </g>
                  ) : null}
                </g>
              )
            })
          : null}
        {interactive('flow') && flowSelected && flow.points[0] ? (
          <ArtefactActions at={flow.points[0]} label={flow.code} selection={selection} />
        ) : null}
      </g>
    )
  }

  // Overlay Graphics annotate the working surface rather than being the thing
  // worked on, so design mode draws them behind the diagram while present mode
  // keeps them on top. One layer, two positions, rather than two renderings.
  const minimapGraphicBounds = graphic ? graphicBounds(graphic, infoschematicViewBox) : null
  const graphicLayer = graphics.map((entry) => {
    const bounds = graphicBounds(entry, infoschematicViewBox)
    const selection = {
      code: null,
      geometry: 'box',
      id: entry.id,
      kind: 'graphic'
    } as const satisfies ArtefactSelection
    const legacyKey = `graphic:${entry.id}`
    const renderer =
      !editing && graphic === entry
        ? activeGraphicRenderer
        : resolveInfoschematicRenderer(
            renderers,
            'graphic',
            entry.kind,
            entry.properties as RendererProperties | undefined,
            entry.id
          )
    const Renderer = renderer?.Component
    return (
      // biome-ignore lint/a11y/noStaticElementInteractions: role and tabIndex are conditional on editing, which the linter cannot see through.
      <g
        aria-label={entry.label ?? entry.id}
        className={`infoschematic-graphic${interactive('graphic') ? ' artefact-selectable' : ''}${pendingRemovals[entry.id] ? ' going' : ''}${
          artefactSelected(selection, legacyKey) ? ' selected' : ''
        }${inGroup(selection)}${inert('graphic')}`}
        data-artefact-id={selection.id}
        data-artefact-kind="overlay"
        key={entry.id}
        onKeyDown={interactive('graphic') ? artefactKeyDown(selection, legacyKey) : undefined}
        onPointerDown={
          interactive('graphic')
            ? dragArtefact(
                selection,
                legacyKey,
                { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 },
                { x: true, y: true }
              )
            : undefined
        }
        role={interactive('graphic') ? 'button' : 'img'}
        tabIndex={interactive('graphic') ? 0 : undefined}
      >
        <title>{entry.label ?? entry.id}</title>
        {Renderer ? (
          <Renderer bounds={bounds} graphic={entry} properties={renderer.properties} viewBox={infoschematicViewBox} />
        ) : (
          <DefaultGraphic bounds={bounds} graphic={entry} />
        )}
        {editing ? (
          <rect className="graphic-frame" height={bounds.height} width={bounds.width} x={bounds.x} y={bounds.y} />
        ) : null}
      </g>
    )
  })

  /*
   * A Point, painted as the static renderer paints it and reachable as Design needs it.
   *
   * The mark is the static circle: same radius, same authored fill and stroke, so the two renderings agree about
   * where a Point is and how big it looks. What Design adds is a transparent disc more than twice that radius,
   * because six units of paint is a target a pointer cannot be expected to find - `DESIGN-011` sets that precedent
   * for a Flow's own stroke. The disc is drawn only while the layer is open, so nothing is added to a rendering
   * that cannot be pressed, and it is drawn first so the visible mark is never painted under it.
   */
  const pointLayer = infoschematicPoints.map((point) => {
    const selection = {
      code: point.id,
      geometry: 'point',
      id: point.id,
      kind: 'point'
    } as const satisfies ArtefactSelection
    const legacyKey = `point:${point.id}`
    const stroke = point.appearance?.color ?? pointTokens.stroke
    /* The authored label, on the side `resolvePointLabel` picks from the Flows that leave this Point. The draft-aware
       `flows` are passed rather than the authored ones, so a label moves out of the way of a route while it is dragged
       instead of after it is committed. */
    const label = resolvePointLabel(point, flows)
    return (
      // biome-ignore lint/a11y/noStaticElementInteractions: role and tabIndex are conditional on editing, which the linter cannot see through.
      <g
        aria-label={`Point ${point.label}`}
        className={`infoschematic-point${interactive('point') ? ' selectable artefact-selectable' : ''}${
          pendingRemovals[point.id] ? ' going' : ''
        }${artefactSelected(selection, legacyKey) ? ' selected' : ''}${hovered === legacyKey ? ' pointed' : ''}${inGroup(
          selection
        )}${inert('point')}`}
        data-artefact-id={selection.id}
        data-artefact-kind="point"
        key={point.id}
        onKeyDown={interactive('point') ? artefactKeyDown(selection, legacyKey) : undefined}
        onPointerDown={
          interactive('point') ? dragArtefact(selection, legacyKey, point.at, { x: true, y: true }) : undefined
        }
        onPointerEnter={onHover ? () => onHover(legacyKey) : undefined}
        onPointerLeave={onHover ? () => onHover(null) : undefined}
        role={interactive('point') ? 'button' : 'img'}
        style={{ color: stroke }}
        tabIndex={interactive('point') ? 0 : undefined}
      >
        <title>{`${point.id}: ${point.label}`}</title>
        {interactive('point') ? (
          <circle className="point-target" cx={point.at.x} cy={point.at.y} r={pointTargetRadius} />
        ) : null}
        <circle
          className="point-mark"
          cx={point.at.x}
          cy={point.at.y}
          fill={point.appearance?.fill ?? pointTokens.fill}
          r={pointRadius}
          stroke={stroke}
          strokeWidth={2}
        />
        {label ? (
          <text
            className="infoschematic-point-label"
            dominantBaseline="middle"
            textAnchor={label.anchor}
            x={label.at.x}
            y={label.at.y}
          >
            {label.text}
          </text>
        ) : null}
      </g>
    )
  })

  /*
   * The selected element's controls, for the one layer that draws them above everything else.
   *
   * A handle drawn inside the element it operates sits wherever that element sits: a Region's resize corner under a
   * Card that overlaps it, an adapter's remove button under the Card it holds. Lifting the controls rather than the
   * element leaves every authored order, treatment and position exactly as it was - there is no stacking property to
   * write and nothing to put back - and the layer goes when the selection changes, clears, or Design mode ends.
   */
  const selectionControls = ((): SelectionControls | null => {
    // A selected Flow already paints above the cards as a whole route, so its own controls travel with it.
    if (!selectedArtefact || selectedArtefact.kind === 'flow' || !interactive(selectedArtefact.kind)) return null
    const selection = selectedArtefact
    if (selection.kind === 'region') {
      const region = infoschematicRegions.find((candidate) => candidate.id === selection.id)
      return region ? controlsFor(selection, region.box, region.label, true) : null
    }
    if (selection.kind === 'fabric') {
      const fabric = infoschematicFabrics.find(
        (candidate) => candidate.id === selection.id && infoschematicFabricIsVisible(candidate, visibleScopes)
      )
      return fabric ? controlsFor(selection, movedBox(fabric.bounds, fabric.code), fabric.label, true) : null
    }
    /* A Point has no extent, so its controls are placed rather than fitted round it: the actions sit clear above the
       hit target, and `axes: null` is what keeps a resize handle off a thing with nothing to resize. The bounds
       stated here are the target disc and exist only to place a control - no operation ever carries them, which is
       what `EDIT-008` means by a Point never acquiring box geometry. */
    if (selection.kind === 'point') {
      const point = infoschematicPoints.find((candidate) => candidate.id === selection.id)
      if (!point) return null
      return {
        actionsAt: { x: point.at.x - 18, y: point.at.y - pointTargetRadius - 16 },
        axes: null,
        bounds: {
          height: pointTargetRadius * 2,
          width: pointTargetRadius * 2,
          x: point.at.x - pointTargetRadius,
          y: point.at.y - pointTargetRadius
        },
        label: point.label,
        selection
      }
    }
    if (selection.kind === 'graphic') {
      const entry = graphics.find((candidate) => candidate.id === selection.id)
      return entry
        ? controlsFor(selection, graphicBounds(entry, infoschematicViewBox), entry.label ?? entry.id, true)
        : null
    }
    // A Card, or the adapter clasping one: an adapter identifies itself but has no box of its own to resize.
    const placeable = placeables.find((candidate) => candidate.id === selection.id)
    const identity = placeable ? register.cardAt(placeable.code) : undefined
    return placeable && identity ? controlsFor(selection, placeable.box, identity.label, !identity.wraps) : null
  })()

  /* Emphasis is a layer over the diagram and nothing else: it needs only geometry, and only from what this render
     actually drew, so an occurrence can never make hidden or filtered content appear. Drawn last for the same reason
     the static renderer draws it last — no emphasised element's own output, ordering, or geometry changes. */
  const emphasisGeometry = new Map<string, CanvasEmphasisGeometry>()
  for (const region of infoschematicRegions) {
    emphasisGeometry.set(region.id, { d: emphasisPerimeterPath(region.box), travels: true })
  }
  for (const placeable of placeables) {
    emphasisGeometry.set(placeable.id, { d: emphasisPerimeterPath(placeable.box), travels: true })
  }
  for (const flow of flows) {
    emphasisGeometry.set(flow.id, {
      d: flow.d,
      markerEnd: flowArrowhead(flow, 'end'),
      markerStart: flowArrowhead(flow, 'start'),
      travels: false
    })
  }
  const emphasisLayer = emphasis.flatMap((occurrence) => {
    const geometry = emphasisGeometry.get(occurrence.elementId)
    if (!geometry) return []
    return [
      // biome-ignore lint/a11y/noAriaHiddenOnFocusable: decorative emphasis graphic with no focusable descendants; the Canvas announces the Dynamic.
      <g
        aria-hidden="true"
        className="infoschematic-element-emphasis"
        data-artefact-id={occurrence.elementId}
        /* Present only for a state, so a document that reports events emits exactly the markup it always did. The
           treatment is selected from it rather than from a second class, because it is a property of the occurrence. */
        data-depicts={occurrence.depicts}
        data-dynamic-id={occurrence.dynamicId}
        data-emphasised="true"
        data-occurrence-key={occurrence.occurrenceKey}
        key={elementEmphasisKey(occurrence)}
      >
        {emphasisTreatment(geometry, occurrence.depicts)}
      </g>
    ]
  })

  return (
    <div className="infoschematic-frame" ref={diagramFrame} style={frameStyle}>
      <svg
        ref={infoschematic}
        aria-label={`${config.title} structural Infoschematic`}
        className={`${highlight ? 'infoschematic-svg highlighting' : 'infoschematic-svg'}${editing ? ' editing' : ''}${focusing ? ' focusing' : ''}${fitted ? '' : ' zoomed'}${panGesture ? ' panning' : ''} surface-${visualTreatment.surface}`}
        data-grid-treatment={visualTreatment.grid}
        data-surface-treatment={visualTreatment.surface}
        height={infoschematicViewBox.height}
        onPointerCancel={panGesture ? stopPan : undefined}
        onPointerDown={editing || !fitted ? startPan : undefined}
        onPointerEnter={rememberZoomPointer}
        onPointerLeave={clearZoomPointer}
        onPointerMove={movePan}
        onPointerUp={panGesture ? stopPan : undefined}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        viewBox={`${viewport.x} ${viewport.y} ${viewport.width} ${viewport.height}`}
        width={infoschematicViewBox.width}
      >
        <title>{config.title}</title>
        {accessibleSummary ? <desc>{`Cards: ${accessibleSummary}`}</desc> : null}
        {/* Sits behind everything else drawn onto the Infoschematic, so it is only ever
          reached once a click has missed every card, region, and line above it -
          which is what makes "clicking empty Infoschematic clears the selection" true
          without this having to know what else is on screen. */}
        <rect
          className="infoschematic-backdrop"
          height={infoschematicViewBox.height}
          width={infoschematicViewBox.width}
          x={infoschematicViewBox.x}
          y={infoschematicViewBox.y}
        />
        <defs>
          <pattern
            height={gridSize}
            id={`${resourcePrefix}-grid-minor`}
            patternUnits="userSpaceOnUse"
            width={gridSize}
            x="0"
            y="0"
          >
            <path
              className="infoschematic-grid-line minor"
              d={`M ${gridSize} 0 V ${gridSize} M 0 ${gridSize} H ${gridSize}`}
            />
          </pattern>
          <pattern
            height={gridMajorSize}
            id={`${resourcePrefix}-grid-major`}
            patternUnits="userSpaceOnUse"
            width={gridMajorSize}
            x="0"
            y="0"
          >
            <path
              className="infoschematic-grid-line major"
              d={`M ${gridMajorSize} 0 V ${gridMajorSize} M 0 ${gridMajorSize} H ${gridMajorSize}`}
            />
          </pattern>
          <pattern
            height={gridMajorSize}
            id={`${resourcePrefix}-grid-major-plus-minor`}
            patternUnits="userSpaceOnUse"
            width={gridMajorSize}
            x="0"
            y="0"
          >
            <rect
              fill={`url(#${resourcePrefix}-grid-minor)`}
              height={gridMajorSize}
              width={gridMajorSize}
              x="0"
              y="0"
            />
            <path
              className="infoschematic-grid-line major"
              d={`M ${gridMajorSize} 0 V ${gridMajorSize} M 0 ${gridMajorSize} H ${gridMajorSize}`}
            />
          </pattern>
          {/* A dot marks each major intersection, so the same lattice the major
            lines would draw is implied by its corners alone. The tile is offset
            by half its width and the dot sits at its centre: a dot authored at
            the tile's corner would be clipped to a quarter by the tile edge. */}
          <pattern
            height={gridMajorSize}
            id={`${resourcePrefix}-grid-dots`}
            patternUnits="userSpaceOnUse"
            width={gridMajorSize}
            x={-gridMajorSize / 2}
            y={-gridMajorSize / 2}
          >
            <circle
              className="infoschematic-grid-dot"
              cx={gridMajorSize / 2}
              cy={gridMajorSize / 2}
              r={gridMinorStrokeWidth * 3}
            />
          </pattern>
          {Definitions ? <Definitions /> : null}
          {infoschematicFamilies.map((family) => (
            <marker
              id={`${resourcePrefix}-arrow-${family.id}`}
              key={family.id}
              markerHeight={arrowTokens.size}
              /* In user units, not stroke widths: the default scales an arrowhead
               with its line, so focusing a line inflated its head by a quarter
               and a bidirectional line grew two of them. */
              markerUnits="userSpaceOnUse"
              markerWidth={arrowTokens.size}
              /* SVG 2, and kept: a browser turns this head to face back out of a
                 source when it is a `marker-start`, which is what lets one definition
                 serve both ends of every Flow. The static renderer emits `auto` and a
                 mirrored second definition instead, because the rasteriser behind the
                 command line ignores this value and paints the head unrotated rather
                 than failing. Deliberate divergence, stated in both places. */
              orient="auto-start-reverse"
              refX={arrowTokens.forwardRefX}
              refY={arrowTokens.refY}
            >
              {/* The family colour is the fallback. Where `context-stroke` is
                understood the stylesheet overrides it and the head takes the
                colour of the line it sits on, so pointing at a line brightens
                its head with it rather than leaving it behind. */}
              <path className="arrow-head" d={arrowTokens.forward} fill={family.color} />
            </marker>
          ))}
        </defs>

        {visualTreatment.grid !== 'none' ? (
          <rect
            className="infoschematic-authored-grid"
            fill={`url(#${resourcePrefix}-grid-${visualTreatment.grid})`}
            height={infoschematicViewBox.height}
            pointerEvents="none"
            width={infoschematicViewBox.width}
            x={infoschematicViewBox.x}
            y={infoschematicViewBox.y}
          />
        ) : null}

        {infoschematicRegions.map((region) => {
          const selection = {
            code: null,
            geometry: 'box',
            id: region.id,
            kind: 'region'
          } as const satisfies ArtefactSelection
          const legacyKey = `region:${region.id}`
          const treatment = resolveRegionTreatment(region)
          const geometry = regionGeometry({ box: region.box, label: region.label, treatment })
          // A boundary-mounted label sits over the backdrop the notch exposes,
          // not the fill, so only a plain label takes its ink from the fill.
          const ink =
            region.fill && geometry.label && treatment.labelTreatment === 'plain'
              ? resolveReadableInk(region.fill)
              : null
          return (
            // biome-ignore lint/a11y/noStaticElementInteractions: role and tabIndex are conditional on editing, which the linter cannot see through.
            <g
              aria-label={`Region ${region.label}`}
              className={`infoschematic-region${interactive('region') || !editing ? ' artefact-selectable' : ''}${pendingRemovals[region.id] ? ' going' : ''}${artefactSelected(selection, legacyKey) ? ' selected' : ''}${inGroup(selection)}${inert('region')}`}
              data-artefact-id={selection.id}
              data-artefact-kind={selection.kind}
              data-frame-treatment={treatment.frame}
              data-label-placement={treatment.label ?? 'none'}
              data-label-treatment={treatment.labelTreatment}
              key={region.id}
              onKeyDown={interactive('region') ? artefactKeyDown(selection, legacyKey) : undefined}
              onPointerDown={
                interactive('region')
                  ? dragArtefact(
                      selection,
                      legacyKey,
                      { x: region.box.x + region.box.width / 2, y: region.box.y + region.box.height / 2 },
                      { x: true, y: true }
                    )
                  : undefined
              }
              role={interactive('region') ? 'button' : undefined}
              tabIndex={interactive('region') ? 0 : undefined}
            >
              {region.fill ? (
                <rect
                  className="infoschematic-region-fill"
                  fill={region.fill}
                  height={region.box.height}
                  rx={region.box.radius ?? cornerRadius}
                  width={region.box.width}
                  x={region.box.x}
                  y={region.box.y}
                />
              ) : null}
              {geometry.outline ? (
                <path
                  className="infoschematic-region-frame"
                  d={geometry.outline}
                  strokeOpacity={treatment.frameOpacity === 1 ? undefined : treatment.frameOpacity}
                />
              ) : null}
              {geometry.label ? (
                <text
                  className={`infoschematic-region-label${interactive('region') && (onSelect || onArtefactSelect) ? ' region-selectable' : ''}${
                    artefactSelected(selection, legacyKey) ? ' selected' : ''
                  }${hovered === legacyKey ? ' pointed' : ''}`}
                  data-ink={ink ?? undefined}
                  dominantBaseline={geometry.label.dominantBaseline}
                  lengthAdjust={geometry.label.length === null ? undefined : 'spacingAndGlyphs'}
                  onPointerEnter={onHover ? () => onHover(legacyKey) : undefined}
                  onPointerLeave={onHover ? () => onHover(null) : undefined}
                  textAnchor={geometry.label.textAnchor}
                  textLength={geometry.label.length ?? undefined}
                  x={geometry.label.x}
                  y={geometry.label.y}
                >
                  {region.label.toUpperCase()}
                </text>
              ) : null}
            </g>
          )
        })}

        {/* The canvas states its own edge, present whenever the editor is open
          regardless of whether the grid is switched on, so a card dragged
          towards it has something other than the region panels to read against. */}
        {editing ? (
          <rect
            className="canvas-edge"
            height={infoschematicViewBox.height}
            width={infoschematicViewBox.width}
            x={infoschematicViewBox.x}
            y={infoschematicViewBox.y}
          />
        ) : null}

        {editing && grid && authoredGridSize > 0 ? (
          <g className="edit-grid">
            <rect
              fill={`url(#${resourcePrefix}-grid-major-plus-minor)`}
              height={infoschematicViewBox.height}
              width={infoschematicViewBox.width}
              x={infoschematicViewBox.x}
              y={infoschematicViewBox.y}
            />
          </g>
        ) : null}

        {editing ? graphicLayer : null}

        {infoschematicFabrics
          .filter((fabric) => infoschematicFabricIsVisible(fabric, visibleScopes))
          .map((fabric) => {
            const bounds = movedBox(fabric.bounds, fabric.code)
            const selection = {
              code: fabric.code,
              geometry: 'box',
              id: fabric.id,
              kind: 'fabric'
            } as const satisfies ArtefactSelection
            const rendererKey = fabric.renderer
            const renderer = resolveInfoschematicRenderer(
              renderers,
              'fabric',
              rendererKey,
              fabric.properties as RendererProperties | undefined,
              fabric.id
            )
            const Renderer = renderer?.Component
            return (
              // biome-ignore lint/a11y/noStaticElementInteractions: role and tabIndex are conditional on editing, which the linter cannot see through.
              <g
                aria-label={fabric.label}
                className={`${fabricClass(fabric.id)}${interactive('fabric') ? ' selectable artefact-selectable' : ''}${pendingRemovals[fabric.code] ? ' going' : ''}${artefactSelected(selection, fabric.code) ? ' selected' : ''}${hovered === fabric.code ? ' pointed' : ''}${inGroup(selection)}${inert('fabric')}`}
                data-artefact-id={selection.id}
                data-artefact-kind={selection.kind}
                key={fabric.id}
                onKeyDown={interactive('fabric') ? artefactKeyDown(selection, fabric.code) : undefined}
                onPointerDown={
                  interactive('fabric')
                    ? dragArtefact(
                        selection,
                        fabric.code,
                        { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 },
                        { x: true, y: true }
                      )
                    : undefined
                }
                onPointerEnter={onHover ? () => onHover(fabric.code) : undefined}
                onPointerLeave={onHover ? () => onHover(null) : undefined}
                role={interactive('fabric') ? 'button' : undefined}
                tabIndex={interactive('fabric') ? 0 : undefined}
              >
                <title>{fabricTitle(fabric)}</title>
                {Renderer ? (
                  <Renderer bounds={bounds} fabric={fabric} properties={renderer.properties} />
                ) : (
                  <DefaultFabric bounds={bounds} fabric={fabric} />
                )}
                {editing ? (
                  <rect
                    className="fabric-frame"
                    height={bounds.height}
                    rx={cornerRadius}
                    width={bounds.width}
                    x={bounds.x}
                    y={bounds.y}
                  />
                ) : null}
              </g>
            )
          })}

        <g className="infoschematic-flows">
          {[...flows]
            // Family order decides the resting stack, but a lit line always paints
            // last. A lower family can otherwise leave its
            // glow ends up underneath the dark backing pipe of every dimmed line
            // crossing it - lit, and invisible.
            .sort((left, right) => {
              // A selected flow paints above everything until it is let go,
              // so the line being worked on is never behind one that is not.
              const leftPicked =
                left.code === selected || (selectedArtefact?.kind === 'flow' && selectedArtefact.id === left.id) ? 1 : 0
              const rightPicked =
                right.code === selected || (selectedArtefact?.kind === 'flow' && selectedArtefact.id === right.id)
                  ? 1
                  : 0
              if (leftPicked !== rightPicked) return leftPicked - rightPicked

              const leftLit = highlight?.flows.has(left.id) ? 1 : 0
              const rightLit = highlight?.flows.has(right.id) ? 1 : 0
              if (leftLit !== rightLit) return leftLit - rightLit
              return (familyLayer.get(right.family) ?? 0) - (familyLayer.get(left.family) ?? 0)
            })
            .filter(
              (flow) =>
                flow.code !== selected && !(selectedArtefact?.kind === 'flow' && selectedArtefact.id === flow.id)
            )
            .map(renderFlow)}
        </g>

        {/* An adapter is a socket the card it holds sits down into, so it is drawn
          with that card's shape cut out of it rather than as a panel behind:
          the rim shows around three sides and the footer carries its own name
          and code, and nothing of the adapter passes under the card. */}
        {/* Geometry from the placeables, identity from the register - the same
          pairing the cards below use, and what lets an adapter made in the
          editor draw at all. The clasp is derived from the card it holds
          wherever that card has got to, so an adapter has never had a position
          of its own to read. */}
        {placeables
          .flatMap((placeable) => {
            const adapter = register.cardAt(placeable.code)
            if (!adapter?.wraps) return []
            const found = placeables.find((candidate) => candidate.id === adapter.wraps)
            return found ? [{ ...placeable, held: found.box, holds: found, identity: adapter }] : []
          })
          .map(({ held, holds, identity: adapter, ...placed }) => {
            const box = placed.box
            const selection = {
              code: adapter.code,
              geometry: 'box',
              id: adapter.id,
              kind: 'card'
            } as const satisfies ArtefactSelection
            const heldSelection = {
              code: holds.code,
              geometry: 'box',
              id: holds.id,
              kind: 'card'
            } as const satisfies ArtefactSelection
            // One shape, traced in View Model so the still renderer draws the
            // same clasp rather than a rectangle over the card it holds.
            const socket = adapterClaspOutline(held, cornerRadius)

            return (
              // biome-ignore lint/a11y/noStaticElementInteractions: role and tabIndex are conditional on editing, which the linter cannot see through.
              <g
                aria-label={`${adapter.label}, holding ${adapter.wraps}`}
                className={`infoschematic-adapter${interactive('card') ? ' selectable' : ''}${pendingRemovals[adapter.code] ? ' going' : ''}${
                  highlight?.endpoints.has(adapter.id) ? ' highlighted' : ''
                }${artefactSelected(selection, adapter.code) ? ' selected' : ''}${hovered === adapter.code ? ' pointed' : ''}${inGroup(selection)}${inert('card')}`}
                data-artefact-id={selection.id}
                data-artefact-kind={selection.kind}
                key={placed.id}
                onKeyDown={interactive('card') ? artefactKeyDown(selection, adapter.code) : undefined}
                onPointerDown={
                  interactive('card')
                    ? (event) => {
                        // Selects the adapter, drags the card. An adapter is a
                        // grip on the thing it holds rather than a thing with a
                        // position, so taking hold of one has to move that card -
                        // and refusing the drag outright, which is what this did,
                        // left a shape on the Infoschematic that could be picked up and
                        // not moved.
                        if (onArtefactMove) {
                          dragArtefact(
                            heldSelection,
                            adapter.code,
                            { x: held.x + held.width / 2, y: held.y + held.height / 2 },
                            { x: true, y: true },
                            selection
                          )(event)
                        } else {
                          selectArtefact(selection, adapter.code)
                          dragComponent(holds.code)(event)
                        }
                      }
                    : undefined
                }
                onPointerEnter={onHover ? () => onHover(adapter.code) : undefined}
                onPointerLeave={onHover ? () => onHover(null) : undefined}
                role={interactive('card') ? 'button' : undefined}
                tabIndex={interactive('card') ? 0 : undefined}
              >
                <title>{`${adapter.code}: ${adapter.label} · ${adapter.detail}`}</title>
                <path className="adapter-socket" d={socket} />
                {/* The whole label is rendered exactly as authored. */}
                <text className="adapter-label" x={box.x + box.width / 2} y={adapterLabelBaseline(held)}>
                  {adapter.label}
                </text>
              </g>
            )
          })}

        {/* Geometry from the placeables, which already carry the drafts and the
          cards made this session; identity from the register. This read the
          Card list and the layout table and folded the offset in by hand,
          which is three sources for one card and no way at all to draw a card
          the model has never heard of. */}
        {placeables
          .flatMap((placeable) => {
            const card = register.cardAt(placeable.code)
            const authored = cardById.get(placeable.id)
            return card && !card.wraps
              ? [
                  {
                    ...placeable,
                    domain: authored?.domain,
                    group: card.group,
                    label: card.label,
                    name: card.detail,
                    stereotype: authored?.stereotype
                  }
                ]
              : []
          })
          // The selected card paints last so nothing overlaps what is being worked
          // on, and drops back into place when it is let go.
          .sort((left, right) => {
            const leftPicked =
              left.code === selected || (selectedArtefact?.kind === 'card' && selectedArtefact.id === left.id) ? 1 : 0
            const rightPicked =
              right.code === selected || (selectedArtefact?.kind === 'card' && selectedArtefact.id === right.id) ? 1 : 0
            return leftPicked - rightPicked
          })
          .map((card) => {
            const layout = card.box
            const selection = {
              code: card.code,
              geometry: 'box',
              id: card.id,
              kind: 'card'
            } as const satisfies ArtefactSelection
            const domain = resolveCardDomain(card, domains)
            const appearance = domain ??
              scopeAppearance[card.group as keyof typeof scopeAppearance] ?? {
                color: 'currentColor',
                fill: 'transparent'
              }
            // Card internals are placed and fitted from the Card's own box by View
            // Model, so the Canvas and the static SVG draw the same Card the same
            // way, saying the same thing, at any shape.
            const text = resolveCardLayout({
              box: layout,
              code: card.code,
              compact: visualTreatment.card.compact,
              description: card.name,
              detail: {
                description: visualTreatment.card.description,
                identity: visualTreatment.card.identity,
                stereotype: visualTreatment.card.stereotype
              },
              label: card.label,
              stereotype: card.stereotype
            })
            const accessibleDetail = [card.code, card.label, card.stereotype, card.name].filter(Boolean).join(' · ')

            return (
              // biome-ignore lint/a11y/noStaticElementInteractions: role and tabIndex are conditional on editing, which the linter cannot see through.
              <g
                aria-label={accessibleDetail}
                className={`infoschematic-service ${card.group}${visualTreatment.card.compact ? ' compact' : ''}${highlight?.endpoints.has(card.id) ? ' highlighted' : ''}${
                  interactive('card') || focusing ? ' selectable' : ''
                }${artefactSelected(selection, card.code) ? ' selected' : ''}${hovered === card.code ? ' pointed' : ''}${
                  pendingRemovals[card.code] ? ' going' : ''
                }${focusing && litByScene?.has(card.id) ? ' lit' : ''}${inGroup(selection)}${inert('card')}`}
                data-artefact-id={selection.id}
                data-artefact-kind={selection.kind}
                data-card-compact={visualTreatment.card.compact || undefined}
                data-collection={domain?.id}
                data-ink={resolveReadableInk(appearance.fill)}
                key={card.id}
                onKeyDown={interactive('card') ? artefactKeyDown(selection, card.code) : undefined}
                /*
                 * Two editors, two meanings for the same press. In the Infoschematic
                 * editor a card is selected and dragged; in the scene editor it
                 * is added to or removed from what the scene lights, and there is
                 * nothing to drag because a scene has no geometry.
                 */
                onPointerDown={
                  interactive('card')
                    ? (event) => {
                        if (onArtefactMove) {
                          dragArtefact(
                            selection,
                            card.code,
                            { x: layout.x + layout.width / 2, y: layout.y + layout.height / 2 },
                            { x: true, y: true }
                          )(event)
                        } else {
                          selectArtefact(selection, card.code)
                          dragComponent(card.code)(event)
                        }
                      }
                    : focusing
                      ? () => onLight?.(card.id, false)
                      : undefined
                }
                onPointerEnter={onHover ? () => onHover(card.code) : undefined}
                onPointerLeave={onHover ? () => onHover(null) : undefined}
                role={interactive('card') ? 'button' : undefined}
                style={{ color: 'color' in appearance ? appearance.color : appearance.stroke }}
                tabIndex={interactive('card') ? 0 : undefined}
                transform={`translate(${layout.x} ${layout.y})`}
              >
                <title>{accessibleDetail}</title>
                <rect
                  fill={appearance.fill}
                  height={layout.height}
                  rx={cornerRadius}
                  stroke={'color' in appearance ? appearance.color : appearance.stroke}
                  width={layout.width}
                />
                {text.identity ? (
                  <g className="infoschematic-card-identity" data-card-detail="identity">
                    <rect
                      height={text.identity.height}
                      rx="4"
                      width={text.identity.width}
                      x={text.identity.x}
                      y={text.identity.y}
                    />
                    <text x={text.identity.textX} y={text.identity.textY}>
                      {card.code}
                    </text>
                  </g>
                ) : null}
                {text.stereotype ? (
                  <text
                    className="infoschematic-card-stereotype"
                    data-card-detail="stereotype"
                    x={text.stereotype.x}
                    y={text.stereotype.y}
                  >
                    {text.stereotype.text.toUpperCase()}
                  </text>
                ) : null}
                <text
                  className="infoschematic-service-label"
                  textAnchor={text.label.anchor}
                  x={text.label.x}
                  y={text.label.y}
                >
                  {text.label.lines.map((line, index) => (
                    <tspan key={line} x={text.label.x} dy={index === 0 ? 0 : text.label.lineHeight}>
                      {line}
                    </tspan>
                  ))}
                </text>
                {text.description ? (
                  <text
                    className="infoschematic-card-description"
                    data-card-detail="description"
                    textAnchor={text.description.anchor}
                    x={text.description.x}
                    y={text.description.y}
                  >
                    {text.description.text}
                  </text>
                ) : null}
              </g>
            )
          })}

        {/* Above the cards and below the Flow a selection promotes, which is the order the static renderer paints
          these in: a Point is small enough that a Card drawn over it would hide it entirely. */}
        {pointLayer}

        {/* Above the cards, so a selected line and its controls are never behind
          one. It leaves this layer the moment it is deselected. */}
        {selectedFlow ? <g className="infoschematic-flows">{renderFlow(selectedFlow)}</g> : null}

        {/* The selection's own controls, above every element the diagram places, for as long as it is selected. */}
        {selectionControls ? (
          <g className="infoschematic-foreground">
            {selectionControls.axes ? (
              <ResizeHandle
                axes={selectionControls.axes}
                bounds={selectionControls.bounds}
                label={selectionControls.label}
                selection={selectionControls.selection}
              />
            ) : null}
            <ArtefactActions
              at={selectionControls.actionsAt}
              label={selectionControls.label}
              selection={selectionControls.selection}
            />
          </g>
        ) : null}

        {/* The band a range sweep has covered so far, drawn above the diagram because it is about the gesture rather
          than about anything on the surface, and gone the moment the pointer is let go. */}
        {rangeGesture ? (
          <rect className="infoschematic-range-band" {...rangeBand(rangeGesture)} pointerEvents="none" />
        ) : null}

        {annotated || editing ? (
          <g aria-label="Infoschematic annotations" className="infoschematic-audit">
            {/*
             * A scene narrows what is annotated to what it lights.
             *
             * Annotating the whole Infoschematic while a scene is up puts a code on
             * every card the scene deliberately dimmed, which is the opposite
             * of what a scene is for: a reader turning codes on during a
             * walkthrough wants to name what they are being shown, not what
             * they are not.
             */}
            {(annotated
              ? placeables.filter((placeable) => !highlight || highlight.endpoints.has(placeable.id))
              : []
            ).map((placeable) => {
              /*
               * The placeable's box already has the drag folded in, so folding it
               * in again moved the code badge at twice the speed of the card it
               * names. The ports a few lines below always read the box straight,
               * which is why a dragged card's badge and its ports came apart.
               */
              const layout = placeable.box
              // An adapter's top corners are beside the card it clasps, so its code
              // goes in the rim along the bottom where its name already is. On
              // everything else the top right is clear and is where a reader looks.
              const clasped = register.byCode(placeable.code)?.wraps
              const held = clasped ? infoschematicLayout[clasped as keyof typeof infoschematicLayout] : undefined
              const badge = held
                ? movedBox(held, placeable.code).y + held.height + (adapterFloor - 20) / 2
                : layout.y + 5
              const badgeWidth = annotationLabelWidth(placeable.code, 56)
              return (
                <g key={placeable.id}>
                  <rect
                    className="audit-component-code-bg"
                    height="20"
                    rx="5"
                    width={badgeWidth}
                    x={layout.x + layout.width - badgeWidth - 4}
                    y={badge}
                  />
                  <text
                    className="audit-component-code"
                    x={layout.x + layout.width - badgeWidth / 2 - 4}
                    y={badge + 14}
                  >
                    {placeable.code}
                  </text>
                </g>
              )
            })}
            {/* A port is a Flow control rather than part of a Card, so it goes with the Flow layer: absent rather
              than dimmed, the way the other editors' handles are, and a press near a Card's edge then reaches the
              Card instead of a port beside it. */}
            {interactive('flow')
              ? placeables.flatMap((placeable) =>
                  portsForBox(placeable.box, placeable.ports).map((port) => {
                    const inUse = used.has(`${placeable.id}:${port.id}`) || dropPort === `${placeable.id}:${port.id}`
                    const portKey = `port:${placeable.code}:${port.id}`
                    // Every port on every card at once reads as noise rather than as
                    // affordance. A port earns its dot by being an anchor the diagram
                    // is read by, by being asked about, or by being a drop target for
                    // the line currently being drawn.
                    const asked = hovered === placeable.code || hovered === portKey || selected === placeable.code
                    const dormant =
                      !inUse &&
                      !attached.has(`${placeable.id}:${port.id}`) &&
                      !asked &&
                      selected !== portKey &&
                      !drawing
                    return (
                      <g
                        className={`${inUse ? 'audit-port in-use' : 'audit-port'}${dormant ? ' dormant' : ''}${
                          selected === portKey ? ' selected' : ''
                        }${hovered === portKey ? ' pointed' : ''}`}
                        key={`${placeable.id}-${port.id}`}
                        onPointerEnter={onHover ? () => onHover(portKey) : undefined}
                        onPointerLeave={onHover ? () => onHover(null) : undefined}
                        onPointerDown={(event) => {
                          const end =
                            selectedFlow && inUse
                              ? selectedFlow.source === placeable.id && selectedFlow.sourcePort === port.id
                                ? ('source' as const)
                                : selectedFlow.target === placeable.id && selectedFlow.targetPort === port.id
                                  ? ('target' as const)
                                  : undefined
                              : undefined
                          if (end && selectedFlow) {
                            dragAttachment(selectedFlow, end)(event)
                            return
                          }
                          event.stopPropagation()
                          onSelect?.(portKey)
                          // Selecting and starting a line are the same press: the
                          // drag only becomes one past the threshold, so a click
                          // that does not travel still just selects the port.
                          dragNewFlow(placeable.id, port)(event)
                        }}
                      >
                        <circle className="audit-port-target" cx={port.at.x} cy={port.at.y} r="9" />
                        <circle cx={port.at.x} cy={port.at.y} r="3.5" />
                        <text x={port.at.x + 8} y={port.at.y - 8}>{`${placeable.code}:${port.id}`}</text>
                      </g>
                    )
                  })
                )
              : null}
            {/* The line a port-to-port drag is making, which has no entry to be
              drawn from yet. Broken and grey because it is a proposal: it has
              no family, so it has no colour to be drawn in. */}
            {drawing ? (
              <path
                className="audit-new-flow"
                d={`M ${drawing.from.x} ${drawing.from.y} L ${drawing.to.x} ${drawing.to.y}`}
              />
            ) : null}
            {(annotated || editing
              ? flows.filter((flow) => editing || !highlight || highlight.flows.has(flow.id))
              : []
            ).map((flow) => {
              const { x, y } = labelPositions.get(flow.id) ?? { x: 0, y: 0 }
              const badgeWidth = annotationLabelWidth(flow.code)
              const selection = {
                code: flow.code,
                geometry: 'route',
                id: flow.id,
                kind: 'flow'
              } as const satisfies ArtefactSelection
              return (
                <g
                  /* The chip is where a Flow's code is read as well as where its label is dragged from, so a closed
                    Flow layer leaves it drawn and takes only the dragging - unlike a port, which is affordance only. */
                  className={`audit-flow${highlight?.flows.has(flow.id) ? ' highlighted' : ''}${editing ? ' editable' : ''}${artefactSelected(selection, flow.code) ? ' selected' : ''}${hovered === flow.code ? ' pointed' : ''}${inGroup(selection)}${inert('flow')}`}
                  key={flow.code}
                  onPointerDown={
                    interactive('flow')
                      ? (event) => {
                          // Select on the press, not on the drag: below the drag
                          // threshold nothing else would, and a label that cannot
                          // be selected cannot be nudged with the arrow keys.
                          selectArtefact(selection, flow.code)
                          dragLabel(flow.code)(event)
                        }
                      : undefined
                  }
                  onPointerEnter={onHover ? () => onHover(flow.code) : undefined}
                  onPointerLeave={onHover ? () => onHover(null) : undefined}
                >
                  {editing ? <title>{`${flow.code} — drag to place`}</title> : null}
                  <rect height="20" rx="4" width={badgeWidth} x={x - badgeWidth / 2} y={y - 10} />
                  <text x={x} y={y + 4}>
                    {flow.code}
                  </text>
                </g>
              )
            })}
          </g>
        ) : null}

        {guides?.length ? (
          <g className="infoschematic-guides">
            {guides.map((guide) => (
              <line
                key={`${guide.axis}-${guide.at}-${guide.from}`}
                x1={guide.axis === 'x' ? guide.at : infoschematicViewBox.x}
                x2={guide.axis === 'x' ? guide.at : infoschematicViewBox.x + infoschematicViewBox.width}
                y1={guide.axis === 'y' ? guide.at : infoschematicViewBox.y}
                y2={guide.axis === 'y' ? guide.at : infoschematicViewBox.y + infoschematicViewBox.height}
              />
            ))}
          </g>
        ) : null}

        {editing ? null : graphicLayer}
        {emphasisLayer.length > 0 ? <g className="infoschematic-emphasis">{emphasisLayer}</g> : null}
      </svg>
      {!fitted && minimap ? (
        <button
          aria-label="Diagram minimap — click or drag to move the viewport"
          className={`infoschematic-minimap ${minimap}${viewportControls === 'overlay' && minimap === 'top-right' ? ' below-controls' : ''}${minimapGesture ? ' dragging' : ''}`}
          onKeyDown={minimapKeyDown}
          onPointerCancel={minimapGesture ? stopMinimapPan : undefined}
          onPointerDown={startMinimapPan}
          onPointerMove={continueMinimapPan}
          onPointerUp={minimapGesture ? stopMinimapPan : undefined}
          title="Diagram minimap — click or drag to move the viewport"
          type="button"
        >
          <svg
            ref={minimapOverview}
            aria-hidden="true"
            focusable="false"
            preserveAspectRatio="xMidYMid meet"
            viewBox={`${infoschematicViewBox.x} ${infoschematicViewBox.y} ${infoschematicViewBox.width} ${infoschematicViewBox.height}`}
          >
            <rect
              className="infoschematic-minimap-backdrop"
              height={infoschematicViewBox.height}
              width={infoschematicViewBox.width}
              x={infoschematicViewBox.x}
              y={infoschematicViewBox.y}
            />
            {infoschematicRegions.map((region) => (
              <rect
                className="infoschematic-minimap-region"
                height={region.box.height}
                key={region.id}
                rx={region.box.radius ?? cornerRadius}
                width={region.box.width}
                x={region.box.x}
                y={region.box.y}
              />
            ))}
            {flows.map((flow) => (
              <path className="infoschematic-minimap-flow" d={flow.d} key={flow.id} />
            ))}
            {placeables.map((placeable) => (
              <rect
                className="infoschematic-minimap-placeable"
                height={placeable.box.height}
                key={placeable.id}
                rx={cornerRadius}
                width={placeable.box.width}
                x={placeable.box.x}
                y={placeable.box.y}
              />
            ))}
            {minimapGraphicBounds ? (
              <rect
                className="infoschematic-minimap-graphic"
                height={minimapGraphicBounds.height}
                width={minimapGraphicBounds.width}
                x={minimapGraphicBounds.x}
                y={minimapGraphicBounds.y}
              />
            ) : null}
            <rect
              className="infoschematic-minimap-viewport"
              height={viewport.height}
              width={viewport.width}
              x={viewport.x}
              y={viewport.y}
            />
          </svg>
        </button>
      ) : null}
      {viewportControls === 'overlay' ? (
        <div aria-label="Diagram zoom controls" className="infoschematic-viewport-controls" role="toolbar">
          <button aria-label="Zoom in" onClick={() => zoomBy(viewportZoomStep)} title="Zoom in (+)" type="button">
            +
          </button>
          <button
            aria-label="Zoom out"
            disabled={fitted}
            onClick={() => zoomBy(1 / viewportZoomStep)}
            title="Zoom out (−)"
            type="button"
          >
            −
          </button>
          <button
            aria-label="Fit whole diagram"
            disabled={fitted}
            onClick={fitViewport}
            title="Fit whole diagram (0)"
            type="button"
          >
            0
          </button>
        </div>
      ) : null}
    </div>
  )
}
