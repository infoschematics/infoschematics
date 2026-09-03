import { useEffect, useMemo, useRef, useState } from 'react'
import type { FabricConfig } from '@infoschematics/domain-model/fabric'
import type { GraphicConfig } from '@infoschematics/domain-model/graphic'
import {
  type CardDetailOverrides,
  resolveCardDomain,
  resolveReadableInk,
  resolveRegionTreatment,
  resolveVisualTreatment,
} from '@infoschematics/view-model/appearance'
import {
  applyArtefactOperations,
  type ArtefactDraftOperation,
} from '@infoschematics/view-model/artefact-draft'
import type { ArtefactSelection, CreatedComponent, ResizeMinimum } from '@infoschematics/view-model/editable'
import type { Box, Point } from '@infoschematics/view-model/geometry'
import { roundedOutline } from '@infoschematics/view-model/geometry'
import type { Guide } from '@infoschematics/view-model/guides'
import { type Port, type PortCounts, portsForBox } from '@infoschematics/view-model/ports'
import { regionGeometry } from '@infoschematics/view-model/region-geometry'
import type { FlowSignal } from '@infoschematics/view-model/signals'
import { visualTokens } from '@infoschematics/view-model/tokens'
import { segmentAt } from '@infoschematics/view-model/waypoints'
export type CanvasMode = 'design' | 'scenes' | 'stories' | null
import {
  createInfoschematicRuntime,
  type RuntimeFlow as InfoschematicFlow,
} from '@infoschematics/view-model/runtime'
import { useInfoschematic } from './runtime-context.tsx'
import {
  type FabricRendererProps,
  resolveInfoschematicRenderer,
  useInfoschematicRenderers,
} from './renderers.tsx'
import { flowSignalKey } from './flow-signals.ts'

type Highlight = { endpoints: ReadonlySet<string>; flows: ReadonlySet<string> }
type LabelOffsets = ReadonlyMap<string, { dx: number; dy: number }>
type MovableArtefactSelection = Exclude<ArtefactSelection, { kind: 'flow' }>
type ResizeAxes = Readonly<{ height: boolean; width: boolean }>

const sameArtefact = (left: ArtefactSelection | null | undefined, right: ArtefactSelection) =>
  left?.kind === right.kind &&
  left.id === right.id &&
  (left.kind !== 'zone' || (right.kind === 'zone' && left.laneId === right.laneId))

const graphicBounds = (graphic: GraphicConfig, viewBox: Box): Box => {
  const width = graphic.placement?.width ?? Math.min(320, viewBox.width / 3)
  const height = graphic.placement?.height ?? 80
  return {
    height,
    width,
    x: graphic.placement?.x ?? viewBox.x + (viewBox.width - width) / 2,
    y: graphic.placement?.y ?? viewBox.y + (viewBox.height - height) / 2,
  }
}

/**
 * Domain answers what semantic family a Card belongs to; Scope answers whether
 * it is applicable and visible. Cards authored before Domain classification
 * retain their Scope colours as a compatibility fallback.
 */
const splitLabel = (label: string) => {
  if (label.length <= 22 || !label.includes(' ')) return [label]

  const words = label.split(' ')
  const candidates = words.slice(1).map((_, index) => {
    const first = words.slice(0, index + 1).join(' ')
    const second = words.slice(index + 1).join(' ')
    return { first, second, width: Math.max(first.length, second.length) }
  })
  const balanced = candidates.reduce((best, candidate) => (candidate.width < best.width ? candidate : best))
  return [balanced.first, balanced.second]
}

function DefaultFabric({ fabric, bounds }: FabricRendererProps) {
  const caption = fabric.appearance?.caption ?? fabric.label
  const detail = fabric.appearance?.detail ?? fabric.detail
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

function DefaultGraphic({ graphic, bounds }: { graphic: GraphicConfig; bounds: Box }) {
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

const {
  addReach,
  attachmentReach,
  cornerRadius,
  dragThreshold,
  gridMajorSize,
  gridSize,
} = visualTokens.canvas.geometry
// The moving pulse is Canvas-only; static output shares only the still-path treatment.
const signalRadius = 5

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
  mode = null,
  litByScene,
  onLight,
  createdCards = [],
  onCreateLine,
  onFreeEnd,
  onHover,
  onSelect,
  onArtefactMove,
  onArtefactRelease,
  onArtefactRemove,
  onArtefactReorder,
  onArtefactResize,
  onArtefactSelect,
  portCounts,
  selected,
  selectedArtefact,
  signals = [],
  flows: suppliedFlows,
  annotated,
  cardDetails,
  grid,
  graphic,
  visibleScopes,
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
  /** Canvas emits pointer coordinates; View Model owns constraints and operation construction. */
  onArtefactMove?: (selection: MovableArtefactSelection, point: Point) => void
  onArtefactResize?: (selection: MovableArtefactSelection, size: ResizeMinimum) => void
  onArtefactReorder?: (selection: ArtefactSelection, direction: -1 | 1) => void
  onArtefactRemove?: (selection: ArtefactSelection) => void
  /** Closes one pointer gesture for undo grouping. */
  onArtefactRelease?: () => void
  /** Port counts changed in the editor but not yet written into the model. */
  portCounts?: Readonly<Record<string, PortCounts>>
  selected?: string | null
  selectedArtefact?: ArtefactSelection | null
  /** Transient host-owned Flow occurrences; stable keys prevent accidental replay. */
  signals?: readonly FlowSignal[]
  flows: readonly InfoschematicFlow[]
  annotated?: boolean
  /** Output-only Card metadata visibility; authored data remains unchanged. */
  cardDetails?: CardDetailOverrides
  /** Legacy Design grid overlay, independent of the authored grid treatment. */
  grid?: boolean
  /** A resolved Graphic drawn by the active Story Scene. */
  graphic?: GraphicConfig
  visibleScopes: ReadonlySet<string>
}) {
  const hostRuntime = useInfoschematic()
  const previewing = artefactOperations.length > 0
  const runtime = useMemo(
    () =>
      previewing
        ? createInfoschematicRuntime(
            applyArtefactOperations(hostRuntime.config, artefactOperations).config,
          )
        : hostRuntime,
    [artefactOperations, hostRuntime, previewing],
  )
  const {
    adapterFloor,
    config,
    infoschematicAnnotationLabelPositions,
    infoschematicCardIsVisible,
    infoschematicCards,
    infoschematicEndpointCodes,
    infoschematicEndpointLabels,
    infoschematicFabricIsVisible,
    infoschematicFabrics,
    infoschematicFamilies,
    infoschematicFlowIsVisible,
    infoschematicFlows,
    infoschematicInterfaceById,
    infoschematicLanes,
    infoschematicLayout,
    infoschematicPlaceables,
    infoschematicPortAudit,
    infoschematicRegisterWith,
    infoschematicScopes,
    infoschematicViewBox,
  } = runtime
  const flows = useMemo(() => {
    if (!previewing || mode !== 'design') return suppliedFlows

    const families = new Set(infoschematicFamilies.map((family) => family.id))
    const suppliedById = new Map(suppliedFlows.map((flow) => [flow.id, flow]))
    const authoredById = new Map(
      hostRuntime.infoschematicFlows.map((flow) => [flow.id, flow]),
    )
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
              targetPort: draft.targetPort,
            }
          : flow
      })
    const effectiveIds = new Set(effective.map((flow) => flow.id))
    const authoredIds = new Set(
      hostRuntime.config.infoschematic.flows.map((flow) => flow.id),
    )
    const legacyDrafts = suppliedFlows.filter(
      (flow) => !authoredIds.has(flow.id) && !effectiveIds.has(flow.id),
    )
    return [...effective, ...legacyDrafts]
  }, [
    hostRuntime.config.infoschematic.flows,
    infoschematicFamilies,
    infoschematicFlowIsVisible,
    infoschematicFlows,
    mode,
    previewing,
    suppliedFlows,
    visibleScopes,
  ])
  const renderers = useInfoschematicRenderers()
  const visualTreatment = resolveVisualTreatment(config.infoschematic.appearance, cardDetails)
  const domains = config.infoschematic.domains ?? []
  const Definitions = renderers.definitions
  const activeGraphicRenderer =
    mode !== 'design' && graphic
      ? resolveInfoschematicRenderer(renderers, 'graphic', graphic.renderer, graphic.properties, graphic.id)
      : undefined
  const familyById = new Map(infoschematicFamilies.map((family) => [family.id, family]))
  const familyLayer = new Map(infoschematicFamilies.map((family, index) => [family.id, index]))
  const scopeAppearance = Object.fromEntries(
    infoschematicScopes.map((scope) => [scope.id, { fill: scope.fill, stroke: scope.color }]),
  ) as Record<string, { fill: string; stroke: string }>
  const cardById = new Map(infoschematicCards.map((card) => [card.id, card]))
  const accessibleSummary = infoschematicCards
    .filter((card) => infoschematicCardIsVisible(card, visibleScopes))
    .map((card) => [card.code, card.label, card.stereotype, card.detail].filter(Boolean).join(' · '))
    .join('; ')
  const _audit = infoschematicPortAudit(flows)
  // Every port a card offers is shown; the ones a route already meets are drawn
  // solid and named, so a reader can see what is taken and what is free.
  // Green marks the ports the *selected* flow meets, not every port in
  // use anywhere: a Infoschematic full of green says nothing about what is selected,
  // and the two ends you can re-attach are the two worth pointing at.
  const selectedFlow = flows.find(
    (flow) =>
      flow.code === selected ||
      (selectedArtefact?.kind === 'flow' && selectedArtefact.id === flow.id),
  )
  const used = new Set(
    selectedFlow
      ? [`${selectedFlow.source}:${selectedFlow.sourcePort}`, `${selectedFlow.target}:${selectedFlow.targetPort}`]
      : [],
  )
  // Boxes and ports with the edits in hand already folded in, so the drop
  // target, the ports drawn, and the lookup that resolves a chosen port all
  // read one answer rather than three merges of the same two drafts.
  const placeables = infoschematicPlaceables(visibleScopes, {
    created: createdCards,
    offsets: componentOffsets,
    portCounts,
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
        ...(anchored(flow.target, flow.targetPort) ? [`${flow.code}:end`] : []),
      ]
    }),
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
  const graphics = editing ? config.infoschematic.graphics : graphic ? [graphic] : []
  // Both editing layers above the Infoschematic light rather than place: a scene says
  // what it shows, and a story's Story Scene does the same through the scene it plays.
  const focusing = mode === 'scenes' || mode === 'stories'

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

  const selectArtefact = (selection: ArtefactSelection, legacyKey: string) => {
    if (onArtefactSelect) onArtefactSelect(selection)
    else onSelect?.(legacyKey)
  }

  const artefactKeyDown = (selection: ArtefactSelection, legacyKey: string) => (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      selectArtefact(selection, legacyKey)
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

  const dragArtefact = (
    selection: MovableArtefactSelection,
    legacyKey: string,
    origin: Point,
    axes: Readonly<{ x: boolean; y: boolean }>,
    selectionToSelect: ArtefactSelection = selection,
  ) =>
    (event: React.PointerEvent<SVGElement>) => {
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
          y: axes.y ? point.y : origin.y,
        })
      }
      const stop = () => {
        if (dragging) onArtefactRelease?.()
        window.removeEventListener('pointermove', move)
        window.removeEventListener('pointerup', stop)
      }
      window.addEventListener('pointermove', move)
      window.addEventListener('pointerup', stop)
    }

  const ResizeHandle = ({
    axes,
    bounds,
    label,
    renderOrigin,
    selection,
  }: {
    axes: ResizeAxes
    bounds: Box
    label: string
    renderOrigin?: Point
    selection: MovableArtefactSelection
  }) => {
    if (!onArtefactResize) return null
    const resize = (point: Point) =>
      onArtefactResize(selection, {
        height: axes.height ? point.y - bounds.y : undefined,
        width: axes.width ? point.x - bounds.x : undefined,
      })
    return (
      // biome-ignore lint/a11y/useSemanticElements: SVG has no button element; the labelled group is keyboard operable.
      <g
        aria-label={`Resize ${label}`}
        className="artefact-resize-handle"
        onKeyDown={(event) => {
          const step = event.shiftKey ? 10 : 1
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
          const stop = () => {
            if (dragging) onArtefactRelease?.()
            window.removeEventListener('pointermove', move)
            window.removeEventListener('pointerup', stop)
          }
          window.addEventListener('pointermove', move)
          window.addEventListener('pointerup', stop)
        }}
        role="button"
        tabIndex={0}
        transform={`translate(${(renderOrigin?.x ?? bounds.x) + bounds.width} ${(renderOrigin?.y ?? bounds.y) + bounds.height})`}
      >
        <rect height="12" width="12" x="-6" y="-6" />
      </g>
    )
  }

  const ArtefactActions = ({
    at,
    label,
    selection,
  }: {
    at: Point
    label: string
    selection: ArtefactSelection
  }) => {
    const actions = [
      ...(onArtefactReorder
        ? [
            { action: () => onArtefactReorder(selection, -1), glyph: '↑', label: `Move ${label} earlier` },
            { action: () => onArtefactReorder(selection, 1), glyph: '↓', label: `Move ${label} later` },
          ]
        : []),
      ...(onArtefactRemove
        ? [{ action: () => onArtefactRemove(selection), glyph: '×', label: `Remove ${label}` }]
        : []),
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
      const snapped = { x: Math.round(at.x / gridSize) * gridSize, y: Math.round(at.y / gridSize) * gridSize }
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
  }, [flows, editing, selected])

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
      const stop = () => {
        if (dragging) onRelease?.()
        window.removeEventListener('pointermove', move)
        window.removeEventListener('pointerup', stop)
      }
      window.addEventListener('pointermove', move)
      window.addEventListener('pointerup', stop)
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
        id: port.id,
      })),
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
          : best,
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
        window.removeEventListener('pointermove', track)
        window.removeEventListener('pointerup', stop)
      }
      window.addEventListener('pointermove', track)
      window.addEventListener('pointerup', stop)
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
        window.removeEventListener('pointermove', move)
        window.removeEventListener('pointerup', stop)
      }
      window.addEventListener('pointermove', move)
      window.addEventListener('pointerup', stop)
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
          { x: released.clientX, y: released.clientY },
        )
      }
      setDropPort(null)
      setDrawing(null)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', stop)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', stop)
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
      onRouteRelease,
    )
  const dragSegment = (flow: InfoschematicFlow, index: number) =>
    dragHandle(
      `${flow.code}:segment:${index}`,
      onMoveSegment && ((_key, point) => onMoveSegment(flow.code, flow.points, index, point)),
      onRouteRelease,
    )

  // Selecting a Flow and adding a waypoint are separate actions. The dedicated
  // waypoint control prevents selection from changing the route.
  const routeClicked = (flow: InfoschematicFlow) => (event: React.PointerEvent<SVGPathElement>) => {
    if (!editing) return
    event.stopPropagation()
    selectArtefact(
      { code: flow.code, geometry: 'route', id: flow.id, kind: 'flow' },
      flow.code,
    )
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

  const fabricTitle = (fabric: FabricConfig) => `${fabric.code}: ${fabric.label} · ${fabric.detail}`

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
      kind: 'flow',
    } as const satisfies ArtefactSelection
    const family = familyById.get(flow.family) ?? infoschematicFamilies[0]
    const sourceCode = infoschematicEndpointCodes.get(flow.source) ?? flow.source
    const targetCode = infoschematicEndpointCodes.get(flow.target) ?? flow.target
    const conforms = (flow.conformsTo ?? []).map((id) => infoschematicInterfaceById.get(id)?.label ?? id).join(' or ')
    const call = flow.operation ? ` · ${flow.operation}` : ''
    const flowSelected = artefactSelected(selection, flow.code)
    return (
      // biome-ignore lint/a11y/useSemanticElements: SVG has no button element; the route is keyboard operable in Design.
      <g
        aria-label={`Flow ${flow.code}`}
        data-artefact-id={selection.id}
        data-artefact-kind={selection.kind}
        className={`flow-family-${flow.family}${highlight?.flows.has(flow.id) ? ' highlighted' : ''}${flowSelected ? ' selected' : ''}${hovered === flow.code ? ' pointed' : ''}${removals[flow.code] ? ' going' : ''}${focusing && litByScene?.has(flow.id) ? ' lit' : ''}`}
        key={flow.id}
        onKeyDown={editing ? artefactKeyDown(selection, flow.code) : undefined}
        role={editing ? 'button' : undefined}
        style={{ color: family.color }}
        tabIndex={editing ? 0 : undefined}
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
          /* A registration is bidirectional, and six heads converging on the
             registry said nothing a reader did not already know - every one of
             them points there. The head that carries meaning is the one at the
             provider, so a two-way line keeps that and drops the other. */
          markerEnd={flow.bidirectional ? undefined : `url(#infoschematic-arrow-${flow.family})`}
          markerStart={flow.bidirectional ? `url(#infoschematic-arrow-${flow.family})` : undefined}
          stroke={family.color}
        />
        {signals
          .filter((signal) => signal.flowId === flow.id)
          .map((signal) => (
            <g
              aria-hidden="true"
              className="infoschematic-flow-signal"
              data-occurrence-key={signal.occurrenceKey}
              key={flowSignalKey(signal)}
            >
              <path className="infoschematic-flow-signal-still" d={flow.d} />
              <circle className="infoschematic-flow-signal-pulse" opacity="0" r={signalRadius}>
                <animate attributeName="opacity" dur="900ms" fill="freeze" values="0;1;1;0" />
                <animateMotion dur="900ms" fill="freeze" path={flow.d} />
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
          onPointerDown={editing ? routeClicked(flow) : focusing ? () => onLight?.(flow.id, true) : undefined}
          onPointerEnter={onHover ? () => onHover(flow.code) : undefined}
          onPointerLeave={onHover ? () => onHover(null) : undefined}
        />
        {editing && flowSelected
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
        {editing && flowSelected && armed && addAt && !hoveredWaypoint && onAddWaypoint ? (
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
        {editing && flowSelected && onFreeEnd
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
        {editing && flowSelected
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
        {editing && flowSelected && flow.points[0] ? (
          <ArtefactActions at={flow.points[0]} label={flow.code} selection={selection} />
        ) : null}
      </g>
    )
  }

  return (
    <svg
      ref={infoschematic}
      aria-label={`${config.title} structural Infoschematic`}
      className={`${highlight ? 'infoschematic-svg highlighting' : 'infoschematic-svg'}${editing ? ' editing' : ''}${focusing ? ' focusing' : ''} surface-${visualTreatment.surface}`}
      data-grid-treatment={visualTreatment.grid}
      data-surface-treatment={visualTreatment.surface}
      height={infoschematicViewBox.height}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      viewBox={`${infoschematicViewBox.x} ${infoschematicViewBox.y} ${infoschematicViewBox.width} ${infoschematicViewBox.height}`}
      width={infoschematicViewBox.width}
    >
      <title>{config.title}</title>
      {accessibleSummary ? <desc>{`Cards: ${accessibleSummary}`}</desc> : null}
      {/* Sits behind everything else drawn onto the Infoschematic, so it is only ever
          reached once a click has missed every card, zone, and line above it -
          which is what makes "clicking empty Infoschematic clears the selection" true
          without this having to know what else is on screen. */}
      <rect
        className="infoschematic-backdrop"
        height={infoschematicViewBox.height}
        onPointerDown={
          editing
            ? () => {
                if (onArtefactSelect) onArtefactSelect(null)
                else onSelect?.('')
              }
            : undefined
        }
        width={infoschematicViewBox.width}
        x={infoschematicViewBox.x}
        y={infoschematicViewBox.y}
      />
      <defs>
        <pattern height={gridSize} id="infoschematic-grid-minor" patternUnits="userSpaceOnUse" width={gridSize} x="0" y="0">
          <path className="infoschematic-grid-line minor" d={`M ${gridSize} 0 V ${gridSize} M 0 ${gridSize} H ${gridSize}`} />
        </pattern>
        <pattern
          height={gridMajorSize}
          id="infoschematic-grid-major"
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
          id="infoschematic-grid-major-plus-minor"
          patternUnits="userSpaceOnUse"
          width={gridMajorSize}
          x="0"
          y="0"
        >
          <rect fill="url(#infoschematic-grid-minor)" height={gridMajorSize} width={gridMajorSize} x="0" y="0" />
          <path
            className="infoschematic-grid-line major"
            d={`M ${gridMajorSize} 0 V ${gridMajorSize} M 0 ${gridMajorSize} H ${gridMajorSize}`}
          />
        </pattern>
        {Definitions ? <Definitions /> : null}
        {infoschematicFamilies.map((family) => (
          <marker
            id={`infoschematic-arrow-${family.id}`}
            key={family.id}
            markerHeight="32"
            /* In user units, not stroke widths: the default scales an arrowhead
               with its line, so focusing a line inflated its head by a quarter
               and a bidirectional line grew two of them. */
            markerUnits="userSpaceOnUse"
            markerWidth="32"
            orient="auto-start-reverse"
            refX="24"
            refY="12"
          >
            {/* The family colour is the fallback. Where `context-stroke` is
                understood the stylesheet overrides it and the head takes the
                colour of the line it sits on, so pointing at a line brightens
                its head with it rather than leaving it behind. */}
            <path className="arrow-head" d="M0,0 L0,24 L24,12 z" fill={family.color} />
          </marker>
        ))}
      </defs>

      {visualTreatment.grid !== 'none' ? (
        <rect
          className="infoschematic-authored-grid"
          fill={`url(#infoschematic-grid-${visualTreatment.grid})`}
          height={infoschematicViewBox.height}
          pointerEvents="none"
          width={infoschematicViewBox.width}
          x={infoschematicViewBox.x}
          y={infoschematicViewBox.y}
        />
      ) : null}

      {infoschematicLanes.map((lane) => (
        <g key={lane.id}>
          <rect
            className="infoschematic-lane-fill"
            height={lane.panel.height}
            rx={lane.panel.radius}
            width={lane.panel.width}
            x={lane.panel.x}
            y={lane.panel.y}
          />
          {lane.zones.map((zone) => {
            const selection = {
              code: null,
              geometry: 'zone',
              id: zone.id,
              kind: 'zone',
              laneId: lane.id,
            } as const satisfies ArtefactSelection
            const legacyKey = `zone:${lane.id}:${zone.id}`
            const bounds = { height: lane.panel.height, width: zone.width, x: zone.x, y: lane.panel.y }
            const treatment = resolveRegionTreatment('zone', zone.label, zone.appearance, lane.legend)
            const geometry = regionGeometry({ box: bounds, label: zone.label, treatment })
            return (
              // biome-ignore lint/a11y/useSemanticElements: SVG has no button element; the full Zone is keyboard operable in Design.
              <g
                aria-label={`Zone ${zone.label}`}
                className={`infoschematic-zone artefact-selectable${artefactSelected(selection, legacyKey) ? ' selected' : ''}`}
                data-artefact-id={selection.id}
                data-artefact-kind={selection.kind}
                data-frame-treatment={treatment.frame}
                data-label-placement={treatment.label ?? 'none'}
                data-label-treatment={treatment.labelTreatment}
                key={zone.id}
                onKeyDown={editing ? artefactKeyDown(selection, legacyKey) : undefined}
                onPointerDown={
                  editing
                    ? dragArtefact(selection, legacyKey, { x: zone.x + zone.width / 2, y: lane.panel.y + lane.panel.height / 2 }, { x: true, y: false })
                    : undefined
                }
                role={editing ? 'button' : undefined}
                tabIndex={editing ? 0 : undefined}
              >
                <rect
                  className="infoschematic-region-fill"
                  fill={zone.fill}
                  height={lane.panel.height}
                  rx={treatment.frame === 'none' ? undefined : cornerRadius}
                  width={zone.width}
                  x={zone.x}
                  y={lane.panel.y}
                />
                {geometry.outline ? <path className="infoschematic-region-frame" d={geometry.outline} /> : null}
                {editing && artefactSelected(selection, legacyKey) ? (
                  <>
                    <ResizeHandle axes={{ height: false, width: true }} bounds={bounds} label={zone.label} selection={selection} />
                    <ArtefactActions at={{ x: zone.x + zone.width - 48, y: lane.panel.y + 12 }} label={zone.label} selection={selection} />
                  </>
                ) : null}
              </g>
            )
          })}
        </g>
      ))}

      <g className="infoschematic-zone-label">
        {infoschematicLanes.flatMap((lane) =>
          lane.zones.map((zone) => {
            const selection = {
              code: null,
              geometry: 'zone',
              id: zone.id,
              kind: 'zone',
              laneId: lane.id,
            } as const satisfies ArtefactSelection
            const legacyKey = `zone:${lane.id}:${zone.id}`
            const bounds = { height: lane.panel.height, width: zone.width, x: zone.x, y: lane.panel.y }
            const treatment = resolveRegionTreatment('zone', zone.label, zone.appearance, lane.legend)
            const label = regionGeometry({ box: bounds, label: zone.label, treatment }).label
            if (!label) return null
            return (
              <text
                className={`${editing && (onSelect || onArtefactSelect) ? 'zone-selectable' : ''}${
                  artefactSelected(selection, legacyKey) ? ' selected' : ''
                }${hovered === legacyKey ? ' pointed' : ''}`}
                data-ink={resolveReadableInk(zone.fill)}
                dominantBaseline={label.dominantBaseline}
                key={`${lane.id}-${zone.id}`}
                onPointerDown={editing ? () => selectArtefact(selection, legacyKey) : undefined}
                onPointerEnter={onHover ? () => onHover(legacyKey) : undefined}
                onPointerLeave={onHover ? () => onHover(null) : undefined}
                textAnchor={label.textAnchor}
                x={label.x}
                y={label.y}
              >
                {zone.label.toUpperCase()}
              </text>
            )
          }),
        )}
      </g>

      {infoschematicLanes.map((lane) => {
        const selection = {
          code: null,
          geometry: 'lane',
          id: lane.id,
          kind: 'lane',
        } as const satisfies ArtefactSelection
        const legacyKey = `lane:${lane.id}`
        const bounds = { height: lane.panel.height, width: lane.panel.width, x: lane.panel.x, y: lane.panel.y }
        const treatment = resolveRegionTreatment('lane', lane.label, lane.appearance, lane.legend)
        const geometry = regionGeometry({ box: bounds, label: lane.label, treatment })
        return (
          // biome-ignore lint/a11y/useSemanticElements: SVG has no button element; the Lane outline is keyboard operable in Design.
          <g
            aria-label={`Lane ${lane.label}`}
            className={`infoschematic-group lane-${lane.id} artefact-selectable${artefactSelected(selection, legacyKey) ? ' selected' : ''}`}
            data-artefact-id={selection.id}
            data-artefact-kind={selection.kind}
            data-frame-treatment={treatment.frame}
            data-label-placement={treatment.label ?? 'none'}
            data-label-treatment={treatment.labelTreatment}
            key={`panel-${lane.id}`}
            onKeyDown={editing ? artefactKeyDown(selection, legacyKey) : undefined}
            onPointerDown={
              editing
                ? dragArtefact(selection, legacyKey, { x: lane.panel.x + lane.panel.width / 2, y: lane.panel.y + lane.panel.height / 2 }, { x: false, y: true })
                : undefined
            }
            role={editing ? 'button' : undefined}
            tabIndex={editing ? 0 : undefined}
          >
            {geometry.outline ? <path className="infoschematic-region-frame" d={geometry.outline} /> : null}
            {/* The zones tile their lane completely, so the legend is the only
                part of a lane a reader can aim at without hitting a zone. */}
            {geometry.label ? (
              <text
                className={`${editing && (onSelect || onArtefactSelect) ? 'lane-selectable' : ''}${
                  artefactSelected(selection, legacyKey) ? ' selected' : ''
                }${hovered === legacyKey ? ' pointed' : ''}`}
                dominantBaseline={geometry.label.dominantBaseline}
                onPointerEnter={onHover ? () => onHover(legacyKey) : undefined}
                onPointerLeave={onHover ? () => onHover(null) : undefined}
                textAnchor={geometry.label.textAnchor}
                x={geometry.label.x}
                y={geometry.label.y}
              >
                {lane.label.toUpperCase()}
              </text>
            ) : null}
            {editing && artefactSelected(selection, legacyKey) ? (
              <>
                <ResizeHandle axes={{ height: true, width: false }} bounds={bounds} label={lane.label} selection={selection} />
                <ArtefactActions
                  at={{ x: lane.panel.x + lane.panel.width - 48, y: lane.panel.y + 12 }}
                  label={lane.label}
                  selection={selection}
                />
              </>
            ) : null}
          </g>
        )
      })}

      {/* The canvas states its own edge, present whenever the editor is open
          regardless of whether the grid is switched on, so a card dragged
          towards it has something other than the lane panels to read against. */}
      {editing ? (
        <rect
          className="canvas-edge"
          height={infoschematicViewBox.height}
          width={infoschematicViewBox.width}
          x={infoschematicViewBox.x}
          y={infoschematicViewBox.y}
        />
      ) : null}

      {editing && grid ? (
        <g className="edit-grid">
          <rect
            fill="url(#infoschematic-grid-major-plus-minor)"
            height={infoschematicViewBox.height}
            width={infoschematicViewBox.width}
            x={infoschematicViewBox.x}
            y={infoschematicViewBox.y}
          />
        </g>
      ) : null}

      {infoschematicFabrics
        .filter((fabric) => infoschematicFabricIsVisible(fabric, visibleScopes))
        .map((fabric) => {
          const bounds = movedBox(fabric.bounds, fabric.code)
          const selection = {
            code: fabric.code,
            geometry: 'box',
            id: fabric.id,
            kind: 'fabric',
          } as const satisfies ArtefactSelection
          const rendererKey = fabric.appearance?.renderer
          const renderer = resolveInfoschematicRenderer(
            renderers,
            'fabric',
            rendererKey,
            fabric.appearance?.properties,
            fabric.id,
          )
          const Renderer = renderer?.Component
          return (
            <g
              aria-label={fabric.label}
              className={`${fabricClass(fabric.id)}${editing ? ' selectable artefact-selectable' : ''}${artefactSelected(selection, fabric.code) ? ' selected' : ''}${hovered === fabric.code ? ' pointed' : ''}`}
              data-artefact-id={selection.id}
              data-artefact-kind={selection.kind}
              key={fabric.id}
              onKeyDown={editing ? artefactKeyDown(selection, fabric.code) : undefined}
              onPointerDown={
                editing
                  ? dragArtefact(
                      selection,
                      fabric.code,
                      { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 },
                      { x: true, y: true },
                    )
                  : undefined
              }
              onPointerEnter={onHover ? () => onHover(fabric.code) : undefined}
              onPointerLeave={onHover ? () => onHover(null) : undefined}
              role={editing ? 'button' : undefined}
              tabIndex={editing ? 0 : undefined}
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
              {editing && artefactSelected(selection, fabric.code) ? (
                <>
                  <ResizeHandle axes={{ height: true, width: true }} bounds={bounds} label={fabric.label} selection={selection} />
                  <ArtefactActions
                    at={{ x: bounds.x + bounds.width - 48, y: bounds.y + 12 }}
                    label={fabric.label}
                    selection={selection}
                  />
                </>
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
              right.code === selected || (selectedArtefact?.kind === 'flow' && selectedArtefact.id === right.id) ? 1 : 0
            if (leftPicked !== rightPicked) return leftPicked - rightPicked

            const leftLit = highlight?.flows.has(left.id) ? 1 : 0
            const rightLit = highlight?.flows.has(right.id) ? 1 : 0
            if (leftLit !== rightLit) return leftLit - rightLit
            return (familyLayer.get(right.family) ?? 0) - (familyLayer.get(left.family) ?? 0)
          })
          .filter(
            (flow) =>
              flow.code !== selected &&
              !(selectedArtefact?.kind === 'flow' && selectedArtefact.id === flow.id),
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
            kind: 'card',
          } as const satisfies ArtefactSelection
          const heldSelection = {
            code: holds.code,
            geometry: 'box',
            id: holds.id,
            kind: 'card',
          } as const satisfies ArtefactSelection
          // Traced as one outline so the clasp is a single shape: out along the
          // left arm, down into the notch the card sits in, up the right arm and
          // round the bottom. Every corner takes the card's own radius, the
          // notch curving inward where the outside curves away.
          const socket = roundedOutline(
            [
              { x: box.x, y: box.y },
              { x: held.x, y: box.y },
              { x: held.x, y: held.y + held.height },
              { x: held.x + held.width, y: held.y + held.height },
              { x: held.x + held.width, y: box.y },
              { x: box.x + box.width, y: box.y },
              { x: box.x + box.width, y: box.y + box.height },
              { x: box.x, y: box.y + box.height },
            ],
            cornerRadius,
          )

          return (
            <g
              aria-label={`${adapter.label}, holding ${adapter.wraps}`}
              className={`infoschematic-adapter${editing ? ' selectable' : ''}${
                highlight?.endpoints.has(adapter.id) ? ' highlighted' : ''
              }${artefactSelected(selection, adapter.code) ? ' selected' : ''}${hovered === adapter.code ? ' pointed' : ''}`}
              data-artefact-id={selection.id}
              data-artefact-kind={selection.kind}
              key={placed.id}
              onKeyDown={editing ? artefactKeyDown(selection, adapter.code) : undefined}
              onPointerDown={
                editing
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
                          selection,
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
              role={editing ? 'button' : undefined}
              tabIndex={editing ? 0 : undefined}
            >
              <title>{`${adapter.code}: ${adapter.label} · ${adapter.detail}`}</title>
              <path className="adapter-socket" d={socket} />
              {/* The whole label is rendered exactly as authored. */}
              <text className="adapter-label" x={box.x + box.width / 2} y={held.y + held.height + adapterFloor / 2 + 5}>
                {adapter.label}
              </text>
              {editing && artefactSelected(selection, adapter.code) ? (
                <ArtefactActions
                  at={{ x: box.x + box.width - 48, y: box.y + 12 }}
                  label={adapter.label}
                  selection={selection}
                />
              ) : null}
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
            ? [{
                ...placeable,
                domain: authored?.domain,
                group: card.group,
                label: card.label,
                name: card.detail,
                stereotype: authored?.stereotype,
              }]
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
            kind: 'card',
          } as const satisfies ArtefactSelection
          const domain = resolveCardDomain(card, domains)
          const appearance = domain ?? scopeAppearance[card.group as keyof typeof scopeAppearance] ?? {
            color: 'currentColor',
            fill: 'transparent',
          }
          const labelLines = visualTreatment.card.compact ? [card.label] : splitLabel(card.label)
          // The legacy treatment remains centred; compact Cards use a left-aligned
          // editorial stack with optional metadata around the authored label.
          const labelY = visualTreatment.card.compact
            ? visualTreatment.card.stereotype && card.stereotype
              ? 39
              : 30
            : labelLines.length === 1
              ? 46
              : 39
          const labelX = visualTreatment.card.compact ? 14 : layout.width / 2
          const identityWidth = Math.max(42, card.code.length * 6.5 + 14)
          const accessibleDetail = [card.code, card.label, card.stereotype, card.name].filter(Boolean).join(' · ')

          return (
            <g
              aria-label={accessibleDetail}
              className={`infoschematic-service ${card.group}${visualTreatment.card.compact ? ' compact' : ''}${highlight?.endpoints.has(card.id) ? ' highlighted' : ''}${
                editing || focusing ? ' selectable' : ''
              }${artefactSelected(selection, card.code) ? ' selected' : ''}${hovered === card.code ? ' pointed' : ''}${
                removals[card.code] ? ' going' : ''
              }${focusing && litByScene?.has(card.id) ? ' lit' : ''}`}
              data-artefact-id={selection.id}
              data-artefact-kind={selection.kind}
              data-card-compact={visualTreatment.card.compact || undefined}
              data-domain={domain?.id}
              data-ink={resolveReadableInk(appearance.fill)}
              key={card.id}
              onKeyDown={editing ? artefactKeyDown(selection, card.code) : undefined}
              /*
               * Two editors, two meanings for the same press. In the Infoschematic
               * editor a card is selected and dragged; in the scene editor it
               * is added to or removed from what the scene lights, and there is
               * nothing to drag because a scene has no geometry.
               */
              onPointerDown={
                editing
                  ? (event) => {
                      if (onArtefactMove) {
                        dragArtefact(
                          selection,
                          card.code,
                          { x: layout.x + layout.width / 2, y: layout.y + layout.height / 2 },
                          { x: true, y: true },
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
              role={editing ? 'button' : undefined}
              style={{ color: 'color' in appearance ? appearance.color : appearance.stroke }}
              tabIndex={editing ? 0 : undefined}
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
              {visualTreatment.card.identity ? (
                <g className="infoschematic-card-identity" data-card-detail="identity">
                  <rect height="20" rx="4" width={identityWidth} x={layout.width - identityWidth - 8} y="8" />
                  <text x={layout.width - identityWidth / 2 - 8} y="18">
                    {card.code}
                  </text>
                </g>
              ) : null}
              {visualTreatment.card.stereotype && card.stereotype ? (
                <text className="infoschematic-card-stereotype" data-card-detail="stereotype" x="14" y="18">
                  {card.stereotype.toUpperCase()}
                </text>
              ) : null}
              <text
                className="infoschematic-service-label"
                textAnchor={visualTreatment.card.compact ? 'start' : 'middle'}
                x={labelX}
                y={labelY}
              >
                {labelLines.map((line, index) => (
                  <tspan key={line} x={labelX} dy={index === 0 ? 0 : 13}>
                    {line}
                  </tspan>
                ))}
              </text>
              {visualTreatment.card.description && card.name ? (
                <text
                  className="infoschematic-card-description"
                  data-card-detail="description"
                  textAnchor={visualTreatment.card.compact ? 'start' : 'middle'}
                  x={labelX}
                  y={Math.min(layout.height - 12, labelY + (labelLines.length - 1) * 13 + 18)}
                >
                  {card.name}
                </text>
              ) : null}
              {editing && artefactSelected(selection, card.code) ? (
                <>
                  <ResizeHandle
                    axes={{ height: true, width: true }}
                    bounds={layout}
                    label={card.label}
                    renderOrigin={{ x: 0, y: 0 }}
                    selection={selection}
                  />
                  <ArtefactActions
                    at={{ x: layout.width - 48, y: 12 }}
                    label={card.label}
                    selection={selection}
                  />
                </>
              ) : null}
            </g>
          )
        })}

      {/* Above the cards, so a selected line and its controls are never behind
          one. It leaves this layer the moment it is deselected. */}
      {selectedFlow ? <g className="infoschematic-flows">{renderFlow(selectedFlow)}</g> : null}

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
          {(annotated ? placeables.filter((placeable) => !highlight || highlight.endpoints.has(placeable.id)) : []).map(
            (placeable) => {
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
              return (
                <g key={placeable.id}>
                  <rect
                    className="audit-component-code-bg"
                    height="20"
                    rx="5"
                    width="56"
                    x={layout.x + layout.width - 60}
                    y={badge}
                  />
                  <text className="audit-component-code" x={layout.x + layout.width - 32} y={badge + 14}>
                    {placeable.code}
                  </text>
                </g>
              )
            },
          )}
          {editing
            ? placeables.flatMap((placeable) =>
                portsForBox(placeable.box, placeable.ports).map((port) => {
                  const inUse = used.has(`${placeable.id}:${port.id}`) || dropPort === `${placeable.id}:${port.id}`
                  return (
                    <g
                      className={`${inUse ? 'audit-port in-use' : 'audit-port'}${
                        selected === `port:${placeable.code}:${port.id}` ? ' selected' : ''
                      }${hovered === `port:${placeable.code}:${port.id}` ? ' pointed' : ''}`}
                      key={`${placeable.id}-${port.id}`}
                      onPointerEnter={onHover ? () => onHover(`port:${placeable.code}:${port.id}`) : undefined}
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
                        onSelect?.(`port:${placeable.code}:${port.id}`)
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
                }),
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
            const selection = {
              code: flow.code,
              geometry: 'route',
              id: flow.id,
              kind: 'flow',
            } as const satisfies ArtefactSelection
            return (
              <g
                className={`audit-flow${highlight?.flows.has(flow.id) ? ' highlighted' : ''}${editing ? ' editable' : ''}${artefactSelected(selection, flow.code) ? ' selected' : ''}${hovered === flow.code ? ' pointed' : ''}`}
                key={flow.code}
                onPointerDown={
                  editing
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
                <rect height="20" rx="4" width="48" x={x - 24} y={y - 10} />
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

      {graphics.map((entry) => {
        const bounds = graphicBounds(entry, infoschematicViewBox)
        const selection = {
          code: null,
          geometry: 'box',
          id: entry.id,
          kind: 'graphic',
        } as const satisfies ArtefactSelection
        const legacyKey = `graphic:${entry.id}`
        const renderer =
          !editing && graphic === entry
            ? activeGraphicRenderer
            : resolveInfoschematicRenderer(renderers, 'graphic', entry.renderer, entry.properties, entry.id)
        const Renderer = renderer?.Component
        return (
          <g
            aria-label={entry.label ?? entry.id}
            className={`infoschematic-graphic${editing ? ' artefact-selectable' : ''}${
              artefactSelected(selection, legacyKey) ? ' selected' : ''
            }`}
            data-artefact-id={selection.id}
            data-artefact-kind={selection.kind}
            key={entry.id}
            onKeyDown={editing ? artefactKeyDown(selection, legacyKey) : undefined}
            onPointerDown={
              editing
                ? dragArtefact(
                    selection,
                    legacyKey,
                    { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 },
                    { x: true, y: true },
                  )
                : undefined
            }
            role={editing ? 'button' : 'img'}
            tabIndex={editing ? 0 : undefined}
          >
            <title>{entry.label ?? entry.id}</title>
            {Renderer ? (
              <Renderer
                bounds={bounds}
                graphic={entry}
                properties={renderer.properties}
                viewBox={infoschematicViewBox}
              />
            ) : (
              <DefaultGraphic bounds={bounds} graphic={entry} />
            )}
            {editing ? (
              <rect
                className="graphic-frame"
                height={bounds.height}
                width={bounds.width}
                x={bounds.x}
                y={bounds.y}
              />
            ) : null}
            {editing && artefactSelected(selection, legacyKey) ? (
              <>
                <ResizeHandle axes={{ height: true, width: true }} bounds={bounds} label={entry.label ?? entry.id} selection={selection} />
                <ArtefactActions
                  at={{ x: bounds.x + bounds.width - 48, y: bounds.y + 12 }}
                  label={entry.label ?? entry.id}
                  selection={selection}
                />
              </>
            ) : null}
          </g>
        )
      })}
    </svg>
  )
}
