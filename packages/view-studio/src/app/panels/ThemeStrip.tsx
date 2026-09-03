import { useMemo } from 'react'
import { useInfoschematic } from '@infoschematics/view-canvas'
import { themeCanActivate } from '../editor/theme-composition.ts'
import type { Presentation } from '../hooks/use-presentation.ts'

/* Thematic Scenes appear alongside other Present focus controls. */
export function ThemeStrip({
  compact = false,
  presentation,
}: {
  compact?: boolean
  presentation: Presentation
}) {
  const { config, thematicScenes, themeLogos } = useInfoschematic()
  const validArtefactIds = useMemo(
    () =>
      new Set([
        ...config.infoschematic.cards.map((entry) => entry.id),
        ...config.infoschematic.fabrics.map((entry) => entry.id),
        ...config.infoschematic.points.map((entry) => entry.id),
      ]),
    [
      config.infoschematic.cards,
      config.infoschematic.fabrics,
      config.infoschematic.points,
    ],
  )
  const validFlowIds = useMemo(
    () => new Set(config.infoschematic.flows.map((entry) => entry.id)),
    [config.infoschematic.flows],
  )
  const activatableSceneIds = useMemo(
    () =>
      new Set(
        config.themes.flatMap((theme) =>
          theme.scenes
            .filter((scene) =>
              themeCanActivate(
                { ...theme, scenes: [scene] },
                validArtefactIds,
                validFlowIds,
              ),
            )
            .map((scene) => scene.id),
        ),
      ),
    [config.themes, validArtefactIds, validFlowIds],
  )

  if (presentation.mode !== 'present') return null

  return (
    <>
      {thematicScenes.map((entry) => {
        const enabled = activatableSceneIds.has(entry.id)
        return (
          <button
            aria-label={compact ? entry.label : undefined}
            aria-pressed={presentation.thematicScene?.id === entry.id}
            className={compact ? 'rail-pathway rail-theme' : 'theme-button'}
            disabled={!enabled}
            key={entry.id}
            onClick={() => presentation.toggleThematicScene(entry)}
            title={`${entry.label} — ${entry.headline}`}
            type="button"
          >
            {themeLogos[entry.id] ? (
              <img
                alt={compact ? '' : entry.label}
                src={themeLogos[entry.id]}
              />
            ) : compact ? (
              entry.code
            ) : (
              (entry.short ?? entry.label)
            )}
          </button>
        )
      })}
    </>
  )
}
