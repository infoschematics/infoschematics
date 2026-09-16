import {
  type AlignEdge,
  type ArtefactKind,
  artefactKinds,
  type DistributeAxis,
  type InteractionLayers,
  interactionLayerOpen
} from '@infoschematics/view-model/editable'
import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignHorizontalDistributeCenter,
  AlignStartHorizontal,
  AlignStartVertical,
  AlignVerticalDistributeCenter,
  CircleDot,
  Eraser,
  Frame,
  Grid3x3,
  Magnet,
  Network,
  RectangleHorizontal,
  Shapes,
  Spline,
  SquarePlus,
  SquareStack,
  Workflow
} from 'lucide-react'
import { useEffect, useState } from 'react'
import type { EditorMode, EditorView } from './use-editor.ts'

const toggles: [keyof EditorView, string, string, typeof Magnet][] = [
  ['snapping', 'Snap to guides', 'Pull a drop onto the nearest edge, centre, or label', Magnet]
]

/*
 * One control per kind the Design session can reach, in the order the diagram stacks them.
 *
 * Turning a kind off leaves it drawn exactly as authored and stops it answering the pointer or the keyboard, so a
 * Card resting over a Region can be worked on without the Region catching every press, and the Region can be caught
 * without moving the Card off it first. Ports go with Flows, because that is what they exist to attach.
 */
const layerControls: Readonly<Record<ArtefactKind, readonly [string, string, typeof Magnet]>> = {
  card: ['Cards', 'Cards and the adapters around them', RectangleHorizontal],
  fabric: ['Fabrics', 'Fabric bounds', Network],
  flow: ['Flows', 'Flow routes, their waypoints, and Card ports', Workflow],
  graphic: ['Graphics', 'Authored graphics over the diagram', Shapes],
  point: ['Points', 'Points where Flows enter or leave the diagram', CircleDot],
  region: ['Regions', 'Region boxes and their labels', Frame]
}

/*
 * Six edges and two axes, in the order a Producer reads them: the horizontal three, then the vertical three.
 *
 * Every one of them brings the group onto the anchor, which is the element selected first. The anchor never moves,
 * so pressing the same control twice does nothing the second time - the arrangement is already the one asked for.
 */
const alignControls: readonly (readonly [AlignEdge, string, string, typeof Magnet])[] = [
  ['left', 'Align left', "the anchor's left edge", AlignStartVertical],
  ['centre-x', 'Align centres across', "the anchor's vertical centre line", AlignCenterVertical],
  ['right', 'Align right', "the anchor's right edge", AlignEndVertical],
  ['top', 'Align top', "the anchor's top edge", AlignStartHorizontal],
  ['centre-y', 'Align centres down', "the anchor's horizontal centre line", AlignCenterHorizontal],
  ['bottom', 'Align bottom', "the anchor's bottom edge", AlignEndHorizontal]
]

/* Distribution equalises the gaps and leaves the two outermost elements where they are, so three is the least it
   can be asked of: two elements are already as evenly spaced as two elements can be. */
const distributeControls: readonly (readonly [DistributeAxis, string, string, typeof Magnet])[] = [
  [
    'horizontal',
    'Distribute across',
    'even the horizontal gaps between the held elements',
    AlignHorizontalDistributeCenter
  ],
  ['vertical', 'Distribute down', 'even the vertical gaps between the held elements', AlignVerticalDistributeCenter]
]

function GridSizeControl({ onChange, value }: Readonly<{ onChange?: (gridSize: number) => void; value: number }>) {
  const [draft, setDraft] = useState(String(value))
  useEffect(() => setDraft(String(value)), [value])

  const commit = () => {
    const number = Number(draft)
    const next = Number.isFinite(number) ? Math.max(0, Math.round(number)) : value
    setDraft(String(next))
    if (next !== value) onChange?.(next)
  }

  return (
    <label className="grid-size-control" title="Design grid size — zero disables grid rounding">
      <Grid3x3 aria-hidden="true" size={15} />
      <input
        aria-label="Design grid size"
        disabled={!onChange}
        min="0"
        onBlur={commit}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') commit()
          if (event.key === 'Escape') setDraft(String(value))
        }}
        step="1"
        type="number"
        value={draft}
      />
    </label>
  )
}

/*
 * What the editor turns on, what it can add, and what it can do to the thing in
 * hand.
 *
 * Three groups, divided, because they answer three different questions and a
 * reader looking for one of them should not have to read the other two. The
 * first is about the editor and never changes. The second is about the model
 * and is always available - a card can be added with nothing selected. The
 * third is about the selection and is therefore mostly disabled, which is the
 * honest way round: a control that vanishes teaches nothing about when it would
 * have been there.
 *
 * Above the split rather than at the head of the properties, because none of it
 * is about the selection's properties, and inside a pane that scrolls the one
 * part of the tab that is always relevant scrolled away.
 */
export function EditorTools({
  canRoute,
  canWrap,
  gridSize,
  groupCount = 0,
  onAddWaypoint,
  onAlign,
  onCreateCard,
  onDistribute,
  onGridSizeChange,
  onResetRoute,
  mode,
  layers,
  onToggle,
  onToggleLayer,
  view
}: {
  /** A flow is selected, so its route can be worked on. */
  canRoute?: boolean
  /** A card is selected that could take an adapter, and has not got one. */
  canWrap?: boolean
  gridSize: number
  /** How many held elements a group operation would move. Two can be aligned; three is the least that can be spaced. */
  groupCount?: number
  onAddWaypoint?: () => void
  onAlign?: (edge: AlignEdge) => void
  onCreateCard?: (kind: 'adapter' | 'card') => void
  onDistribute?: (axis: DistributeAxis) => void
  onGridSizeChange?: (gridSize: number) => void
  onResetRoute?: () => void
  /** Which kinds answer interaction. Absent leaves every kind interactive, which is how a session opens. */
  layers?: InteractionLayers
  onToggle: (key: keyof EditorView) => void
  onToggleLayer?: (kind: ArtefactKind) => void
  view: EditorView
  /** Which editor is open. The tab decides it; this only reads it. */
  mode?: EditorMode
}) {
  // The Infoschematic editor's own tools. A scene has no geometry, so none of this
  // applies to it and none of it is rendered while it is open.
  // The Infoschematic editor's own tools. A scene has no geometry, so none of this
  // applies to it and none of it is rendered while the scene editor is open.
  if (mode === 'scenes' || mode === 'stories') {
    return (
      <fieldset className="editor-tools">
        <legend className="sr-only">Scene tools</legend>
        <span className="scene-hint">
          {mode === 'scenes'
            ? 'Click a card or a flow on the Infoschematic to add it to the selected scene.'
            : 'Story Scenes that play a named scene are edited under Scenes.'}
        </span>
      </fieldset>
    )
  }

  return (
    <fieldset className="editor-tools">
      <legend className="sr-only">Editor tools</legend>
      {mode === 'design' ? (
        <>
          <GridSizeControl onChange={onGridSizeChange} value={gridSize} />
          <button
            aria-label="Restore ten-unit Design grid"
            className="tool-button grid-default-button"
            disabled={!onGridSizeChange || gridSize === 10}
            onClick={() => onGridSizeChange?.(10)}
            title="Restore the ordinary ten-unit grid"
            type="button"
          >
            10
          </button>
          <span className="tool-divider" />
          {artefactKinds.map((kind) => {
            const [label, hint, Icon] = layerControls[kind]
            const open = interactionLayerOpen(kind, layers)
            return (
              <button
                aria-label={`${label} interactive`}
                aria-pressed={open}
                className="tool-button layer-button"
                disabled={!onToggleLayer}
                key={kind}
                onClick={() => onToggleLayer?.(kind)}
                title={`${label} — ${open ? `stop ${hint.toLowerCase()} answering selection` : `let ${hint.toLowerCase()} be selected again`}`}
                type="button"
              >
                <Icon aria-hidden="true" size={15} />
              </button>
            )
          })}
          <span className="tool-divider" />
        </>
      ) : null}

      {toggles.map(([key, label, hint, Icon]) => (
        <button
          aria-label={label}
          aria-pressed={view[key]}
          className="tool-button"
          key={key}
          onClick={() => onToggle(key)}
          title={`${label} — ${hint}`}
          type="button"
        >
          <Icon aria-hidden="true" size={15} />
        </button>
      ))}

      {mode === 'design' ? (
        <>
          <span className="tool-divider" />
          {alignControls.map(([edge, label, onto, Icon]) => (
            <button
              aria-label={label}
              className="tool-button"
              disabled={!onAlign || groupCount < 2}
              key={edge}
              onClick={() => onAlign?.(edge)}
              title={
                groupCount < 2
                  ? `${label} — hold a second element with Shift to align a group`
                  : `${label} — bring the other ${groupCount - 1} onto ${onto}`
              }
              type="button"
            >
              <Icon aria-hidden="true" size={15} />
            </button>
          ))}
          {distributeControls.map(([axis, label, hint, Icon]) => (
            <button
              aria-label={label}
              className="tool-button"
              disabled={!onDistribute || groupCount < 3}
              key={axis}
              onClick={() => onDistribute?.(axis)}
              title={
                groupCount < 3
                  ? `${label} — hold three elements with Shift to space a group evenly`
                  : `${label} — ${hint}`
              }
              type="button"
            >
              <Icon aria-hidden="true" size={15} />
            </button>
          ))}
        </>
      ) : null}

      <span className="tool-divider" />

      <button
        aria-label="Add a Card"
        className="tool-button"
        disabled={!onCreateCard}
        onClick={() => onCreateCard?.('card')}
        title="Add a standard card — a default card to name in the properties below"
        type="button"
      >
        <SquarePlus aria-hidden="true" size={15} />
      </button>

      <span className="tool-divider" />

      <button
        aria-label="Add an adapter around the selected card"
        className="tool-button"
        disabled={!canWrap}
        onClick={() => onCreateCard?.('adapter')}
        title={
          canWrap
            ? 'Add an adapter around the selected card'
            : 'Select a card without an adapter — an adapter is drawn around the card it holds, and a card holds one'
        }
        type="button"
      >
        <SquareStack aria-hidden="true" size={15} />
      </button>
      <button
        aria-label="Add a waypoint to the selected flow"
        className="tool-button"
        disabled={!canRoute}
        onClick={() => onAddWaypoint?.()}
        title={
          canRoute ? 'Add a waypoint to the middle of the longest run' : 'Select a flow to add a waypoint to its route'
        }
        type="button"
      >
        <Spline aria-hidden="true" size={15} />
      </button>
      <button
        aria-label="Clear the selected flow's waypoints"
        className="tool-button"
        disabled={!canRoute}
        onClick={() => onResetRoute?.()}
        title={
          canRoute
            ? 'Clear every waypoint and run the line straight between its ports'
            : 'Select a flow to clear its route back to a direct one'
        }
        type="button"
      >
        <Eraser aria-hidden="true" size={15} />
      </button>
    </fieldset>
  )
}
