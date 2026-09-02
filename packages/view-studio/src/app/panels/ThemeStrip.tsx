import type { Presentation } from '../hooks/use-presentation.ts'
import { useInfoschematic } from '../infoschematic-context.tsx'

/*
 * Who is in the consortium, and what each of them provides.
 *
 * A bank on the control surface rather than a strip along the header. It sat at
 * the top because a visitor should see whose work this is before they see
 * anything else - but it does the same job as the three banks below it, focusing
 * a named set of components and flows and dimming the rest, and a control
 * that behaves like its neighbours should sit with them.
 *
 * A Thematic Scene's mark where one has been configured under its own id, and
 * its name otherwise. One or the other, never both: a
 * wordmark is the name already drawn, so setting it beside the name says it
 * twice.
 */
export function ThemeStrip({ presentation }: { presentation: Presentation }) {
  const { thematicScenes, themeLogos } = useInfoschematic()
  return (
    <>
      {thematicScenes.map((entry) => (
        <button
          aria-pressed={presentation.thematicScene?.id === entry.id}
          className="theme-button"
          key={entry.id}
          onClick={() => presentation.toggleThematicScene(entry)}
          title={`${entry.label} — ${entry.headline}`}
          type="button"
        >
          {themeLogos[entry.id] ? <img alt={entry.label} src={themeLogos[entry.id]} /> : (entry.short ?? entry.label)}
        </button>
      ))}
    </>
  )
}
