import type { InfoschematicInput } from '@infoschematics/domain-model'
import {
  type DynamicOccurrence,
  type ElementEmphasis,
  emphasisDepictsState,
  resolveDiagramDynamics
} from '@infoschematics/view-model/dynamics'
import { createInfoschematicRuntime } from '@infoschematics/view-model/runtime'
import type { FlowSignal } from '@infoschematics/view-model/signals'
import { type ComponentProps, type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { DiagramAnnouncements } from './announcements.tsx'
import {
  advanceElementEmphasisAnnouncement,
  type ElementEmphasisAnnouncement,
  elementEmphasisDuration,
  reconcileElementEmphasis,
  retireElementEmphasis
} from './element-emphasis.ts'
import {
  advanceFlowSignalAnnouncement,
  type FlowSignalAnnouncement,
  flowSignalDuration,
  reconcileFlowSignals,
  retireFlowSignals
} from './flow-signals.ts'
import { InfoschematicDiagram } from './InfoschematicDiagram.tsx'
import {
  defineInfoschematicRenderers,
  type InfoschematicRenderers,
  InfoschematicRenderersContext
} from './renderers.tsx'
import { InfoschematicContext, useInfoschematic } from './runtime-context.tsx'

type DiagramProps = ComponentProps<typeof InfoschematicDiagram>

const noSignals: readonly FlowSignal[] = []
const noDynamics: readonly DynamicOccurrence[] = []

export { reconcileFlowSignals } from './flow-signals.ts'

export type CanvasProps = Omit<DiagramProps, 'emphasis' | 'flows' | 'visibleScopes'> & {
  children?: ReactNode
  className?: string
  config: InfoschematicInput
  /**
   * Host-owned occurrences of authored Diagram Dynamics, named by Dynamic id.
   *
   * The document says what a Dynamic means and what it touches; the host says only that it happened, and retains or
   * changes the occurrence key to hold or replay it. Withdrawing an occurrence cancels it.
   */
  dynamics?: readonly DynamicOccurrence[]
  flows?: DiagramProps['flows']
  renderers?: InfoschematicRenderers
  visibleScopes?: DiagramProps['visibleScopes']
}

function CanvasContent({
  children,
  className,
  dynamics = noDynamics,
  flows,
  signals = noSignals,
  visibleScopes,
  ...diagram
}: Omit<CanvasProps, 'config' | 'renderers'>) {
  const runtime = useInfoschematic()
  const allScopes = useMemo(
    () => new Set(runtime.infoschematicScopes.map((scope) => scope.id)),
    [runtime.infoschematicScopes]
  )
  const scopes = visibleScopes ?? allScopes
  const shownFlows = useMemo(() => {
    if (flows) return flows
    const families = new Set(runtime.infoschematicFamilies.map((family) => family.id))
    return runtime.infoschematicFlows.filter((flow) => runtime.infoschematicFlowIsVisible(flow, families, scopes))
  }, [flows, runtime, scopes])
  const shownFlowIds = useMemo(() => new Set(shownFlows.map(({ id }) => id)), [shownFlows])
  const declaredDynamics = runtime.config.diagram.dynamics
  const resolvedDynamics = useMemo(
    () => resolveDiagramDynamics(declaredDynamics, dynamics),
    [declaredDynamics, dynamics]
  )
  /* A resolved Flow signal and a directly supplied one say the same thing, so they join here and travel one path: a
     Dynamic cannot acquire a lifecycle a host-supplied signal does not have. */
  const suppliedSignals = useMemo(
    () => (resolvedDynamics.signals.length === 0 ? signals : [...signals, ...resolvedDynamics.signals]),
    [resolvedDynamics, signals]
  )
  /* Emphasis may only reach what this Canvas drew, which is the same rule the static renderer applies. */
  const shownElementIds = useMemo(() => {
    const shown = new Set<string>(shownFlowIds)
    for (const region of runtime.infoschematicRegions) shown.add(region.id)
    for (const card of runtime.infoschematicCards) {
      if (runtime.infoschematicCardIsVisible(card, scopes)) shown.add(card.id)
    }
    for (const fabric of runtime.infoschematicFabrics) {
      if (runtime.infoschematicFabricIsVisible(fabric, scopes)) shown.add(fabric.id)
    }
    return shown
  }, [runtime, scopes, shownFlowIds])
  const initialSignals = useRef<{
    acceptedSignals: readonly FlowSignal[]
    activeSignals: readonly FlowSignal[]
    seenSignals: Set<string>
  }>(undefined)
  if (!initialSignals.current) {
    const seenSignals = new Set<string>()
    initialSignals.current = {
      ...reconcileFlowSignals([], suppliedSignals, shownFlowIds, seenSignals),
      seenSignals
    }
  }
  const seenSignals = useRef(initialSignals.current.seenSignals)
  const activeSignalsRef = useRef(initialSignals.current.activeSignals)
  const initialAnnouncement = useRef(initialSignals.current.acceptedSignals)
  const announcedInitialSignals = useRef(false)
  const [activeSignals, setActiveSignals] = useState<readonly FlowSignal[]>(initialSignals.current.activeSignals)
  const [announcement, setAnnouncement] = useState<FlowSignalAnnouncement>()
  useEffect(() => {
    const next = reconcileFlowSignals(activeSignalsRef.current, suppliedSignals, shownFlowIds, seenSignals.current)
    activeSignalsRef.current = next.activeSignals
    setActiveSignals(next.activeSignals)

    const newlyAccepted = announcedInitialSignals.current ? next.acceptedSignals : initialAnnouncement.current
    announcedInitialSignals.current = true
    setAnnouncement((current) => advanceFlowSignalAnnouncement(current, newlyAccepted, next.activeSignals))
  }, [shownFlowIds, suppliedSignals])

  useEffect(() => {
    if (activeSignals.length === 0) return
    const retiring = activeSignals
    const timer = window.setTimeout(() => {
      const retained = retireFlowSignals(activeSignalsRef.current, retiring)
      activeSignalsRef.current = retained
      setActiveSignals(retained)
    }, flowSignalDuration)
    return () => window.clearTimeout(timer)
  }, [activeSignals])

  const suppliedEmphasis = resolvedDynamics.emphasis
  const initialEmphasis = useRef<{
    acceptedEmphasis: readonly ElementEmphasis[]
    activeEmphasis: readonly ElementEmphasis[]
    seenEmphasis: Set<string>
  }>(undefined)
  if (!initialEmphasis.current) {
    const seenEmphasis = new Set<string>()
    initialEmphasis.current = {
      ...reconcileElementEmphasis([], suppliedEmphasis, shownElementIds, seenEmphasis),
      seenEmphasis
    }
  }
  const seenEmphasis = useRef(initialEmphasis.current.seenEmphasis)
  const activeEmphasisRef = useRef(initialEmphasis.current.activeEmphasis)
  const initialEmphasisAnnouncement = useRef(initialEmphasis.current.acceptedEmphasis)
  const announcedInitialEmphasis = useRef(false)
  const [activeEmphasis, setActiveEmphasis] = useState<readonly ElementEmphasis[]>(
    initialEmphasis.current.activeEmphasis
  )
  const [emphasisAnnouncement, setEmphasisAnnouncement] = useState<ElementEmphasisAnnouncement>()
  useEffect(() => {
    const next = reconcileElementEmphasis(
      activeEmphasisRef.current,
      suppliedEmphasis,
      shownElementIds,
      seenEmphasis.current
    )
    activeEmphasisRef.current = next.activeEmphasis
    setActiveEmphasis(next.activeEmphasis)

    const newlyAccepted = announcedInitialEmphasis.current ? next.acceptedEmphasis : initialEmphasisAnnouncement.current
    announcedInitialEmphasis.current = true
    setEmphasisAnnouncement((current) =>
      advanceElementEmphasisAnnouncement(current, newlyAccepted, next.activeEmphasis)
    )
  }, [shownElementIds, suppliedEmphasis])

  /* An event emphasis retires on the shared token duration, as it always has. A state has no end of its own, so
     nothing here ends one: only the host withdrawing the occurrence, a replaced key, or the element leaving what this
     Canvas drew — all of which reconciliation already handles, because a hold is still a host-owned occurrence. */
  useEffect(() => {
    const retiring = activeEmphasis.filter((emphasis) => !emphasisDepictsState(emphasis))
    if (retiring.length === 0) return
    const timer = window.setTimeout(() => {
      const retained = retireElementEmphasis(activeEmphasisRef.current, retiring)
      activeEmphasisRef.current = retained
      setActiveEmphasis(retained)
    }, elementEmphasisDuration)
    return () => window.clearTimeout(timer)
  }, [activeEmphasis])

  return (
    <section
      aria-label={`${runtime.config.title} Infoschematic`}
      className={className ? `infoschematic ${className}` : 'infoschematic'}
    >
      <InfoschematicDiagram
        {...diagram}
        emphasis={activeEmphasis}
        flows={shownFlows}
        signals={activeSignals}
        visibleScopes={scopes}
      />
      <DiagramAnnouncements emphasis={emphasisAnnouncement} flows={shownFlows} signals={announcement} />
      {children}
    </section>
  )
}

export function Canvas({ config, renderers, ...props }: CanvasProps) {
  const runtime = useMemo(() => createInfoschematicRuntime(config), [config])
  const rendererRegistry = useMemo(() => defineInfoschematicRenderers(renderers ?? {}), [renderers])
  return (
    <InfoschematicRenderersContext value={rendererRegistry}>
      <InfoschematicContext value={runtime}>
        <CanvasContent {...props} />
      </InfoschematicContext>
    </InfoschematicRenderersContext>
  )
}
