import type { DiagramDynamic } from '@infoschematics/domain-model'
import type { FlowSignal } from './signals.ts'

/**
 * Resolution of authored Diagram Dynamics into renderer-facing occurrences.
 *
 * The authored document names what changed; the host says that it happened, by Dynamic id and occurrence key. This
 * module is the join between those two statements, and it is the only place that knows an authored Dynamic kind turns
 * into a Flow signal or element emphasis. Renderers receive the resolved occurrences and choose a treatment, so no
 * renderer reads authored Dynamic shorthand and no authored document names a renderer behaviour.
 */

/**
 * A host-owned request to play one named Dynamic.
 *
 * The host owns `occurrenceKey` exactly as it does for a Flow signal: retaining it identifies the same occurrence,
 * while changing it permits a renderer to replay the Dynamic.
 */
export type DynamicOccurrence = Readonly<{
  dynamicId: string
  occurrenceKey: string
}>

/**
 * One authored visual element asked to take finite emphasis.
 *
 * The Dynamic id travels with it because the accessible meaning of the emphasis is the Dynamic's, not the element's: a
 * renderer announces what happened, and only the declaration knows that.
 */
export type ElementEmphasis = Readonly<{
  dynamicId: string
  elementId: string
  occurrenceKey: string
}>

/** What renderers consume: the same two occurrence shapes they already understand. */
export type ResolvedDynamics = Readonly<{
  emphasis: readonly ElementEmphasis[]
  signals: readonly FlowSignal[]
}>

const noDynamics: ResolvedDynamics = { emphasis: [], signals: [] }

/**
 * Resolve host occurrences against the authored Dynamics of one Diagram.
 *
 * An occurrence naming an unknown Dynamic is ignored rather than rejected: a host that binds a Dynamic id removed from
 * a later document should show the document it has, not fail. Targets resolve in authored order, and a repeated
 * occurrence of the same Dynamic and key resolves once, so a re-render cannot multiply what a renderer plays.
 */
export const resolveDiagramDynamics = (
  dynamics: readonly DiagramDynamic[],
  occurrences: readonly DynamicOccurrence[]
): ResolvedDynamics => {
  if (dynamics.length === 0 || occurrences.length === 0) return noDynamics

  const declared = new Map(dynamics.map((dynamic) => [dynamic.id, dynamic]))
  const emphasis: ElementEmphasis[] = []
  const signals: FlowSignal[] = []
  const resolved = new Set<string>()

  for (const occurrence of occurrences) {
    const dynamic = declared.get(occurrence.dynamicId)
    if (!dynamic) continue

    const targets = dynamic.kind === 'signal-flow' ? dynamic.flows : dynamic.elements
    for (const target of targets) {
      // Identity is the target, not the declaration: two Dynamics naming the same element in one occurrence mean one
      // emphasis, and the first declaration supplied owns its accessible meaning.
      const identity = JSON.stringify([dynamic.kind, target, occurrence.occurrenceKey])
      if (resolved.has(identity)) continue
      resolved.add(identity)

      if (dynamic.kind === 'signal-flow') signals.push({ flowId: target, occurrenceKey: occurrence.occurrenceKey })
      else emphasis.push({ dynamicId: dynamic.id, elementId: target, occurrenceKey: occurrence.occurrenceKey })
    }
  }

  return { emphasis, signals }
}
