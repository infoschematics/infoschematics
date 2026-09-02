import type { Ref } from 'react'
import type { Stage } from '../hooks/use-stage.ts'
import { type RuntimeStory, useInfoschematic } from '../infoschematic-context.tsx'
import { scopeIcon } from '../scope-icons.ts'
import { PartnerStrip } from './PartnerStrip.tsx'

// Four banks in two rows: what is on stage and what its lines carry above, what
// to play and whose work to light below. The top two filter and the bottom two
// light, which is the same division the stage makes internally between what is
// present and what is lit.
export function Lighting({
  onPlay,
  ref,
  stage
}: {
  onPlay: (demonstration: RuntimeStory) => void
  ref: Ref<HTMLElement>
  stage: Stage
}) {
  const { demonstrations, topologyFamilies, topologyScopes } = useInfoschematic()
  return (
    <section className="lighting-panel legend" aria-label="Topology controls" ref={ref}>
      {/* Named for the taxonomy each bank toggles rather than for what it
          filters. Component now means anything on the stage, so a bank called
          Components that leaves the flows out would be the one word this
          vocabulary just widened, used narrowly. Scope and family are what the
          buttons actually are. */}
      <section className="lighting-bank" aria-label="Scopes">
        <span className="lighting-label">Scopes</span>
        {topologyScopes.map((scope) => {
          // The same mark the collapsed rail uses, so a scope is recognised by
          // one thing however the panel is showing it.
          const ScopeIcon = scopeIcon(scope.icon)
          return (
            <button
              aria-label={scope.label}
              aria-pressed={stage.visibleScopes.has(scope.id)}
              className="scope-button"
              key={scope.id}
              onClick={() => stage.toggleScope(scope.id)}
              style={{ '--family-color': scope.color } as React.CSSProperties}
              title={`${scope.label} — ${scope.description}`}
              type="button"
            >
              <ScopeIcon aria-hidden="true" size={13} />
              {scope.prefix}
            </button>
          )
        })}
        <button className="action-button" onClick={() => stage.showAllScopes(!stage.hasVisibleScopes)} type="button">
          {stage.hasVisibleScopes ? 'Hide' : 'Show'}
        </button>
      </section>

      <section className="lighting-bank" aria-label="Families">
        <span className="lighting-label">Families</span>
        {topologyFamilies.map((family) => (
          <button
            aria-pressed={stage.visibleFamilies.has(family.id)}
            aria-label={family.label}
            className="flow-family-button"
            key={family.id}
            onClick={() => stage.toggleFamily(family.id)}
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
          onClick={() => stage.showAllFamilies(!stage.hasVisibleFamilies)}
          type="button"
        >
          {stage.hasVisibleFamilies ? 'Hide' : 'Show'}
        </button>
      </section>

      <section className="lighting-bank" aria-label="Stories">
        <span className="lighting-label">Stories</span>
        {demonstrations.map((demonstration) => (
          <button
            aria-pressed={stage.playing?.id === demonstration.id}
            className="toggle-button"
            key={demonstration.id}
            onClick={() => onPlay(demonstration)}
            title={`${demonstration.code} — ${demonstration.question}`}
            type="button"
          >
            {demonstration.label}
          </button>
        ))}
        <button
          className="action-button"
          disabled={!stage.playing}
          onClick={() => stage.stopDemonstration()}
          type="button"
        >
          Clear
        </button>
      </section>

      {/* The fourth bank, and the fourth thing that lights the stage. Partners
          are this diagram's use of a mechanism the stage already has: a named
          set of components and flows, lit together, dimming the rest. */}
      <section className="lighting-bank" aria-label="Partners">
        <span className="lighting-label">Partners</span>
        <PartnerStrip stage={stage} />
        <button className="action-button" disabled={!stage.vendor} onClick={() => stage.lightNothing()} type="button">
          Clear
        </button>
      </section>
    </section>
  )
}
