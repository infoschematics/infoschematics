import type { InfoschematicInput } from '@infoschematics/domain-model'
import { Canvas, type CanvasProps } from '@infoschematics/view-canvas'
import { createInfoschematicRuntime } from '@infoschematics/view-model/runtime'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useCueCadence } from './cues.ts'
import { PresentationControls } from './PresentationControls.tsx'
import { PresentationDetails } from './PresentationDetails.tsx'
import type { SceneSignalPolicy } from './presentation.ts'
import { SceneCallout } from './SceneCallout.tsx'
import { usePresentation } from './use-presentation.ts'

export type PresentProps = Readonly<{
  className?: string
  config: InfoschematicInput
  /**
   * Host-owned occurrences of authored Diagram Dynamics, merged with the ones a Scene's cues ask for.
   *
   * A host occurrence says something outside the presentation happened; a cue is the document asking for a Dynamic
   * while a Scene is on screen. Neither suppresses the other, and a renderer sees both as occurrences it may play.
   */
  dynamics?: CanvasProps['dynamics']
  renderers?: CanvasProps['renderers']
  /** Opt into rendered-size Card detail reduction in the Canvas. */
  responsiveCardDetails?: boolean
  /** Signal focused Flows on Scene entry, or suppress automatic signalling. */
  signalPolicy?: SceneSignalPolicy
}>

export function Present({
  className,
  config,
  dynamics,
  renderers,
  responsiveCardDetails = false,
  signalPolicy = 'focused-flows'
}: PresentProps) {
  const runtime = useMemo(() => createInfoschematicRuntime(config), [config])
  const presentation = usePresentation(runtime, signalPolicy)
  const { derived, dispatch, state } = presentation
  const sequenceCallout = derived.activeSequenceScene?.calloutConfig
  const [detailsVisible, setDetailsVisible] = useState(true)
  const [fullscreen, setFullscreen] = useState(false)
  const root = useRef<HTMLElement>(null)

  const replayCues = useCallback(() => dispatch({ type: 'replay-cues' }), [dispatch])
  useCueCadence(derived.repeatingCues, replayCues, state.sceneOccurrence)

  const occurrences = useMemo(
    () => (dynamics ? [...dynamics, ...derived.dynamics] : derived.dynamics),
    [derived.dynamics, dynamics]
  )

  const stepSequence = useCallback(
    (delta: number) => dispatch({ type: 'step-sequence', sequences: runtime.sequences, delta }),
    [dispatch, runtime.sequences]
  )
  // biome-ignore lint/correctness/useExhaustiveDependencies: pre-existing dependency shape kept as-is; TOOL-015 is toolchain-only and does not change effect/callback behaviour.
  useEffect(() => {
    const { playing } = state
    const { activeSequence, activeSequenceScene } = derived
    if (!playing || !activeSequence || !activeSequenceScene || !activeSequence.presentation.timed || !state.autoAdvance)
      return
    const timer = window.setTimeout(
      () => {
        dispatch({ type: 'step-sequence', sequences: runtime.sequences, delta: 1 })
      },
      Math.max(0, activeSequenceScene.hold)
    )
    return () => window.clearTimeout(timer)
  }, [
    derived.activeSequence,
    derived.activeSequenceScene,
    dispatch,
    runtime.sequences,
    state.autoAdvance,
    state.playing
  ])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target?.closest('input, textarea, select, [role="tablist"]')) return
      if (!state.playing) return
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault()
        stepSequence(event.key === 'ArrowRight' ? 1 : -1)
      } else if (event.key === ' ' || event.key === 'Spacebar') {
        event.preventDefault()
        dispatch({ type: 'set-auto-advance', value: !state.autoAdvance })
      } else if (event.key === 'Escape') {
        event.preventDefault()
        dispatch({ type: 'stop-sequence' })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dispatch, state.autoAdvance, state.playing, stepSequence])

  useEffect(() => {
    const sync = () => setFullscreen(document.fullscreenElement === root.current)
    document.addEventListener('fullscreenchange', sync)
    return () => document.removeEventListener('fullscreenchange', sync)
  }, [])

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => undefined)
    } else {
      void root.current?.requestFullscreen().catch(() => undefined)
    }
  }

  const activateSequence = (sequence: (typeof runtime.sequences)[number], step?: number) => {
    if (step !== undefined) {
      dispatch({ type: 'toggle-sequence-scene', sequence, step })
    } else {
      dispatch(state.playing?.id === sequence.id ? { type: 'stop-sequence' } : { type: 'start-sequence', sequence })
    }
  }

  return (
    <section className={`infoschematic-present${className ? ` ${className}` : ''}`} ref={root}>
      <header className="isp-title-bar">
        <hgroup>
          <h1>{config.title}</h1>
          {config.subtitle ? <p>{config.subtitle}</p> : null}
        </hgroup>
        <div className="isp-title-actions">
          <button
            aria-label="Annotate"
            aria-pressed={state.annotated}
            onClick={() => dispatch({ type: 'set-annotated', value: !state.annotated })}
            type="button"
          >
            Labels
          </button>
          <button
            aria-label="Key takeaways"
            aria-pressed={state.takeaways}
            onClick={() => dispatch({ type: 'set-takeaways', value: !state.takeaways })}
            type="button"
          >
            Takeaways
          </button>
          <button aria-label="Toggle full screen" aria-pressed={fullscreen} onClick={toggleFullscreen} type="button">
            {fullscreen ? 'Exit full screen' : 'Full screen'}
          </button>
          <button
            aria-label="Toggle details"
            aria-pressed={detailsVisible}
            onClick={() => setDetailsVisible((value) => !value)}
            type="button"
          >
            Details
          </button>
        </div>
      </header>

      <div className={`isp-room${detailsVisible ? '' : ' isp-room-wide'}`}>
        <div className="isp-stage">
          <Canvas
            annotated={state.annotated}
            className="isp-canvas"
            config={config}
            dynamics={occurrences}
            flows={derived.visibleFlows}
            graphic={derived.activeSequenceScene?.graphic}
            highlight={derived.highlight}
            renderers={renderers}
            responsiveCardDetails={responsiveCardDetails}
            signals={derived.signals}
            visibleScopes={state.visibleScopes}
          >
            {derived.activeSequenceScene && derived.activeSequence?.presentation.callouts ? (
              <SceneCallout
                autoAdvance={derived.activeSequence.presentation.timed ? state.autoAdvance : undefined}
                body={derived.activeSequenceScene.caption || derived.activeSequenceScene.description}
                calloutConfig={sequenceCallout}
                eyebrow={derived.activeSequence.label}
                logo={derived.activeSequenceScene.logo}
                onExit={() => dispatch({ type: 'stop-sequence' })}
                onStep={stepSequence}
                onToggleAuto={
                  derived.activeSequence.presentation.timed
                    ? () => dispatch({ type: 'set-auto-advance', value: !state.autoAdvance })
                    : undefined
                }
                profile={derived.activeSequenceScene.profile}
                runtime={runtime}
                scene={derived.activeSequenceScene}
                stepNumber={(state.playing?.step ?? 0) + 1}
                stepTotal={derived.activeSequence.scenes.length}
                takeaways={state.takeaways ? derived.activeSequenceScene.takeaways : undefined}
                title={derived.activeSequenceScene.headline}
                wide={derived.activeSequenceScene.cover}
              />
            ) : null}
          </Canvas>
          <PresentationControls onActivateSequence={activateSequence} presentation={presentation} runtime={runtime} />
        </div>
        {detailsVisible ? <PresentationDetails presentation={presentation} runtime={runtime} /> : null}
      </div>
    </section>
  )
}
