import { useState } from 'react'
import { systemExample } from '@infoschematics/is-system'
import { renderInfoschematicSvg } from '@infoschematics/render-svg'
import './styles.css'

const sharedPreviewSource = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  renderInfoschematicSvg(systemExample, { annotations: true }),
)}`

const stages = [
  {
    code: 'OBS-01',
    step: 'Observe',
    title: 'Signals',
    detail: 'Facts, events and relationships',
    tone: 'metadata'
  },
  {
    code: 'MAP-02',
    step: 'Arrange',
    title: 'Structure',
    detail: 'Systems, boundaries and flow',
    tone: 'media'
  },
  {
    code: 'LIT-03',
    step: 'Illuminate',
    title: 'Meaning',
    detail: 'Stories, scenes and evidence',
    tone: 'registration'
  },
  {
    code: 'SEE-04',
    step: 'Understand',
    title: 'Shared view',
    detail: 'Complexity made legible',
    tone: 'control'
  }
] as const

const connectorLabels = ['select', 'connect', 'reveal'] as const

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
function FlowConnector({ label, signalKey }: { label: string; signalKey: number }) {
  return (
    <div aria-hidden="true" className="flow-connector">
      <span className="flow-connector__label">{label}</span>
      <span className="flow-connector__rail" />
      <span className="flow-connector__line" />
      <span className="flow-connector__arrow" />
      <span className="flow-connector__pulse" key={signalKey} />
    </div>
  )
}

export function App() {
  const [signalKey, setSignalKey] = useState(0)

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

          <button className="signal-button" onClick={() => setSignalKey((current) => current + 1)} type="button">
            <span aria-hidden="true" className="signal-button__icon">
              ↗
            </span>
            Trace the idea
          </button>
          <span className="sr-only" aria-live="polite">
            {signalKey > 0 ? `Signal traced ${signalKey} ${signalKey === 1 ? 'time' : 'times'}.` : ''}
          </span>
        </div>

        <section aria-label="Homepage treatment comparison" className="comparison-lane">
          <article className="comparison-treatment" data-treatment="bespoke">
            <header className="comparison-treatment__header">
              <p className="eyebrow">Bespoke homepage treatment</p>
              <p>Editorial composition for the front door</p>
            </header>

            <section className="instrument" aria-label="The infoschematic process">
              <div className="instrument__header">
                <div>
                  <p className="eyebrow">Front of house / preview</p>
                  <h2>A system, explained</h2>
                </div>
                <p className="instrument__readout">
                  <span>4 components</span>
                  <span>3 connections</span>
                </p>
              </div>

              <div className="stage">
                <fieldset aria-hidden="true" className="stage__lane">
                  <legend>Infoschematic</legend>
                </fieldset>
                <div aria-hidden="true" className="stage__ambient stage__ambient--left" />
                <div aria-hidden="true" className="stage__ambient stage__ambient--right" />
                <p className="stage__axis stage__axis--input">Information</p>
                <p className="stage__axis stage__axis--output">Understanding</p>

                <div className="flow-map">
                  {stages.map((stage, index) => (
                    <div className="flow-map__segment" key={stage.code}>
                      <article className="system-card" data-tone={stage.tone}>
                        <span className="system-card__tag">{stage.code}</span>
                        <p>{stage.step}</p>
                        <h3>{stage.title}</h3>
                        <small>{stage.detail}</small>
                      </article>
                      {index < connectorLabels.length ? (
                        <FlowConnector label={connectorLabels[index]} signalKey={signalKey} />
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>

              <div className="instrument__footer">
                <p>
                  <span className="legend-line" />
                  One idea, routed end to end
                </p>
                <p className="instrument__mode">Release / holding page 01</p>
              </div>
            </section>
          </article>

          <article className="comparison-treatment" data-treatment="shared-renderer">
            <header className="comparison-treatment__header">
              <p className="eyebrow">Shared renderer treatment</p>
              <p>One authored example through framework-neutral SVG</p>
            </header>

            <div className="shared-preview">
              <img
                alt={`${systemExample.title} rendered through shared SVG output`}
                className="shared-preview__image"
                src={sharedPreviewSource}
              />
              <p className="shared-preview__caption">
                Same serialisable definition as the hosted interactive example
              </p>
            </div>
          </article>
        </section>
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
