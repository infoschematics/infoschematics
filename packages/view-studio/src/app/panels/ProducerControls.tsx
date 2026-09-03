import type { Ref } from 'react'
import type { Presentation } from '../hooks/use-presentation.ts'
import { type RuntimeStory, useInfoschematic } from '@infoschematics/view-canvas'
import { useInfoschematicRenderers } from '@infoschematics/view-canvas'
import { ThemeStrip } from './ThemeStrip.tsx'

// Four banks in two rows: what is on Infoschematic and what its lines carry above, what
// to play and whose work to light below. The top two filter and the bottom two
// light, which is the same division the Infoschematic makes internally between what is
// present and what is lit.
export function ProducerControls({
  onPlay,
  ref,
  presentation,
}: {
  onPlay: (story: RuntimeStory) => void
  ref: Ref<HTMLElement>
  presentation: Presentation
}) {
  const { infoschematicFamilies, infoschematicScopes, stories } = useInfoschematic()
  const { scopeIcons } = useInfoschematicRenderers()
  return (
    <section className="producer-controls legend" aria-label="Infoschematic controls" ref={ref}>
      {/* Named for the taxonomy each bank toggles rather than for what it
          filters. Component now means anything on the Infoschematic, so a bank called
          Components that leaves the flows out would be the one word this
          vocabulary just widened, used narrowly. Scope and family are what the
          buttons actually are. */}
      <section className="producer-bank" aria-label="Scopes">
        <span className="producer-label">Scopes</span>
        {infoschematicScopes.map((scope) => {
          // The same mark the collapsed rail uses, so a scope is recognised by
          // one thing however the panel is showing it.
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
            aria-pressed={presentation.visibleFamilies.has(family.id)}
            aria-label={family.label}
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
        {stories.map((story) => (
          <button
            aria-pressed={presentation.playing?.id === story.id}
            className="toggle-button"
            key={story.id}
            onClick={() => onPlay(story)}
            title={`${story.code} — ${story.question}`}
            type="button"
          >
            {story.label}
          </button>
        ))}
        <button
          className="action-button"
          disabled={!presentation.playing}
          onClick={() => presentation.stopStory()}
          type="button"
        >
          Clear
        </button>
      </section>

      {/* The fourth bank, and the fourth thing that focuses the Infoschematic. Themes
          use the same mechanism as other Scenes: a named
          set of components and flows, lit together, dimming the rest. */}
      <section className="producer-bank" aria-label="Themes">
        <span className="producer-label">Themes</span>
        <ThemeStrip presentation={presentation} />
        <button
          className="action-button"
          disabled={!presentation.thematicScene}
          onClick={() => presentation.lightNothing()}
          type="button"
        >
          Clear
        </button>
      </section>
    </section>
  )
}
