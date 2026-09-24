export type SurfaceTreatment = 'neutral' | 'blueprint'

export type GridTreatment = 'none' | 'major' | 'major-plus-minor' | 'dots'

export type RegionLabelFrameTreatment = 'plain' | 'notched'

export type RegionLabelPlacement =
  | 'north-west'
  | 'north'
  | 'north-east'
  | 'west'
  | 'center'
  | 'east'
  | 'south-west'
  | 'south'
  | 'south-east'

export type RegionLabelTreatment = 'none' | RegionLabelPlacement

/**
 * What a Card discloses, as the Diagram's own statement about every Card.
 *
 * `identity`, `stereotype` and `description` are a ceiling rather than a fixed answer or an opening default: they say
 * the most a reader may ever be shown, so a rendering too small for a row may withhold it and no rendered size or
 * magnification may restore one the document left off. An element that states its own `identity` is the floor beneath
 * that and survives the reduction. `compact` is treatment rather than disclosure — it decides how a Card stacks its
 * text and at which size, withholds nothing, and takes no part in either the output override or the reduction.
 */
export type CardDetailDefaults = {
  compact?: boolean
  identity?: boolean
  stereotype?: boolean
  description?: boolean
}

export type InfoschematicAppearanceConfig = {
  surface?: SurfaceTreatment
  grid?: GridTreatment
  card?: CardDetailDefaults
  /**
   * Whether every element draws its own code, as the Diagram's default.
   *
   * `card.identity` says the same thing for Cards alone and was the only way to say it; this is the same statement
   * made once for every kind, and an element that states its own `identity` is the more specific answer.
   */
  identity?: boolean
}

const surfaceTreatmentMembers: Record<SurfaceTreatment, true> = {
  neutral: true,
  blueprint: true
}

const gridTreatmentMembers: Record<GridTreatment, true> = {
  none: true,
  major: true,
  'major-plus-minor': true,
  dots: true
}

const regionLabelPlacementMembers: Record<RegionLabelPlacement, true> = {
  'north-west': true,
  north: true,
  'north-east': true,
  west: true,
  center: true,
  east: true,
  'south-west': true,
  south: true,
  'south-east': true
}

export const surfaceTreatments = Object.keys(surfaceTreatmentMembers) as readonly SurfaceTreatment[]

export const gridTreatments = Object.keys(gridTreatmentMembers) as readonly GridTreatment[]

export const regionLabelPlacements = Object.keys(regionLabelPlacementMembers) as readonly RegionLabelPlacement[]
