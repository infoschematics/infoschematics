import { docsIndexPath, documentationRoutes, documentSections, sectionTitles, visualGuidePath } from './routes.ts'
import './styles.css'

/** Left-hand article navigation shared by the documentation index and every document page. */
export function DocsSidebar({ currentPath }: { currentPath?: string }) {
  return (
    <nav aria-label="Documentation" className="docs-sidebar">
      <ul>
        <li>
          <a aria-current={currentPath === docsIndexPath ? 'page' : undefined} href={docsIndexPath}>
            Documentation
          </a>
        </li>
        <li>
          <a href={visualGuidePath}>Visual guide</a>
        </li>
      </ul>
      {documentSections.map((section) => (
        <section aria-labelledby={`sidebar-${section}`} key={section}>
          <h2 id={`sidebar-${section}`}>{sectionTitles[section]}</h2>
          <ul>
            {documentationRoutes
              .filter((route) => route.section === section)
              .map((route) => (
                <li key={route.sourcePath}>
                  <a aria-current={currentPath === route.path ? 'page' : undefined} href={route.path}>
                    {route.title}
                  </a>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </nav>
  )
}
