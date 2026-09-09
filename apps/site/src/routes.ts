export const blankExamplePath = '/examples/blank/'
export const infoschematicsExamplePath = '/examples/infoschematics/'
export const systemExamplePath = '/examples/system/'
export const docsIndexPath = '/docs/'
export const examplesIndexPath = '/examples/'
export const visualGuidePath = '/docs/visual-guide/'
export const playgroundPath = '/playground/'

export function playgroundPresetPath(preset: string) {
  return `${playgroundPath}?preset=${preset}`
}

export type DocumentSection = 'guide' | 'reference' | 'design'

export const sectionTitles: Record<DocumentSection, string> = {
  guide: 'User guide',
  reference: 'Reference',
  design: 'Design'
}

export const documentSections: readonly DocumentSection[] = ['guide', 'reference', 'design']

interface PublishedDocument {
  sourcePath: string
  path: string
  title: string
  summary: string
  section: DocumentSection
}

// The user guide's Markdown steps in reading order; the visual guide, a rendered specimen page rather than a
// Markdown document, takes its place in the order in DocsSidebar.
const publishedDocuments = [
  {
    sourcePath: 'apps/site/content/getting-started.md',
    path: docsIndexPath,
    title: 'Getting started',
    summary: 'What an Infoschematic is, what it is made of, and how this guide is organised.',
    section: 'guide'
  },
  {
    sourcePath: 'apps/site/content/capabilities.md',
    path: '/docs/capabilities/',
    title: 'Capabilities',
    summary: 'Scenes, Themes, Stories, Scopes, Graphics and Callouts beyond the diagram.',
    section: 'guide'
  },
  {
    sourcePath: 'apps/site/content/authoring.md',
    path: '/docs/authoring/',
    title: 'Authoring',
    summary: 'Write a serialisable Infoschematic definition from scratch.',
    section: 'guide'
  },
  {
    sourcePath: 'apps/site/content/present.md',
    path: '/docs/present/',
    title: 'Present view',
    summary: 'Show an Infoschematic to an audience with filtering, focus and Story playback.',
    section: 'guide'
  },
  {
    sourcePath: 'apps/site/content/studio.md',
    path: '/docs/studio/',
    title: 'Studio view',
    summary: 'Design the diagram and direct its presentation material in a structured editor.',
    section: 'guide'
  },
  {
    sourcePath: 'apps/site/content/static-rendering.md',
    path: '/docs/static-rendering/',
    title: 'Static rendering',
    summary: 'Export deterministic SVG for documents and pipelines.',
    section: 'guide'
  },
  {
    sourcePath: 'apps/site/content/react-integration.md',
    path: '/docs/react-integration/',
    title: 'React integration',
    summary: 'Mount an authored Infoschematic inside a host React application.',
    section: 'guide'
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
    path: '/docs/design/architecture/',
    title: 'Architecture',
    summary: 'Ownership roots, package boundaries and the dependency direction between them.',
    section: 'design'
  },
  {
    sourcePath: 'docs/design/visual-language.md',
    path: '/docs/design/visual-language/',
    title: 'Visual language',
    summary: 'Composition, colour, routing, motion, and accessible visual treatment.',
    section: 'design'
  },
  {
    sourcePath: 'docs/design/view-present.md',
    path: '/docs/design/view-present/',
    title: 'Present view design',
    summary: 'Audience-facing filtering, Scene focus and Story playback design.',
    section: 'design'
  },
  {
    sourcePath: 'docs/design/view-studio.md',
    path: '/docs/design/view-studio/',
    title: 'Studio view design',
    summary: 'Generic editing session design: selection, drafts and consolidation.',
    section: 'design'
  }
] as const satisfies readonly PublishedDocument[]

export const documentationRoutes: readonly PublishedDocument[] = publishedDocuments

export type DocumentationRoute = (typeof documentationRoutes)[number]

export function isBlankExamplePath(pathname: string) {
  return pathname === blankExamplePath || pathname === blankExamplePath.slice(0, -1)
}

export function isInfoschematicsExamplePath(pathname: string) {
  return pathname === infoschematicsExamplePath || pathname === infoschematicsExamplePath.slice(0, -1)
}

export function isSystemExamplePath(pathname: string) {
  return pathname === systemExamplePath || pathname === systemExamplePath.slice(0, -1)
}

export function isDocsIndexPath(pathname: string) {
  return pathname === docsIndexPath || pathname === docsIndexPath.slice(0, -1)
}

export function isExamplesIndexPath(pathname: string) {
  return pathname === examplesIndexPath || pathname === examplesIndexPath.slice(0, -1)
}

export function isVisualGuidePath(pathname: string) {
  return pathname === visualGuidePath || pathname === visualGuidePath.slice(0, -1)
}

export function isPlaygroundPath(pathname: string) {
  return pathname === playgroundPath || pathname === playgroundPath.slice(0, -1)
}

export function getDocumentationRoute(pathname: string): DocumentationRoute | undefined {
  return documentationRoutes.find((route) => pathname === route.path || pathname === route.path.slice(0, -1))
}
