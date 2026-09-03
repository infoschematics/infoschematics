import { useEffect, useMemo, useState } from 'react'
import {
  type RuntimeStandaloneScene,
  type RuntimeStory,
  type RuntimeThemeScene,
  useInfoschematic,
} from '@infoschematics/view-canvas'
import {
  createPresentationState,
  createProductionState,
  derivePresentation,
  type DirectTarget,
  type PlayingStory,
  type PresentationAction,
  type ProductionAction,
  type ProductionMode,
  type ProductionState,
  reduceProduction,
} from '@infoschematics/view-present'
import { usePersistentState } from './use-persistent-state.ts'

export type { PlayingStory } from '@infoschematics/view-present'

type PlayingUpdate =
  | PlayingStory
  | null
  | ((current: PlayingStory | null) => PlayingStory | null)

const presentationAction = (action: PresentationAction): ProductionAction => ({
  action,
  type: 'presentation',
})

export function usePresentation() {
  const runtime = useInfoschematic()
  const allFamilyIds = runtime.infoschematicFamilies.map((family) => family.id)
  const allScopeIds = runtime.infoschematicScopes.map((scope) => scope.id)
  const storage = runtime.config.id

  // Audience preferences persist. Production mode, focus and playback do not.
  const [storedAutoAdvance, setStoredAutoAdvance] = usePersistentState(
    storage && `${storage}.presentation.autoAdvance`,
    true,
  )
  const [storedAnnotated, setStoredAnnotated] = usePersistentState(
    storage && `${storage}.annotated`,
    false,
  )
  const [storedTakeaways, setStoredTakeaways] = usePersistentState(
    storage && `${storage}.takeaways`,
    true,
  )
  const [production, setProduction] = useState(() =>
    createProductionState({
      ...createPresentationState(runtime),
      annotated: storedAnnotated,
      autoAdvance: storedAutoAdvance,
      takeaways: storedTakeaways,
    }),
  )

  useEffect(() => {
    setStoredAnnotated(production.presentation.annotated)
    setStoredAutoAdvance(production.presentation.autoAdvance)
    setStoredTakeaways(production.presentation.takeaways)
  }, [
    production.presentation.annotated,
    production.presentation.autoAdvance,
    production.presentation.takeaways,
    setStoredAnnotated,
    setStoredAutoAdvance,
    setStoredTakeaways,
  ])

  const derived = useMemo(
    () => derivePresentation(runtime, production.presentation),
    [runtime, production.presentation],
  )

  const dispatch = (action: ProductionAction) => {
    setProduction((current) => reduceProduction(current, action))
  }

  const dispatchPresentation = (action: PresentationAction) => {
    dispatch(presentationAction(action))
  }

  const setMode = (mode: ProductionMode) => {
    dispatch({ mode, type: 'set-mode' })
  }

  const setPlaying = (update: PlayingUpdate) => {
    setProduction((current) => {
      if (current.mode !== 'present') return current

      const currentPlaying = current.presentation.playing
      const next =
        typeof update === 'function' ? update(currentPlaying) : update
      if (!next) {
        return reduceProduction(
          current,
          presentationAction({ type: 'stop-story' }),
        )
      }

      const story = runtime.stories.find((entry) => entry.id === next.id)
      if (!story || story.steps.length === 0) {
        return reduceProduction(
          current,
          presentationAction({ type: 'stop-story' }),
        )
      }

      let nextState: ProductionState = current
      if (currentPlaying?.id !== story.id) {
        nextState = reduceProduction(
          current,
          presentationAction({ story, type: 'start-story' }),
        )
      }

      const from = nextState.presentation.playing?.step ?? 0
      const to =
        ((next.step % story.steps.length) + story.steps.length) %
        story.steps.length
      return from === to
        ? nextState
        : reduceProduction(
            nextState,
            presentationAction({
              delta: to - from,
              stories: runtime.stories,
              type: 'step-story',
            }),
          )
    })
  }

  // Producer modes render complete authored content. Audience filters remain in
  // presentation state and become visible again when Present resumes.
  const producerMode = production.mode !== 'present'
  const visibleFamilies = producerMode
    ? new Set(allFamilyIds)
    : production.presentation.visibleFamilies
  const visibleScopes = producerMode
    ? new Set(allScopeIds)
    : production.presentation.visibleScopes
  const visibleCards = producerMode
    ? runtime.infoschematicCards
    : derived.visibleCards
  const visibleFabrics = producerMode
    ? runtime.infoschematicFabrics
    : derived.visibleFabrics
  const visibleFlows = producerMode
    ? runtime.infoschematicFlows
    : derived.visibleFlows

  return {
    annotated: production.presentation.annotated,
    autoAdvance: production.presentation.autoAdvance,
    directTarget: production.directTarget,
    designing: production.mode === 'design',
    hasVisibleFamilies: visibleFamilies.size > 0,
    hasVisibleScopes: visibleScopes.size > 0,
    highlight: derived.highlight,
    lightNothing: () => dispatchPresentation({ type: 'clear-focus' }),
    mode: production.mode,
    playing: production.presentation.playing,
    reconcileDirectTargets: (availableTargets: readonly DirectTarget[]) =>
      dispatch({ availableTargets, type: 'reconcile-direct-target' }),
    runningStory: derived.runningStory,
    runningStoryScene: derived.runningStoryScene,
    setDesigning: (designing: boolean) =>
      setMode(designing ? 'design' : 'present'),
    setDirectTarget: (target: DirectTarget | null) =>
      dispatch({ target, type: 'set-direct-target' }),
    setMode,
    setPlaying,
    showAllFamilies: (show: boolean) =>
      dispatchPresentation({
        ids: allFamilyIds,
        type: 'show-all-families',
        value: show,
      }),
    showAllScopes: (show: boolean) =>
      dispatchPresentation({
        ids: allScopeIds,
        type: 'show-all-scopes',
        value: show,
      }),
    standaloneScene: derived.standaloneScene,
    startStory: (story: RuntimeStory) =>
      dispatchPresentation({ story, type: 'start-story' }),
    stepStory: (delta: number) =>
      dispatchPresentation({
        delta,
        stories: runtime.stories,
        type: 'step-story',
      }),
    stepThematicScene: (delta: number) =>
      dispatchPresentation({
        delta,
        scenes: runtime.thematicScenes,
        type: 'step-theme',
      }),
    stopStory: () => dispatchPresentation({ type: 'stop-story' }),
    takeaways: production.presentation.takeaways,
    thematicScene: derived.thematicScene,
    toggleAnnotated: () =>
      dispatchPresentation({
        type: 'set-annotated',
        value: !production.presentation.annotated,
      }),
    toggleAutoAdvance: () =>
      dispatchPresentation({
        type: 'set-auto-advance',
        value: !production.presentation.autoAdvance,
      }),
    toggleFamily: (id: string) =>
      dispatchPresentation({ id, type: 'toggle-family' }),
    toggleScope: (id: string) =>
      dispatchPresentation({ id, type: 'toggle-scope' }),
    toggleStandaloneScene: (scene: RuntimeStandaloneScene) =>
      dispatchPresentation({ scene, type: 'toggle-standalone-scene' }),
    toggleTakeaways: () =>
      dispatchPresentation({
        type: 'set-takeaways',
        value: !production.presentation.takeaways,
      }),
    toggleThematicScene: (scene: RuntimeThemeScene) =>
      dispatchPresentation({ scene, type: 'toggle-theme-scene' }),
    visibleCards,
    visibleFabrics,
    visibleFamilies,
    visibleFlows,
    visibleScopes,
  }
}

export type Presentation = ReturnType<typeof usePresentation>
