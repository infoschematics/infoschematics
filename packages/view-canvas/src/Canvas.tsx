import type { InfoschematicConfig } from '@infoschematics/domain-model'
import { createInfoschematicRuntime } from '@infoschematics/view-model/runtime'
import type { FlowSignal } from '@infoschematics/view-model/signals'
import { type ComponentProps, type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { advanceFlowSignalAnnouncement, type FlowSignalAnnouncement, reconcileFlowSignals } from './flow-signals.ts'
import { InfoschematicDiagram } from './InfoschematicDiagram.tsx'
import {
  defineInfoschematicRenderers,
  type InfoschematicRenderers,
  InfoschematicRenderersContext
} from './renderers.tsx'
import { InfoschematicContext, useInfoschematic } from './runtime-context.tsx'

type DiagramProps = ComponentProps<typeof InfoschematicDiagram>

const noSignals: readonly FlowSignal[] = []

export { reconcileFlowSignals } from './flow-signals.ts'

export type CanvasProps = Omit<DiagramProps, 'flows' | 'visibleScopes'> & {
  children?: ReactNode
  className?: string
  config: InfoschematicConfig
  flows?: DiagramProps['flows']
  renderers?: InfoschematicRenderers
  visibleScopes?: DiagramProps['visibleScopes']
}

function CanvasContent({
  children,
  className,
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
  const initialSignals = useRef<{
    acceptedSignals: readonly FlowSignal[]
    activeSignals: readonly FlowSignal[]
    seenSignals: Set<string>
  }>(undefined)
  if (!initialSignals.current) {
    const seenSignals = new Set<string>()
    initialSignals.current = {
      ...reconcileFlowSignals([], signals, shownFlowIds, seenSignals),
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
    const next = reconcileFlowSignals(activeSignalsRef.current, signals, shownFlowIds, seenSignals.current)
    activeSignalsRef.current = next.activeSignals
    setActiveSignals(next.activeSignals)

    const newlyAccepted = announcedInitialSignals.current ? next.acceptedSignals : initialAnnouncement.current
    announcedInitialSignals.current = true
    setAnnouncement((current) => advanceFlowSignalAnnouncement(current, newlyAccepted, next.activeSignals))
  }, [shownFlowIds, signals])

  return (
    <section
      aria-label={`${runtime.config.title} Infoschematic`}
      className={className ? `infoschematic ${className}` : 'infoschematic'}
    >
      <InfoschematicDiagram {...diagram} flows={shownFlows} signals={activeSignals} visibleScopes={scopes} />
      <p aria-live="polite" className="infoschematic-signal-announcement" role="status">
        {announcement ? `Signal update ${announcement.revision}. ` : ''}
        {announcement?.signals
          .map((signal) => {
            const flow = shownFlows.find((candidate) => candidate.id === signal.flowId)
            if (!flow) return null
            const source = runtime.infoschematicEndpointLabels.get(flow.source) ?? flow.source
            const target = runtime.infoschematicEndpointLabels.get(flow.target) ?? flow.target
            return `Flow ${flow.code}, ${source} to ${target}, signalled.`
          })
          .filter(Boolean)
          .join(' ')}
      </p>
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
