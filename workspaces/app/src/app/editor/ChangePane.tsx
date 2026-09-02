import { Copy, Redo2, Trash2, Undo2, X } from 'lucide-react'
import type { PendingChange, PendingOrigin } from './use-editor.ts'
// What the editor has to say back, in the panel's lower half where live evidence
// sits otherwise. Applying a change stays a deliberate step: the model is
// authored TypeScript under review, not a store the editor writes.
export function ChangePane({
  count,
  canRedo,
  canUndo,
  hovered,
  onDiscard,
  onDiscardOne,
  onHover,
  onRedo,
  onSelect,
  onUndo,
  pending,
  source
}: {
  count: number
  canRedo: boolean
  canUndo: boolean
  /** What the pointer is over on the stage, so its changes light up here. */
  hovered: string | null
  onDiscard: () => void
  onDiscardOne: (origin: PendingOrigin) => void
  onHover: (code: string | null) => void
  onRedo: () => void
  onSelect: (code: string) => void
  onUndo: () => void
  pending: readonly PendingChange[]
  source: string
}) {
  return (
    <section className="change-panel">
      <div className="compact-heading">
        <div>
          <p className="eyebrow">CHANGES</p>
        </div>
      </div>
      {/* One toolbar rather than controls at both ends: undo and redo act on the
          same list that Copy and Discard act on, so they belong together. */}
      <fieldset className="editor-tools change-tools">
        <legend className="sr-only">Change controls</legend>
        <button
          aria-label="Undo"
          className="tool-button"
          disabled={!canUndo}
          onClick={onUndo}
          title="Undo"
          type="button"
        >
          <Undo2 aria-hidden="true" size={15} />
        </button>
        <button
          aria-label="Redo"
          className="tool-button"
          disabled={!canRedo}
          onClick={onRedo}
          title="Redo"
          type="button"
        >
          <Redo2 aria-hidden="true" size={15} />
        </button>
        <button
          aria-label="Copy every change"
          className="tool-button"
          disabled={count === 0}
          onClick={() => void navigator.clipboard?.writeText(source)}
          title="Copy every change"
          type="button"
        >
          <Copy aria-hidden="true" size={15} />
        </button>
        <button
          aria-label="Discard every change"
          className="tool-button"
          disabled={count === 0}
          onClick={onDiscard}
          title="Discard every change"
          type="button"
        >
          <Trash2 aria-hidden="true" size={15} />
        </button>
      </fieldset>
      {count > 0 ? (
        <>
          <p className="contract-meta">
            {count} change{count === 1 ? '' : 's'}
          </p>
          <ul className="change-list">
            {/* A change and the thing it describes point at each other: hovering
                either lights both, and picking a change selects what it is
                about, so a list of forty lines stays readable against the
                stage. The row is a button rather than a clickable li - it is
                one, and the keyboard should reach it. */}
            {/* A removal is not a property set to a value, and a reader
                scanning forty lines of `code -> field: value,` will skim past
                one that is not. A creation is the same case the other way up:
                a whole entry to add rather than a property to change. */}
            {pending.map((change) => (
              <li
                className={`${change.key === hovered ? 'highlighted' : ''}${change.field === 'remove' ? ' removing' : ''}${change.field === 'create' ? ' creating' : ''}`}
                key={`${change.key}|${change.field}`}
              >
                <button
                  className="change-pick"
                  onClick={() => onSelect(change.key)}
                  onFocus={() => onHover(change.key)}
                  onBlur={() => onHover(null)}
                  onPointerEnter={() => onHover(change.key)}
                  onPointerLeave={() => onHover(null)}
                  title={`Select ${change.key}`}
                  type="button"
                >
                  <code>{change.source}</code>
                </button>
                {change.origin ? (
                  <button
                    aria-label={`Drop ${change.source}`}
                    className="change-drop"
                    onClick={() => onDiscardOne(change.origin as PendingOrigin)}
                    title="Drop this change"
                    type="button"
                  >
                    <X aria-hidden="true" size={12} />
                  </button>
                ) : (
                  // A carried route follows from the move that caused it, so it
                  // goes when that goes rather than on its own.
                  <span className="change-carried" title="Follows from a move above">
                    ↳
                  </span>
                )}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="contract-empty">Drag a flow label to place it, or select a component to change its ports.</p>
      )}
    </section>
  )
}
