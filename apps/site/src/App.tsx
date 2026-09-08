import { systemExample } from '@infoschematics/is-system'
import { renderInfoschematicSvg } from '@infoschematics/render-svg'
import { SiteNav } from './SiteNav.tsx'
import './styles.css'

const sharedPreviewSource = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  renderInfoschematicSvg(systemExample, { annotations: true })
)}`

export function App() {
  return (
    <main className="page-shell">
      <SiteNav />

      <section className="hero" aria-labelledby="hero-title">
        <div className="hero__copy">
          <div className="hero__headline">
            <p className="eyebrow">A visual instrument for complex systems</p>
            <h1 id="hero-title">
              See how it <span>fits together.</span>
            </h1>
          </div>
          <p className="hero__lede">
            Infoschematic turns architecture, movement and meaning into one calm, explorable view. The full experience
            is being assembled.
          </p>
        </div>

        <div className="shared-preview">
          <img
            alt={`${systemExample.title} rendered through shared SVG output`}
            className="shared-preview__image"
            src={sharedPreviewSource}
          />
          <p className="shared-preview__caption">Same serialisable definition as the hosted interactive example</p>
        </div>
      </section>

      <footer className="page-footer">
        <p>infoschematics.info © {__BUILD_DATE__.slice(0, 4)}</p>
        <p>Last updated {__BUILD_DATE__}</p>
      </footer>
    </main>
  )
}
