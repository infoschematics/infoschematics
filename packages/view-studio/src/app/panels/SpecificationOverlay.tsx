import { X } from 'lucide-react'
import { lazy, Suspense } from 'react'

/* A host-published specification rendered as readable documentation on demand. */
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
  /** The published document supplied by the host's contract pack. */
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
