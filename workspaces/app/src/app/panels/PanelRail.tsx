import type { Presentation } from '../hooks/use-presentation.ts'
import { type RuntimeStory, useInfoschematic } from '../infoschematic-context.tsx'
import { scopeIcon } from '../scope-icons.ts'

// Everything the control surface offers, folded into 48px for the maximised
// diagram, so switching a dimension off never needs the panels back.
export function PanelRail({
  onPlay,
  presentation,
}: {
  onPlay: (story: RuntimeStory) => void
  presentation: Presentation
}) {
  const { infoschematicFamilies, infoschematicScopes, stories, thematicScenes, themeLogos } = useInfoschematic()
  return (
    <div className="panel-rail">
      {/*
       * No expand, no annotate, no takeaways, no fullscreen.
       *
       * All four are in the title bar, which does not move when the panels
       * collapse - so having them here too meant the same control appeared in
       * two places and jumped between them as the panel opened and shut. What
       * is left is what only the rail has: the filters, small enough to sit in
       * a column and useless anywhere else.
       */}
      <section className="rail-group" aria-label="Scopes">
        {infoschematicScopes.map((scope) => {
          const ScopeIcon = scopeIcon(scope.icon)
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
              <ScopeIcon aria-hidden="true" size={16} />
            </button>
          )
        })}
        <button
          className="rail-toggle"
          onClick={() => presentation.showAllScopes(!presentation.hasVisibleScopes)}
          title={presentation.hasVisibleScopes ? 'Hide all components' : 'Show all components'}
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
          onClick={() => presentation.showAllFamilies(!presentation.hasVisibleFamilies)}
          title={presentation.hasVisibleFamilies ? 'Hide all flows' : 'Show all flows'}
          type="button"
        >
          {presentation.hasVisibleFamilies ? 'Hide' : 'Show'}
        </button>
      </section>

      <section className="rail-group" aria-label="Stories">
        {stories.map((story) => (
          <button
            aria-label={story.label}
            aria-pressed={presentation.playing?.id === story.id}
            className="rail-pathway"
            key={story.id}
            onClick={() => onPlay(story)}
            title={`${story.label} — ${story.question}`}
            type="button"
          >
            {story.short ?? story.code}
          </button>
        ))}
        <button
          className="rail-toggle"
          disabled={!presentation.playing}
          onClick={() => presentation.stopStory()}
          title="Stop the story"
          type="button"
        >
          Clear
        </button>
      </section>

      {/* Theme scenes use compact codes here because the collapsed rail has no
          room for their full labels. */}
      <section className="rail-group" aria-label="Themes">
        {thematicScenes.map((entry) => (
          <button
            aria-label={entry.label}
            aria-pressed={presentation.thematicScene?.id === entry.id}
            className="rail-pathway rail-theme"
            key={entry.id}
            onClick={() => presentation.toggleThematicScene(entry)}
            title={`${entry.label} — ${entry.headline}`}
            type="button"
          >
            {themeLogos[entry.id] ? <img alt="" src={themeLogos[entry.id]} /> : entry.code}
          </button>
        ))}
        <button
          className="rail-toggle"
          disabled={!presentation.thematicScene}
          onClick={() => presentation.lightNothing()}
          title="Clear the Theme"
          type="button"
        >
          Clear
        </button>
      </section>
    </div>
  )
}
