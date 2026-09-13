import { renderInfoschematicSvg } from '@infoschematics/render-svg'
import { DocsSidebar } from './DocsSidebar.tsx'
import { componentsPath } from './routes.ts'
import { SiteNav } from './SiteNav.tsx'
import { presentationConcepts, treatmentSections, visualArtefacts, visualGroupings } from './visual-guide/curriculum.ts'
import { InteractiveSpecimen } from './visual-guide/InteractiveSpecimen.tsx'
import { anatomySpecimen } from './visual-guide/specimens.ts'
import './styles.css'

export const componentsGuideContents = [
  { depth: 2, slug: 'anatomy', label: 'Anatomy of an Infoschematic' },
  { depth: 2, slug: 'groupings', label: 'Groupings' },
  { depth: 2, slug: 'treatments', label: 'Treatments' },
  { depth: 3, slug: 'canvas-treatments', label: 'Canvas treatments' },
  { depth: 3, slug: 'region-treatments', label: 'Region treatments' },
  { depth: 3, slug: 'card-treatments', label: 'Card treatments' },
  { depth: 2, slug: 'explanation', label: 'Explanation and presentation' },
  { depth: 2, slug: 'presentation-states', label: 'Presentation states' }
] as const

export function VisualGuide() {
  const anatomySource = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    renderInfoschematicSvg(anatomySpecimen, { annotations: true, visibility: { graphics: 'all' } })
  )}`

  return (
    <div className="document-shell document-shell--wide docs-shell">
      <a className="skip-link" href="#document-content">
        Skip to content
      </a>
      <SiteNav section="docs" />
      <div className="docs-columns">
        <DocsSidebar currentPageOutline={componentsGuideContents} currentPath={componentsPath} />
        <main id="document-content">
          <article aria-label="Components" className="document-content">
            <h1>Components</h1>
            <p>
              Learn what each visible part of an Infoschematic means, how the parts layer together, and which authored
              treatments change their appearance. Every example is generated from the same serialisable definition used
              by each renderer.
            </p>

            <section aria-labelledby="anatomy" className="visual-guide__section">
              <h2 id="anatomy">Anatomy of an Infoschematic</h2>
              <p>
                An Infoschematic is a layered structural diagram. Regions establish background geography, Fabrics occupy
                the midground, and Cards, Flows, Points, and Graphics form the foreground. Routes and Ports describe how
                a Flow travels; they are geometry, not extra artefact kinds.
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
                    <h3>{artefact.title}</h3>
                    <p>{artefact.summary}</p>
                  </article>
                ))}
              </div>
            </section>

            <section aria-labelledby="groupings" className="visual-guide__section">
              <h2 id="groupings">Groupings</h2>
              <p>
                Scope, Domain, and Flow Family classify different facts. They may influence colour or visibility, but
                none is another box on the diagram and none substitutes for another.
              </p>
              <div className="visual-guide__reference-grid visual-guide__reference-grid--three">
                {visualGroupings.map((grouping) => (
                  <article className="visual-guide__reference-card" key={grouping.id}>
                    <h3>{grouping.title}</h3>
                    <p>{grouping.summary}</p>
                  </article>
                ))}
              </div>
            </section>

            <section aria-labelledby="treatments" className="visual-guide__section">
              <h2 id="treatments">Treatments</h2>
              <p>
                Treatments are stable presentation intent stored with the definition. They change how the same structure
                is drawn; they do not change what the structure means. Use the controls to compare the available values
                in place.
              </p>
              {treatmentSections.map((section) => (
                <section aria-labelledby={section.id} className="visual-guide__treatment" key={section.id}>
                  <h3 id={section.id}>{section.title}</h3>
                  <p>{section.summary}</p>
                  <InteractiveSpecimen optionKeys={section.optionKeys} title={section.title} />
                </section>
              ))}
            </section>

            <section aria-labelledby="explanation" className="visual-guide__section">
              <h2 id="explanation">Explanation and presentation</h2>
              <p>
                These concepts tailor one stable diagram to a subject, audience, or guided explanation. They change
                visibility and emphasis without changing the underlying geometry.
              </p>
              <div className="visual-guide__reference-grid">
                {presentationConcepts.map((concept) => (
                  <article className="visual-guide__reference-card" key={concept.id}>
                    <h3>{concept.title}</h3>
                    <p>{concept.summary}</p>
                  </article>
                ))}
              </div>
            </section>

            <section aria-labelledby="presentation-states" className="visual-guide__section">
              <h2 id="presentation-states">Presentation states</h2>
              <p>
                Scenes can focus existing artefacts and reveal Graphics. Flow signalling can briefly emphasise movement.
                These are presentation states, not authored appearance options: the underlying Cards, Regions, and
                routes remain the same and a still output remains understandable without motion.
              </p>
              <p>
                Continue with the <a href="/docs/approach/visual-language/">visual-language approach</a> for
                composition, colour, routing, motion, and accessibility principles, or open the{' '}
                <a href="/playground/">Playground</a> to edit a complete definition. When you need exact contract
                language, use the <a href="/docs/reference/vocabulary/">canonical terminology</a>.
              </p>
            </section>
          </article>
        </main>
      </div>
    </div>
  )
}
