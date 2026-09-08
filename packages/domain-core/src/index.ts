export type { InfoschematicConfig } from '@infoschematics/domain-model'
export {
  type CardDetailDefaults,
  type GridTreatment,
  gridTreatments,
  type RegionLabelPlacement,
  regionLabelPlacements,
  type SurfaceTreatment,
  surfaceTreatments
} from '@infoschematics/domain-model/appearance'
export { defaultInfoschematicAppearance, defineInfoschematic } from './define.ts'
export {
  formatInfoschematicIssue,
  type InfoschematicFormat,
  type InfoschematicIssue,
  type InfoschematicParseResult,
  infoschematicFormatExtensions,
  infoschematicFormatOf,
  type ParseInfoschematicOptions,
  parseInfoschematic
} from './parse.ts'
export { infoschematicConfigSchema, type SchemaMirrorsContract } from './schema.ts'
