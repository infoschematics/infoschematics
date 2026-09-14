import type { ArtefactIdentity } from './artefact.ts'
import type { Box } from './geometry.ts'
import type { PortCounts } from './ports.ts'
import type { RendererReferenceInput } from './renderer.ts'

export type FabricConfig = ArtefactIdentity & {
  scope: string
  placement: { box: Box; ports?: PortCounts }
  appearance?: {
    renderer: RendererReferenceInput
    caption?: string
    detail?: string
    properties?: Readonly<Record<string, boolean | number | string>>
  }
}
