import type { Stage } from '../hooks/use-stage.ts'
import { type RuntimeStory, useInfoschematic } from '../infoschematic-context.tsx'
import { scopeIcon } from '../scope-icons.ts'

// Everything the control surface offers, folded into 48px for the maximised
// diagram, so switching a dimension off never needs the panels back.
export function PanelRail({
  onPlay,
  stage
}: {
  onPlay: (demonstration: RuntimeStory) => void
  stage: Stage
}) {
  const { demonstrations, partnerLogos, topologyFamilies, topologyScopes, vendors } = useInfoschematic()
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
        {topologyScopes.map((scope) => {
          const ScopeIcon = scopeIcon(scope.icon)
          return (
            <button
              aria-label={scope.label}
              aria-pressed={stage.visibleScopes.has(scope.id)}
              className="rail-scope"
              key={scope.id}
              onClick={() => stage.toggleScope(scope.id)}
              title={`${scope.label} — ${scope.description}`}
              type="button"
            >
              <ScopeIcon aria-hidden="true" size={16} />
            </button>
          )
        })}
        <button
          className="rail-toggle"
          onClick={() => stage.showAllScopes(!stage.hasVisibleScopes)}
          title={stage.hasVisibleScopes ? 'Hide all components' : 'Show all components'}
          type="button"
        >
          {stage.hasVisibleScopes ? 'Hide' : 'Show'}
        </button>
      </section>

      <section className="rail-group" aria-label="Families">
        {topologyFamilies.map((family) => (
          <button
            aria-label={family.label}
            aria-pressed={stage.visibleFamilies.has(family.id)}
            className="rail-swatch"
            key={family.id}
            onClick={() => stage.toggleFamily(family.id)}
            style={{ '--family-color': family.color } as React.CSSProperties}
            title={`${family.label} — ${family.description}`}
            type="button"
          />
        ))}
        <button
          className="rail-toggle"
          onClick={() => stage.showAllFamilies(!stage.hasVisibleFamilies)}
          title={stage.hasVisibleFamilies ? 'Hide all flows' : 'Show all flows'}
          type="button"
        >
          {stage.hasVisibleFamilies ? 'Hide' : 'Show'}
        </button>
      </section>

      <section className="rail-group" aria-label="Stories">
        {demonstrations.map((demonstration) => (
          <button
            aria-label={demonstration.label}
            aria-pressed={stage.playing?.id === demonstration.id}
            className="rail-pathway"
            key={demonstration.id}
            onClick={() => onPlay(demonstration)}
            title={`${demonstration.label} — ${demonstration.question}`}
            type="button"
          >
            {demonstration.short ?? demonstration.code}
          </button>
        ))}
        <button
          className="rail-toggle"
          disabled={!stage.playing}
          onClick={() => stage.stopDemonstration()}
          title="Stop the story"
          type="button"
        >
          Clear
        </button>
      </section>

      {/* Theme scenes use compact codes here because the collapsed rail has no
          room for their full labels. */}
      <section className="rail-group" aria-label="Partners">
        {vendors.map((entry) => (
          <button
            aria-label={entry.label}
            aria-pressed={stage.vendor?.id === entry.id}
            className="rail-pathway rail-partner"
            key={entry.id}
            onClick={() => stage.toggleVendor(entry)}
            title={`${entry.label} — ${entry.headline}`}
            type="button"
          >
            {partnerLogos[entry.id] ? <img alt="" src={partnerLogos[entry.id]} /> : entry.code}
          </button>
        ))}
        <button
          className="rail-toggle"
          disabled={!stage.vendor}
          onClick={() => stage.lightNothing()}
          title="Clear the partner"
          type="button"
        >
          Clear
        </button>
      </section>
    </div>
  )
}
