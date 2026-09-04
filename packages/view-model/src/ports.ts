import type { PortCounts, PortId } from '@infoschematics/domain-model/ports'
import type { Box, Point } from './geometry.ts'

export type { PortCounts, PortId, Side } from '@infoschematics/domain-model/ports'

// Where routes meet the things they connect. A port is a position on one side
// of a box, identified by that side and its number, and two routes sharing an
// endpoint must not land on the same port or within touching distance of each
// other. Nothing here knows what is being connected.

export type PortUse<Flow extends string = string> = {
  flow: Flow
  endpoint: string
  point: Point
  port: PortId
  terminal: 'source' | 'target'
}

export type PortFinding<Flow extends string = string> = {
  distance: number
  endpoint: string
  left: PortUse<Flow>
  right: PortUse<Flow>
  severity: 'collision' | 'crowded' | 'misassigned'
}

/**
 * How close two ports may sit, and so how close two arrowheads may. One grid
 * unit: a port may take any grid line, and anything tighter would put one
 * between them. The audit uses the same figure of necessity - a larger one
 * would forbid using two ports the model had just offered next to each other,
 * and whether that crowds is a judgment for whoever places them.
 */
export const minimumPortGap = 10

export const auditPorts = <Flow extends string>(ports: readonly PortUse<Flow>[], minimumSpacing = minimumPortGap) => {
  const findings: PortFinding<Flow>[] = []

  for (let leftIndex = 0; leftIndex < ports.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < ports.length; rightIndex += 1) {
      const left = ports[leftIndex]
      const right = ports[rightIndex]
      if (left.endpoint !== right.endpoint) continue

      const distance = Math.hypot(left.point.x - right.point.x, left.point.y - right.point.y)
      if (left.port === right.port && distance > 0) {
        findings.push({ distance, endpoint: left.endpoint, left, right, severity: 'misassigned' })
      } else if (distance < minimumSpacing) {
        findings.push({
          distance,
          endpoint: left.endpoint,
          left,
          right,
          severity: distance === 0 ? 'collision' : 'crowded'
        })
      }
    }
  }

  return findings
}

export type Port = { id: PortId; at: Point }

/**
 * A side offers any number of ports it has room for, not only the counts that
 * divide it exactly.
 *
 * They are spread evenly along the side and then each one moves to the nearest
 * grid line, so the spacing stays as even as the grid allows and every port
 * still lands somewhere a route can be drawn to. Restricting the count to those
 * that divide the side into whole units kept the spacing perfect but left long
 * gaps in what could be asked for - a 160 side offered one, three, seven or
 * fifteen and nothing in between, so wanting four meant taking seven.
 *
 * Numbering runs centre-outward, so port one is the most central place a route
 * can meet the side. It is worked out from the ports the count actually
 * produces, so it is stable for a given count rather than assuming a midpoint
 * that only an odd count has.
 */
const subdivide = (length: number, count: number): number[] | undefined => {
  const spread = Array.from({ length: count }, (_, index) => ((index + 1) * length) / (count + 1))
  const snapped = spread.map((offset) => Math.round(offset / minimumPortGap) * minimumPortGap)

  // A count that crowds two ports onto one grid line, or pushes one onto a
  // corner, is a count this side has no room for.
  const usable = snapped.every((offset, index) => offset > 0 && offset < length && snapped.indexOf(offset) === index)
  if (!usable) return undefined

  const centre = length / 2
  return [...snapped].sort((left, right) => Math.abs(left - centre) - Math.abs(right - centre) || left - right)
}

/**
 * The counts a side may take: every one it has room for, from none up to a port
 * on each interior grid line. None is always a choice - a side with no ports is
 * a side nothing may meet, which is a thing worth being able to say.
 */
export const portCountsForSide = (length: number): number[] => {
  const counts = [0]
  for (let count = 1; subdivide(length, count); count += 1) counts.push(count)
  return counts
}

/** What a side offers when it does not say, and the first count above what any card uses. */
export const defaultPortCount = 7

/**
 * A request the side has no room for takes the largest count it does have, so a
 * side never silently offers more ports than were asked for.
 */
export const portOffsetsForSide = (length: number, requested?: number) => {
  const wanted = requested ?? defaultPortCount
  if (wanted <= 0) return []
  const allowed = portCountsForSide(length)
  return subdivide(length, Math.min(wanted, allowed.at(-1) ?? 0)) ?? []
}

/** Every place a route could meet a box, on all four sides. */
export const portsForBox = (box: Box, counts: PortCounts = {}): Port[] => {
  const top = portOffsetsForSide(box.width, counts.north)
  const bottom = portOffsetsForSide(box.width, counts.south)
  const right = portOffsetsForSide(box.height, counts.east)
  const left = portOffsetsForSide(box.height, counts.west)

  return [
    ...top.map((offset, index): Port => ({ at: { x: box.x + offset, y: box.y }, id: `N${index + 1}` })),
    ...right.map((offset, index): Port => ({ at: { x: box.x + box.width, y: box.y + offset }, id: `E${index + 1}` })),
    ...bottom.map((offset, index): Port => ({ at: { x: box.x + offset, y: box.y + box.height }, id: `S${index + 1}` })),
    ...left.map((offset, index): Port => ({ at: { x: box.x, y: box.y + offset }, id: `W${index + 1}` }))
  ]
}
