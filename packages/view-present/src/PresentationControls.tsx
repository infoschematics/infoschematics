import type { InfoschematicRuntime, RuntimeSequence } from '@infoschematics/view-model/runtime'
import type { CSSProperties } from 'react'
import type { Presentation } from './use-presentation.ts'

export function PresentationControls({
  onActivateSequence,
  presentation,
  runtime
}: {
  onActivateSequence: (sequence: RuntimeSequence, step?: number) => void
  presentation: Presentation
  runtime: InfoschematicRuntime
}) {
  const { dispatch, state } = presentation
  const control = (label: string, pressed: boolean, onClick: () => void, detail?: string) => (
    <button aria-label={label} aria-pressed={pressed} onClick={onClick} title={detail} type="button">
      {label}
    </button>
  )

  return (
    <section className="isp-controls" aria-label="Infoschematic presentation controls">
      <section className="isp-control-bank" aria-label="Architectural scopes">
        <span>Architectural scopes</span>
        {runtime.infoschematicScopes.map((scope) => (
          <span key={scope.id} style={{ '--isp-accent': scope.color } as CSSProperties}>
            {control(
              scope.label,
              state.visibleScopes.has(scope.id),
              () => dispatch({ type: 'toggle-scope', id: scope.id }),
              `Architectural scope: ${scope.description ?? ''}`
            )}
          </span>
        ))}
      </section>

      <section className="isp-control-bank" aria-label="Flow families">
        <span>Flow families</span>
        {runtime.infoschematicFamilies.map((family) => (
          <span key={family.id} style={{ '--isp-accent': family.color } as CSSProperties}>
            {control(
              family.label,
              state.visibleFamilies.has(family.id),
              () => dispatch({ type: 'toggle-family', id: family.id }),
              `Flow family: ${family.description}`
            )}
          </span>
        ))}
      </section>

      {runtime.sequences.length ? (
        <section className="isp-control-bank" aria-label="Sequences">
          <span>Sequences</span>
          {runtime.sequences.flatMap((sequence) => {
            const sceneControls =
              sequence.presentation.display === 'expanded'
                ? sequence.scenes.map((scene, step) => (
                    <span key={`${sequence.id}/${scene.id}`}>
                      {control(
                        scene.label,
                        state.playing?.id === sequence.id && state.playing.step === step,
                        () => onActivateSequence(sequence, step),
                        scene.description
                      )}
                    </span>
                  ))
                : [
                    <span key={sequence.id}>
                      {control(
                        sequence.label,
                        state.playing?.id === sequence.id,
                        () => onActivateSequence(sequence),
                        sequence.description
                      )}
                    </span>
                  ]
            return sequence.presentation.display === 'expanded' && sequence.presentation.timed
              ? [
                  <span key={`${sequence.id}/play`}>
                    {control(
                      `Play ${sequence.label}`,
                      state.playing?.id === sequence.id && state.autoAdvance,
                      () => onActivateSequence(sequence),
                      sequence.description
                    )}
                  </span>,
                  ...sceneControls
                ]
              : sceneControls
          })}
          <button disabled={!state.playing} onClick={() => dispatch({ type: 'stop-sequence' })} type="button">
            Clear
          </button>
        </section>
      ) : null}
    </section>
  )
}
