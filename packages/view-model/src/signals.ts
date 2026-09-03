import type { InfoschematicConfig } from '@infoschematics/domain-model'

/**
 * A finite request to signal one authored Flow.
 *
 * The host owns `occurrenceKey`: retaining it identifies the same occurrence,
 * while changing it permits a renderer to replay the signal.
 */
export type FlowSignal = Readonly<{
  flowId: string
  occurrenceKey: string
}>

/** An authored Scene entry whose focused Flows can be resolved. */
export type SceneSignalSelection =
  | Readonly<{ kind: 'standalone'; sceneId: string }>
  | Readonly<{ kind: 'theme'; sceneId: string; themeId: string }>
  | Readonly<{ kind: 'story'; sceneIndex: number; storyId: string }>

const focusedFlowIds = (
  config: InfoschematicConfig,
  selection: SceneSignalSelection,
): readonly string[] => {
  if (selection.kind === 'standalone') {
    return (
      config.standaloneScenes.find(({ id }) => id === selection.sceneId)?.focus.flows ?? []
    )
  }

  if (selection.kind === 'theme') {
    return (
      config.themes
        .find(({ id }) => id === selection.themeId)
        ?.scenes.find(({ id }) => id === selection.sceneId)?.focus.flows ?? []
    )
  }

  if (!Number.isInteger(selection.sceneIndex) || selection.sceneIndex < 0) return []
  const scene = config.stories.find(({ id }) => id === selection.storyId)?.scenes[
    selection.sceneIndex
  ]
  if (!scene) return []
  if (scene.focus?.flows !== undefined) return scene.focus.flows
  if (!scene.sourceScene) return []
  return (
    config.standaloneScenes.find(({ id }) => id === scene.sourceScene)?.focus.flows ?? []
  )
}

/**
 * Resolve one occurrence per known focused Flow for a Scene entry.
 *
 * Unknown Scene and Flow references are ignored. Duplicate focused Flow ids
 * resolve once, in authored order. The function neither generates occurrence
 * identity nor mutates authored configuration.
 */
export const resolveSceneFlowSignals = (
  config: InfoschematicConfig,
  selection: SceneSignalSelection,
  occurrenceKey: string,
): readonly FlowSignal[] => {
  const knownFlowIds = new Set(config.infoschematic.flows.map(({ id }) => id))
  const resolved = new Set<string>()
  const signals: FlowSignal[] = []

  for (const flowId of focusedFlowIds(config, selection)) {
    if (!knownFlowIds.has(flowId) || resolved.has(flowId)) continue
    resolved.add(flowId)
    signals.push({ flowId, occurrenceKey })
  }

  return signals
}
