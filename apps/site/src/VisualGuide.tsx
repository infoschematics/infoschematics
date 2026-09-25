import { standardFabricKeys, standardGraphicKeys } from '@infoschematics/view-canvas'
import type { CSSProperties, ReactNode } from 'react'
import { DocsSidebar } from './DocsSidebar.tsx'
import { GuideJourneyNav } from './GuideJourneyNav.tsx'
import { type ComponentRoute, componentPaths, componentRoutes, componentsPath } from './routes.ts'
import { SiteNav } from './SiteNav.tsx'
import { StaticInfoschematic } from './StaticInfoschematic.tsx'
import { componentSections, type SpecimenKind } from './visual-guide/curriculum.ts'
import { DynamicsSpecimen } from './visual-guide/DynamicsSpecimen.tsx'
import { dynamicsSpecimen } from './visual-guide/dynamics.ts'
import { InteractiveSpecimen } from './visual-guide/InteractiveSpecimen.tsx'
import { schemeSpecimen, specimenFor } from './visual-guide/specimens.ts'
import './styles.css'

/* The catalogue's own key lists drive this, so a treatment added to the product appears here without an edit. */
const treatmentComparisons = (id: string) =>
  id === 'fabric'
    ? standardFabricKeys.map((key) => ({ id: key, label: treatmentLabel(key), treatment: key }))
    : id === 'graphic'
      ? standardGraphicKeys.map((key) => ({ id: key, label: treatmentLabel(key), treatment: key }))
      : undefined

const treatmentLabel = (key: string) => key.replace(/-/g, ' ').replace(/^./, (first) => first.toUpperCase())

/*
 * A tour aside is the product's own static rendering of the same specimen the component's page opens with, drawn once
 * per component and reused, so the hub shows each component rather than a picture kept in step by hand.
 */
const previewOptions = { annotations: { flows: true }, visibility: { graphics: 'all' } } as const

const previewSpecimen = (componentId: SpecimenKind | 'dynamics') =>
  componentId === 'dynamics' ? dynamicsSpecimen : specimenFor(componentId)

/*
 * The palette, drawn rather than tabulated.
 *
 * A swatch grid says which colours exist; it cannot say whether the light scheme is readable or only light, which is
 * the claim a reviewer has to settle by looking. Three renderings of one definition say it: two resolved, so the
 * palettes can be compared side by side, and one that defers, so the page shows what a reader actually gets.
 */
/**
 * The chrome roles a reader can see the effect of, rather than all thirty-six.
 *
 * A full dump would be a token table with extra steps. These are the ones that carry the structure of an interface —
 * the planes it is built from, the lines between them, the four levels of type, the accent and the three states — so
 * a reader can see what a scheme change actually does before deciding they want one.
 */
const chromeRoles = [
  'page',
  'surface',
  'surface-raised',
  'surface-sunken',
  'border',
  'border-strong',
  'text',
  'text-secondary',
  'text-muted',
  'text-faint',
  'accent',
  'text-on-accent',
  'positive',
  'caution',
  'negative'
] as const

const modeDrawings = [
  { id: 'light', label: 'Light', options: { mode: 'light' } },
  { id: 'dark', label: 'Dark', options: { mode: 'dark' } },
  { id: 'system', label: 'Follows your preference', options: { mode: 'system' } }
] as const

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
          An Infoschematic is drawn back to front. The Canvas and its Regions set the ground, Fabrics lay connectable
          planes across it, and Cards, Flows, Points, and Graphics sit on top of both. Dynamics name a change to any of
          them rather than drawing anything of their own.
        </p>
        <p>
          Each component below has its own page with a live example and its property reference. Read them in order from
          the Canvas, or go straight to the one you need.
        </p>
        <ol className="component-tour">
          {componentRoutes.slice(1).map((route) => {
            const component = componentSections.find(({ id }) => id === route.componentId)
            return (
              <li key={route.path}>
                <a className="component-tour__item" href={route.path}>
                  <span className="component-tour__text">
                    <strong>{route.title}</strong>
                    <span>{component?.summary ?? route.summary}</span>
                  </span>
                  {component ? (
                    <StaticInfoschematic
                      className="component-tour__preview"
                      input={previewSpecimen(component.id)}
                      label={null}
                      options={previewOptions}
                      resourceIdPrefix={`tour-${component.id}`}
                    />
                  ) : null}
                </a>
              </li>
            )
          })}
        </ol>
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
        ...(component.id === 'canvas'
          ? ([{ depth: 2, slug: 'canvas-schemes', label: 'Style and mode' }] as const)
          : []),
        { depth: 2, slug: `${component.id}-properties`, label: 'Properties' }
      ]}
    >
      <article aria-label={component.title} className="document-content">
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
        {component.id === 'dynamics' && (
          <p>
            A Dynamic is the only part of a document that describes change, and it still carries no timing: no duration,
            no easing, no timer, and no occurrence key. A Scene cues it by name, <code>once</code> or on a{' '}
            <code>repeat</code>, and the View owns the beat. A change that lasts is authored as{' '}
            <code>depicts: state</code> on the Dynamic itself and is held until the occurrence is withdrawn.
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
          {component.id === 'dynamics' ? (
            <DynamicsSpecimen />
          ) : (
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
          )}
        </section>
        {component.id === 'canvas' && (
          <section aria-labelledby="canvas-schemes" className="component-page__section">
            <h2 id="canvas-schemes">Style and mode</h2>
            <p>
              These are two different things and a drawing carries both. A <em>style</em> says what the drawing is —{' '}
              <code>appearance.style: blueprint</code> makes it a blueprint, and it stays one wherever it is read. A{' '}
              <em>mode</em> says which ground the reader is on, light or dark. A blueprint is realised on both: navy
              paper in the dark, cyanotype on light, because the style is the author's and the ground is the reader's.
            </p>
            <p>
              Mode is authorable too, as <code>appearance.mode</code>, and its <code>system</code> value is the author
              declining to pick rather than an instruction to defer — it falls through to whoever is drawing. An
              interactive drawing follows the page. A rendered file cannot, so{' '}
              <code>infoschematics render --mode dark</code> writes a dark drawing rather than one that might become
              dark, and <code>--mode system</code> writes one SVG carrying both palettes — which is what the third
              drawing below is.
            </p>
            <ul className="scheme-gallery">
              {modeDrawings.map(({ id, label, options }) => (
                <li className="scheme-gallery__item" key={id}>
                  <StaticInfoschematic
                    className="scheme-gallery__drawing"
                    input={schemeSpecimen}
                    label={`Colour mode example, ${label.toLowerCase()}`}
                    options={options}
                    resourceIdPrefix={`scheme-${id}`}
                  />
                  <p className="scheme-gallery__caption">{label}</p>
                </li>
              ))}
            </ul>
            <p>
              The interface around a drawing answers the same modes, from its own set of roles. These swatches are
              painted from those roles rather than listed, so they are showing you the mode you are actually in — use
              the switch in the header and they move with everything else.
            </p>
            <ul className="chrome-roles">
              {chromeRoles.map((role) => (
                <li className="chrome-roles__item" key={role}>
                  <span
                    aria-hidden="true"
                    className="chrome-roles__swatch"
                    style={{ '--chrome-role': `var(--infoschematic-chrome-paint-${role})` } as CSSProperties}
                  />
                  <code className="chrome-roles__name">{role}</code>
                </li>
              ))}
            </ul>
          </section>
        )}
        <section aria-labelledby={`${component.id}-properties`} className="component-page__section">
          <h2 id={`${component.id}-properties`}>Properties</h2>
          <p>The portable fields this component represents.</p>
          <div className="visual-guide__property-reference">
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
          </div>
        </section>
      </article>
    </Shell>
  )
}

export { futureRoute }
