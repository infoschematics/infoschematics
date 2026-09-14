import { Eraser, Grid3x3, Magnet, Spline, SquarePlus, SquareStack } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { EditorMode, EditorView } from './use-editor.ts'

const toggles: [keyof EditorView, string, string, typeof Magnet][] = [
  ['snapping', 'Snap to guides', 'Pull a drop onto the nearest edge, centre, or label', Magnet]
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
  onAddWaypoint,
  onCreateCard,
  onGridSizeChange,
  onResetRoute,
  mode,
  onToggle,
  view
}: {
  /** A flow is selected, so its route can be worked on. */
  canRoute?: boolean
  /** A card is selected that could take an adapter, and has not got one. */
  canWrap?: boolean
  gridSize: number
  onAddWaypoint?: () => void
  onCreateCard?: (kind: 'adapter' | 'card') => void
  onGridSizeChange?: (gridSize: number) => void
  onResetRoute?: () => void
  onToggle: (key: keyof EditorView) => void
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
