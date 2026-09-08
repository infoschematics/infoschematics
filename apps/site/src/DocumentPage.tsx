import { Marked, type Tokens } from 'marked'
import architectureMarkdown from '../../../docs/design/architecture.md?raw'
import viewPresentDesignMarkdown from '../../../docs/design/view-present.md?raw'
import viewStudioDesignMarkdown from '../../../docs/design/view-studio.md?raw'
import visualLanguageMarkdown from '../../../docs/design/visual-language.md?raw'
import authoringMarkdown from '../../../docs/guides/authoring.md?raw'
import reactIntegrationMarkdown from '../../../docs/guides/react-integration.md?raw'
import vocabularyMarkdown from '../../../docs/reference/vocabulary.md?raw'
import domainCoreMarkdown from '../../../docs/specs/domain-core.md?raw'
import domainModelMarkdown from '../../../docs/specs/domain-model.md?raw'
import specsReadmeMarkdown from '../../../docs/specs/README.md?raw'
import renderSvgMarkdown from '../../../docs/specs/render-svg.md?raw'
import viewCanvasMarkdown from '../../../docs/specs/view-canvas.md?raw'
import viewModelMarkdown from '../../../docs/specs/view-model.md?raw'
import viewPresentSpecMarkdown from '../../../docs/specs/view-present.md?raw'
import viewStudioSpecMarkdown from '../../../docs/specs/view-studio.md?raw'
import { DocsSidebar } from './DocsSidebar.tsx'
import type { DocumentationRoute } from './routes.ts'
import { documentationRoutes } from './routes.ts'
import { SiteNav } from './SiteNav.tsx'
import './styles.css'

const repositoryUrl = 'https://github.com/infoschematics/infoschematics'

const markdownBySourcePath: Record<string, string> = {
  'docs/guides/authoring.md': authoringMarkdown,
  'docs/guides/react-integration.md': reactIntegrationMarkdown,
  'docs/reference/vocabulary.md': vocabularyMarkdown,
  'docs/design/architecture.md': architectureMarkdown,
  'docs/design/visual-language.md': visualLanguageMarkdown,
  'docs/design/view-present.md': viewPresentDesignMarkdown,
  'docs/design/view-studio.md': viewStudioDesignMarkdown,
  'docs/specs/README.md': specsReadmeMarkdown,
  'docs/specs/domain-model.md': domainModelMarkdown,
  'docs/specs/domain-core.md': domainCoreMarkdown,
  'docs/specs/view-model.md': viewModelMarkdown,
  'docs/specs/view-canvas.md': viewCanvasMarkdown,
  'docs/specs/view-present.md': viewPresentSpecMarkdown,
  'docs/specs/view-studio.md': viewStudioSpecMarkdown,
  'docs/specs/render-svg.md': renderSvgMarkdown
}

const publishedPathBySourcePath: Record<string, string> = Object.fromEntries(
  documentationRoutes.map((route) => [route.sourcePath, route.path])
)

function normaliseRepositoryPath(path: string) {
  const segments: string[] = []

  for (const segment of path.split('/')) {
    if (!segment || segment === '.') {
      continue
    }

    if (segment === '..') {
      segments.pop()
    } else {
      segments.push(segment)
    }
  }

  return segments.join('/')
}

function rewriteRepositoryLink(href: string, sourcePath: string) {
  if (
    href.startsWith('/') ||
    href.startsWith('#') ||
    href.startsWith('?') ||
    href.startsWith('//') ||
    /^[a-z][a-z\d+.-]*:/i.test(href)
  ) {
    return href
  }

  const suffixIndex = href.search(/[?#]/)
  const relativePath = suffixIndex === -1 ? href : href.slice(0, suffixIndex)
  const suffix = suffixIndex === -1 ? '' : href.slice(suffixIndex)
  const sourceDirectory = sourcePath.slice(0, sourcePath.lastIndexOf('/') + 1)
  const repositoryPath = normaliseRepositoryPath(`${sourceDirectory}${relativePath}`)
  const publishedPath = publishedPathBySourcePath[repositoryPath]

  if (publishedPath) {
    return `${publishedPath}${suffix}`
  }

  const view = relativePath.endsWith('/') ? 'tree' : 'blob'
  return `${repositoryUrl}/${view}/main/${repositoryPath}${relativePath.endsWith('/') ? '/' : ''}${suffix}`
}

/** A GitHub-style anchor slug: the heading text lowered, punctuation dropped, spaces hyphenated. */
const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/`/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

interface ContentsEntry {
  depth: number
  slug: string
  label: string
}

function renderDocument(route: DocumentationRoute): { html: string; contents: readonly ContentsEntry[] } {
  const markdown = markdownBySourcePath[route.sourcePath]
  const contents: ContentsEntry[] = []
  const slugCounts = new Map<string, number>()
  const headingIds = new WeakMap<Tokens.Heading, string>()

  // marked emits no heading ids of its own; walkTokens sees every heading in document order, so it can assign
  // deduplicated slugs and collect the page contents in the same pass that rewrites relative links.
  const marked = new Marked({ gfm: true }).use({
    walkTokens(token) {
      if (token.type === 'link') {
        token.href = rewriteRepositoryLink(token.href, route.sourcePath)
      }
      if (token.type === 'heading') {
        const heading = token as Tokens.Heading
        const base = slugify(heading.text)
        const seen = slugCounts.get(base) ?? 0
        slugCounts.set(base, seen + 1)
        const slug = seen === 0 ? base : `${base}-${seen}`
        headingIds.set(heading, slug)
        if (heading.depth === 2 || heading.depth === 3) {
          contents.push({ depth: heading.depth, slug, label: heading.text.replace(/`/g, '') })
        }
      }
    },
    renderer: {
      heading(token) {
        const body = this.parser.parseInline(token.tokens)
        return `<h${token.depth} id="${headingIds.get(token)}">${body}</h${token.depth}>\n`
      }
    }
  })

  return { html: marked.parse(markdown, { async: false }), contents }
}

export function DocumentPage({ route }: { route: DocumentationRoute }) {
  const { html, contents } = renderDocument(route)

  return (
    <div className="document-shell document-shell--wide docs-shell">
      <a className="skip-link" href="#document-content">
        Skip to content
      </a>
      <SiteNav section="docs" />
      <div className="docs-columns">
        <DocsSidebar currentPath={route.path} />
        <main id="document-content">
          {/* biome-ignore lint/security/noDangerouslySetInnerHtml: html is rendered from repository-authored Markdown under docs/, not user input */}
          <article aria-label={route.title} className="document-content" dangerouslySetInnerHTML={{ __html: html }} />
        </main>
        {contents.length > 0 ? (
          <aside className="docs-toc">
            <nav aria-label="On this page">
              <h2>On this page</h2>
              <ul>
                {contents.map((entry) => (
                  <li className={entry.depth === 3 ? 'docs-toc__sub' : undefined} key={entry.slug}>
                    <a href={`#${entry.slug}`}>{entry.label}</a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
        ) : null}
      </div>
    </div>
  )
}
