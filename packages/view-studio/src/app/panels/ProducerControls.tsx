import { type RuntimeStory, useInfoschematic, useInfoschematicRenderers } from '@infoschematics/view-canvas'
import type { Ref } from 'react'
import type { Presentation } from '../hooks/use-presentation.ts'

export function ProducerControls({
  onPlay: _onPlay,
  onPlayDynamic,
  playingDynamicId,
  ref,
  presentation
}: {
  onPlay?: (story: RuntimeStory) => void
  /** Play one authored Diagram Dynamic, the way a host binding its id would. */
  onPlayDynamic?: (dynamicId: string) => void
  playingDynamicId?: string
  ref: Ref<HTMLElement>
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

  /*
   * Which scopes and which Flow families are drawn is a question about the Diagram, not about presenting it, so the
   * bank that answers it stays wherever the Diagram is. Playback does belong to presenting: a Sequence or a Dynamic
   * runs the view through states a Producer is in the middle of authoring, so those banks are withheld elsewhere.
   */
  const presenting = presentation.mode === 'present'

  return (
    <section aria-label="Infoschematic controls" className="producer-controls legend" ref={ref}>
      <section className="producer-bank" aria-label="Architectural scopes">
        <span className="producer-label">Architectural scopes</span>
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
              title={`Architectural scope: ${scope.label} — ${scope.description}`}
              type="button"
            >
              {ScopeIcon ? <ScopeIcon aria-hidden={true} size={13} /> : null}
              {scope.label}
            </button>
          )
        })}
      </section>

      <section className="producer-bank" aria-label="Flow families">
        <span className="producer-label">Flow families</span>
        {infoschematicFamilies.map((family) => (
          <button
            aria-label={family.label}
            aria-pressed={presentation.visibleFamilies.has(family.id)}
            className="flow-family-button"
            key={family.id}
            onClick={() => presentation.toggleFamily(family.id)}
            style={{ '--family-color': family.color } as React.CSSProperties}
            title={`Flow family: ${family.label} — ${family.description}`}
            type="button"
          >
            <i aria-hidden="true" style={{ background: family.color }} />
            {family.label}
          </button>
        ))}
      </section>

      {presenting && onPlayDynamic && config.diagram.dynamics.length ? (
        <section className="producer-bank" aria-label="Diagram Dynamics">
          <span className="producer-label">Dynamics</span>
          {config.diagram.dynamics.map((dynamic) => (
            <button
              aria-pressed={playingDynamicId === dynamic.id}
              className="toggle-button"
              key={dynamic.id}
              onClick={() => onPlayDynamic(dynamic.id)}
              title={`${dynamic.label}${dynamic.description ? ` — ${dynamic.description}` : ''}`}
              type="button"
            >
              {dynamic.label}
            </button>
          ))}
        </section>
      ) : null}

      {presenting && sequences.length ? (
        <section className="producer-bank" aria-label="Sequences">
          <span className="producer-label">Sequences</span>
          {sequences.flatMap((sequence) => {
            const selectors =
              sequence.presentation.display === 'expanded'
                ? sequence.scenes.map((scene, step) => (
                    <button
                      aria-pressed={presentation.playing?.id === sequence.id && presentation.playing.step === step}
                      className="toggle-button"
                      disabled={!sceneCanActivate(scene)}
                      key={`${sequence.id}/${scene.id}`}
                      onClick={() => presentation.activateSequence(sequence, step)}
                      title={`${sequence.label} — ${scene.description}`}
                      type="button"
                    >
                      {scene.label}
                    </button>
                  ))
                : [
                    <button
                      aria-pressed={presentation.playing?.id === sequence.id}
                      className="toggle-button"
                      disabled={!sequence.scenes.some(sceneCanActivate)}
                      key={sequence.id}
                      onClick={() => presentation.activateSequence(sequence)}
                      title={`${sequence.code} — ${sequence.description}`}
                      type="button"
                    >
                      {sequence.label}
                    </button>
                  ]
            return sequence.presentation.display === 'expanded' && sequence.presentation.timed
              ? [
                  <button
                    aria-pressed={presentation.playing?.id === sequence.id && presentation.autoAdvance}
                    className="toggle-button"
                    disabled={!sequence.scenes.some(sceneCanActivate)}
                    key={`${sequence.id}/play`}
                    onClick={() => presentation.activateSequence(sequence)}
                    type="button"
                  >
                    Play {sequence.label}
                  </button>,
                  ...selectors
                ]
              : selectors
          })}
          <button
            className="action-button"
            disabled={!presentation.playing}
            onClick={presentation.stopSequence}
            type="button"
          >
            Clear
          </button>
        </section>
      ) : null}
    </section>
  )
}
