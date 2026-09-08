import { blankExamplePath, infoschematicsExamplePath, playgroundPresetPath, systemExamplePath } from './routes.ts'
import { SiteNav } from './SiteNav.tsx'
import './styles.css'

const examples = [
  {
    path: infoschematicsExamplePath,
    preset: 'infoschematics',
    title: 'Infoschematics',
    summary: 'A hosted Infoschematic explaining Infoschematics itself.'
  },
  {
    path: systemExamplePath,
    preset: 'system',
    title: 'A system, explained',
    summary: 'A hosted Infoschematic walking through a wider system.'
  },
  {
    path: blankExamplePath,
    preset: 'blank',
    title: 'Blank Infoschematic',
    summary: 'An empty canvas for starting a new Infoschematic from scratch.'
  }
]

export function ExamplesIndex() {
  return (
    <div className="document-shell document-shell--wide">
      <SiteNav section="examples" />
      <main id="document-content">
        <h1>Examples</h1>
        <ul className="index-list">
          {examples.map((example) => (
            <li key={example.path}>
              <a href={example.path}>{example.title}</a>
              <p>{example.summary}</p>
              <p>
                <a href={playgroundPresetPath(example.preset)}>Open in playground</a>
              </p>
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}
