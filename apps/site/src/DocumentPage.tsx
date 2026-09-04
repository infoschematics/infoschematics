import { marked } from 'marked'
import authoringMarkdown from '../../../docs/guides/authoring.md?raw'
import reactIntegrationMarkdown from '../../../docs/guides/react-integration.md?raw'
import vocabularyMarkdown from '../../../docs/reference/vocabulary.md?raw'
import type { DocumentationRoute } from './routes.ts'
import './styles.css'

const repositoryUrl = 'https://github.com/infoschematics/infoschematics'

const publishedDocuments: Record<string, string> = {
  'docs/guides/authoring.md': '/guides/authoring/',
  'docs/guides/react-integration.md': '/guides/react-integration/',
  'docs/reference/vocabulary.md': '/reference/vocabulary/'
}

const documents: Record<DocumentationRoute['key'], { markdown: string; sourcePath: string }> = {
  authoring: {
    markdown: authoringMarkdown,
    sourcePath: 'docs/guides/authoring.md'
  },
  'react-integration': {
    markdown: reactIntegrationMarkdown,
    sourcePath: 'docs/guides/react-integration.md'
  },
  vocabulary: {
    markdown: vocabularyMarkdown,
    sourcePath: 'docs/reference/vocabulary.md'
  }
}

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
  const publishedPath = publishedDocuments[repositoryPath]

  if (publishedPath) {
    return `${publishedPath}${suffix}`
  }

  const view = relativePath.endsWith('/') ? 'tree' : 'blob'
  return `${repositoryUrl}/${view}/main/${repositoryPath}${relativePath.endsWith('/') ? '/' : ''}${suffix}`
}

export function DocumentPage({ route }: { route: DocumentationRoute }) {
  const document = documents[route.key]
  const html = marked.parse(document.markdown, {
    async: false,
    gfm: true,
    walkTokens(token) {
      if (token.type === 'link') {
        token.href = rewriteRepositoryLink(token.href, document.sourcePath)
      }
    }
  })

  return (
    <div className="document-shell">
      <a className="skip-link" href="#document-content">
        Skip to content
      </a>
      <header className="document-header">
        <a className="document-brand" href="/">
          Infoschematics
        </a>
        <nav aria-label="Documentation">
          <a href="/guides/authoring/">Authoring</a>
          <a href="/guides/react-integration/">React integration</a>
          <a href="/reference/vocabulary/">Vocabulary</a>
        </nav>
      </header>
      <main id="document-content">
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: html is rendered from repository-authored Markdown under docs/, not user input */}
        <article aria-label={route.title} className="document-content" dangerouslySetInnerHTML={{ __html: html }} />
      </main>
      <footer className="document-footer">
        <a href="/">Return to Infoschematics</a>
      </footer>
    </div>
  )
}
