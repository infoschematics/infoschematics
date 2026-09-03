import { useMemo, useState } from 'react'
import {
  type RuntimeStandaloneScene,
  type RuntimeStory,
  type RuntimeThemeScene,
  useInfoschematic,
} from '@infoschematics/view-canvas'
import { usePersistentState } from './use-persistent-state.ts'

// One state model supplies the diagram, controls and details panel. Filters
// determine visibility, while Scenes and Stories determine emphasis.

export type PlayingStory = { id: string; step: number }

export function usePresentation() {
  const runtime = useInfoschematic()
  const {
    infoschematicCardIsVisible,
    infoschematicCards,
    infoschematicFabricIsVisible,
    infoschematicFabrics,
    infoschematicFamilies,
    infoschematicFlowIsVisible,
    infoschematicFlows,
    infoschematicScopes,
    stories,
    thematicScenes,
  } = runtime
  const allFamilyIds = infoschematicFamilies.map((family) => family.id)
  const allScopeIds = infoschematicScopes.map((scope) => scope.id)
  const storage = runtime.config.id
  const [visibleFamilies, setVisibleFamilies] = useState<Set<string>>(() => new Set(allFamilyIds))
  const [visibleScopes, setVisibleScopes] = useState<Set<string>>(() => new Set(allScopeIds))
  const [standaloneScene, setStandaloneScene] = useState<RuntimeStandaloneScene | null>(null)
  const [thematicScene, setThematicScene] = useState<RuntimeThemeScene | null>(null)
  const [playing, setPlaying] = useState<PlayingStory | null>(null)
  // Auto-advance is a presentation preference rather than authored content.
  const [autoAdvance, setAutoAdvance] = usePersistentState(storage && `${storage}.presentation.autoAdvance`, true)
  const [annotated, setAnnotated] = usePersistentState(storage && `${storage}.annotated`, false)
  // Takeaways are visible by default and remembered with other presentation choices.
  const [takeaways, setTakeaways] = usePersistentState(storage && `${storage}.takeaways`, true)
  // Design mode is transient so a reload always returns to presentation.
  const [designing, setDesigning] = useState(false)

  const visibleCards = useMemo(
    () => infoschematicCards.filter((card) => infoschematicCardIsVisible(card, visibleScopes)),
    [infoschematicCardIsVisible, infoschematicCards, visibleScopes],
  )
  const visibleFabrics = useMemo(
    () => infoschematicFabrics.filter((fabric) => infoschematicFabricIsVisible(fabric, visibleScopes)),
    [infoschematicFabricIsVisible, infoschematicFabrics, visibleScopes],
  )
  const visibleFlows = useMemo(
    () => infoschematicFlows.filter((flow) => infoschematicFlowIsVisible(flow, visibleFamilies, visibleScopes)),
    [infoschematicFlowIsVisible, infoschematicFlows, visibleFamilies, visibleScopes],
  )

  const runningStory = playing ? stories.find((entry) => entry.id === playing.id) : undefined
  const runningStoryScene = playing ? runningStory?.steps[playing.step] : undefined

  // A running Story owns the presentation while it plays; otherwise a Thematic
  // Scene, otherwise a Standalone Scene. All three use the same focus treatment,
  // changes under the viewer - only what is lit.
  const focusedScene = runningStoryScene ?? thematicScene ?? standaloneScene
  const highlight = useMemo(() => {
    if (!focusedScene) return undefined
    const flows = infoschematicFlows.filter(
      (flow) =>
        focusedScene.flows.includes(flow.id) && infoschematicFlowIsVisible(flow, visibleFamilies, visibleScopes),
    )
    if (flows.length === 0 && focusedScene.components.length === 0) return undefined
    return {
      endpoints: new Set<string>(focusedScene.components),
      flows: new Set(flows.map((flow) => flow.id)),
    }
  }, [focusedScene, infoschematicFlowIsVisible, infoschematicFlows, visibleFamilies, visibleScopes])

  const toggle = <T>(set: (update: (current: Set<T>) => Set<T>) => void, value: T) => {
    set((current) => {
      const next = new Set(current)
      if (next.has(value)) next.delete(value)
      else next.add(value)
      return next
    })
  }

  return {
    annotated,
    autoAdvance,
    hasVisibleFamilies: visibleFamilies.size > 0,
    hasVisibleScopes: visibleScopes.size > 0,
    highlight,
    lightNothing: () => {
      setStandaloneScene(null)
      setThematicScene(null)
      setPlaying(null)
    },
    playing,
    runningStory,
    runningStoryScene,
    setPlaying,
    setVisibleFamilies,
    setVisibleScopes,
    showAllFamilies: (show: boolean) => setVisibleFamilies(show ? new Set(allFamilyIds) : new Set()),
    showAllScopes: (show: boolean) => setVisibleScopes(show ? new Set(allScopeIds) : new Set()),
    standaloneScene,
    // Choosing one lit source clears the other two.
    startStory: (story: RuntimeStory) => {
      setStandaloneScene(null)
      setThematicScene(null)
      setPlaying({ id: story.id, step: 0 })
    },
    // A Story loops until it is stopped; stepping past either end wraps the run.
    stepStory: (delta: number) =>
      setPlaying((current) => {
        if (!current) return current
        const running = stories.find((entry) => entry.id === current.id)
        if (!running) return null
        const count = running.steps.length
        return { id: current.id, step: (current.step + delta + count) % count }
      }),
    stopStory: () => setPlaying(null),
    designing,
    setDesigning,
    takeaways,
    toggleAnnotated: () => setAnnotated((current) => !current),
    toggleAutoAdvance: () => setAutoAdvance((current) => !current),
    toggleTakeaways: () => setTakeaways((current) => !current),
    toggleFamily: (family: string) => toggle(setVisibleFamilies, family),
    toggleScope: (scope: string) => toggle(setVisibleScopes, scope),
    toggleStandaloneScene: (entry: RuntimeStandaloneScene) => {
      setPlaying(null)
      setThematicScene(null)
      setStandaloneScene((current) => (current?.id === entry.id ? null : entry))
    },
    // Thematic Scenes follow their visible order and wrap at either end.
    stepThematicScene: (delta: number) =>
      setThematicScene((current) => {
        if (!current) return current
        const at = thematicScenes.findIndex((entry) => entry.id === current.id)
        if (at === -1) return current
        return thematicScenes[(at + delta + thematicScenes.length) % thematicScenes.length]
      }),
    toggleThematicScene: (entry: RuntimeThemeScene) => {
      setPlaying(null)
      setStandaloneScene(null)
      setThematicScene((current) => (current?.id === entry.id ? null : entry))
    },
    thematicScene,
    visibleFamilies,
    visibleFabrics,
    visibleCards,
    visibleFlows,
    visibleScopes,
  }
}

export type Presentation = ReturnType<typeof usePresentation>
