import type {
  AuthoredColourMode,
  CardDetailDefaults,
  GridTreatment,
  InfoschematicAppearanceConfig,
  RegionLabelFrameTreatment,
  RegionLabelPlacement,
  VisualStyle
} from '@infoschematics/domain-model/appearance'
import type { CardConfig } from '@infoschematics/domain-model/card'
import type { DomainConfig } from '@infoschematics/domain-model/domain'
import type { Box } from '@infoschematics/domain-model/geometry'
import type { RegionConfig, RegionFrameStyle } from '@infoschematics/domain-model/region'

export type CardDetailOverrides = Readonly<Partial<Pick<CardDetailDefaults, 'description' | 'identity' | 'stereotype'>>>

export type ResolvedCardTreatment = Readonly<{
  compact: boolean
  description: boolean
  identity: boolean
  stereotype: boolean
}>

export type RenderedSize = Readonly<{ height: number; width: number }>

export type ResolvedVisualTreatment = Readonly<{
  card: ResolvedCardTreatment
  grid: GridTreatment
  /** Whether an element that states nothing draws its own code. */
  identity: boolean
  /**
   * The ground the document asked for, which is a request rather than an answer.
   *
   * `system` stays here deliberately: this is the authored treatment, and the document really did decline to choose.
   * Whoever renders it resolves that refusal into a ground — the browser from the reader's preference, the command
   * line from its flag — and no palette is selected from this value.
   */
  mode: AuthoredColourMode
  /** Whether the reader may move off `mode`. */
  modeLocked: boolean
  style: VisualStyle
}>

export type ResolvedRegionTreatment = Readonly<{
  frame: RegionFrameStyle | 'none'
  frameOpacity: number
  label: RegionLabelPlacement | null
  /** Along-edge pull-in; null takes the geometry's standard inset. */
  labelOffset: number | null
  labelTreatment: RegionLabelFrameTreatment
}>

const defaultCardTreatment: ResolvedCardTreatment = Object.freeze({
  compact: false,
  description: false,
  identity: false,
  stereotype: false
})

/** Resolve authored diagram treatment and output-only Card visibility overrides. */
export const resolveVisualTreatment = (
  appearance?: InfoschematicAppearanceConfig,
  output?: CardDetailOverrides
): ResolvedVisualTreatment => ({
  card: {
    compact: appearance?.card?.compact ?? defaultCardTreatment.compact,
    description: output?.description ?? appearance?.card?.description ?? defaultCardTreatment.description,
    /* `card.identity` is the older and narrower statement, so it answers first where both are authored; the
       diagram-wide default is what a document that never mentioned Cards specifically is saying about them. */
    identity: output?.identity ?? appearance?.card?.identity ?? appearance?.identity ?? defaultCardTreatment.identity,
    stereotype: output?.stereotype ?? appearance?.card?.stereotype ?? defaultCardTreatment.stereotype
  },
  grid: appearance?.grid ?? 'none',
  identity: appearance?.identity ?? false,
  mode: appearance?.mode ?? 'system',
  modeLocked: appearance?.modeLocked ?? false,
  /* `surface` is what this field was called, and documents written under that name keep working; `style` is the
     answer where a document states both, because it is the one the writer of that document chose most recently. */
  style: appearance?.style ?? appearance?.surface ?? 'neutral'
})

/**
 * Whether one element draws its own code, permanently, in every rendering of the Diagram.
 *
 * The element's own answer is the specific one and wins; the Diagram's default for its kind answers for everything
 * that said nothing. An output-only override and the responsive reduction both act on that default rather than on
 * this: a caller narrowing Card detail for a small rendering is describing the rendering, while an element saying
 * it carries its code is describing the element, and the second survives being drawn small.
 */
export const drawsOwnCode = (element: Readonly<{ identity?: boolean }> | undefined, byDefault: boolean): boolean =>
  element?.identity ?? byDefault

/**
 * Reduce optional Card rows when an authored view box is rendered too small
 * for those rows to remain legible. The caller must opt in and supply the
 * rendered size; authored geometry and the requested upper bound stay intact.
 */
export const resolveResponsiveCardTreatment = (
  viewBox: Pick<Box, 'height' | 'width'>,
  target: RenderedSize,
  requested: ResolvedCardTreatment
): ResolvedCardTreatment => {
  const values = [viewBox.height, viewBox.width, target.height, target.width]
  if (values.some((value) => !Number.isFinite(value) || value <= 0)) {
    throw new TypeError('Responsive Card detail dimensions must be finite positive numbers')
  }

  const scale = Math.min(target.width / viewBox.width, target.height / viewBox.height)
  return {
    compact: requested.compact,
    description: requested.description && scale >= 0.8,
    identity: requested.identity && scale >= 0.6,
    stereotype: requested.stereotype && scale >= 0.4
  }
}

/**
 * Resolve one Region's treatment from its authored record. A boundary-mounted
 * label notches the frame; an empty or hidden label, or an absent frame,
 * always resolves to a continuous plain treatment instead.
 */
export const resolveRegionTreatment = (
  region: Pick<RegionConfig, 'label' | 'frame' | 'labelPlacement' | 'labelMount' | 'labelOffset'>
): ResolvedRegionTreatment => {
  const placement = region.labelPlacement ?? 'north-west'
  const resolvedLabel = region.label.trim().length === 0 || placement === 'none' ? null : placement
  const frame = region.frame?.style ?? 'none'
  return {
    frame,
    frameOpacity: region.frame?.opacity ?? 1,
    label: resolvedLabel,
    labelOffset: region.labelOffset ?? null,
    labelTreatment:
      (region.labelMount ?? 'internal') === 'boundary' && resolvedLabel !== null && frame !== 'none'
        ? 'notched'
        : 'plain'
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
  domains: readonly DomainConfig[]
): DomainConfig | undefined => (card.domain ? domains.find(({ id }) => id === card.domain) : undefined)
