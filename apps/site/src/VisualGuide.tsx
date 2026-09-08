import { renderInfoschematicSvg } from '@infoschematics/render-svg'
import { DocsSidebar } from './DocsSidebar.tsx'
import { visualGuidePath } from './routes.ts'
import { SiteNav } from './SiteNav.tsx'
import {
  cardDetailSpecimens,
  gridSpecimens,
  regionLabelPlacementSpecimens,
  type Specimen,
  surfaceSpecimens
} from './visual-guide/specimens.ts'
import './styles.css'

const groups: { key: string; title: string; specimens: readonly Specimen[] }[] = [
  { key: 'surface', title: 'Surface', specimens: surfaceSpecimens },
  { key: 'grid', title: 'Grid', specimens: gridSpecimens },
  { key: 'card-detail', title: 'Card detail', specimens: cardDetailSpecimens },
  { key: 'region-label', title: 'Region label placement', specimens: regionLabelPlacementSpecimens }
]

function SpecimenCard({ specimen }: { specimen: Specimen }) {
  const source = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(renderInfoschematicSvg(specimen.config))}`

  return (
    <li className="specimen-card">
      <img alt={specimen.caption} src={source} />
      <p>{specimen.caption}</p>
    </li>
  )
}

export function VisualGuide() {
  return (
    <div className="document-shell document-shell--wide docs-shell">
      <SiteNav section="docs" />
      <div className="docs-columns docs-columns--full">
        <DocsSidebar currentPath={visualGuidePath} />
        <main id="document-content">
          <h1>Visual guide</h1>
          {groups.map((group) => (
            <section aria-labelledby={`group-${group.key}`} key={group.key}>
              <h2 id={`group-${group.key}`}>{group.title}</h2>
              <ul className="specimen-grid">
                {group.specimens.map((specimen) => (
                  <SpecimenCard key={specimen.key} specimen={specimen} />
                ))}
              </ul>
            </section>
          ))}
        </main>
      </div>
    </div>
  )
}
