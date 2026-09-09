import { renderInfoschematicSvg } from '@infoschematics/render-svg'
import { DocsSidebar } from './DocsSidebar.tsx'
import { visualGuidePath } from './routes.ts'
import { SiteNav } from './SiteNav.tsx'
import { treatmentSections, visualArtefacts, visualGroupings } from './visual-guide/curriculum.ts'
import { InteractiveSpecimen } from './visual-guide/InteractiveSpecimen.tsx'
import { anatomySpecimen } from './visual-guide/specimens.ts'
import './styles.css'

const vocabularyHref = (id: string) => `/docs/reference/vocabulary/#${id}`

export function VisualGuide() {
  const anatomySource = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    renderInfoschematicSvg(anatomySpecimen, { annotations: true, visibility: { graphics: 'all' } })
  )}`

  return (
    <div className="document-shell document-shell--wide docs-shell">
      <SiteNav section="docs" />
      <div className="docs-columns">
        <DocsSidebar currentPath={visualGuidePath} />
        <main className="visual-guide" id="document-content">
          <header className="visual-guide__intro">
            <p className="visual-guide__eyebrow">Diagram reference</p>
            <h1>Visual guide</h1>
            <p className="visual-guide__lede">
              Learn what each visible part of an Infoschematic means, how the parts layer together, and which authored
              treatments change their appearance. Every example is generated from the same serialisable definition used
              by the product renderers.
            </p>
            <nav aria-label="Visual guide sections" className="visual-guide__contents">
              <a href="#anatomy">Anatomy</a>
              <a href="#groupings">Groupings</a>
              <a href="#treatments">Treatments</a>
              <a href="#presentation-states">Presentation states</a>
            </nav>
          </header>

          <section aria-labelledby="anatomy" className="visual-guide__section">
            <p className="visual-guide__eyebrow">Start with the whole</p>
            <h2 id="anatomy">Anatomy of an Infoschematic</h2>
            <p>
              An Infoschematic is a layered structural diagram. Regions establish background geography, Fabrics occupy
              the midground, and Cards, Flows, Points, and Graphics form the foreground. Routes and Ports describe how a
              Flow travels; they are geometry, not extra artefact kinds.
            </p>
            <figure className="visual-guide__anatomy">
              <img
                alt="An Infoschematic containing a Region, Fabric, Card, Flow, Point, and Graphic"
                src={anatomySource}
              />
              <figcaption>The six primary artefact kinds in one deterministic SVG output.</figcaption>
            </figure>
            <div className="visual-guide__reference-grid">
              {visualArtefacts.map((artefact) => (
                <article className="visual-guide__reference-card" key={artefact.id}>
                  <p className="visual-guide__layer">{artefact.layer}</p>
                  <h3>
                    <a href={vocabularyHref(artefact.id)}>{artefact.title}</a>
                  </h3>
                  <p>{artefact.summary}</p>
                </article>
              ))}
            </div>
          </section>

          <section aria-labelledby="groupings" className="visual-guide__section">
            <p className="visual-guide__eyebrow">Meaning across artefacts</p>
            <h2 id="groupings">Groupings are not shapes</h2>
            <p>
              Scope, Domain, and Flow Family classify different facts. They may influence colour or visibility, but none
              is another box on the diagram and none substitutes for another.
            </p>
            <div className="visual-guide__reference-grid visual-guide__reference-grid--three">
              {visualGroupings.map((grouping) => (
                <article className="visual-guide__reference-card" key={grouping.id}>
                  <h3>
                    <a href={vocabularyHref(grouping.id)}>{grouping.title}</a>
                  </h3>
                  <p>{grouping.summary}</p>
                </article>
              ))}
            </div>
          </section>

          <section aria-labelledby="treatments" className="visual-guide__section">
            <p className="visual-guide__eyebrow">Authored appearance</p>
            <h2 id="treatments">Treatments</h2>
            <p>
              Treatments are stable presentation intent stored with the definition. They change how the same structure
              is drawn; they do not change what the structure means. Use the controls to compare the available values in
              place.
            </p>
            {treatmentSections.map((section) => (
              <section aria-labelledby={section.id} className="visual-guide__treatment" key={section.id}>
                <h3 id={section.id}>
                  <a href={vocabularyHref(section.termId)}>{section.title}</a>
                </h3>
                <p>{section.summary}</p>
                <InteractiveSpecimen optionKeys={section.optionKeys} title={section.title} />
              </section>
            ))}
          </section>

          <section
            aria-labelledby="presentation-states"
            className="visual-guide__section visual-guide__section--callout"
          >
            <p className="visual-guide__eyebrow">Same structure, different moment</p>
            <h2 id="presentation-states">Presentation states</h2>
            <p>
              <a href={vocabularyHref('scene')}>Scenes</a> can focus existing artefacts and reveal Graphics. Flow
              signalling can briefly emphasise movement. These are presentation states, not authored appearance options:
              the underlying Cards, Regions, and routes remain the same and a still output remains understandable
              without motion.
            </p>
            <p>
              Continue with the <a href="/docs/design/visual-language/">visual-language guide</a> for composition,
              colour, routing, motion, and accessibility principles, or open the <a href="/playground/">Playground</a>
              to edit a complete definition.
            </p>
          </section>
        </main>
      </div>
    </div>
  )
}
