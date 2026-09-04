import type { Point } from './geometry.ts'
import type { PortCounts } from './ports.ts'

export type PointConfig = {
  id: string
  code: string
  label: string
  scopes: readonly string[]
  point: Point
  ports?: PortCounts
}
