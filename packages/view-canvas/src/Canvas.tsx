import { useMemo, type ComponentProps, type ReactNode } from 'react'
import type { InfoschematicConfig } from '@infoschematics/domain-model'
import { createInfoschematicRuntime } from '@infoschematics/view-model/runtime'
import { InfoschematicDiagram } from './InfoschematicDiagram.tsx'
import {
  defineInfoschematicRenderers,
  InfoschematicRenderersContext,
  type InfoschematicRenderers,
} from './renderers.tsx'
import { InfoschematicContext, useInfoschematic } from './runtime-context.tsx'

type DiagramProps = ComponentProps<typeof InfoschematicDiagram>

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
  signals = [],
  visibleScopes,
  ...diagram
}: Omit<CanvasProps, 'config' | 'renderers'>) {
  const runtime = useInfoschematic()
  const allScopes = useMemo(
    () => new Set(runtime.infoschematicScopes.map((scope) => scope.id)),
    [runtime.infoschematicScopes],
  )
  const scopes = visibleScopes ?? allScopes
  const shownFlows = useMemo(() => {
    if (flows) return flows
    const families = new Set(runtime.infoschematicFamilies.map((family) => family.id))
    return runtime.infoschematicFlows.filter((flow) => runtime.infoschematicFlowIsVisible(flow, families, scopes))
  }, [flows, runtime, scopes])

  return (
    <section
      aria-label={`${runtime.config.title} Infoschematic`}
      className={className ? `infoschematic ${className}` : 'infoschematic'}
    >
      <InfoschematicDiagram {...diagram} flows={shownFlows} signals={signals} visibleScopes={scopes} />
      <p aria-live="polite" className="infoschematic-signal-announcement" role="status">
        {signals
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
