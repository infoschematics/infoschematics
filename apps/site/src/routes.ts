const blankExamplePath = '/examples/blank/'
const infoschematicsExamplePath = '/examples/infoschematics/'
const systemExamplePath = '/examples/system/'
export const docsIndexPath = '/docs/'
export const examplesIndexPath = '/examples/'
export const componentsPath = '/docs/components/'
export const installationPath = '/docs/installation/'
export const playgroundPath = '/playground/'

export type DocumentSection = 'guide' | 'usage' | 'reference' | 'approach'

export const sectionTitles: Record<DocumentSection, string> = {
  guide: 'User guide',
  usage: 'Use Infoschematics',
  reference: 'Reference',
  approach: 'Approach'
}

export const documentSections = ['guide', 'usage', 'approach'] as const satisfies readonly DocumentSection[]

interface PublishedDocument {
  sourcePath: string
  path: string
  title: string
  summary: string
  section: DocumentSection
}

// Components is a rendered specimen page rather than a Markdown document, so DocsSidebar places it after Installation.
const publishedDocuments = [
  {
    sourcePath: 'apps/site/content/getting-started.md',
    path: docsIndexPath,
    title: 'Overview',
    summary: 'Understand the core model, the available outcomes, and where to go next.',
    section: 'guide'
  },
  {
    sourcePath: 'apps/site/content/installation.md',
    path: installationPath,
    title: 'Installation',
    summary: 'Choose a hosted no-install workflow or the packages needed for static and interactive use.',
    section: 'guide'
  },
  {
    sourcePath: 'apps/site/content/authoring.md',
    path: '/docs/authoring/',
    title: 'Authoring',
    summary: 'Write a serialisable Infoschematic definition from scratch.',
    section: 'usage'
  },
  {
    sourcePath: 'apps/site/content/representations.md',
    path: '/docs/representations/',
    title: 'Representation patterns',
    summary: 'Apply the architectural visual grammar to systems, workflows, entities and data or media pipelines.',
    section: 'usage'
  },
  {
    sourcePath: 'apps/site/content/explanation.md',
    path: '/docs/explanation/',
    title: 'Explanation',
    summary: 'Use Scopes, Scenes, Themes, Stories, Callouts, and Graphics to explain one stable diagram.',
    section: 'usage'
  },
  {
    sourcePath: 'apps/site/content/present.md',
    path: '/docs/present/',
    title: 'Present view',
    summary: 'Show an Infoschematic to an audience with filtering, focus and Story playback.',
    section: 'usage'
  },
  {
    sourcePath: 'apps/site/content/studio.md',
    path: '/docs/studio/',
    title: 'Studio view',
    summary: 'Design the diagram and direct its presentation material in a structured editor.',
    section: 'usage'
  },
  {
    sourcePath: 'apps/site/content/static-rendering.md',
    path: '/docs/static-rendering/',
    title: 'Static rendering',
    summary: 'Export deterministic SVG for documents and pipelines.',
    section: 'usage'
  },
  {
    sourcePath: 'apps/site/content/react-integration.md',
    path: '/docs/react-integration/',
    title: 'React integration',
    summary: 'Mount an authored Infoschematic inside a host React application.',
    section: 'usage'
  },
  {
    sourcePath: 'docs/reference/vocabulary.md',
    path: '/docs/reference/vocabulary/',
    title: 'Terminology',
    summary: 'Canonical product terms used across every specification and guide.',
    section: 'reference'
  },
  {
    sourcePath: 'docs/design/architecture.md',
    path: '/docs/approach/architecture/',
    title: 'Architecture',
    summary: 'Ownership roots, package boundaries and the dependency direction between them.',
    section: 'approach'
  },
  {
    sourcePath: 'docs/design/visual-language.md',
    path: '/docs/approach/visual-language/',
    title: 'Visual language',
    summary: 'Composition, colour, routing, motion, and accessible visual presentation.',
    section: 'approach'
  },
  {
    sourcePath: 'docs/design/view-present.md',
    path: '/docs/approach/view-present/',
    title: 'Present view design',
    summary: 'Audience-facing filtering, Scene focus and Story playback design.',
    section: 'approach'
  },
  {
    sourcePath: 'docs/design/view-studio.md',
    path: '/docs/approach/view-studio/',
    title: 'Studio view design',
    summary: 'Generic editing session design: selection, drafts and consolidation.',
    section: 'approach'
  }
] as const satisfies readonly PublishedDocument[]

export const documentationRoutes: readonly PublishedDocument[] = publishedDocuments

export type DocumentationRoute = (typeof documentationRoutes)[number]

interface SiteLocation {
  pathname: string
  search: string
}

const legacyLocationAliases: Readonly<Record<string, SiteLocation>> = {
  '/docs/capabilities/': { pathname: componentsPath, search: '' },
  '/docs/visual-guide/': { pathname: componentsPath, search: '' },
  '/docs/design/architecture/': { pathname: '/docs/approach/architecture/', search: '' },
  '/docs/design/visual-language/': { pathname: '/docs/approach/visual-language/', search: '' },
  '/docs/design/view-present/': { pathname: '/docs/approach/view-present/', search: '' },
  '/docs/design/view-studio/': { pathname: '/docs/approach/view-studio/', search: '' },
  [examplesIndexPath]: { pathname: playgroundPath, search: '?preset=source-to-sink' },
  [blankExamplePath]: { pathname: playgroundPath, search: '?preset=blank' },
  [infoschematicsExamplePath]: { pathname: playgroundPath, search: '?preset=explained' },
  [systemExamplePath]: { pathname: playgroundPath, search: '?preset=explained' }
}

/** Return the canonical browser location for a retired public route. */
export function canonicalSiteLocation(pathname: string, search = ''): SiteLocation {
  const normalised = pathname.endsWith('/') ? pathname : `${pathname}/`
  const alias = legacyLocationAliases[normalised]
  if (alias) return alias
  if (normalised.startsWith(examplesIndexPath)) {
    return { pathname: playgroundPath, search: '?preset=source-to-sink' }
  }
  return { pathname, search }
}

/** Return only the canonical path when query selection is not needed by the caller. */
export function canonicalSitePath(pathname: string) {
  return canonicalSiteLocation(pathname).pathname
}

export function isDocsIndexPath(pathname: string) {
  return pathname === docsIndexPath || pathname === docsIndexPath.slice(0, -1)
}

export function isComponentsPath(pathname: string) {
  return pathname === componentsPath || pathname === componentsPath.slice(0, -1)
}

export function isPlaygroundPath(pathname: string) {
  return pathname === playgroundPath || pathname === playgroundPath.slice(0, -1)
}

export function getDocumentationRoute(pathname: string): DocumentationRoute | undefined {
  const canonicalPath = canonicalSitePath(pathname)
  return documentationRoutes.find((route) => canonicalPath === route.path || canonicalPath === route.path.slice(0, -1))
}
