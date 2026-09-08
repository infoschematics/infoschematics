import {
  type DocumentSection,
  documentationRoutes,
  documentSections,
  sectionTitles,
  visualGuidePath
} from './routes.ts'
import './styles.css'

const entriesFor = (section: DocumentSection): { path: string; title: string }[] => {
  const entries = documentationRoutes
    .filter((route) => route.section === section)
    .map((route) => ({ path: route.path, title: route.title }))

  // The visual guide is a rendered specimen page rather than a Markdown document, so it joins the section here.
  if (section === 'getting-started') {
    entries.splice(1, 0, { path: visualGuidePath, title: 'Visual guide' })
  }

  return entries
}

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
