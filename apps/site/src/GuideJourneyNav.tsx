import { useEffect } from 'react'
import { getGuideJourneyNeighbours } from './routes.ts'

/*
 * Arrow keys move along the journey, so a reader walks the guide without returning to the foot of each page. The site
 * loads each page in full — there is no client router — so the accelerator does what the link does and assigns the
 * location. It stands aside for a modifier chord, for a handled key, and for anything being typed or adjusted: the
 * component pages are full of range controls a left or right arrow belongs to.
 */
const acceleratorDirection = (event: KeyboardEvent) => {
  if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return undefined
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return undefined
  const target = event.target
  if (target instanceof HTMLElement) {
    if (target.isContentEditable) return undefined
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName)) return undefined
  }
  return event.key === 'ArrowLeft' ? 'previous' : 'next'
}

const followLink = (path: string) => {
  window.location.href = path
}

export function GuideJourneyNav({
  currentPath,
  navigate = followLink
}: {
  currentPath: string
  navigate?: (path: string) => void
}) {
  const { previous, next } = getGuideJourneyNeighbours(currentPath)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const direction = acceleratorDirection(event)
      const destination = direction === 'previous' ? previous : direction === 'next' ? next : undefined
      if (!destination) return
      event.preventDefault()
      navigate(destination.path)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [navigate, next, previous])

  if (!previous && !next) return null

  return (
    <nav aria-label="Guide journey" className="guide-journey">
      <p>
        Continue the guide{' '}
        <span className="guide-journey__accelerators">
          or press <kbd>←</kbd> <kbd>→</kbd>
        </span>
      </p>
      <div className="guide-journey__links">
        {previous ? (
          <a className="guide-journey__link guide-journey__link--previous" href={previous.path} rel="prev">
            <span aria-hidden="true">←</span>
            <span>
              <small>Previous</small>
              <strong>{previous.title}</strong>
              <em>{previous.summary}</em>
            </span>
          </a>
        ) : null}
        {next ? (
          <a className="guide-journey__link guide-journey__link--next" href={next.path} rel="next">
            <span>
              <small>Next</small>
              <strong>{next.title}</strong>
              <em>{next.summary}</em>
            </span>
            <span aria-hidden="true">→</span>
          </a>
        ) : null}
      </div>
    </nav>
  )
}
