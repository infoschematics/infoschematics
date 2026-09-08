import { marked } from 'marked'
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

export function DocumentPage({ route }: { route: DocumentationRoute }) {
  const markdown = markdownBySourcePath[route.sourcePath]
  const html = marked.parse(markdown, {
    async: false,
    gfm: true,
    walkTokens(token) {
      if (token.type === 'link') {
        token.href = rewriteRepositoryLink(token.href, route.sourcePath)
      }
    }
  })

  return (
    <div className="document-shell">
      <a className="skip-link" href="#document-content">
        Skip to content
      </a>
      <SiteNav section="docs" />
      <main id="document-content">
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: html is rendered from repository-authored Markdown under docs/, not user input */}
        <article aria-label={route.title} className="document-content" dangerouslySetInnerHTML={{ __html: html }} />
      </main>
      <footer className="document-footer">
        <a href="/docs/">Back to documentation</a>
      </footer>
    </div>
  )
}
