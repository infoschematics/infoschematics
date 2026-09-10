import type { Box, Point } from '@infoschematics/domain-model/geometry'
import type { Infoschematic } from '@infoschematics/domain-model/model'
import type { PortCounts } from '@infoschematics/domain-model/ports'
import { stringify } from 'yaml'
import { defaultCalloutPositions, defineInfoschematicModel } from './model.ts'

type Mapping = Record<string, unknown>

const topLevelOrder = [
  'id',
  'title',
  'subtitle',
  'description',
  'diagram',
  'scopes',
  'specifications',
  'stories',
  'themes'
]

const diagramOrder = [
  'bounds',
  'appearance',
  'collections',
  'families',
  'cards',
  'fabrics',
  'points',
  'regions',
  'flows',
  'overlays',
  'calloutPositions'
]

const fieldOrder = [
  'id',
  'title',
  'label',
  'subtitle',
  'description',
  'collection',
  'family',
  'kind',
  'stereotype',
  'owner',
  'documents',
  'code',
  'href',
  'version',
  'realisedBy',
  'interfaces',
  'operations',
  'question',
  'scopes',
  'elements',
  'adapts',
  'wraps',
  'bounds',
  'at',
  'ports',
  'link',
  'labelAt',
  'waypoints',
  'diagram',
  'specifications',
  'stories',
  'themes',
  'collections',
  'families',
  'cards',
  'fabrics',
  'points',
  'regions',
  'flows',
  'overlays',
  'calloutPositions',
  'summary',
  'visibility',
  'show',
  'hide',
  'focus',
  'scenes',
  'callout',
  'duration',
  'body',
  'takeaways',
  'placement',
  'operation',
  'properties',
  'appearance',
  'surface',
  'grid',
  'card',
  'compact',
  'identity',
  'cornerRadius',
  'frame',
  'style',
  'opacity',
  'mount',
  'offset',
  'color',
  'fill',
  'icon',
  'line'
]

const rank = (order: readonly string[], key: string): number => {
  const index = order.indexOf(key)
  return index === -1 ? order.length : index
}

const ordered = (entries: readonly [string, unknown][], context: string): Mapping => {
  const order = context === '<root>' ? topLevelOrder : context === 'diagram' ? diagramOrder : fieldOrder
  return Object.fromEntries(
    [...entries].sort(([left], [right]) => {
      const difference = rank(order, left) - rank(order, right)
      return difference || left.localeCompare(right)
    })
  )
}

const pointText = ({ x, y }: Point): string => `${x} ${y}`
const boxText = ({ x, y, width, height }: Box): string => `${x} ${y} ${width} ${height}`

const portText = (ports: PortCounts): string | undefined => {
  const { north, east, south, west } = ports
  if ([north, east, south, west].some((value) => value === undefined)) return undefined
  if (north === east && east === south && south === west) return String(north)
  if (north === south && east === west) return `${north} ${east}`
  if (east === west) return `${north} ${east} ${south}`
  return `${north} ${east} ${south} ${west}`
}

const pointsText = (points: readonly Point[]): string => points.map(({ x, y }) => `${x},${y}`).join(' ')

const samePoint = (left: Point, right: Point): boolean => left.x === right.x && left.y === right.y
const isDefaultCalloutPositions = (value: unknown): boolean =>
  Array.isArray(value) &&
  value.length === defaultCalloutPositions.length &&
  value.every((entry, index) => {
    const expected = defaultCalloutPositions[index]
    return expected !== undefined && typeof entry === 'object' && entry !== null && samePoint(entry as Point, expected)
  })

const isMapping = (value: unknown): value is Mapping =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const emptyCollectionIsDefault = (key: string, context: string): boolean =>
  (context === '<root>' && ['scopes', 'specifications', 'stories', 'themes'].includes(key)) ||
  (context === 'diagram' &&
    ['collections', 'families', 'cards', 'fabrics', 'points', 'regions', 'flows', 'overlays'].includes(key))

const compactMapping = (input: Readonly<Mapping>, context: string): Mapping => {
  const value: Mapping = { ...input }

  if (context === 'flows' && isMapping(value.source) && isMapping(value.target)) {
    const arrow = value.direction === 'bidirectional' ? '<->' : '->'
    value.link = `${value.source.element} ${value.source.port} ${arrow} ${value.target.element} ${value.target.port}`
    delete value.source
    delete value.target
    delete value.direction

    if (isMapping(value.route)) {
      if (value.route.labelAt !== undefined) value.labelAt = value.route.labelAt
      if (Array.isArray(value.route.waypoints) && value.route.waypoints.length > 0) {
        value.waypoints = pointsText(value.route.waypoints as readonly Point[])
      }
      delete value.route
    }
  }

  if (context === 'diagram' && isDefaultCalloutPositions(value.calloutPositions)) {
    delete value.calloutPositions
  }

  if (
    ['collections', 'families', 'fabrics', 'points', 'flows', 'scopes'].includes(context) &&
    isMapping(value.appearance)
  ) {
    const appearanceEntries = Object.entries(value.appearance).filter(([, entry]) => entry !== undefined)
    const [single] = appearanceEntries
    if (
      appearanceEntries.length === 1 &&
      single !== undefined &&
      ['color', 'fill', 'icon', 'line'].includes(single[0])
    ) {
      value[single[0]] = single[1]
      delete value.appearance
    }
  }

  const entries: [string, unknown][] = []
  for (const [key, entry] of Object.entries(value)) {
    if (entry === undefined) continue
    if (key === 'waypoints' && Array.isArray(entry) && entry.length === 0) continue
    if (Array.isArray(entry) && entry.length === 0 && emptyCollectionIsDefault(key, context)) continue

    if (key === 'bounds' && isMapping(entry)) {
      entries.push([key, boxText(entry as Box)])
      continue
    }
    if (key === 'at' && isMapping(entry)) {
      entries.push([key, pointText(entry as Point)])
      continue
    }
    if (key === 'ports' && isMapping(entry)) {
      entries.push([key, portText(entry as PortCounts) ?? compactMapping(entry, key)])
      continue
    }
    if (key === 'waypoints' && Array.isArray(entry)) {
      entries.push([key, pointsText(entry as readonly Point[])])
      continue
    }
    if (key === 'calloutPositions' && Array.isArray(entry)) {
      entries.push([key, entry.map((point) => pointText(point as Point))])
      continue
    }
    if (Array.isArray(entry)) {
      entries.push([key, entry.map((item) => (isMapping(item) ? compactMapping(item, key) : item))])
      continue
    }
    entries.push([key, isMapping(entry) ? compactMapping(entry, key) : entry])
  }

  return ordered(entries, context)
}

const authoredInfoschematic = (input: Infoschematic): Mapping =>
  compactMapping(defineInfoschematicModel(input) as unknown as Mapping, '<root>')

/** Serialise canonical data as the compact, semantically ordered human-authored YAML representation. */
export const serialiseInfoschematicYaml = (input: Infoschematic): string =>
  stringify(authoredInfoschematic(input), { lineWidth: 0, version: '1.2' })

/** Serialise canonical data as deterministic compact JSON interchange. */
export const serialiseInfoschematicJson = (input: Infoschematic): string =>
  `${JSON.stringify(authoredInfoschematic(input), null, 2)}\n`
