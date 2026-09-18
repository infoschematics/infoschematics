import type { ElementEmphasis } from '@infoschematics/view-model/dynamics'
import type { FlowSignal } from '@infoschematics/view-model/signals'
import { useEffect, useState } from 'react'
import { advanceElementEmphasisAnnouncement, type ElementEmphasisAnnouncement } from './element-emphasis.ts'
import { advanceFlowSignalAnnouncement, type FlowSignalAnnouncement } from './flow-signals.ts'
import { useInfoschematic } from './runtime-context.tsx'

/**
 * The live regions a reader of an interactive Diagram hears, mounted by every host that draws one.
 *
 * `DYNAMIC-006` puts the obligation on the interactive renderer, and for as long as `Canvas` was the only host of
 * `InfoschematicDiagram` the two were the same thing. Studio mounts the Diagram directly, so it drew every Flow
 * signal and every rehearsed Dynamic and announced none of them. The regions cannot move into the Diagram itself,
 * which renders an `<svg>` root: a status paragraph is not SVG content, and giving the Diagram a wrapper to hold one
 * would change the element every host already positions and styles. So the announcement surface is its own component
 * beside the Diagram, and a host that draws a Diagram mounts it.
 */
export type DiagramAnnouncementFlow = Readonly<{ code: string; id: string; source: string; target: string }>

export type DiagramAnnouncementsProps = Readonly<{
  /**
   * The element ids this Diagram drew, which is what an emphasis announcement is filtered against.
   *
   * Omit it and every accepted occurrence is announced, which is right only for a host whose accepted set is its
   * drawn set. A host that filters anything supplies it, or `COMPOSE-004` fails the other way about: a reader is
   * told a Dynamic played over elements that were never painted.
   */
  drawnElements?: ReadonlySet<string>
  /** The accepted emphasis to read, as the host's own lifecycle advanced it. */
  emphasis?: ElementEmphasisAnnouncement
  /** The Flows this Diagram drew, which is what a Flow signal's text is read from. */
  flows: readonly DiagramAnnouncementFlow[]
  /** The accepted Flow signals to read. */
  signals?: FlowSignalAnnouncement
}>

/**
 * Announcement state for a host that owns its occurrence lifecycle without reconciling visibility.
 *
 * `Canvas` does not use this: its accepted set is not its active set, because an occurrence that arrives while its
 * element is hidden is never accepted at all, so it advances the announcement inside the same reconciliation that
 * decides acceptance. A host that resolves occurrences and draws them as they are — Studio rehearsing one Dynamic at
 * a time — has accepted exactly what is active, and needs only this.
 */
export const useDiagramAnnouncements = (
  signals: readonly FlowSignal[],
  emphasis: readonly ElementEmphasis[]
): Readonly<{ emphasis?: ElementEmphasisAnnouncement; signals?: FlowSignalAnnouncement }> => {
  const [signalAnnouncement, setSignalAnnouncement] = useState<FlowSignalAnnouncement>()
  const [emphasisAnnouncement, setEmphasisAnnouncement] = useState<ElementEmphasisAnnouncement>()
  useEffect(() => {
    setSignalAnnouncement((current) => advanceFlowSignalAnnouncement(current, signals, signals))
  }, [signals])
  useEffect(() => {
    setEmphasisAnnouncement((current) => advanceElementEmphasisAnnouncement(current, emphasis, emphasis))
  }, [emphasis])
  return { emphasis: emphasisAnnouncement, signals: signalAnnouncement }
}

export function DiagramAnnouncements({ drawnElements, emphasis, flows, signals }: DiagramAnnouncementsProps) {
  const runtime = useInfoschematic()
  /* `COMPOSE-004`: the revision prefix distinguishes two otherwise identical announcements, so it is announced only
     with the sentence it distinguishes. Composing the sentence first is what makes the announcement obey the same
     filter the treatment obeys: an occurrence whose every target was hidden draws nothing and now says nothing. */
  const signalSentence = (signals?.signals ?? [])
    .map((signal) => {
      const flow = flows.find((candidate) => candidate.id === signal.flowId)
      if (!flow) return null
      const source = runtime.infoschematicEndpointLabels.get(flow.source) ?? flow.source
      const target = runtime.infoschematicEndpointLabels.get(flow.target) ?? flow.target
      return `Flow ${flow.code}, ${source} to ${target}, signalled.`
    })
    .filter((sentence): sentence is string => sentence !== null)
    .join(' ')
  const emphasisSentence = [
    ...new Set(
      (emphasis?.emphasis ?? [])
        .filter(({ elementId }) => !drawnElements || drawnElements.has(elementId))
        .map(({ dynamicId }) => runtime.config.diagram.dynamics.find((dynamic) => dynamic.id === dynamicId)?.label)
    )
  ]
    .filter((label): label is string => label !== undefined)
    .map((label) => `${label}.`)
    .join(' ')
  return (
    <>
      <p aria-live="polite" className="infoschematic-signal-announcement" role="status">
        {signals && signalSentence ? `Signal update ${signals.revision}. ${signalSentence}` : ''}
      </p>
      {/* The emphasis treatment is decorative; what a reader needs is the Dynamic's own meaning, stated once per
          occurrence however many elements it touches. */}
      <p aria-live="polite" className="infoschematic-signal-announcement" role="status">
        {emphasis && emphasisSentence ? `Dynamic update ${emphasis.revision}. ${emphasisSentence}` : ''}
      </p>
    </>
  )
}
