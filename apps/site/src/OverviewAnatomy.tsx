import { renderInfoschematicSvg } from '@infoschematics/render-svg'
import { componentSections } from './visual-guide/curriculum.ts'
import { anatomySpecimen } from './visual-guide/specimens.ts'

export function OverviewAnatomy() {
  const source = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    renderInfoschematicSvg(anatomySpecimen, {
      annotations: true,
      visibility: { graphics: 'all' }
    })
  )}`

  return (
    <section aria-labelledby="labelled-example" className="visual-guide__section overview-anatomy">
      <h2 id="labelled-example">A labelled Infoschematic</h2>
      <p>
        This complete example shows the Canvas, Region, Fabric, Cards, Flows, Point, and Graphic together. The legend
        makes the visual vocabulary self-describing before you explore the individual component pages.
      </p>
      <figure className="visual-guide__anatomy">
        <img
          alt="A labelled Infoschematic showing its Canvas, Region, Fabric, Card, Flows, Point, and Graphic"
          src={source}
        />
        <figcaption>All seven visible parts shown together in one deterministic SVG.</figcaption>
      </figure>
      <ul aria-label="Labels for the complete example" className="visual-guide__anatomy-key">
        {componentSections.map((component) => (
          <li key={component.id}>
            <strong>{component.title}</strong>
            <p>{component.summary}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
