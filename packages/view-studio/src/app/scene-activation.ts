import type { RuntimeSequenceScene } from '@infoschematics/view-model/runtime'

/** A Scene is actionable when it can change the Diagram or present authored explanatory content. */
export const sceneCanActivate = (
  scene: RuntimeSequenceScene,
  validElements: ReadonlySet<string>,
  validFlows: ReadonlySet<string>,
  validDynamics: ReadonlySet<string>
) =>
  scene.calloutConfig !== undefined ||
  scene.components.some((id) => validElements.has(id)) ||
  scene.flows.some((id) => validFlows.has(id)) ||
  scene.cues.some((cue) => validDynamics.has(cue.dynamic))
