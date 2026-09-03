import type { Presentation } from '../hooks/use-presentation.ts'
import { useInfoschematic } from '@infoschematics/view-canvas'

/* Thematic Scenes appear alongside the other focus controls. */
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
