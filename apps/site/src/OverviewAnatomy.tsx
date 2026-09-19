import { StaticInfoschematic } from './StaticInfoschematic.tsx'
import { componentSections } from './visual-guide/curriculum.ts'
import { anatomySpecimen } from './visual-guide/specimens.ts'

const anatomyOptions = { annotations: { flows: true }, visibility: { graphics: 'all' } } as const

export function OverviewAnatomy() {
  return (
    <section aria-labelledby="labelled-example" className="visual-guide__section overview-anatomy">
      <h2 id="labelled-example">A labelled Infoschematic</h2>
      <p>
        This complete example shows the Canvas, Region, Fabric, Cards, Flows, Point, and Graphic together. The legend
        makes the visual vocabulary self-describing before you explore the individual component pages.
      </p>
      <figure className="visual-guide__anatomy">
        <StaticInfoschematic
          className="visual-guide__anatomy-drawing"
          input={anatomySpecimen}
          label="A labelled Infoschematic showing its Canvas, Region, Fabric, Card, Flows, Point, and Graphic"
          options={anatomyOptions}
          resourceIdPrefix="overview-anatomy"
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
