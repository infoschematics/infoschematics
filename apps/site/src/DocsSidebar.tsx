import { useEffect, useState } from 'react'
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
  activeOutlineSlug,
  currentPageOutline = [],
  currentPath,
  idPrefix
}: DocsSidebarProps & { activeOutlineSlug?: string; idPrefix: string }) {
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
                      <a
                        aria-current={activeOutlineSlug === outlineEntry.slug ? 'location' : undefined}
                        href={`#${outlineEntry.slug}`}
                      >
                        {outlineEntry.label}
                      </a>
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
  const [activeOutlineSlug, setActiveOutlineSlug] = useState<string>()
  const currentTitle = [...guideEntries, ...documentSections.flatMap(entriesFor)].find(
    (entry) => entry.path === currentPath
  )?.title

  useEffect(() => {
    let animationFrame = 0

    const updateActiveHeading = () => {
      animationFrame = 0
      const activeHeading = currentPageOutline
        .map(({ slug }) => document.getElementById(slug))
        .filter((heading): heading is HTMLElement => heading !== null)
        .filter((heading) => heading.getBoundingClientRect().top <= 32)
        .at(-1)

      setActiveOutlineSlug(activeHeading?.id)
    }

    const scheduleUpdate = () => {
      if (animationFrame) return
      animationFrame = window.requestAnimationFrame(updateActiveHeading)
    }

    updateActiveHeading()
    window.addEventListener('scroll', scheduleUpdate, { passive: true })
    window.addEventListener('resize', scheduleUpdate)

    return () => {
      window.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('resize', scheduleUpdate)
      window.cancelAnimationFrame(animationFrame)
    }
  }, [currentPageOutline])

  return (
    <>
      <nav aria-label="Documentation" className="docs-navigation docs-sidebar">
        <DocumentationLinks
          activeOutlineSlug={activeOutlineSlug}
          currentPageOutline={currentPageOutline}
          currentPath={currentPath}
          idPrefix="sidebar"
        />
      </nav>
      <details className="docs-mobile-navigation">
        <summary>
          <span>Guide navigation</span>
          {currentTitle ? <strong>{currentTitle}</strong> : null}
        </summary>
        <nav aria-label="Mobile documentation" className="docs-mobile-navigation__body docs-navigation">
          <DocumentationLinks
            activeOutlineSlug={activeOutlineSlug}
            currentPageOutline={currentPageOutline}
            currentPath={currentPath}
            idPrefix="mobile-navigation"
          />
        </nav>
      </details>
    </>
  )
}
