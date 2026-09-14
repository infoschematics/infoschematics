import { getGuideJourneyNeighbours } from './routes.ts'

export function GuideJourneyNav({ currentPath }: { currentPath: string }) {
  const { previous, next } = getGuideJourneyNeighbours(currentPath)

  if (!previous && !next) return null

  return (
    <nav aria-label="Guide journey" className="guide-journey">
      <p>Continue the guide</p>
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
