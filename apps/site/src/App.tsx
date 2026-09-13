import { HomepageGuideDiagram } from './HomepageGuideDiagram.tsx'
import { docsIndexPath } from './routes.ts'
import { SiteNav } from './SiteNav.tsx'
import './styles.css'

export function App() {
  return (
    <main className="page-shell">
      <SiteNav />

      <section className="hero" aria-labelledby="hero-title">
        <div className="hero__copy">
          <div className="hero__headline">
            <p className="eyebrow">A visual instrument for complex systems</p>
            <h1 id="hero-title">
              See how it <span>works together.</span>
            </h1>
          </div>
          <div className="hero__intro">
            <p className="hero__lede">
              An Infoschematic turns a system&rsquo;s architecture and the flows that move through it into one live,
              explorable view &mdash; precise enough for the engineer, clear enough to present to anyone.
            </p>
            <a className="hero__cta" href={docsIndexPath}>
              Getting started <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>

        <div className="shared-preview">
          <HomepageGuideDiagram />
        </div>
      </section>

      <footer className="page-footer">
        <p>infoschematics.info © {__BUILD_DATE__.slice(0, 4)}</p>
        <p>Last updated {__BUILD_DATE__}</p>
      </footer>
    </main>
  )
}
