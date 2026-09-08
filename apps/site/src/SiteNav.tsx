import { docsIndexPath, examplesIndexPath, playgroundPath } from './routes.ts'

const repositoryUrl = 'https://github.com/infoschematics/infoschematics'

export type SiteSection = 'docs' | 'examples' | 'playground'

export function BrandMark() {
  return (
    <svg aria-hidden="true" className="brand-mark" viewBox="0 0 52 32">
      <path className="brand-mark__rail" d="M9 16h34" />
      <path className="brand-mark__signal" d="M9 16h34" />
      <circle className="brand-mark__node brand-mark__node--first" cx="9" cy="16" r="6" />
      <circle className="brand-mark__node brand-mark__node--last" cx="43" cy="16" r="6" />
    </svg>
  )
}

export function SiteNav({ section }: { section?: SiteSection }) {
  return (
    <header className="site-nav">
      <a aria-label="Infoschematic home" className="wordmark" href="/">
        <BrandMark />
        <span>infoschematic</span>
      </a>
      <nav aria-label="Site">
        <a aria-current={section === 'docs' ? 'page' : undefined} href={docsIndexPath}>
          Docs
        </a>
        <a aria-current={section === 'examples' ? 'page' : undefined} href={examplesIndexPath}>
          Examples
        </a>
        <a aria-current={section === 'playground' ? 'page' : undefined} href={playgroundPath}>
          Playground
        </a>
        <a href={repositoryUrl} rel="noreferrer" target="_blank">
          GitHub
        </a>
      </nav>
    </header>
  )
}
