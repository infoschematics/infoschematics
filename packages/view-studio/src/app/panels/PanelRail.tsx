import { type RuntimeStory, useInfoschematic, useInfoschematicRenderers } from '@infoschematics/view-canvas'
import type { Presentation } from '../hooks/use-presentation.ts'

/*
 * Present controls folded into 48px for a maximised diagram.
 *
 * The rail is a Present affordance and stays one. Scope, Family and Sequence are small, mutually exclusive choices
 * that fit; Design's properties, tools and layer controls and Direct's target chooser are not, so there is no
 * Producer-mode branch here and collapsed is not a compact Producer mode. Entering a Producer mode opens the dock
 * instead - App.tsx holds that transition, and ADR-INFOSCHEMATICS-028 records why it went this way round.
 */
export function PanelRail({
  onPlay: _onPlay,
  presentation
}: {
  onPlay?: (story: RuntimeStory) => void
  presentation: Presentation
}) {
  const { config, infoschematicFamilies, infoschematicFlows, infoschematicRegister, infoschematicScopes, sequences } =
    useInfoschematic()
  const { scopeIcons } = useInfoschematicRenderers()
  const validElements = new Set(infoschematicRegister.all.map(({ id }) => id))
  const validFlows = new Set(infoschematicFlows.map(({ id }) => id))
  /* A Scene is worth activating if it changes what the Diagram shows, and a cue does that: a Scene that focuses
     nothing but asks for a Dynamic is a Scene, not an empty step. */
  const validDynamics = new Set(config.diagram.dynamics.map(({ id }) => id))
  const sceneCanActivate = (scene: (typeof sequences)[number]['scenes'][number]) =>
    scene.components.some((id) => validElements.has(id)) ||
    scene.flows.some((id) => validFlows.has(id)) ||
    scene.cues.some((cue) => validDynamics.has(cue.dynamic))

  if (presentation.mode !== 'present') return null

  return (
    <div className="panel-rail">
      <section className="rail-group" aria-label="Architectural scopes">
        {infoschematicScopes.map((scope) => {
          const ScopeIcon = scope.icon ? scopeIcons?.[scope.icon] : undefined
          return (
            <button
              aria-label={scope.label}
              aria-pressed={presentation.visibleScopes.has(scope.id)}
              className="rail-scope"
              key={scope.id}
              onClick={() => presentation.toggleScope(scope.id)}
              title={`Architectural scope: ${scope.label} — ${scope.description}`}
              type="button"
            >
              {ScopeIcon ? (
                <ScopeIcon aria-hidden={true} size={16} />
              ) : (
                /* A scope's authored name, not the code prefix derived from its id: the rail is 48px wide and
                   `SCOPE-PIPELINE` neither fits it nor tells a reader anything the label does not. With no icon
                   registered it sets down the rail like the Scene and Story entries beneath it. */
                <span className="rail-scope__name">{scope.label}</span>
              )}
            </button>
          )
        })}
      </section>

      <section className="rail-group" aria-label="Flow families">
        {infoschematicFamilies.map((family) => (
          <button
            aria-label={family.label}
            aria-pressed={presentation.visibleFamilies.has(family.id)}
            className="rail-swatch"
            key={family.id}
            onClick={() => presentation.toggleFamily(family.id)}
            style={{ '--family-color': family.color } as React.CSSProperties}
            title={`Flow family: ${family.label} — ${family.description}`}
            type="button"
          />
        ))}
      </section>

      {sequences.length ? (
        <section className="rail-group" aria-label="Sequences">
          {sequences.flatMap((sequence) =>
            sequence.presentation.display === 'expanded'
              ? sequence.scenes.map((scene, step) => (
                  <button
                    aria-label={scene.label}
                    aria-pressed={presentation.playing?.id === sequence.id && presentation.playing.step === step}
                    className="rail-pathway"
                    disabled={!sceneCanActivate(scene)}
                    key={`${sequence.id}/${scene.id}`}
                    onClick={() => presentation.activateSequence(sequence, step)}
                    title={`${sequence.label} — ${scene.description}`}
                    type="button"
                  >
                    {scene.code}
                  </button>
                ))
              : [
                  <button
                    aria-label={sequence.label}
                    aria-pressed={presentation.playing?.id === sequence.id}
                    className="rail-pathway"
                    disabled={!sequence.scenes.some(sceneCanActivate)}
                    key={sequence.id}
                    onClick={() => presentation.activateSequence(sequence)}
                    title={`${sequence.label} — ${sequence.description}`}
                    type="button"
                  >
                    {sequence.code}
                  </button>
                ]
          )}
          <button
            className="rail-toggle"
            disabled={!presentation.playing}
            onClick={presentation.stopSequence}
            title="Stop the Sequence"
            type="button"
          >
            Clear
          </button>
        </section>
      ) : null}
    </div>
  )
}
