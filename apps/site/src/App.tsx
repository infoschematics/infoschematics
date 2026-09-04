import { systemExample } from '@infoschematics/is-system'
import { renderInfoschematicSvg } from '@infoschematics/render-svg'
import './styles.css'

const sharedPreviewSource = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  renderInfoschematicSvg(systemExample, { annotations: true })
)}`

function BrandMark() {
  return (
    <svg aria-hidden="true" className="brand-mark" viewBox="0 0 52 32">
      <path className="brand-mark__rail" d="M9 16h34" />
      <path className="brand-mark__signal" d="M9 16h34" />
      <circle className="brand-mark__node brand-mark__node--first" cx="9" cy="16" r="6" />
      <circle className="brand-mark__node brand-mark__node--last" cx="43" cy="16" r="6" />
    </svg>
  )
}

export function App() {
  return (
    <main className="page-shell">
      <header className="title-bar">
        <a aria-label="Infoschematic home" className="wordmark" href="/">
          <BrandMark />
          <span>infoschematic</span>
        </a>
      </header>

      <section className="hero" aria-labelledby="hero-title">
        <div className="hero__copy">
          <p className="eyebrow">A visual instrument for complex systems</p>
          <h1 id="hero-title">
            See how it <span>fits together.</span>
          </h1>
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
        <p>infoschematics.info</p>
        <p className="page-footer__links">
          <a className="page-footer__link" href="/examples/infoschematics/">
            Infoschematics · Hosted example
          </a>
          <a className="page-footer__link" href="/examples/system/">
            A system, explained · Hosted example
          </a>
          <a className="page-footer__link" href="/examples/blank/">
            Blank Infoschematic · Empty canvas
          </a>
          <a className="page-footer__link" href="/guides/authoring/">
            Authoring guide
          </a>
          <a className="page-footer__link" href="/reference/vocabulary/">
            Vocabulary
          </a>
        </p>
        <p>
          <span aria-hidden="true">●</span> A new way to explain what systems are and what moves through them.
        </p>
      </footer>
    </main>
  )
}
