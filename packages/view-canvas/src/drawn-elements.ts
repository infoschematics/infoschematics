import type { InfoschematicRuntime } from '@infoschematics/view-model/runtime'

/**
 * Which element ids a rendering actually drew, given the Flows it drew and the Scopes it is showing.
 *
 * `DYNAMIC-003` says an occurrence reaches only what the renderer drew, and `COMPOSE-004` says an announcement obeys
 * the same filter the treatment obeys. Those are one question asked twice, so it is answered here once: a treatment
 * reconciled against one set and an announcement composed against another is exactly how a live region came to report
 * something no reader could see.
 */
export const drawnElementIds = (
  runtime: InfoschematicRuntime,
  drawnFlowIds: ReadonlySet<string>,
  scopes: ReadonlySet<string>
): ReadonlySet<string> => {
  const shown = new Set<string>(drawnFlowIds)
  for (const region of runtime.infoschematicRegions) shown.add(region.id)
  for (const card of runtime.infoschematicCards) {
    if (runtime.infoschematicCardIsVisible(card, scopes)) shown.add(card.id)
  }
  for (const fabric of runtime.infoschematicFabrics) {
    if (runtime.infoschematicFabricIsVisible(fabric, scopes)) shown.add(fabric.id)
  }
  return shown
}
