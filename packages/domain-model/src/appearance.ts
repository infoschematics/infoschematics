export type SurfaceTreatment = 'neutral' | 'blueprint'

export type GridTreatment = 'none' | 'major' | 'major-plus-minor'

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
