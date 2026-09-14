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
  { depth: 2, slug: 'future-notation', label: 'Future notation' },
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
              <figure className="visual-guide__anatomy">
                <img
                  alt="A labelled Infoschematic showing its Canvas, Region, Fabric, Card, Flows, connected Point, and Graphic"
                  src={anatomySource}
                />
                <figcaption>All seven visible parts shown together in one deterministic SVG.</figcaption>
              </figure>
              <ul aria-label="Labels for the complete example" className="visual-guide__anatomy-key">
                {componentSections.map((component) => (
                  <li key={component.id}>
                    <strong>{component.title}</strong>
                    <p>{component.summary}</p>
                  </li>
                ))}
              </ul>
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
                {component.id === 'fabric' ? (
                  <>
                    <p>
                      A <strong>Port</strong> is a numbered attachment position on the north, east, south, or west side
                      of a Card, Fabric, or Point. Port counts describe the available positions; a Flow names the
                      particular source and target Ports it uses.
                    </p>
                    <p>
                      The portable static renderer keeps Fabrics visually neutral. Named renderers—such as an Internet
                      Fabric with a dotted field—need a portable fallback before this guide can offer them as presets.
                    </p>
                  </>
                ) : null}
                {component.id === 'canvas' ? (
                  <p>
                    Surface selects the neutral default or the blueprint preset. A custom colour and opacity override is
                    not yet part of the portable definition, so the controls do not invent one locally.
                  </p>
                ) : null}
                {component.id === 'card' ? (
                  <p>
                    Standard and Adapter Cards are supported today. An Adapter Card names the Standard Card it{' '}
                    <code>wraps</code>, so its derived position stays attached. Decision and stacked Cards are future
                    notation, not hidden Card types.
                  </p>
                ) : null}
                {component.id === 'graphic' ? (
                  <p>
                    The dashed box is the deterministic static-SVG fallback. Authored data does not contain free-form
                    SVG: it names a renderer and passes serialisable properties, while the host supplies the actual
                    React or SVG implementation for Canvas.
                  </p>
                ) : null}
                <InteractiveSpecimen
                  kind={component.id}
                  propertyKeys={component.propertyKeys}
                  title={`${component.title} properties`}
                />
                <details className="visual-guide__property-reference">
                  <summary>
                    Property reference <span>{component.properties.length} groups</span>
                  </summary>
                  <div className="visual-guide__property-table">
                    <table>
                      <thead>
                        <tr>
                          <th scope="col">Property</th>
                          <th scope="col">What it controls</th>
                        </tr>
                      </thead>
                      <tbody>
                        {component.properties.map((property) => (
                          <tr key={property.name}>
                            <th scope="row">
                              <code>{property.name}</code>
                            </th>
                            <td>{property.summary}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              </section>
            ))}

            <section aria-labelledby="future-notation" className="visual-guide__section">
              <h2 id="future-notation">Future notation</h2>
              <p>
                This page only offers controls the portable definition and current renderers support. The following
                ideas are useful directions, but need model semantics and renderer parity before they can become public
                API:
              </p>
              <ul>
                <li>
                  an arbitrary Canvas colour and opacity override beyond the current neutral and blueprint surfaces;
                </li>
                <li>named Fabric renderers such as Internet with portable static fallbacks;</li>
                <li>Decision and stacked Card variants in addition to Standard and Adapter Cards;</li>
                <li>semantic start, finish, junction, and off-page Point roles;</li>
                <li>Flow endpoint markers, cardinality, and a coherent data-flow-diagram vocabulary.</li>
              </ul>
              <p>
                The existing <strong>Theme</strong> concept groups related Scenes; it is not a colour theme. Any visual
                theme or inherited surface contract needs a distinct name and an explicit model boundary.
              </p>
            </section>

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
