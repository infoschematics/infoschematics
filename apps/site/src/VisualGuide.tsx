import { renderInfoschematicSvg } from '@infoschematics/render-svg'
import { DocsSidebar } from './DocsSidebar.tsx'
import { componentsPath } from './routes.ts'
import { SiteNav } from './SiteNav.tsx'
import { componentSections } from './visual-guide/curriculum.ts'
import { InteractiveSpecimen } from './visual-guide/InteractiveSpecimen.tsx'
import { anatomySpecimen } from './visual-guide/specimens.ts'
import './styles.css'

export const componentsGuideContents = [
  { depth: 2, slug: 'labelled-example', label: 'A labelled Infoschematic' },
  ...componentSections.map(({ id, title }) => ({ depth: 2 as const, slug: id, label: title })),
  { depth: 2, slug: 'where-next', label: 'Where next' }
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
              Start with one complete Infoschematic, then inspect each part on its own. Every focused example is
              generated from the same serialisable properties used by Canvas and static SVG.
            </p>

            <section aria-labelledby="labelled-example" className="visual-guide__section">
              <h2 id="labelled-example">A labelled Infoschematic</h2>
              <p>
                The Canvas is the background. Regions establish geography, Fabrics sit in the midground, and Cards,
                Flows, Points, and Graphics make up the foreground. In this example the Point is connected, so it acts
                as a real endpoint rather than an unexplained dot.
              </p>
              <div className="visual-guide__anatomy-layout">
                <figure className="visual-guide__anatomy">
                  <img
                    alt="A labelled Infoschematic showing its Canvas, Region, Fabric, Card, Flows, connected Point, and Graphic"
                    src={anatomySource}
                  />
                  <figcaption>All seven visible parts shown together in one deterministic SVG.</figcaption>
                </figure>
                <ol aria-label="Labels for the complete example" className="visual-guide__anatomy-key">
                  {componentSections.map((component, index) => (
                    <li key={component.id}>
                      <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                      <div>
                        <strong>{component.title}</strong>
                        <p>{component.summary}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </section>

            {componentSections.map((component) => (
              <section
                aria-labelledby={component.id}
                className="visual-guide__section visual-guide__component"
                key={component.id}
              >
                <p className="visual-guide__layer">{component.layer}</p>
                <h2 id={component.id}>{component.title}</h2>
                <p>{component.summary}</p>
                <InteractiveSpecimen
                  kind={component.id}
                  propertyKeys={component.propertyKeys}
                  title={`${component.title} properties`}
                />
                {component.id === 'canvas' ? (
                  <p className="visual-guide__property-note">
                    Canvas colour currently comes from a surface preset. Arbitrary Canvas colour and opacity are not yet
                    part of the portable definition; Region fill already supports both.
                  </p>
                ) : null}
                <div className="visual-guide__property-reference">
                  <h3>Property reference</h3>
                  <dl>
                    {component.properties.map((property) => (
                      <div key={property.name}>
                        <dt>
                          <code>{property.name}</code>
                        </dt>
                        <dd>{property.summary}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </section>
            ))}

            <section aria-labelledby="where-next" className="visual-guide__section">
              <h2 id="where-next">Where next</h2>
              <p>
                Continue to <a href="/docs/explanation/">Explanation</a> for Scopes, Scenes, Themes, Stories, Callouts,
                and presentation state. Use <a href="/docs/authoring/">Authoring</a> for complete TypeScript, YAML, and
                JSON examples, or the <a href="/docs/reference/vocabulary/">canonical terminology</a> when you need the
                exact contract language.
              </p>
            </section>
          </article>
        </main>
      </div>
    </div>
  )
}
