import { type RuntimeStory, useInfoschematic, useInfoschematicRenderers } from '@infoschematics/view-canvas'
import type { Ref } from 'react'
import { storyCanActivate, storyForEditing } from '../editor/scenes.ts'
import type { Presentation } from '../hooks/use-presentation.ts'
import { ThemeStrip } from './ThemeStrip.tsx'

export function ProducerControls({
  onPlay,
  ref,
  presentation
}: {
  onPlay: (story: RuntimeStory) => void
  ref: Ref<HTMLElement>
  presentation: Presentation
}) {
  const { config, infoschematicFamilies, infoschematicScopes, stories } = useInfoschematic()
  const { scopeIcons } = useInfoschematicRenderers()
  const standaloneSceneIds = new Set(config.standaloneScenes.map((scene) => scene.id))

  if (presentation.mode !== 'present') return null

  return (
    <section aria-label="Infoschematic controls" className="producer-controls legend" ref={ref}>
      <section className="producer-bank" aria-label="Scopes">
        <span className="producer-label">Scopes</span>
        {infoschematicScopes.map((scope) => {
          const ScopeIcon = scope.icon ? scopeIcons?.[scope.icon] : undefined
          return (
            <button
              aria-label={scope.label}
              aria-pressed={presentation.visibleScopes.has(scope.id)}
              className="scope-button"
              key={scope.id}
              onClick={() => presentation.toggleScope(scope.id)}
              style={{ '--family-color': scope.color } as React.CSSProperties}
              title={`${scope.label} — ${scope.description}`}
              type="button"
            >
              {ScopeIcon ? <ScopeIcon aria-hidden={true} size={13} /> : null}
              {scope.prefix}
            </button>
          )
        })}
        <button
          className="action-button"
          onClick={() => presentation.showAllScopes(!presentation.hasVisibleScopes)}
          type="button"
        >
          {presentation.hasVisibleScopes ? 'Hide' : 'Show'}
        </button>
      </section>

      <section className="producer-bank" aria-label="Families">
        <span className="producer-label">Families</span>
        {infoschematicFamilies.map((family) => (
          <button
            aria-label={family.label}
            aria-pressed={presentation.visibleFamilies.has(family.id)}
            className="flow-family-button"
            key={family.id}
            onClick={() => presentation.toggleFamily(family.id)}
            style={{ '--family-color': family.color } as React.CSSProperties}
            title={`${family.label} — ${family.description}`}
            type="button"
          >
            <i aria-hidden="true" style={{ background: family.color }} />
            {family.prefix}
          </button>
        ))}
        <button
          className="action-button"
          onClick={() => presentation.showAllFamilies(!presentation.hasVisibleFamilies)}
          type="button"
        >
          {presentation.hasVisibleFamilies ? 'Hide' : 'Show'}
        </button>
      </section>

      <section className="producer-bank" aria-label="Stories">
        <span className="producer-label">Stories</span>
        {stories.map((story) => {
          const authored = config.stories.find((candidate) => candidate.id === story.id)
          const enabled = authored
            ? storyCanActivate(storyForEditing(authored, config.standaloneScenes), standaloneSceneIds)
            : false
          return (
            <button
              aria-pressed={presentation.playing?.id === story.id}
              className="toggle-button"
              disabled={!enabled}
              key={story.id}
              onClick={() => onPlay(story)}
              title={`${story.code} — ${story.question}`}
              type="button"
            >
              {story.label}
            </button>
          )
        })}
        <button
          className="action-button"
          disabled={!presentation.playing}
          onClick={presentation.stopStory}
          type="button"
        >
          Clear
        </button>
      </section>

      <section className="producer-bank" aria-label="Themes">
        <span className="producer-label">Themes</span>
        <ThemeStrip presentation={presentation} />
        <button
          className="action-button"
          disabled={!presentation.thematicScene}
          onClick={presentation.lightNothing}
          type="button"
        >
          Clear
        </button>
      </section>
    </section>
  )
}
