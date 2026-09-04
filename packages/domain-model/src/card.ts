import type { ArtefactIdentity } from './artefact.ts'
import type { Box } from './geometry.ts'
import type { PortCounts } from './ports.ts'

export type CardConfig = ArtefactIdentity & {
  scope: string
  domain?: string
  stereotype?: string
  wraps?: string
  placement: { box: Box; ports?: PortCounts }
}
