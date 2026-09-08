import { blankExamplePath, infoschematicsExamplePath, systemExamplePath } from './routes.ts'
import { SiteNav } from './SiteNav.tsx'
import './styles.css'

const examples = [
  {
    path: infoschematicsExamplePath,
    title: 'Infoschematics',
    summary: 'A hosted Infoschematic explaining Infoschematics itself.'
  },
  {
    path: systemExamplePath,
    title: 'A system, explained',
    summary: 'A hosted Infoschematic walking through a wider system.'
  },
  {
    path: blankExamplePath,
    title: 'Blank Infoschematic',
    summary: 'An empty canvas for starting a new Infoschematic from scratch.'
  }
]

export function ExamplesIndex() {
  return (
    <div className="document-shell">
      <SiteNav section="examples" />
      <main id="document-content">
        <h1>Examples</h1>
        <ul className="index-list">
          {examples.map((example) => (
            <li key={example.path}>
              <a href={example.path}>{example.title}</a>
              <p>{example.summary}</p>
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}
