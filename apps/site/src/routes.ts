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

export type DocumentSection = 'getting-started' | 'reference' | 'design' | 'specs'

export const sectionTitles: Record<DocumentSection, string> = {
  'getting-started': 'Getting started',
  reference: 'Reference',
  design: 'Design',
  specs: 'Specifications'
}

export const documentSections: readonly DocumentSection[] = ['getting-started', 'reference', 'design', 'specs']

interface PublishedDocument {
  sourcePath: string
  title: string
  summary: string
  section: DocumentSection
}

const publishedDocuments = [
  {
    sourcePath: 'docs/overview.md',
    title: 'Overview',
    summary: 'What an Infoschematic is, the pieces that produce one, and where to start.',
    section: 'getting-started'
  },
  {
    sourcePath: 'docs/guides/authoring.md',
    title: 'Authoring Infoschematics',
    summary: 'Write a serialisable Infoschematic definition from scratch.',
    section: 'getting-started'
  },
  {
    sourcePath: 'docs/guides/react-integration.md',
    title: 'React integration',
    summary: 'Mount an authored Infoschematic inside a host React application.',
    section: 'getting-started'
  },
  {
    sourcePath: 'docs/reference/vocabulary.md',
    title: 'Infoschematics vocabulary',
    summary: 'Canonical product terms used across every specification and guide.',
    section: 'reference'
  },
  {
    sourcePath: 'docs/design/architecture.md',
    title: 'Architecture',
    summary: 'Ownership roots, package boundaries and the dependency direction between them.',
    section: 'design'
  },
  {
    sourcePath: 'docs/design/visual-language.md',
    title: 'Visual language',
    summary: 'The appearance options an Infoschematic can express and how they render.',
    section: 'design'
  },
  {
    sourcePath: 'docs/design/view-present.md',
    title: 'Present view design',
    summary: 'Audience-facing filtering, Scene focus and Story playback design.',
    section: 'design'
  },
  {
    sourcePath: 'docs/design/view-studio.md',
    title: 'Studio view design',
    summary: 'Generic editing session design: selection, drafts and consolidation.',
    section: 'design'
  },
  {
    sourcePath: 'docs/specs/README.md',
    title: 'Specifications',
    summary: 'The reusable contracts Infoschematics defines and their requirement language.',
    section: 'specs'
  },
  {
    sourcePath: 'docs/specs/domain-model.md',
    title: 'Domain Model',
    summary: 'Authored identity, data, geography and relationship rules.',
    section: 'specs'
  },
  {
    sourcePath: 'docs/specs/domain-core.md',
    title: 'Domain Core',
    summary: 'Configuration normalisation and the TypeScript, JSON and YAML document boundary.',
    section: 'specs'
  },
  {
    sourcePath: 'docs/specs/view-model.md',
    title: 'View Model',
    summary: 'Geometry, routes, ports, guides and placement calculations.',
    section: 'specs'
  },
  {
    sourcePath: 'docs/specs/view-canvas.md',
    title: 'Canvas View',
    summary: 'The interactive surface, host renderer registry, validation and diagnostics.',
    section: 'specs'
  },
  {
    sourcePath: 'docs/specs/view-present.md',
    title: 'Present View',
    summary: 'Audience-facing filtering, Scene focus, Story playback and presentation controls.',
    section: 'specs'
  },
  {
    sourcePath: 'docs/specs/view-studio.md',
    title: 'Studio View',
    summary: 'Generic editing sessions, selection, drafts, change consolidation and creation or removal behaviour.',
    section: 'specs'
  },
  {
    sourcePath: 'docs/specs/render-svg.md',
    title: 'Static SVG renderer',
    summary: 'Deterministic, framework-neutral SVG output and visibility options.',
    section: 'specs'
  }
] as const satisfies readonly PublishedDocument[]

function documentPath(sourcePath: string): string {
  if (sourcePath === 'docs/overview.md') {
    return docsIndexPath
  }

  const withoutReadme = sourcePath.endsWith('/README.md') ? sourcePath.slice(0, -'README.md'.length) : sourcePath
  const withoutExtension = withoutReadme.endsWith('.md') ? withoutReadme.slice(0, -'.md'.length) : withoutReadme
  return `/${withoutExtension}/`.replace(/\/+/g, '/')
}

export const documentationRoutes: ReadonlyArray<PublishedDocument & { path: string }> = publishedDocuments.map(
  (document) => ({ ...document, path: documentPath(document.sourcePath) })
)

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
