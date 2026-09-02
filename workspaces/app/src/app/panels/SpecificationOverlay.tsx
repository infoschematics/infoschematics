import { X } from 'lucide-react'
import { lazy, Suspense } from 'react'

/*
 * A published specification, rendered to be read.
 *
 * The link this replaces opened the raw JSON in a new tab, which is honest but
 * asks a visitor to parse OpenAPI by eye at a trade stand. Scalar renders the
 * same document as documentation, and the document is still one click away
 * underneath for anyone who wants it.
 *
 * Loaded only when a specification is opened. The renderer is far larger than
 * the rest of the dashboard put together, and most visitors never open one, so
 * it must not sit in the bundle they wait for.
 */
const ApiReference = lazy(async () => {
  // Its stylesheet comes with it rather than sitting in the entry bundle, so a
  // visitor who never opens a specification never fetches either.
  await import('@scalar/api-reference-react/style.css')
  const module = await import('@scalar/api-reference-react')
  return { default: module.ApiReferenceReact }
})

export function SpecificationOverlay({
  href,
  name,
  onClose
}: {
  /** The published document, served from the contract pack beside the dashboard. */
  href: string
  name: string
  onClose: () => void
}) {
  return (
    <div className="specification-overlay">
      <button aria-label="Close" className="shortcut-scrim" onClick={onClose} type="button" />
      <div className="specification-card">
        <header className="specification-head">
          <h2>{name}</h2>
          <div className="specification-head-actions">
            <a href={href} rel="noreferrer" target="_blank">
              Raw document
            </a>
            <button aria-label="Close" className="icon-button" onClick={onClose} type="button">
              <X aria-hidden="true" size={14} />
            </button>
          </div>
        </header>
        <div className="specification-frame">
          <Suspense fallback={<p className="contract-empty">Loading the renderer…</p>}>
            <ApiReference configuration={{ hideClientButton: true, layout: 'classic', url: href }} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
