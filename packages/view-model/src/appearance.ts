import type {
  CardDetailDefaults,
  GridTreatment,
  InfoschematicAppearanceConfig,
  RegionAppearanceConfig,
  RegionFrameTreatment,
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
  const requestedFrame = appearance?.frame ?? (kind === 'lane' ? 'plain' : 'none')
  return {
    frame: requestedFrame === 'notched' && resolvedLabel === null ? 'plain' : requestedFrame,
    label: resolvedLabel,
  }
}

/** Domain classification is deliberately resolved without consulting Scope. */
export const resolveCardDomain = (
  card: Pick<CardConfig, 'domain'>,
  domains: readonly DomainConfig[],
): DomainConfig | undefined => (card.domain ? domains.find(({ id }) => id === card.domain) : undefined)
