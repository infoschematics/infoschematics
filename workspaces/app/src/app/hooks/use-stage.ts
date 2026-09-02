import { useMemo, useState } from 'react'
import {
  type RuntimeStandaloneScene as Spotlight,
  type RuntimeStory as Demonstration,
  type RuntimeThemeScene as Vendor,
  useInfoschematic
} from '../infoschematic-context.tsx'
import { usePersistentState } from './use-persistent-state.ts'

// What the stage is currently showing, in one place. Two filters decide what is
// present, three sources compete to decide what is lit, and the diagram, the
// control surface, and the panel all read the same answer rather than each
// deriving it from a scatter of state.
//
// The three lit sources are mutually exclusive by construction: choosing one
// clears the others, so a running demonstration can never be fighting a vendor
// for the same cards.


export type PlayingDemonstration = { id: string; step: number }

// Annotating is one thing: the code on every component and every flow.
// Attachment points are not part of it — they belong to editing, which turns
// them on by being open.

export function useStage() {
  const runtime = useInfoschematic()
  const {
    demonstrations,
    topologyFabricIsVisible,
    topologyFabrics,
    topologyFamilies,
    topologyFlowIsVisible,
    topologyFlows,
    topologyScopes,
    topologyServiceIsVisible,
    topologyServices,
    vendors
  } = runtime
  const allFamilyIds = topologyFamilies.map((family) => family.id)
  const allScopeIds = topologyScopes.map((scope) => scope.id)
  const storage = runtime.config.id
  const [visibleFamilies, setVisibleFamilies] = useState<Set<string>>(() => new Set(allFamilyIds))
  const [visibleScopes, setVisibleScopes] = useState<Set<string>>(() => new Set(allScopeIds))
  const [spotlight, setSpotlight] = useState<Spotlight | null>(null)
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [playing, setPlaying] = useState<PlayingDemonstration | null>(null)
  // Auto-advance is a presenter's choice, not a property of a demonstration: it
  // survives switching between them, being stopped and started, and a reload.
  // Someone who holds the walkthrough to talk over it is saying how they
  // present, and being handed it back running is the wrong default for them.
  const [autoAdvance, setAutoAdvance] = usePersistentState(storage && `${storage}.demonstration.auto`, true)
  const [annotated, setAnnotated] = usePersistentState(storage && `${storage}.annotated`, false)
  // On by default and remembered, like every other choice about how the stage
  // is presented: a stand wants the summary, a rehearsal reading the prose
  // aloud does not.
  const [takeaways, setTakeaways] = usePersistentState(storage && `${storage}.takeaways`, true)
  /*
   * Front of house or backstage.
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
  const [backstage, setBackstage] = useState(false)

  const visibleServices = useMemo(
    () => topologyServices.filter((service) => topologyServiceIsVisible(service, visibleScopes)),
    [visibleScopes]
  )
  const visibleFabrics = useMemo(
    () => topologyFabrics.filter((network) => topologyFabricIsVisible(network, visibleScopes)),
    [visibleScopes]
  )
  const visibleFlows = useMemo(
    () => topologyFlows.filter((flow) => topologyFlowIsVisible(flow, visibleFamilies, visibleScopes)),
    [visibleFamilies, visibleScopes]
  )

  const runningDemonstration = playing ? demonstrations.find((entry) => entry.id === playing.id) : undefined
  const runningStep = playing ? runningDemonstration?.steps[playing.step] : undefined

  // A running demonstration owns the stage while it plays; otherwise a vendor,
  // otherwise a spotlight. All three light the same way, so the treatment never
  // changes under the viewer - only what is lit.
  const lit = runningStep ?? vendor ?? spotlight
  const highlight = useMemo(() => {
    if (!lit) return undefined
    const flows = topologyFlows.filter(
      (flow) => lit.flows.includes(flow.id) && topologyFlowIsVisible(flow, visibleFamilies, visibleScopes)
    )
    if (flows.length === 0 && lit.components.length === 0) return undefined
    return {
      endpoints: new Set<string>(lit.components),
      flows: new Set(flows.map((flow) => flow.id))
    }
  }, [lit, visibleFamilies, visibleScopes])

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
      setSpotlight(null)
      setVendor(null)
      setPlaying(null)
    },
    playing,
    runningDemonstration,
    runningStep,
    setPlaying,
    setVisibleFamilies,
    setVisibleScopes,
    showAllFamilies: (show: boolean) => setVisibleFamilies(show ? new Set(allFamilyIds) : new Set()),
    showAllScopes: (show: boolean) => setVisibleScopes(show ? new Set(allScopeIds) : new Set()),
    spotlight,
    // Choosing one lit source clears the other two.
    startDemonstration: (demonstration: Demonstration) => {
      setSpotlight(null)
      setVendor(null)
      setPlaying({ id: demonstration.id, step: 0 })
    },
    // A demonstration loops until it is stopped, so a stand can leave one
    // running. Stepping past either end wraps rather than ending the run.
    stepDemonstration: (delta: number) =>
      setPlaying((current) => {
        if (!current) return current
        const running = demonstrations.find((entry) => entry.id === current.id)
        if (!running) return null
        const count = running.steps.length
        return { id: current.id, step: (current.step + delta + count) % count }
      }),
    stopDemonstration: () => setPlaying(null),
    backstage,
    setBackstage,
    takeaways,
    toggleAnnotated: () => setAnnotated((current) => !current),
    toggleAutoAdvance: () => setAutoAdvance((current) => !current),
    toggleTakeaways: () => setTakeaways((current) => !current),
    toggleFamily: (family: string) => toggle(setVisibleFamilies, family),
    toggleScope: (scope: string) => toggle(setVisibleScopes, scope),
    toggleSpotlight: (entry: Spotlight) => {
      setPlaying(null)
      setVendor(null)
      setSpotlight((current) => (current?.id === entry.id ? null : entry))
    },
    /*
     * Alphabetical, wrapping, and only where a partner is already chosen.
     *
     * Browsing rather than a performance: there is no auto-advance to step, so
     * this exists to be driven by hand. The order is the strip's own, which is
     * the order the reader can see.
     */
    stepVendor: (delta: number) =>
      setVendor((current) => {
        if (!current) return current
        const at = vendors.findIndex((entry) => entry.id === current.id)
        if (at === -1) return current
        return vendors[(at + delta + vendors.length) % vendors.length]
      }),
    toggleVendor: (entry: Vendor) => {
      setPlaying(null)
      setSpotlight(null)
      setVendor((current) => (current?.id === entry.id ? null : entry))
    },
    vendor,
    visibleFamilies,
    visibleFabrics,
    visibleServices,
    visibleFlows,
    visibleScopes
  }
}

export type Stage = ReturnType<typeof useStage>
