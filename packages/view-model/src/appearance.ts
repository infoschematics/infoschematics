import type {
  CardDetailDefaults,
  GridTreatment,
  InfoschematicAppearanceConfig,
  RegionAppearanceConfig,
  RegionFrameTreatment,
  RegionLabelFrameTreatment,
  RegionLabelPlacement,
  SurfaceTreatment,
} from '@infoschematics/domain-model/appearance'
import type { CardConfig } from '@infoschematics/domain-model/card'
import type { DomainConfig } from '@infoschematics/domain-model/domain'

export type CardDetailOverrides = Readonly<
  Partial<Pick<CardDetailDefaults, 'description' | 'identity' | 'stereotype'>>
>

export type ResolvedCardTreatment = Readonly<{
  compact: boolean
  description: boolean
  identity: boolean
  stereotype: boolean
}>

export type ResolvedVisualTreatment = Readonly<{
  card: ResolvedCardTreatment
  grid: GridTreatment
  surface: SurfaceTreatment
}>

export type RegionKind = 'lane' | 'zone'
export type RegionLegendEdge = 'top' | 'bottom'

export type ResolvedRegionTreatment = Readonly<{
  frame: RegionFrameTreatment
  label: RegionLabelPlacement | null
  labelTreatment: RegionLabelFrameTreatment
}>

const defaultCardTreatment: ResolvedCardTreatment = Object.freeze({
  compact: false,
  description: false,
  identity: false,
  stereotype: false,
})

/** Resolve authored diagram treatment and output-only Card visibility overrides. */
export const resolveVisualTreatment = (
  appearance?: InfoschematicAppearanceConfig,
  output?: CardDetailOverrides,
): ResolvedVisualTreatment => ({
  card: {
    compact: appearance?.card?.compact ?? defaultCardTreatment.compact,
    description: output?.description ?? appearance?.card?.description ?? defaultCardTreatment.description,
    identity: output?.identity ?? appearance?.card?.identity ?? defaultCardTreatment.identity,
    stereotype: output?.stereotype ?? appearance?.card?.stereotype ?? defaultCardTreatment.stereotype,
  },
  grid: appearance?.grid ?? 'none',
  surface: appearance?.surface ?? 'neutral',
})

/**
 * Resolve Lane and Zone treatment without making either inherit the other's
 * visual defaults. Empty or hidden labels always turn a requested notch into
 * a continuous plain frame.
 */
export const resolveRegionTreatment = (
  kind: RegionKind,
  label: string,
  appearance?: RegionAppearanceConfig,
  legend: RegionLegendEdge = 'top',
): ResolvedRegionTreatment => {
  const fallbackLabel: RegionLabelPlacement =
    legend === 'bottom'
      ? kind === 'lane'
        ? 'south-west'
        : 'south-east'
      : kind === 'lane'
        ? 'north-west'
        : 'north-east'
  const resolvedLabel = label.trim().length === 0 || appearance?.label === 'none' ? null : appearance?.label ?? fallbackLabel
  const requestedFrame = appearance?.frame ?? (kind === 'lane' ? 'solid' : 'none')
  const requestedLabelTreatment = appearance?.labelTreatment ?? 'plain'
  return {
    frame: requestedFrame,
    label: resolvedLabel,
    labelTreatment: requestedLabelTreatment === 'notched' && resolvedLabel === null ? 'plain' : requestedLabelTreatment,
  }
}

/**
 * Choose readable ink for text drawn over a fill. Relative luminance follows
 * the sRGB weighting, so renderers agree on the same threshold without a
 * per-definition knob. Non-hex fills fall back to dark ink, which preserves
 * the established output treatment for the neutral surface fallback.
 */
export const resolveReadableInk = (fill: string): 'dark' | 'light' => {
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(fill.trim())?.[1]
  if (!hex) return 'dark'
  const expanded = hex.length === 3 ? [...hex].map((digit) => digit.repeat(2)).join('') : hex.slice(0, 6)
  const linear = (offset: number) => {
    const channel = Number.parseInt(expanded.slice(offset, offset + 2), 16) / 255
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  }
  const luminance = 0.2126 * linear(0) + 0.7152 * linear(2) + 0.0722 * linear(4)
  return luminance > 0.179 ? 'dark' : 'light'
}

/** Domain classification is deliberately resolved without consulting Scope. */
export const resolveCardDomain = (
  card: Pick<CardConfig, 'domain'>,
  domains: readonly DomainConfig[],
): DomainConfig | undefined => (card.domain ? domains.find(({ id }) => id === card.domain) : undefined)
