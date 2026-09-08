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
