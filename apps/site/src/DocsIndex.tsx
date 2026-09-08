import { DocsSidebar } from './DocsSidebar.tsx'
import { docsIndexPath, documentationRoutes, documentSections, sectionTitles, visualGuidePath } from './routes.ts'
import { SiteNav } from './SiteNav.tsx'
import './styles.css'

export function DocsIndex() {
  return (
    <div className="document-shell document-shell--wide docs-shell">
      <SiteNav section="docs" />
      <div className="docs-columns">
        <DocsSidebar currentPath={docsIndexPath} />
        <main id="document-content">
          <h1>Documentation</h1>
          <p>
            See the <a href={visualGuidePath}>visual guide</a> for every appearance option rendered as an actual SVG
            specimen.
          </p>
          {documentSections.map((section) => (
            <section aria-labelledby={`section-${section}`} key={section}>
              <h2 id={`section-${section}`}>{sectionTitles[section]}</h2>
              <ul className="index-list">
                {documentationRoutes
                  .filter((route) => route.section === section)
                  .map((route) => (
                    <li key={route.sourcePath}>
                      <a href={route.path}>{route.title}</a>
                      <p>{route.summary}</p>
                    </li>
                  ))}
              </ul>
            </section>
          ))}
        </main>
      </div>
    </div>
  )
}
