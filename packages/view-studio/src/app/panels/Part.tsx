import { ChevronDown, ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'

/*
 * A part of a panel that folds.
 *
 * Useful in narrow panels where a large register or property set would
 * otherwise hide the section a reader needs.
 *
 * The whole heading is the control rather than a chevron beside one. A part is
 * a thing a reader aims at, not a target they have to find.
 *
 * `count` is what is inside a part you have shut, which is the one thing worth
 * saying about it while it is closed. A properties set has no count worth
 * giving - three rows is not news - so it goes without.
 */
export function Part({
  children,
  count,
  note,
  onToggle,
  open,
  title
}: {
  children: ReactNode
  count?: number
  note?: string
  onToggle: () => void
  open: boolean
  title: string
}) {
  return (
    <section className="register-part-section">
      <button aria-expanded={open} className="register-part" onClick={onToggle} type="button">
        {open ? <ChevronDown aria-hidden="true" size={13} /> : <ChevronRight aria-hidden="true" size={13} />}
        <span>{title}</span>
        {count === undefined ? null : <em>{count}</em>}
      </button>
      {open ? (
        <>
          {note ? <p className="register-note">{note}</p> : null}
          {children}
        </>
      ) : null}
    </section>
  )
}
