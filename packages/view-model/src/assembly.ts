import type { Box } from './geometry.ts'

const adapterGrip = 20
export const adapterFloor = 40
const adapterReach = 0.5

/** Derive the visible Adapter box from the Card it wraps. */
export const adapterBoundsFor = (held: Box): Box => ({
  height: held.height * (1 - adapterReach) + adapterFloor,
  width: held.width + adapterGrip * 2,
  x: held.x - adapterGrip,
  y: held.y + held.height * adapterReach
})
