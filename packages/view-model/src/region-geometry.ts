import type { Box } from '@infoschematics/domain-model/geometry'
import type { RegionLabelPlacement } from '@infoschematics/domain-model/appearance'
import type { ResolvedRegionTreatment } from './appearance.ts'
import { visualTokens } from './tokens.ts'

export type RegionLabelGeometry = Readonly<{
  dominantBaseline: 'middle'
  /** Pinned rendered extent for a notched label, so text and notch agree; null for plain labels. */
  length: number | null
  placement: RegionLabelPlacement
  textAnchor: 'end' | 'middle' | 'start'
  x: number
  y: number
}>

export type RegionNotchGeometry = Readonly<{
  edge: 'east' | 'north' | 'south' | 'west'
  end: number
  padding: number
  start: number
}>

export type RegionGeometry = Readonly<{
  label: RegionLabelGeometry | null
  notch: RegionNotchGeometry | null
  outline: string | null
}>

export type RegionGeometryInput = Readonly<{
  box: Box
  label: string
  treatment: ResolvedRegionTreatment
}>

export const regionGeometryDefaults = Object.freeze({
  // Matches the canvas lane-label metrics (13px/600 code face + 1.6px tracking);
  // notched text is pinned to this via textLength so the notch stays symmetric.
  characterWidth: 9.4,
  labelHeight: 14,
  labelInset: 16,
  notchPadding: 10,
})

const number = (value: number) => String(Number(value.toFixed(3)))
const point = (x: number, y: number) => `${number(x)} ${number(y)}`

const roundedFrame = (box: Box, radius: number) => {
  const { x, y, width, height } = box
  const right = x + width
  const bottom = y + height
  return [
    `M${point(x + radius, y)}`,
    `H${number(right - radius)}`,
    `A${number(radius)} ${number(radius)} 0 0 1 ${point(right, y + radius)}`,
    `V${number(bottom - radius)}`,
    `A${number(radius)} ${number(radius)} 0 0 1 ${point(right - radius, bottom)}`,
    `H${number(x + radius)}`,
    `A${number(radius)} ${number(radius)} 0 0 1 ${point(x, bottom - radius)}`,
    `V${number(y + radius)}`,
    `A${number(radius)} ${number(radius)} 0 0 1 ${point(x + radius, y)}`,
    'Z',
  ].join(' ')
}

const labelGeometry = (
  box: Box,
  placement: RegionLabelPlacement,
  mounted: boolean,
): RegionLabelGeometry => {
  const { x, y, width, height } = box
  const east = placement.endsWith('east') || placement === 'east'
  const west = placement.endsWith('west') || placement === 'west'
  const north = placement.startsWith('north')
  const south = placement.startsWith('south')
  // A border-mounted label sits on the frame line the notch breaks; only a
  // plain label sets down inside the region by the inset.
  const edgeInset = mounted ? 0 : regionGeometryDefaults.labelInset
  return {
    dominantBaseline: 'middle',
    length: null,
    placement,
    textAnchor: east ? 'end' : west ? 'start' : 'middle',
    x: east
      ? placement === 'east'
        ? x + width - edgeInset
        : x + width - regionGeometryDefaults.labelInset
      : west
        ? placement === 'west'
          ? x + edgeInset
          : x + regionGeometryDefaults.labelInset
        : x + width / 2,
    y: north
      ? y + edgeInset
      : south
        ? y + height - edgeInset
        : y + height / 2,
  }
}

const notchEdge = (placement: RegionLabelPlacement): RegionNotchGeometry['edge'] | null => {
  if (placement.startsWith('north')) return 'north'
  if (placement.startsWith('south')) return 'south'
  if (placement === 'west') return 'west'
  if (placement === 'east') return 'east'
  return null
}

const fitNotch = (
  box: Box,
  radius: number,
  label: RegionLabelGeometry,
  labelText: string,
): { label: RegionLabelGeometry; notch: RegionNotchGeometry } | null => {
  const edge = notchEdge(label.placement)
  if (!edge) return null
  const horizontal = edge === 'north' || edge === 'south'
  const extent = horizontal ? labelText.length * regionGeometryDefaults.characterWidth : regionGeometryDefaults.labelHeight
  const padding = regionGeometryDefaults.notchPadding
  const labelStart = horizontal
    ? label.textAnchor === 'start'
      ? label.x
      : label.textAnchor === 'end'
        ? label.x - extent
        : label.x - extent / 2
    : label.y - extent / 2
  let start = labelStart - padding
  let end = labelStart + extent + padding
  const minimum = (horizontal ? box.x : box.y) + radius
  const maximum = (horizontal ? box.x + box.width : box.y + box.height) - radius
  if (end - start > maximum - minimum) return null
  const shift = start < minimum ? minimum - start : end > maximum ? maximum - end : 0
  start += shift
  end += shift
  return {
    label: horizontal
      ? { ...label, length: Number(extent.toFixed(3)), x: label.x + shift }
      : { ...label, y: label.y + shift },
    notch: { edge, end, padding, start },
  }
}

const notchedFrame = (box: Box, radius: number, notch: RegionNotchGeometry) => {
  const { x, y, width, height } = box
  const right = x + width
  const bottom = y + height
  const r = number(radius)
  const start = number(notch.start)
  const end = number(notch.end)
  switch (notch.edge) {
    case 'north':
      return `M${end} ${number(y)} H${number(right - radius)} A${r} ${r} 0 0 1 ${point(right, y + radius)} V${number(bottom - radius)} A${r} ${r} 0 0 1 ${point(right - radius, bottom)} H${number(x + radius)} A${r} ${r} 0 0 1 ${point(x, bottom - radius)} V${number(y + radius)} A${r} ${r} 0 0 1 ${point(x + radius, y)} H${start}`
    case 'south':
      return `M${start} ${number(bottom)} H${number(x + radius)} A${r} ${r} 0 0 1 ${point(x, bottom - radius)} V${number(y + radius)} A${r} ${r} 0 0 1 ${point(x + radius, y)} H${number(right - radius)} A${r} ${r} 0 0 1 ${point(right, y + radius)} V${number(bottom - radius)} A${r} ${r} 0 0 1 ${point(right - radius, bottom)} H${end}`
    case 'west':
      return `M${number(x)} ${start} V${number(y + radius)} A${r} ${r} 0 0 1 ${point(x + radius, y)} H${number(right - radius)} A${r} ${r} 0 0 1 ${point(right, y + radius)} V${number(bottom - radius)} A${r} ${r} 0 0 1 ${point(right - radius, bottom)} H${number(x + radius)} A${r} ${r} 0 0 1 ${point(x, bottom - radius)} V${end}`
    case 'east':
      return `M${number(right)} ${end} V${number(bottom - radius)} A${r} ${r} 0 0 1 ${point(right - radius, bottom)} H${number(x + radius)} A${r} ${r} 0 0 1 ${point(x, bottom - radius)} V${number(y + radius)} A${r} ${r} 0 0 1 ${point(x + radius, y)} H${number(right - radius)} A${r} ${r} 0 0 1 ${point(right, y + radius)} V${start}`
  }
}

/** Resolve renderer-neutral label coordinates and one deterministic frame path. */
export const regionGeometry = ({ box, label, treatment }: RegionGeometryInput): RegionGeometry => {
  const resolvedRadius = Math.max(
    0,
    Math.min(visualTokens.canvas.geometry.cornerRadius, box.width / 2, box.height / 2),
  )
  const resolvedLabel =
    treatment.label && label.trim().length > 0
      ? labelGeometry(box, treatment.label, treatment.labelTreatment === 'notched')
      : null
  if (treatment.frame === 'none') return { label: resolvedLabel, notch: null, outline: null }
  if (treatment.labelTreatment !== 'notched' || !resolvedLabel) {
    return { label: resolvedLabel, notch: null, outline: roundedFrame(box, resolvedRadius) }
  }
  const fitted = fitNotch(box, resolvedRadius, resolvedLabel, label)
  if (!fitted) return { label: resolvedLabel, notch: null, outline: roundedFrame(box, resolvedRadius) }
  return {
    label: fitted.label,
    notch: fitted.notch,
    outline: notchedFrame(box, resolvedRadius, fitted.notch),
  }
}
