export const docsIndexPath = '/docs/'
export const componentsPath = '/docs/components/'
export const componentPaths = {
  canvas: '/docs/components/canvas/',
  region: '/docs/components/regions/',
  fabric: '/docs/components/fabrics/',
  card: '/docs/components/cards/',
  flow: '/docs/components/flows/',
  point: '/docs/components/points/',
  graphic: '/docs/components/graphics/',
  dynamics: '/docs/components/dynamics/',
  future: '/docs/components/future/'
} as const
export const installationPath = '/docs/installation/'
/** The React integration guide, which hosts the addressing demonstration as well as its prose. */
export const reactIntegrationPath = '/docs/react-integration/'
export const playgroundPath = '/playground/'

export type DocumentSection = 'guide' | 'components' | 'usage' | 'reference' | 'approach'

export const sectionTitles: Record<DocumentSection, string> = {
  guide: 'User guide',
  components: 'Components',
  usage: 'Use Infoschematics',
  reference: 'Reference',
  approach: 'Approach'
}

export const documentSections = [
  'guide',
  'components',
  'usage',
  'approach'
] as const satisfies readonly DocumentSection[]

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
    summary: 'Use Scopes, Scenes, Sequences, Callouts, and Overlays to explain one stable Diagram.',
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
    path: reactIntegrationPath,
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
    sourcePath: 'docs/decisions/references/design-architecture.md',
    path: '/docs/approach/architecture/',
    title: 'Architecture',
    summary: 'Ownership roots, package boundaries and the dependency direction between them.',
    section: 'approach'
  },
  {
    sourcePath: 'docs/decisions/references/design-visual-language.md',
    path: '/docs/approach/visual-language/',
    title: 'Visual language',
    summary: 'Composition, colour, routing, motion, and accessible visual presentation.',
    section: 'approach'
  },
  {
    sourcePath: 'docs/decisions/references/design-view-present.md',
    path: '/docs/approach/view-present/',
    title: 'Present view design',
    summary: 'Audience-facing filtering, Scene focus and Story playback design.',
    section: 'approach'
  },
  {
    sourcePath: 'docs/decisions/references/design-view-studio.md',
    path: '/docs/approach/view-studio/',
    title: 'Studio view design',
    summary: 'Generic editing session design: selection, drafts and consolidation.',
    section: 'approach'
  }
] as const satisfies readonly PublishedDocument[]

export type ComponentRoute = {
  path: string
  title: string
  summary: string
  section: 'components'
  componentId?: string
}

export const componentRoutes: readonly ComponentRoute[] = [
  {
    path: componentsPath,
    title: 'Components',
    summary: 'Explore the visible parts of an Infoschematic.',
    section: 'components'
  },
  {
    path: componentPaths.canvas,
    title: 'Canvas',
    summary: 'The drawing area and its backdrop.',
    section: 'components',
    componentId: 'canvas'
  },
  {
    path: componentPaths.region,
    title: 'Regions',
    summary: 'Named boundaries that establish geography.',
    section: 'components',
    componentId: 'region'
  },
  {
    path: componentPaths.fabric,
    title: 'Fabrics',
    summary: 'Connectable planes and shared substrates.',
    section: 'components',
    componentId: 'fabric'
  },
  {
    path: componentPaths.card,
    title: 'Cards',
    summary: 'Placed components and capabilities.',
    section: 'components',
    componentId: 'card'
  },
  {
    path: componentPaths.flow,
    title: 'Flows',
    summary: 'Connections between diagram elements.',
    section: 'components',
    componentId: 'flow'
  },
  {
    path: componentPaths.point,
    title: 'Points',
    summary: 'Junctions and explicit waypoints.',
    section: 'components',
    componentId: 'point'
  },
  {
    path: componentPaths.graphic,
    title: 'Graphics',
    summary: 'Named visual renderers supplied by a host.',
    section: 'components',
    componentId: 'graphic'
  },
  {
    path: componentPaths.dynamics,
    title: 'Dynamics',
    summary: 'Named changes a Scene cues or a host records.',
    section: 'components',
    componentId: 'dynamics'
  },
  {
    path: componentPaths.future,
    title: 'Future',
    summary: 'Notation under consideration.',
    section: 'components',
    componentId: 'future'
  }
]

export const documentationRoutes: readonly PublishedDocument[] = publishedDocuments

export type DocumentationRoute = (typeof documentationRoutes)[number]

export interface GuideJourneyEntry {
  path: string
  title: string
  summary: string
}

/*
 * One reading order through the whole guide. The component pages are part of it rather than a detour from it, so the
 * hub's next step is the Canvas and the last component leads on to Authoring.
 */
export const guideJourney: readonly GuideJourneyEntry[] = [
  ...publishedDocuments.filter((route) => route.section === 'guide'),
  ...componentRoutes,
  ...publishedDocuments.filter((route) => route.section === 'usage')
]

/** Routes are published with a trailing slash; a browser that drops it still asks for the same page. */
const matchesRoute = (pathname: string, path: string) => pathname === path || pathname === path.slice(0, -1)

export function getGuideJourneyNeighbours(pathname: string): {
  previous?: GuideJourneyEntry
  next?: GuideJourneyEntry
} {
  const currentIndex = guideJourney.findIndex((entry) => matchesRoute(pathname, entry.path))

  if (currentIndex === -1) return {}

  return {
    previous: guideJourney[currentIndex - 1],
    next: guideJourney[currentIndex + 1]
  }
}

export function isDocsIndexPath(pathname: string) {
  return pathname === docsIndexPath || pathname === docsIndexPath.slice(0, -1)
}

export function isReactIntegrationPath(pathname: string) {
  return pathname === reactIntegrationPath || pathname === reactIntegrationPath.slice(0, -1)
}

export function getComponentRoute(pathname: string): ComponentRoute | undefined {
  return componentRoutes.find((route) => matchesRoute(pathname, route.path))
}

export function isPlaygroundPath(pathname: string) {
  return pathname === playgroundPath || pathname === playgroundPath.slice(0, -1)
}

export function getDocumentationRoute(pathname: string): DocumentationRoute | undefined {
  return documentationRoutes.find((route) => matchesRoute(pathname, route.path))
}
