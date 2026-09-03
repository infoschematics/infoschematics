import {
  type RuntimeStory,
  useInfoschematic,
  useInfoschematicRenderers,
} from '@infoschematics/view-canvas'
import { storyCanActivate, storyForEditing } from '../editor/scenes.ts'
import type { Presentation } from '../hooks/use-presentation.ts'
import { ThemeStrip } from './ThemeStrip.tsx'

/* Present controls folded into 48px for a maximised diagram. */
export function PanelRail({
  onPlay,
  presentation,
}: {
  onPlay: (story: RuntimeStory) => void
  presentation: Presentation
}) {
  const { config, infoschematicFamilies, infoschematicScopes, stories } =
    useInfoschematic()
  const { scopeIcons } = useInfoschematicRenderers()
  const standaloneSceneIds = new Set(
    config.standaloneScenes.map((scene) => scene.id),
  )

  if (presentation.mode !== 'present') return null

  return (
    <div className="panel-rail">
      <section className="rail-group" aria-label="Scopes">
        {infoschematicScopes.map((scope) => {
          const ScopeIcon = scope.icon ? scopeIcons?.[scope.icon] : undefined
          return (
            <button
              aria-label={scope.label}
              aria-pressed={presentation.visibleScopes.has(scope.id)}
              className="rail-scope"
              key={scope.id}
              onClick={() => presentation.toggleScope(scope.id)}
              title={`${scope.label} — ${scope.description}`}
              type="button"
            >
              {ScopeIcon ? (
                <ScopeIcon aria-hidden={true} size={16} />
              ) : (
                scope.prefix
              )}
            </button>
          )
        })}
        <button
          className="rail-toggle"
          onClick={() =>
            presentation.showAllScopes(!presentation.hasVisibleScopes)
          }
          title={
            presentation.hasVisibleScopes
              ? 'Hide all components'
              : 'Show all components'
          }
          type="button"
        >
          {presentation.hasVisibleScopes ? 'Hide' : 'Show'}
        </button>
      </section>

      <section className="rail-group" aria-label="Families">
        {infoschematicFamilies.map((family) => (
          <button
            aria-label={family.label}
            aria-pressed={presentation.visibleFamilies.has(family.id)}
            className="rail-swatch"
            key={family.id}
            onClick={() => presentation.toggleFamily(family.id)}
            style={{ '--family-color': family.color } as React.CSSProperties}
            title={`${family.label} — ${family.description}`}
            type="button"
          />
        ))}
        <button
          className="rail-toggle"
          onClick={() =>
            presentation.showAllFamilies(!presentation.hasVisibleFamilies)
          }
          title={
            presentation.hasVisibleFamilies
              ? 'Hide all flows'
              : 'Show all flows'
          }
          type="button"
        >
          {presentation.hasVisibleFamilies ? 'Hide' : 'Show'}
        </button>
      </section>

      <section className="rail-group" aria-label="Stories">
        {stories.map((story) => {
          const authored = config.stories.find(
            (candidate) => candidate.id === story.id,
          )
          const enabled = authored
            ? storyCanActivate(
                storyForEditing(authored, config.standaloneScenes),
                standaloneSceneIds,
              )
            : false
          return (
            <button
              aria-label={story.label}
              aria-pressed={presentation.playing?.id === story.id}
              className="rail-pathway"
              disabled={!enabled}
              key={story.id}
              onClick={() => onPlay(story)}
              title={`${story.label} — ${story.question}`}
              type="button"
            >
              {story.short ?? story.code}
            </button>
          )
        })}
        <button
          className="rail-toggle"
          disabled={!presentation.playing}
          onClick={presentation.stopStory}
          title="Stop the Story"
          type="button"
        >
          Clear
        </button>
      </section>

      <section className="rail-group" aria-label="Themes">
        <ThemeStrip compact presentation={presentation} />
        <button
          className="rail-toggle"
          disabled={!presentation.thematicScene}
          onClick={presentation.lightNothing}
          title="Clear Theme"
          type="button"
        >
          Clear
        </button>
      </section>
    </div>
  )
}
