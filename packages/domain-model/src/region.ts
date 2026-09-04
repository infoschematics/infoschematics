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
