import {
  type RuntimeExpandedScene,
  type RuntimeStandaloneScene,
  type RuntimeStory,
  useInfoschematic
} from '@infoschematics/view-canvas'
import {
  createPresentationState,
  createProductionState,
  type DirectTarget,
  derivePresentation,
  directTargetOf,
  type PlayingStory,
  type PresentationAction,
  type ProductionAction,
  type ProductionState,
  reduceProduction,
  type WorkspaceKind
} from '@infoschematics/view-present'
import { useEffect, useMemo, useState } from 'react'
import { usePersistentState } from './use-persistent-state.ts'

type PlayingUpdate = PlayingStory | null | ((current: PlayingStory | null) => PlayingStory | null)

const presentationAction = (action: PresentationAction): ProductionAction => ({
  action,
  type: 'presentation'
})

export function usePresentation() {
  const runtime = useInfoschematic()
  const storage = runtime.compatibilityConfig.id

  // Audience preferences persist. Whether a Producer is producing, which workspace they are in, focus and
  // playback do not.
  const [storedAutoAdvance, setStoredAutoAdvance] = usePersistentState(
    storage && `${storage}.presentation.autoAdvance`,
    true
  )
  const [storedAnnotated, setStoredAnnotated] = usePersistentState(storage && `${storage}.annotated`, false)
  const [overlays, setOverlays] = usePersistentState(storage && `${storage}.overlays`, true)
  const [production, setProduction] = useState(() =>
    createProductionState({
      ...createPresentationState(runtime),
      annotated: storedAnnotated,
      autoAdvance: storedAutoAdvance
    })
  )

  useEffect(() => {
    setStoredAnnotated(production.presentation.annotated)
    setStoredAutoAdvance(production.presentation.autoAdvance)
  }, [production.presentation.annotated, production.presentation.autoAdvance, setStoredAnnotated, setStoredAutoAdvance])

  const derived = useMemo(
    () => derivePresentation(runtime, production.presentation),
    [runtime, production.presentation]
  )

  const dispatch = (action: ProductionAction) => {
    setProduction((current) => reduceProduction(current, action))
  }

  const dispatchPresentation = (action: PresentationAction) => {
    dispatch(presentationAction(action))
  }

  const setProducing = (producing: boolean) => {
    dispatch({ producing, type: 'set-producing' })
  }

  /**
   * Take up one workspace's tools, which is the gesture the toolbar offers and the two axes underneath it.
   *
   * Both actions are folded into one update rather than dispatched twice, so the axes arrive in the same paint and
   * no render sees a Producer producing in the workspace they have just left.
   */
  const produceIn = (kind: WorkspaceKind) => {
    setProduction((current) =>
      reduceProduction(reduceProduction(current, { kind, type: 'enter-workspace' }), {
        producing: true,
        type: 'set-producing'
      })
    )
  }

  const setPlaying = (update: PlayingUpdate) => {
    setProduction((current) => {
      if (current.producing) return current

      const currentPlaying = current.presentation.playing
      const next = typeof update === 'function' ? update(currentPlaying) : update
      if (!next) {
        return reduceProduction(current, presentationAction({ type: 'stop-story' }))
      }

      const story = runtime.stories.find((entry) => entry.id === next.id)
      if (!story || story.steps.length === 0) {
        return reduceProduction(current, presentationAction({ type: 'stop-story' }))
      }

      let nextState: ProductionState = current
      if (currentPlaying?.id !== story.id) {
        nextState = reduceProduction(current, presentationAction({ story, type: 'start-story' }))
      }

      const from = nextState.presentation.playing?.step ?? 0
      const to = ((next.step % story.steps.length) + story.steps.length) % story.steps.length
      return from === to
        ? nextState
        : reduceProduction(
            nextState,
            presentationAction({
              delta: to - from,
              stories: runtime.stories,
              type: 'step-story'
            })
          )
    })
  }

  /*
   * Which scopes and which families are drawn holds on either axis.
   *
   * A Producer laying a Diagram out asks "what is on the surface" as often as a presenter does, and the bank that
   * answers it sits beside the Diagram wherever the Diagram is. The Producer's workspaces used to substitute the complete
   * authored content here, which is why the bank left with Present: a filter nothing honours is worse company for
   * an editing surface than no filter at all.
   *
   * Scene focus is the part that is Present's own, and it is not in here: `derived` narrows by scope and family
   * membership and nothing else, and taking up the Producer's tools clears the focus besides.
   */
  const visibleFamilies = production.presentation.visibleFamilies
  const visibleScopes = production.presentation.visibleScopes
  const visibleCards = derived.visibleCards
  const visibleFabrics = derived.visibleFabrics
  const visibleFlows = derived.visibleFlows

  return {
    annotated: production.presentation.annotated,
    /* The Scene's own cues, derived rather than scheduled here: Studio plays what the document asks for while a
       Scene is on screen, and the rehearsal bank beside it stays the Producer's own occurrence. */
    cueOccurrences: derived.dynamics,
    /* How many stages the focused Scene cascades through, so a timed Sequence beats per stage here as it does in
       Present rather than holding a whole Scene for a cascade that has not finished. */
    cueStages: derived.cueStages,
    cueStage: production.presentation.cueStage,
    repeatingCues: derived.repeatingCues,
    replayCues: () => dispatchPresentation({ type: 'replay-cues' }),
    sceneOccurrence: production.presentation.sceneOccurrence,
    activeSequence: derived.activeSequence,
    activeSequenceScene: derived.activeSequenceScene,
    autoAdvance: production.presentation.autoAdvance,
    directTarget: directTargetOf(production),
    designing: production.producing && production.workspace.kind === 'design',
    directing: production.producing && production.workspace.kind === 'direct',
    highlight: derived.highlight,
    lightNothing: () => dispatchPresentation({ type: 'clear-focus' }),
    presenting: !production.producing,
    producing: production.producing,
    overlays,
    playing: production.presentation.playing,
    reconcileDirectTargets: (availableTargets: readonly DirectTarget[]) =>
      dispatch({ availableTargets, type: 'reconcile-direct-target' }),
    runningStory: derived.runningStory,
    runningStoryScene: derived.runningStoryScene,
    produceIn,
    setDirectTarget: (target: DirectTarget | null) => dispatch({ target, type: 'set-direct-target' }),
    setProducing,
    setPlaying,
    standaloneScene: derived.standaloneScene,
    activateSequence: (sequence: (typeof runtime.sequences)[number], step?: number) =>
      dispatchPresentation(
        step === undefined ? { sequence, type: 'start-sequence' } : { sequence, step, type: 'toggle-sequence-scene' }
      ),
    startStory: (story: RuntimeStory) => dispatchPresentation({ story, type: 'start-story' }),
    stepStory: (delta: number) =>
      dispatchPresentation({
        delta,
        stories: runtime.stories,
        type: 'step-story'
      }),
    stepSequence: (delta: number) =>
      dispatchPresentation({ delta, sequences: runtime.sequences, type: 'step-sequence' }),
    stepExpandedScene: (delta: number) =>
      dispatchPresentation({
        delta,
        scenes: runtime.expandedScenes,
        type: 'step-expanded'
      }),
    stopStory: () => dispatchPresentation({ type: 'stop-story' }),
    stopSequence: () => dispatchPresentation({ type: 'stop-sequence' }),
    expandedScene: derived.expandedScene,
    toggleAnnotated: () =>
      dispatchPresentation({
        type: 'set-annotated',
        value: !production.presentation.annotated
      }),
    toggleAutoAdvance: () =>
      dispatchPresentation({
        type: 'set-auto-advance',
        value: !production.presentation.autoAdvance
      }),
    toggleFamily: (id: string) => dispatchPresentation({ id, type: 'toggle-family' }),
    toggleOverlays: () => setOverlays((visible) => !visible),
    toggleScope: (id: string) => dispatchPresentation({ id, type: 'toggle-scope' }),
    toggleStandaloneScene: (scene: RuntimeStandaloneScene) =>
      dispatchPresentation({ scene, type: 'toggle-standalone-scene' }),
    toggleExpandedScene: (scene: RuntimeExpandedScene) =>
      dispatchPresentation({ scene, type: 'toggle-expanded-scene' }),
    visibleCards,
    visibleFabrics,
    visibleFamilies,
    visibleFlows,
    visibleScopes,
    /** Which tools the Producer is in, whether or not they are producing with them right now. */
    workspace: production.workspace.kind
  }
}

export type Presentation = ReturnType<typeof usePresentation>
