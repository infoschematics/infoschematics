import { standardFabricKeys, standardGraphicKeys } from '@infoschematics/view-canvas'
import type { ReactNode } from 'react'
import { DocsSidebar } from './DocsSidebar.tsx'
import { GuideJourneyNav } from './GuideJourneyNav.tsx'
import { type ComponentRoute, componentPaths, componentRoutes, componentsPath } from './routes.ts'
import { SiteNav } from './SiteNav.tsx'
import { componentSections } from './visual-guide/curriculum.ts'
import { InteractiveSpecimen } from './visual-guide/InteractiveSpecimen.tsx'
import './styles.css'

/* The catalogue's own key lists drive this, so a treatment added to the product appears here without an edit. */
const treatmentComparisons = (id: string) =>
  id === 'fabric'
    ? standardFabricKeys.map((key) => ({ id: key, label: treatmentLabel(key), treatment: key }))
    : id === 'graphic'
      ? standardGraphicKeys.map((key) => ({ id: key, label: treatmentLabel(key), treatment: key }))
      : undefined

const treatmentLabel = (key: string) => key.replace(/-/g, ' ').replace(/^./, (first) => first.toUpperCase())

const futureRoute = {
  path: componentPaths.future,
  title: 'Future',
  summary: 'Notation under consideration.',
  section: 'components' as const
}

function Shell({
  children,
  currentPath,
  outline = []
}: {
  children: ReactNode
  currentPath: string
  outline?: readonly { depth: 2 | 3; slug: string; label: string }[]
}) {
  return (
    <div className="document-shell document-shell--wide docs-shell">
      <a className="skip-link" href="#document-content">
        Skip to content
      </a>
      <SiteNav section="docs" />
      <div className="docs-columns">
        <DocsSidebar currentPageOutline={outline} currentPath={currentPath} />
        <main id="document-content">
          {children}
          <GuideJourneyNav currentPath={currentPath} />
        </main>
      </div>
    </div>
  )
}

export function ComponentsHub() {
  return (
    <Shell currentPath={componentsPath}>
      <article aria-label="Components" className="document-content">
        <h1>Components</h1>
        <p>
          Infoschematics combine a Canvas, named Regions, connectable Fabrics, Cards, Flows, Points, and placed
          Graphics. Explore each component on its own.
        </p>
        <div className="component-catalogue">
          {componentRoutes.slice(1).map((route) => {
            const component = componentSections.find(({ id }) => id === route.componentId)
            return (
              <a className="component-catalogue__item" href={route.path} key={route.path}>
                <strong>{route.title}</strong>
                <span>{component?.summary ?? route.summary}</span>
              </a>
            )
          })}
        </div>
      </article>
    </Shell>
  )
}

function FuturePage() {
  return (
    <Shell currentPath={futureRoute.path}>
      <article aria-label="Future notation" className="document-content">
        <h1>Future notation</h1>
        <p>These ideas need a portable model and renderer parity before becoming public controls.</p>
        <ul>
          <li>Orthogonal Canvas grid patterns: Squares or Dots, each with Major or Major + minor intervals.</li>
          <li>Semantic Point roles such as start, end, junction, anchor, and off-page.</li>
          <li>Decision and stacked Card variants, plus richer endpoint markers and cardinality.</li>
          <li>Authored visual themes distinct from Scene and Callout themes.</li>
        </ul>
      </article>
    </Shell>
  )
}

export function VisualGuide({ route }: { route?: ComponentRoute }) {
  if (!route || route.path === componentsPath) return <ComponentsHub />
  if (route.path === futureRoute.path) return <FuturePage />
  const component = componentSections.find(({ id }) => id === route.componentId)
  if (!component) return <ComponentsHub />
  return (
    <Shell
      currentPath={route.path}
      outline={[
        { depth: 2, slug: `${component.id}-example`, label: 'Example' },
        { depth: 2, slug: `${component.id}-properties`, label: 'Properties' }
      ]}
    >
      <article aria-label={component.title} className="document-content">
        <p className="visual-guide__layer">{component.layer}</p>
        <h1>{component.title}</h1>
        <p>{component.summary}</p>
        {component.id === 'canvas' && (
          <p>
            Today the Grid offers four values: none, major lines, major plus minor lines, or major dots. A future
            Pattern × Intervals model will make squares and dots consistent without changing grid geometry.
          </p>
        )}
        {component.id === 'region' && (
          <p>
            Fill opacity and frame opacity are independent. Border colour and width are renderer tokens today, not
            authored Region properties.
          </p>
        )}
        {component.id === 'fabric' && (
          <p>
            Ports are numbered attachment positions. Naming a <code>renderer</code> picks a treatment: the product
            offers {standardFabricKeys.length} standard ones, drawn the same way here and by{' '}
            <code>infoschematics render</code>, and a host registering its own under the same key takes over from the
            catalogue. A key nothing answers draws the generic plane.
          </p>
        )}
        {component.id === 'card' && (
          <p>Standard and Adapter Cards are supported today. Decision and stacked Cards remain future notation.</p>
        )}
        {component.id === 'point' && (
          <p>
            A Point is a coordinate artefact in its own right. It is positioned rather than boxed, carries ports of its
            own so several Flows may meet it, and is editable in Design: selected, dragged, nudged by key, or given an
            exact coordinate. It is authored in source or seeded from the Library like any other artefact. Its{' '}
            <code>label</code> is required, and both renderers draw it beside the mark on a side no Flow leaves by.
            Start, end, junction, anchor, and hidden are future role semantics.
          </p>
        )}
        {component.id === 'graphic' && (
          <p>
            Authored data names a renderer and passes serialisable properties. The product offers{' '}
            {standardGraphicKeys.length} standard treatments; a host supplies any other by registering its own under the
            key the document names.
          </p>
        )}
        <section aria-labelledby={`${component.id}-example`} className="component-page__section">
          <h2 id={`${component.id}-example`}>Example</h2>
          <InteractiveSpecimen
            comparisons={
              component.id === 'card'
                ? [
                    { id: 'standard', label: 'Standard', propertyKey: 'card.variant', value: 'standard' },
                    { id: 'adapter', label: 'Adapter', propertyKey: 'card.variant', value: 'adapter' }
                  ]
                : treatmentComparisons(component.id)
            }
            kind={component.id}
            propertyKeys={component.propertyKeys}
            title={`${component.title} properties`}
          />
        </section>
        <section aria-labelledby={`${component.id}-properties`} className="component-page__section">
          <h2 id={`${component.id}-properties`}>Properties</h2>
          <p>Open the reference for the portable fields represented by this component.</p>
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
      </article>
    </Shell>
  )
}

export { futureRoute }
