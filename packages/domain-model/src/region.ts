import type { RegionLabelTreatment } from './appearance.ts'
import type { Box } from './geometry.ts'

/** How a region's frame line is drawn; a region without a frame draws none. */
export type RegionFrameStyle = 'solid' | 'dashed' | 'dotted'

export type RegionFrameConfig = {
  style: RegionFrameStyle
  opacity?: number
}

/** Where a region's label sits relative to its boundary. */
export type RegionLabelMount = 'boundary' | 'internal'

/**
 * A region is a panel: an explicit box carrying independent frame, fill and
 * label treatments. Rows, columns and matrices are shapes an author draws,
 * not model vocabulary, and authored order is paint order.
 */
export type RegionConfig = {
  id: string
  label: string
  box: Box & { radius?: number }
  frame?: RegionFrameConfig
  fill?: string
  labelPlacement?: RegionLabelTreatment
  labelMount?: RegionLabelMount
  labelOffset?: number
}

// The unions above are erased at runtime, but a control surface and a visual
// guide both need to offer their members. Keying a literal object by the union
// makes the tuple exhaustive: a new style or mount fails to compile until it is
// listed here as well.
const regionFrameStyleMembers: Record<RegionFrameStyle, true> = {
  solid: true,
  dashed: true,
  dotted: true
}

const regionLabelMountMembers: Record<RegionLabelMount, true> = {
  boundary: true,
  internal: true
}

export const regionFrameStyles = Object.keys(regionFrameStyleMembers) as readonly RegionFrameStyle[]

export const regionLabelMounts = Object.keys(regionLabelMountMembers) as readonly RegionLabelMount[]
