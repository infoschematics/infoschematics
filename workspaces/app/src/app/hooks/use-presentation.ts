import { useMemo, useState } from 'react'
import {
  type RuntimeStandaloneScene,
  type RuntimeStory,
  type RuntimeThemeScene,
  useInfoschematic,
} from '../infoschematic-context.tsx'
import { usePersistentState } from './use-persistent-state.ts'

// What the presentation is currently showing, in one place. Two filters decide what is
// present, three sources compete to decide what is lit, and the diagram, the
// control surface, and the panel all read the same answer rather than each
// deriving it from a scatter of state.
//
// The three lit sources are mutually exclusive by construction: choosing one
// clears the others, so a running Story can never be fighting a Thematic Scene
// for the same cards.

export type PlayingStory = { id: string; step: number }

// Annotating is one thing: the code on every component and every flow.
// Attachment points are not part of it — they belong to editing, which turns
// them on by being open.

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
  // Auto-advance is a presenter's choice, not a property of a Story: it
  // survives switching between them, being stopped and started, and a reload.
  // Someone who holds the walkthrough to talk over it is saying how they
  // present, and being handed it back running is the wrong default for them.
  // Compatibility contract: retain this legacy persisted-state key until an
  // explicit migration can preserve existing presenter preferences.
  const [autoAdvance, setAutoAdvance] = usePersistentState(storage && `${storage}.demonstration.auto`, true)
  const [annotated, setAnnotated] = usePersistentState(storage && `${storage}.annotated`, false)
  // On by default and remembered, like every other presentation choice
  // is presented: a stand wants the summary, a rehearsal reading the prose
  // aloud does not.
  const [takeaways, setTakeaways] = usePersistentState(storage && `${storage}.takeaways`, true)
  /*
   * Present or Design.
   *
   * Two audiences, and until now one strip of five tabs that were not five of a
   * kind: Info and Specifications are for a visitor, and the three editors are
   * for an author. An author passed two visitor tabs to reach an editor, and a
   * visitor at a stand had three authoring tabs one click from the thing being
   * demonstrated.
   *
   * Not persisted, for the reason edit mode never was: a dashboard that comes
   * back from a reload showing its editors in front of a room is a foot-gun.
   */
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
    // A Story loops until it is stopped, so a stand can leave one
    // running. Stepping past either end wraps rather than ending the run.
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
    /*
     * Alphabetical, wrapping, and only where a Thematic Scene is already chosen.
     *
     * Browsing rather than a performance: there is no auto-advance to step, so
     * this exists to be driven by hand. The order is the strip's own, which is
     * the order the reader can see.
     */
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
