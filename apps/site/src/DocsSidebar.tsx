import {
  componentRoutes,
  type DocumentSection,
  docsIndexPath,
  documentationRoutes,
  documentSections,
  installationPath,
  sectionTitles
} from './routes.ts'
import './styles.css'

interface SidebarEntry {
  path: string
  title: string
}

export interface DocsPageOutlineEntry {
  depth: 2 | 3
  slug: string
  label: string
}

function documentEntry(path: string): SidebarEntry {
  const route = documentationRoutes.find((candidate) => candidate.path === path)

  if (!route) {
    throw new Error(`No published document at ${path}`)
  }

  return { path: route.path, title: route.title }
}

const guideEntries: readonly SidebarEntry[] = [documentEntry(docsIndexPath), documentEntry(installationPath)]

const componentEntries: readonly SidebarEntry[] = componentRoutes.map(({ path, title }) => ({ path, title }))

const entriesFor = (section: DocumentSection): readonly SidebarEntry[] =>
  section === 'guide'
    ? guideEntries
    : section === 'components'
      ? componentEntries
      : documentationRoutes
          .filter((route) => route.section === section)
          .map((route) => ({ path: route.path, title: route.title }))

interface DocsSidebarProps {
  currentPath?: string
  currentPageOutline?: readonly DocsPageOutlineEntry[]
}

function DocumentationLinks({
  currentPageOutline = [],
  currentPath,
  idPrefix
}: DocsSidebarProps & { idPrefix: string }) {
  return documentSections.map((section) => (
    <section aria-labelledby={`${idPrefix}-${section}`} key={section}>
      <h2 id={`${idPrefix}-${section}`}>{sectionTitles[section]}</h2>
      <ul>
        {entriesFor(section).map((entry) => {
          const isCurrent = currentPath === entry.path
          const showsOutline = isCurrent && currentPageOutline.length > 0

          return (
            <li key={entry.path}>
              <a aria-current={isCurrent ? 'page' : undefined} href={entry.path}>
                {entry.title}
              </a>
              {showsOutline ? (
                <ul aria-label={`${entry.title} sections`} className="docs-sidebar__outline">
                  {currentPageOutline.map((outlineEntry) => (
                    <li
                      className={outlineEntry.depth === 3 ? 'docs-sidebar__outline-subsection' : undefined}
                      key={outlineEntry.slug}
                    >
                      <a href={`#${outlineEntry.slug}`}>{outlineEntry.label}</a>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          )
        })}
      </ul>
    </section>
  ))
}

/** Left-hand article navigation shared by every page in the documentation section. */
export function DocsSidebar({ currentPath, currentPageOutline = [] }: DocsSidebarProps) {
  const currentTitle = [...guideEntries, ...documentSections.flatMap(entriesFor)].find(
    (entry) => entry.path === currentPath
  )?.title

  return (
    <>
      <nav aria-label="Documentation" className="docs-navigation docs-sidebar">
        <DocumentationLinks currentPageOutline={currentPageOutline} currentPath={currentPath} idPrefix="sidebar" />
      </nav>
      <details className="docs-mobile-navigation">
        <summary>
          <span>Guide navigation</span>
          {currentTitle ? <strong>{currentTitle}</strong> : null}
        </summary>
        <nav aria-label="Mobile documentation" className="docs-mobile-navigation__body docs-navigation">
          <DocumentationLinks
            currentPageOutline={currentPageOutline}
            currentPath={currentPath}
            idPrefix="mobile-navigation"
          />
        </nav>
      </details>
    </>
  )
}
