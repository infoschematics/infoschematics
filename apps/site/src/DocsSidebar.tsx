import {
  type DocumentSection,
  docsIndexPath,
  documentationRoutes,
  documentSections,
  sectionTitles,
  visualGuidePath
} from './routes.ts'
import './styles.css'

interface SidebarEntry {
  path: string
  title: string
}

function documentEntry(path: string): SidebarEntry {
  const route = documentationRoutes.find((candidate) => candidate.path === path)

  if (!route) {
    throw new Error(`No published document at ${path}`)
  }

  return { path: route.path, title: route.title }
}

// The user guide's step order, stated once. The visual guide is a rendered specimen page rather than a Markdown
// document, so its entry is declared here alongside the Markdown steps.
const guideEntries: readonly SidebarEntry[] = [
  documentEntry(docsIndexPath),
  { path: visualGuidePath, title: 'Visual guide' },
  documentEntry('/docs/capabilities/'),
  documentEntry('/docs/authoring/'),
  documentEntry('/docs/present/'),
  documentEntry('/docs/studio/'),
  documentEntry('/docs/static-rendering/'),
  documentEntry('/docs/react-integration/')
]

const entriesFor = (section: DocumentSection): readonly SidebarEntry[] =>
  section === 'guide'
    ? guideEntries
    : documentationRoutes
        .filter((route) => route.section === section)
        .map((route) => ({ path: route.path, title: route.title }))

/** Left-hand article navigation shared by every page in the documentation section. */
export function DocsSidebar({ currentPath }: { currentPath?: string }) {
  return (
    <nav aria-label="Documentation" className="docs-sidebar">
      {documentSections.map((section) => (
        <section aria-labelledby={`sidebar-${section}`} key={section}>
          <h2 id={`sidebar-${section}`}>{sectionTitles[section]}</h2>
          <ul>
            {entriesFor(section).map((entry) => (
              <li key={entry.path}>
                <a aria-current={currentPath === entry.path ? 'page' : undefined} href={entry.path}>
                  {entry.title}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </nav>
  )
}
